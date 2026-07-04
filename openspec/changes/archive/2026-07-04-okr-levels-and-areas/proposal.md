## Why

La metodología de OKRs distingue **tres niveles** —empresa (estratégico), área/equipo
y individual— y esa distinción es lo que hace visible la **alineación** (el trabajo de
una persona conecta con un objetivo de área y este con uno de empresa). Hoy goalboard
trata todos los objetivos por igual: tienen dueño y un enlace de alineación opcional,
pero **no hay noción de nivel ni de área** como entidad. Sin eso no se puede: reservar
los objetivos de empresa a liderazgo, agrupar por área, ni que el coach alinee contra
los objetivos *de empresa* en vez de contra todos.

## What Changes

- **Nivel en el objetivo**: `objectives.level` = `empresa` | `area` | `individual`
  (default `individual`). Se apoya en el `parent_objective_id` ya existente para la
  cascada flexible individual → área → empresa (bottom-up, no forzada).
- **Áreas como entidad** (nueva capability): tabla de **áreas** dentro de la
  organización + **membresía de usuarios a áreas** con rol (`lider` | `miembro`). Un
  objetivo de nivel `area` referencia su área (`objectives.area_id`).
- **BREAKING (RLS)**: la escritura de objetivos deja de ser solo "dueño o admin" y
  pasa a depender del nivel: **empresa** → solo admin; **área** → líder del área o
  admin; **individual** → dueño o admin. Lectura sigue siendo toda la org
  (transparencia). Nuevo helper `is_team_lead(area_id)`.
- **Coach de IA**: alinea los borradores contra los objetivos de **nivel empresa**
  (no todos) y encuadra según el nivel elegido (empresa: amplio/estratégico;
  individual: concreto y medible).
- **UI**: gestión de áreas (crear/asignar miembros), selector de **nivel** (y de
  **área** cuando corresponde) al crear un objetivo, y una vista de la **cascada**
  empresa → área → individuo.

## Capabilities

### New Capabilities
- `okr-areas`: áreas/equipos como entidad dentro de la organización, con membresía y
  rol (líder/miembro); base para agrupar objetivos de nivel área y para permisos.

### Modified Capabilities
- `okr-model`: los objetivos incorporan `level` (empresa/área/individual) y, para los
  de área, un `area_id`; se precisa la semántica de alineación entre niveles.
- `okr-access-control`: la escritura de objetivos se rige por nivel/área (empresa=admin,
  área=líder o admin, individual=dueño o admin); lectura intra-org sin cambios.
- `okr-management-ui`: alta de objetivo con nivel/área, gestión de áreas y vista de
  cascada por niveles.
- `ai-okr-assistant`: el modo definir/revisar alinea contra objetivos de nivel empresa
  y considera el nivel del objetivo al aconsejar.

## Impact

- **Schema/RLS** (`supabase/migrations/…`): nueva migración — `areas` + `area_members`
  (+ RLS y helper `is_team_lead`), `objectives.level` y `objectives.area_id`, y
  reescritura de las policies de escritura de `objectives`.
- **Front-end**: `js/data.js` (CRUD de áreas/membresía, `level`/`area_id` en objetivos,
  traer objetivos de empresa para el coach), `js/ui.js` (gestión de áreas, selectores,
  vista de cascada), `js/app.js` (handlers).
- **Edge Function** `okr-coach`: recibir/priorizar objetivos de empresa y el nivel del
  borrador en el prompt.
- **Specs**: `okr-areas` (nuevo) + deltas en `okr-model`, `okr-access-control`,
  `okr-management-ui`, `ai-okr-assistant`.
- **Sin cambios**: modelo de KRs, check-ins, scoring de cierre, cadencia.
- **Dev**: verificación local con `supabase db reset` + front por HTTP (free tier).
