-- goalboard — cadencia de ciclos flexible
--
-- Generaliza `cycles.cadence`: de un enum cerrado (`anual`/`trimestral`) a una
-- etiqueta libre no vacía + `period_months` (duración del período en meses). Así
-- se soporta cualquier ritmo (semestral, cuatrimestral, mensual, …) sin volver a
-- tocar el schema. Aditiva, con backfill, y replayable (idempotente).

-- 1. period_months (duración del período). Nullable al inicio para backfillear.
alter table public.cycles
  add column if not exists period_months smallint;

-- 2. Backfill de los ciclos existentes según su cadencia previa.
update public.cycles
   set period_months = case cadence
     when 'anual'      then 12
     when 'trimestral' then 3
     else 12
   end
 where period_months is null;

-- 3. De acá en más, period_months es obligatorio y positivo.
alter table public.cycles
  alter column period_months set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cycles_period_months_positive') then
    alter table public.cycles
      add constraint cycles_period_months_positive check (period_months > 0);
  end if;
end $$;

-- 4. Cadencia: quitar el enum cerrado; exigir solo una etiqueta no vacía.
alter table public.cycles
  drop constraint if exists cycles_cadence_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cycles_cadence_nonempty') then
    alter table public.cycles
      add constraint cycles_cadence_nonempty check (length(trim(cadence)) > 0);
  end if;
end $$;
