## 1. Schema (migración + RLS)

- [x] 1.1 Nueva migración: agregar `period_months smallint` (nullable) a `cycles`
- [x] 1.2 Backfill: `anual`→12, `trimestral`→3, cualquier otro→12
- [x] 1.3 `ALTER … SET NOT NULL` en `period_months` + `CHECK (period_months > 0)`
- [x] 1.4 `DROP CONSTRAINT` del `CHECK (cadence in (...))`; agregar `CHECK (length(trim(cadence)) > 0)`
- [x] 1.5 Confirmar que las RLS de `cycles` no cambian (lectura miembros / escritura admin)
- [x] 1.6 `supabase db reset` corre limpio; verificar columnas/constraints en Studio

## 2. Front-end (data + UI)

- [x] 2.1 `js/data.js`: `createCycle` acepta y envía `periodMonths` junto a `cadence`
- [x] 2.2 `js/ui.js`: reemplazar el `<select>` fijo por presets `{label, period_months}` (Anual/Semestral/Cuatrimestral/Trimestral/Mensual) + opción "Otro…" (etiqueta + meses)
- [x] 2.3 `js/ui.js`: badge del ciclo deriva de mapa conocido con fallback a la inicial de la etiqueta (dejar de asumir A/Q)
- [x] 2.4 `js/app.js`: pasar `periodMonths` en el handler de creación de ciclo
- [x] 2.5 Consola limpia (cero errores/warnings); tokens semánticos, dark mode intacto _(confirmado en browser)_

## 3. Spec y no-regresión

- [x] 3.1 Confirmar que scoring de cierre (`closeCycle`/`objectiveScore`) sigue igual (no depende de cadencia)
- [x] 3.2 Confirmar que la Edge Function `okr-coach` no se ve afectada
- [x] 3.3 Actualizar el spec `okr-model` según el delta de este cambio

## 4. Verificación local (cierre condicionado a esto)

- [x] 4.1 Crear ciclo Semestral desde preset → queda `semestral` / `period_months = 6` _(verificado a nivel DB)_
- [x] 4.2 Crear ciclo con "Otro…" (p. ej. bimestral/2) → se crea sin tocar schema _(verificado a nivel DB)_
- [x] 4.3 Crear anual + trimestral enlazados → padre-hijo se mantiene _(verificado a nivel DB)_
- [ ] 4.4 Ciclos preexistentes (anual/trimestral) siguen mostrándose bien tras la migración _(backfill correcto por lógica; no ejercido en reset limpio)_
- [x] 4.5 Rechazo de cadencia vacía o `period_months <= 0` (CHECK de la base) _(verificado a nivel DB)_
- [x] 4.6 Badge correcto para cadencias conocidas y custom _(confirmado en browser)_
