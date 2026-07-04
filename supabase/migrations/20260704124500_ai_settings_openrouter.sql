-- Permitir 'openrouter' como proveedor de IA en ai_settings (gateway agregador).
-- Reemplaza el CHECK cerrado (anthropic/openai) por uno que incluye openrouter.
alter table public.ai_settings
  drop constraint if exists ai_settings_provider_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ai_settings_provider_allowed') then
    alter table public.ai_settings
      add constraint ai_settings_provider_allowed
      check (provider in ('anthropic', 'openai', 'openrouter'));
  end if;
end $$;
