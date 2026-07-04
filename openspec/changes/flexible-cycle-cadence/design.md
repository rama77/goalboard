## Context

Hoy `cycles.cadence` es un `CHECK` cerrado a `('anual','trimestral')` (migración
`20260628210439_init_okr_model.sql`). La relación padre-hijo entre ciclos ya es
libre vía `parent_cycle_id`. El front lo consume en `js/data.js` (`createCycle`
pasa `cadence` tal cual) y `js/ui.js` (un `<select>` de dos opciones y un badge que
asume `A`/`Q`). El scoring de cierre es por KR/objetivo (promedio de scores de KRs)
y **no** agrega entre ciclos; la Edge Function `okr-coach` **no** referencia la
cadencia. Restricciones del proyecto: front vanilla sin build, schema versionado por
migraciones (append-only, source of truth), free tier, dev local con `supabase db
reset`.

## Goals / Non-Goals

**Goals:**
- Soportar cualquier ritmo de ciclo (anual, semestral, cuatrimestral, trimestral,
  mensual, u otro) **sin migrar el schema** ante cada nuevo valor.
- Mantener una estructura mínima que permita ordenar/etiquetar ciclos por alcance.
- No romper datos existentes ni el resto de la app (scoring, coach, objetivos/KRs).

**Non-Goals:**
- Roll-up de scoring entre ciclos (padre/hijo) — sigue fuera de alcance.
- Que el AI coach use la cadencia en sus prompts — posible a futuro, no acá.
- Catálogo de cadencias configurable por empresa (tabla aparte) — sobra por ahora.
- Validar/forzar coherencia de fechas contra `period_months`.

## Decisions

### Decisión 1: etiqueta libre + `period_months`, en vez de solo texto libre
`cadence` pasa a ser `text` no vacío (etiqueta legible, p. ej. "Semestral") y se
agrega `period_months smallint not null check (period_months > 0)` que captura la
duración del período (12/6/4/3/1/…).

- **Por qué**: el texto libre solo ya cumpliría "no tocar el schema", pero perdés
  toda semántica de orden. `period_months` da un eje numérico barato para ordenar
  ciclos por alcance, derivar el badge sin parsear español, y (a futuro) validar
  jerarquías (hijo < padre) sin hardcodear etiquetas.
- **Alternativas**: (a) solo `cadence text` libre → badge/orden frágiles por parseo
  de labels; (b) tabla `cadences` por empresa → normalizada pero pesada y over-kill
  para el free tier y el alcance actual.

### Decisión 2: nueva migración aditiva con backfill (no editar la migración init)
Se agrega un archivo de migración nuevo que: (1) agrega `period_months` nullable,
(2) backfillea (`anual`→12, `trimestral`→3, resto→12 por defecto), (3) `SET NOT
NULL`, (4) `DROP CONSTRAINT` del `CHECK` de `cadence`, (5) agrega
`CHECK (length(trim(cadence)) > 0)`.

- **Por qué**: las migraciones son append-only y el source of truth; editar la init
  rompería el historial replayable. El backfill garantiza que los ciclos existentes
  queden válidos antes de exigir la columna.

### Decisión 3: UI con presets + "Otro…"
El `<select>` de dos opciones se reemplaza por presets comunes que llevan
`{label, period_months}` (Anual/12, Semestral/6, Cuatrimestral/4, Trimestral/3,
Mensual/1) más una opción **"Otro…"** que revela un input de etiqueta + un número de
meses. El badge del ciclo deriva de un mapa conocido (Anual→A, Semestral→S,
Trimestral→Q, …) con fallback a la inicial de la etiqueta en mayúscula.

- **Por qué**: cubre el 95% de los casos con un clic y deja la puerta abierta a
  ritmos raros sin tocar código. `createCycle` en `data.js` suma `periodMonths`.

## Risks / Trade-offs

- **[BREAKING de schema]** Quitar el `CHECK` afloja la validación de la base →
  Mitigación: se mantiene `cadence` no vacío y `period_months > 0`; los valores
  "lindos" se encauzan por los presets de la UI.
- **[Inconsistencia de etiquetas]** dos empresas podrían escribir "Semestral" vs
  "semestral" → Mitigación: presets como camino principal; es cosmético y aislado
  por `organization_id`.
- **[Badge ambiguo]** etiquetas custom pueden colisionar en la inicial →
  Mitigación: el badge es informativo, no identificador; el nombre del ciclo manda.
- **[Rollback]** si hay que revertir, alcanza con reponer el `CHECK` viejo, pero
  fallaría si ya existen ciclos con cadencias nuevas → aceptable en pre-producción
  local; se decide caso por caso.
