-- goalboard — esquema de base de datos (Supabase / Postgres)
--
-- Modelo de datos + Row Level Security para OKRs.
-- Cubre: organización, miembros/roles, ciclos (anual+trimestral), objetivos
-- (comprometido/aspiracional), key results (numérico/%/hito), alineación por
-- enlace, check-ins (con confianza e historial) y scoring de cierre.
--
-- Sin IA, sin pantallas: solo el piso de datos. La autorización vive acá, en
-- RLS — el front-end habla directo a Supabase y no impone permisos.
--
-- Idempotente: se puede correr varias veces. Pegar en el SQL Editor de Supabase.

-- =====================================================================
-- 1. TABLAS
-- =====================================================================

-- 1.1 Organización y miembros -----------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  role             text not null default 'member' check (role in ('admin', 'member')),
  created_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- 1.2 Ciclos (anual / trimestral) -------------------------------------
create table if not exists public.cycles (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  parent_cycle_id  uuid references public.cycles (id) on delete set null,
  name             text not null check (length(trim(name)) > 0),
  cadence          text not null check (cadence in ('anual', 'trimestral')),
  status           text not null default 'activo' check (status in ('activo', 'cerrado')),
  starts_on        date,
  ends_on          date,
  created_at       timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

-- 1.3 Objetivos -------------------------------------------------------
create table if not exists public.objectives (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  cycle_id             uuid not null references public.cycles (id) on delete cascade,
  owner_id             uuid not null references auth.users (id),
  parent_objective_id  uuid references public.objectives (id) on delete set null,
  title                text not null check (length(trim(title)) > 0),
  kind                 text not null check (kind in ('comprometido', 'aspiracional')),
  score                numeric check (score is null or (score >= 0 and score <= 1)),
  created_at           timestamptz not null default now()
);

-- 1.4 Key Results -----------------------------------------------------
-- 1.6 Progreso: columna generada. Para 'hito' se usa current/target 0→1, así
-- la misma fórmula sirve. Protegido contra división por cero (target=inicial).
create table if not exists public.key_results (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  objective_id     uuid not null references public.objectives (id) on delete cascade,
  title            text not null check (length(trim(title)) > 0),
  type             text not null check (type in ('numerico', 'porcentaje', 'hito')),
  start_value      numeric not null default 0,
  target_value     numeric not null,
  current_value    numeric not null default 0,
  score            numeric check (score is null or (score >= 0 and score <= 1)),
  progress         numeric generated always as (
    case
      when target_value = start_value then
        case when current_value >= target_value then 1 else 0 end
      else greatest(0, least(1,
        (current_value - start_value) / (target_value - start_value)))
    end
  ) stored,
  created_at       timestamptz not null default now()
);

-- 1.5 Check-ins -------------------------------------------------------
create table if not exists public.check_ins (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  key_result_id    uuid not null references public.key_results (id) on delete cascade,
  author_id        uuid not null references auth.users (id),
  value            numeric not null,
  confidence       text not null check (confidence in ('en_camino', 'en_riesgo', 'trabado')),
  note             text,
  created_at       timestamptz not null default now()
);

-- 1.7 Índices ---------------------------------------------------------
create index if not exists idx_memberships_org   on public.memberships (organization_id);
create index if not exists idx_memberships_user  on public.memberships (user_id);
create index if not exists idx_cycles_org        on public.cycles (organization_id);
create index if not exists idx_cycles_parent     on public.cycles (parent_cycle_id);
create index if not exists idx_objectives_org    on public.objectives (organization_id);
create index if not exists idx_objectives_cycle  on public.objectives (cycle_id);
create index if not exists idx_objectives_owner  on public.objectives (owner_id);
create index if not exists idx_objectives_parent on public.objectives (parent_objective_id);
create index if not exists idx_krs_org           on public.key_results (organization_id);
create index if not exists idx_krs_objective     on public.key_results (objective_id);
create index if not exists idx_checkins_org      on public.check_ins (organization_id);
create index if not exists idx_checkins_kr       on public.check_ins (key_result_id);

-- =====================================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================================

-- 2.1 Helpers SECURITY DEFINER -----------------------------------------
-- Corren como dueño de la función => no disparan RLS sobre memberships, así se
-- evita la recursión clásica al chequear pertenencia desde otras políticas.

create or replace function public.is_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_admin(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = org and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

-- ¿El usuario actual puede escribir este objetivo? (dueño o admin de la org)
create or replace function public.can_write_objective(obj uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.objectives o
    where o.id = obj
      and (o.owner_id = auth.uid() or public.is_admin(o.organization_id))
  );
$$;

-- ¿... este key result? (vía su objetivo)
create or replace function public.can_write_kr(kr uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.key_results k
    join public.objectives o on o.id = k.objective_id
    where k.id = kr
      and (o.owner_id = auth.uid() or public.is_admin(o.organization_id))
  );
$$;

-- Bootstrap de organización: crea la org y deja al creador como admin, de forma
-- atómica. Evita el huevo-y-gallina de "para insertar membership hay que ser
-- admin, pero todavía no hay admin".
create or replace function public.create_organization(p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  insert into public.organizations (name) values (p_name) returning * into org;
  insert into public.memberships (organization_id, user_id, role)
    values (org.id, auth.uid(), 'admin');
  return org;
end;
$$;

-- 2.2 Activar RLS ------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.cycles        enable row level security;
alter table public.objectives    enable row level security;
alter table public.key_results   enable row level security;
alter table public.check_ins     enable row level security;

-- Helper de este script: re-crear una política de forma idempotente.
-- (No hay "create policy if not exists", así que se hace drop + create.)

-- 2.3 LECTURA: todo miembro lee todo lo de su organización --------------
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations
  for select using (public.is_member(id));

drop policy if exists membership_read on public.memberships;
create policy membership_read on public.memberships
  for select using (public.is_member(organization_id));

drop policy if exists cycles_read on public.cycles;
create policy cycles_read on public.cycles
  for select using (public.is_member(organization_id));

drop policy if exists objectives_read on public.objectives;
create policy objectives_read on public.objectives
  for select using (public.is_member(organization_id));

drop policy if exists krs_read on public.key_results;
create policy krs_read on public.key_results
  for select using (public.is_member(organization_id));

drop policy if exists checkins_read on public.check_ins;
create policy checkins_read on public.check_ins
  for select using (public.is_member(organization_id));

-- 2.6 Gestión (org, miembros, ciclos): solo admin -----------------------
-- organizations: cualquier autenticado puede crear (alta de su propia org);
-- modificarla/borrarla, solo admin de esa org.
drop policy if exists org_insert on public.organizations;
create policy org_insert on public.organizations
  for insert with check (auth.uid() is not null);

drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations
  for update using (public.is_admin(id)) with check (public.is_admin(id));

drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations
  for delete using (public.is_admin(id));

drop policy if exists membership_write on public.memberships;
create policy membership_write on public.memberships
  for all using (public.is_admin(organization_id))
  with check (public.is_admin(organization_id));

drop policy if exists cycles_write on public.cycles;
create policy cycles_write on public.cycles
  for all using (public.is_admin(organization_id))
  with check (public.is_admin(organization_id));

-- 2.4 ESCRITURA de objetivos y KRs: dueño o admin -----------------------
drop policy if exists objectives_insert on public.objectives;
create policy objectives_insert on public.objectives
  for insert with check (
    public.is_member(organization_id)
    and (owner_id = auth.uid() or public.is_admin(organization_id))
  );

drop policy if exists objectives_update on public.objectives;
create policy objectives_update on public.objectives
  for update using (owner_id = auth.uid() or public.is_admin(organization_id))
  with check (owner_id = auth.uid() or public.is_admin(organization_id));

drop policy if exists objectives_delete on public.objectives;
create policy objectives_delete on public.objectives
  for delete using (owner_id = auth.uid() or public.is_admin(organization_id));

drop policy if exists krs_insert on public.key_results;
create policy krs_insert on public.key_results
  for insert with check (
    public.is_member(organization_id) and public.can_write_objective(objective_id)
  );

drop policy if exists krs_update on public.key_results;
create policy krs_update on public.key_results
  for update using (public.can_write_objective(objective_id))
  with check (public.can_write_objective(objective_id));

drop policy if exists krs_delete on public.key_results;
create policy krs_delete on public.key_results
  for delete using (public.can_write_objective(objective_id));

-- 2.5 ESCRITURA de check-ins: dueño del objetivo o admin ----------------
drop policy if exists checkins_insert on public.check_ins;
create policy checkins_insert on public.check_ins
  for insert with check (
    author_id = auth.uid()
    and public.is_member(organization_id)
    and public.can_write_kr(key_result_id)
  );

drop policy if exists checkins_update on public.check_ins;
create policy checkins_update on public.check_ins
  for update using (public.can_write_kr(key_result_id))
  with check (public.can_write_kr(key_result_id));

drop policy if exists checkins_delete on public.check_ins;
create policy checkins_delete on public.check_ins
  for delete using (public.can_write_kr(key_result_id));

-- =====================================================================
-- 3. TRIGGERS
-- =====================================================================

-- Al registrar un check-in, el valor actual del KR pasa a ser el del check-in
-- (esto recalcula su `progress`, que es columna generada). SECURITY DEFINER
-- para no chocar con RLS al actualizar el KR desde el trigger.
create or replace function public.apply_check_in_to_kr()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.key_results
     set current_value = new.value
   where id = new.key_result_id;
  return new;
end;
$$;

drop trigger if exists trg_apply_check_in on public.check_ins;
create trigger trg_apply_check_in
  after insert on public.check_ins
  for each row execute function public.apply_check_in_to_kr();

-- =====================================================================
-- 4. PRIVILEGIOS PARA LOS ROLES DE SUPABASE
-- =====================================================================
-- La seguridad real la imponen las políticas RLS de arriba. Estos GRANT son el
-- piso de privilegios que PostgREST necesita para que los roles lleguen a las
-- tablas (Supabase Cloud los auto-otorga; el stack local NO, así que se hacen
-- explícitos para que el schema sea portable entre local y nube).
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
