## 1. Schema (migración + RLS)

- [x] 1.1 Migración: tablas `areas` (org, name) y `area_members` (area, user, role lider/miembro, unique(area,user))
- [x] 1.2 `objectives.level` (`empresa`/`area`/`individual`, default `individual`) + `objectives.area_id` (FK areas, ON DELETE RESTRICT)
- [x] 1.3 CHECK: `(level <> 'area') or (area_id is not null)`; y área e individual sin exigir área
- [x] 1.4 Helper `is_team_lead(area_id)` (SECURITY DEFINER): usuario actual es `lider` del área
- [x] 1.5 RLS `areas`/`area_members`: lectura miembros de la org; escritura solo admin (+ grants de tabla)
- [x] 1.6 Reescribir `objectives_insert`/`objectives_update`/`delete`: empresa→admin; área→líder o admin; individual→dueño o admin
- [x] 1.7 `supabase db reset` limpio; verificado tablas/columnas/policies

## 2. Front-end (data)

- [x] 2.1 `js/data.js`: CRUD de áreas (`listAreas`, `createArea`) y membresía (`listAreaMembers`, `addAreaMember`, `removeAreaMember`, `listOrgMembers` vía RPC)
- [x] 2.2 `js/data.js`: `createObjectiveWithKRs` acepta `level`, `areaId` y `parentObjectiveId`
- [x] 2.3 `js/data.js`: `listCompanyObjectives` (ancla del coach) + `areas(name)` en `listObjectives`

## 3. Front-end (UI)

- [x] 3.1 Alta de objetivo: selector de **nivel**; **área** visible solo si nivel=área; **alineación** opcional; `empresa` solo a admin
- [x] 3.2 Gestión de **áreas** (botón 👥): crear área, asignar/quitar miembros con rol; ver áreas (todos)
- [x] 3.3 Vista de **cascada**: objetivos agrupados por nivel con su alineación (padre)
- [x] 3.4 `js/app.js`: handlers de áreas y de nivel/área/alineación en el alta; pasar objetivos de empresa al coach
- [ ] 3.5 Consola limpia; tokens semánticos; dark mode intacto _(pendiente: pasada en browser)_

## 4. Edge Function (coach)

- [x] 4.1 `okr-coach`: recibe el `level` del borrador/definición y prioriza los objetivos de empresa; encuadra el consejo según nivel

## 5. Specs y no-regresión

- [x] 5.1 Objetivos existentes quedan `individual` y conservan la regla de escritura previa (dueño o admin) _(verificado)_
- [x] 5.2 KRs, check-ins, scoring y cadencia sin cambios (por inspección; write de KR delega en `can_write_objective`)
- [x] 5.3 Deltas de spec reflejados (okr-areas nuevo + okr-model/okr-access-control/okr-management-ui/ai-okr-assistant)

## 6. Verificación local (cierre condicionado a esto)

- [x] 6.1 Admin crea área; un member la ve pero no puede crearla (RLS)
- [x] 6.2 Admin crea objetivo de **empresa**; un member no puede (RLS)
- [x] 6.3 Líder crea objetivo de **área** de su área; un no-líder no puede (RLS)
- [x] 6.4 Miembro crea objetivo **individual** (dueño); alineación por `parent_objective_id` disponible
- [x] 6.5 Objetivo de área sin área → rechazado; borrar área con objetivos → restringido
- [ ] 6.6 Vista de cascada muestra los tres niveles y la alineación _(pendiente: pasada en browser)_
- [ ] 6.7 Coach alinea contra objetivos de empresa y encuadra según nivel _(coach verificado antes; falta smoke del prompt level-aware)_
