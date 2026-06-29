-- goalboard — IA coach: configuración de proveedor/modelo por empresa y registro
-- de uso/costo. La autorización vive en RLS (igual que el resto del modelo).

-- Configuración de IA por empresa (proveedor + modelo)
create table if not exists public.ai_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  provider        text not null default 'anthropic' check (provider in ('anthropic', 'openai')),
  model           text not null default 'claude-opus-4-8',
  updated_at      timestamptz not null default now()
);

-- Registro de uso de IA (tokens + costo estimado). Se inserta desde la Edge
-- Function (service role); los miembros de la empresa lo leen.
create table if not exists public.ai_usage (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid references auth.users (id),
  feature          text not null check (feature in ('definir', 'revisar')),
  provider         text not null,
  model            text not null,
  input_tokens     integer not null default 0,
  output_tokens    integer not null default 0,
  est_cost_usd     numeric not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists idx_ai_usage_org on public.ai_usage (organization_id);

-- RLS
alter table public.ai_settings enable row level security;
alter table public.ai_usage    enable row level security;

drop policy if exists ai_settings_read on public.ai_settings;
create policy ai_settings_read on public.ai_settings
  for select using (public.is_member(organization_id));

drop policy if exists ai_settings_write on public.ai_settings;
create policy ai_settings_write on public.ai_settings
  for all using (public.is_admin(organization_id))
  with check (public.is_admin(organization_id));

drop policy if exists ai_usage_read on public.ai_usage;
create policy ai_usage_read on public.ai_usage
  for select using (public.is_member(organization_id));
-- ai_usage no tiene política de inserción: solo el service role (Edge Function) inserta.

-- Privilegios para los roles de Supabase (RLS sigue gobernando el acceso)
grant select on public.ai_settings, public.ai_usage to anon, authenticated;
grant insert, update, delete on public.ai_settings to authenticated;
