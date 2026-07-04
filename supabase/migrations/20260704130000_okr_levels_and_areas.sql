-- goalboard — niveles de OKR + áreas como entidad
--
-- (1) Áreas (equipos) dentro de la org + membresía con rol (lider/miembro).
-- (2) objectives.level (empresa/area/individual) + objectives.area_id.
-- (3) Escritura de objetivos/KRs por nivel: empresa=admin, area=líder o admin,
--     individual=dueño o admin. Lectura intra-org sin cambios.
-- Aditiva y replayable. La alineación (parent_objective_id) ya existe.

-- =====================================================================
-- 1. TABLAS: áreas + membresía
-- =====================================================================
create table if not exists public.areas (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null check (length(trim(name)) > 0),
  created_at       timestamptz not null default now()
);

create table if not exists public.area_members (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid not null references public.areas (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'miembro' check (role in ('lider', 'miembro')),
  created_at  timestamptz not null default now(),
  unique (area_id, user_id)
);

create index if not exists idx_areas_org         on public.areas (organization_id);
create index if not exists idx_area_members_area on public.area_members (area_id);
create index if not exists idx_area_members_user on public.area_members (user_id);

-- =====================================================================
-- 2. OBJETIVOS: nivel + área
-- =====================================================================
alter table public.objectives
  add column if not exists level text not null default 'individual'
    check (level in ('empresa', 'area', 'individual'));
alter table public.objectives
  add column if not exists area_id uuid references public.areas (id) on delete restrict;

-- Un objetivo de nivel área siempre tiene área; empresa/individual no la llevan.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'objectives_area_level_chk') then
    alter table public.objectives
      add constraint objectives_area_level_chk check (level <> 'area' or area_id is not null);
  end if;
end $$;

create index if not exists idx_objectives_area on public.objectives (area_id);

-- =====================================================================
-- 3. HELPERS RLS
-- =====================================================================
-- ¿El usuario actual es líder de esta área?
create or replace function public.is_team_lead(p_area uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.area_members am
    where am.area_id = p_area and am.user_id = auth.uid() and am.role = 'lider'
  );
$$;

-- ¿Puede escribir este objetivo? Según su nivel:
--   empresa    -> admin de la org
--   area       -> líder del área o admin
--   individual -> dueño o admin
create or replace function public.can_write_objective(obj uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.objectives o
    where o.id = obj and (
      case o.level
        when 'empresa' then public.is_admin(o.organization_id)
        when 'area'    then public.is_admin(o.organization_id) or public.is_team_lead(o.area_id)
        else                public.is_admin(o.organization_id) or o.owner_id = auth.uid()
      end
    )
  );
$$;

-- ¿... este key result? (vía su objetivo, con la misma regla por nivel)
create or replace function public.can_write_kr(kr uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.key_results k
    where k.id = kr and public.can_write_objective(k.objective_id)
  );
$$;

-- Miembros de la org (id + email + rol) para asignarlos a áreas. SECURITY
-- DEFINER para poder leer auth.users; guardado a miembros de la propia org.
create or replace function public.list_org_members(org uuid)
returns table (user_id uuid, email text, role text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.user_id, u.email::text, m.role
  from public.memberships m
  join auth.users u on u.id = m.user_id
  where m.organization_id = org and public.is_member(org)
  order by u.email;
$$;

-- =====================================================================
-- 4. RLS: áreas + membresía
-- =====================================================================
alter table public.areas        enable row level security;
alter table public.area_members enable row level security;

-- Grants a nivel tabla (RLS decide el acceso fino). Igual que el resto del schema:
-- anon lee, authenticated escribe. Las tablas nuevas no heredan estos grants.
grant select on public.areas, public.area_members to anon;
grant select, insert, update, delete on public.areas, public.area_members to authenticated;

-- Lectura: todo miembro de la org ve las áreas y su membresía.
drop policy if exists areas_read on public.areas;
create policy areas_read on public.areas
  for select using (public.is_member(organization_id));

drop policy if exists area_members_read on public.area_members;
create policy area_members_read on public.area_members
  for select using (
    exists (select 1 from public.areas a where a.id = area_id and public.is_member(a.organization_id))
  );

-- Escritura de áreas y su membresía: solo admin de la org.
drop policy if exists areas_write on public.areas;
create policy areas_write on public.areas
  for all using (public.is_admin(organization_id))
  with check (public.is_admin(organization_id));

drop policy if exists area_members_write on public.area_members;
create policy area_members_write on public.area_members
  for all using (
    exists (select 1 from public.areas a where a.id = area_id and public.is_admin(a.organization_id))
  )
  with check (
    exists (select 1 from public.areas a where a.id = area_id and public.is_admin(a.organization_id))
  );

-- =====================================================================
-- 5. RLS: escritura de objetivos por nivel (reescribe las policies previas)
-- =====================================================================
drop policy if exists objectives_insert on public.objectives;
create policy objectives_insert on public.objectives
  for insert with check (
    public.is_member(organization_id) and (
      case level
        when 'empresa' then public.is_admin(organization_id)
        when 'area'    then public.is_admin(organization_id) or public.is_team_lead(area_id)
        else                public.is_admin(organization_id) or owner_id = auth.uid()
      end
    )
  );

drop policy if exists objectives_update on public.objectives;
create policy objectives_update on public.objectives
  for update using (
    case level
      when 'empresa' then public.is_admin(organization_id)
      when 'area'    then public.is_admin(organization_id) or public.is_team_lead(area_id)
      else                public.is_admin(organization_id) or owner_id = auth.uid()
    end
  ) with check (
    case level
      when 'empresa' then public.is_admin(organization_id)
      when 'area'    then public.is_admin(organization_id) or public.is_team_lead(area_id)
      else                public.is_admin(organization_id) or owner_id = auth.uid()
    end
  );

drop policy if exists objectives_delete on public.objectives;
create policy objectives_delete on public.objectives
  for delete using (
    case level
      when 'empresa' then public.is_admin(organization_id)
      when 'area'    then public.is_admin(organization_id) or public.is_team_lead(area_id)
      else                public.is_admin(organization_id) or owner_id = auth.uid()
    end
  );
