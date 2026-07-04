## Why

La cadencia de ciclos está clavada en un `CHECK` de dos valores (`anual`,
`trimestral`). Deja afuera ritmos reales y comunes —**semestral (H1/H2)**,
cuatrimestral, mensual— y obliga a una migración cada vez que aparece uno nuevo.
Eso choca con la dirección de producto (alineación **flexible**): forzar a todas
las empresas al molde anual+trimestral es fricción que empuja de vuelta al Excel.

## What Changes

- **BREAKING (schema)**: se elimina el `CHECK (cadence in ('anual','trimestral'))`
  de `cycles`. La cadencia pasa a ser una **etiqueta libre** (`cadence text`, no
  vacía) acompañada de un **`period_months`** (entero > 0) que expresa la duración
  del período (12 = anual, 6 = semestral, 4 = cuatrimestral, 3 = trimestral,
  1 = mensual, u otro). Así se soporta cualquier ritmo **sin tocar el schema**.
- **Migración de datos**: los ciclos existentes se rellenan (`anual` → 12,
  `trimestral` → 3) antes de quitar el constraint.
- **UI de creación de ciclos**: el `<select>` fijo de dos opciones se reemplaza por
  presets comunes (Anual/Semestral/Cuatrimestral/Trimestral/Mensual) más una opción
  **"Otro…"** para etiqueta + meses personalizados. El badge del ciclo deja de
  asumir A/Q y deriva de la etiqueta/período.
- **Sin cambios funcionales** en scoring ni en el AI coach: el scoring es por
  KR/objetivo (no hace roll-up entre ciclos) y el coach hoy no referencia la
  cadencia. Se documenta que quedan intactos.

## Capabilities

### New Capabilities
<!-- Ninguna capability nueva: esto generaliza un requisito existente. -->

### Modified Capabilities
- `okr-model`: el requisito **"Ciclos anual y trimestral"** cambia — la cadencia deja
  de ser un enum cerrado y pasa a ser etiqueta libre + `period_months`; la relación
  padre-hijo entre ciclos se mantiene.

## Impact

- **Schema/RLS** (`supabase/migrations/…`): nueva migración que agrega
  `period_months`, backfillea, y quita el `CHECK` de `cadence`. Las políticas RLS de
  `cycles` no cambian (siguen atadas a `organization_id` y rol admin para escritura).
- **Front-end**: `js/ui.js` (selector de cadencia + badge del ciclo) y `js/data.js`
  (`createCycle` pasa a incluir `periodMonths`).
- **Spec**: `openspec/specs/okr-model/spec.md` (requisito de ciclos).
- **No afecta**: scoring de cierre de ciclo, Edge Function `okr-coach`, ni el modelo
  de objetivos/KRs/check-ins.
- **Dev**: verificación local con `supabase db reset` + front por HTTP (free tier).
