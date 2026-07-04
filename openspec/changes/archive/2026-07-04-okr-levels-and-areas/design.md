## Context

Hoy `objectives` tiene `owner_id`, `parent_objective_id` (alineación flexible) y `kind`
(comprometido/aspiracional), pero no hay nivel ni áreas. La seguridad vive en RLS con
helpers `is_member(org)` e `is_admin(org)`; la escritura de objetivos es "dueño o admin".
Filosofía del proyecto (memoria): alineación flexible bottom-up (no cascada forzada),
free tier, front vanilla, migraciones append-only como source of truth.

## Goals / Non-Goals

**Goals:**
- Distinguir objetivos de **empresa / área / individual** y reservar los de empresa a
  liderazgo.
- Modelar **áreas** como entidad real (con membresía y líder) para agrupar y permisar.
- Que el coach alinee contra los objetivos **de empresa** y encuadre según nivel.
- No romper el comportamiento actual de los objetivos existentes.

**Non-Goals:**
- Jerarquía de áreas anidadas (sub-áreas) — plano por ahora.
- Roll-up de scoring por área/empresa — sigue fuera de alcance.
- Cascada de alineación **forzada** — se mantiene flexible (sugerida, no obligatoria).
- Reasignación masiva / mover objetivos entre áreas en lote.

## Decisions

### Decisión 1: `level` como enum en el objetivo (no tablas separadas por nivel)
`objectives.level text not null default 'individual' check (level in ('empresa','area','individual'))`.

- **Por qué**: el nivel es un atributo del objetivo, no un tipo distinto; un enum es lo
  más simple y no duplica el modelo. El default `individual` deja a los objetivos
  existentes válidos y con el mismo comportamiento de permisos que hoy.

### Decisión 2: Áreas como entidad + membresía con rol
- `areas (id, organization_id, name, created_at)`.
- `area_members (id, area_id, user_id, role check in ('lider','miembro'), unique(area_id,user_id))`.
- `objectives.area_id uuid references areas(id)`, usado por los objetivos de nivel `area`.

- **Por qué**: para que "área" sea una entidad real (agrupar objetivos, permisos por
  líder) hace falta una tabla propia y su membresía N:M. Se separa de `memberships`
  (org) porque una persona pertenece a la org y, aparte, a 0..N áreas.
- **Integridad**: `area_id` con **ON DELETE RESTRICT** + `check ((level <> 'area') or
  (area_id is not null))` → un objetivo de área siempre tiene área, y no se puede borrar
  un área con objetivos vivos (obliga a reasignar primero). Alternativa descartada:
  `ON DELETE SET NULL`, que dejaría objetivos de área huérfanos violando el CHECK.

### Decisión 3: RLS de escritura por nivel/área + helper `is_team_lead`
Nuevo helper `is_team_lead(area_id)` (SECURITY DEFINER): true si `auth.uid()` es miembro
de esa área con rol `lider`. Se reescribe la escritura de `objectives`:
- `empresa` → `is_admin(org)`
- `area` → `is_admin(org) or is_team_lead(area_id)`
- `individual` → `is_admin(org) or owner_id = auth.uid()`

Áreas: lectura para miembros de la org; **crear/editar áreas y su membresía = admin**
(el líder gobierna los objetivos del área, no la membresía, para acotar el alcance v1).

- **Por qué**: refleja la metodología (liderazgo fija los de empresa; el área los suyos)
  sin inventar roles nuevos a nivel org. Mantener la lectura intra-org preserva la
  transparencia actual.
- **Alternativa**: que el líder también gestione miembros del área → más poder pero más
  RLS; se posterga.

### Decisión 4: Alineación flexible entre niveles (reusa `parent_objective_id`)
La cascada sugerida es individual → área → empresa vía `parent_objective_id`, pero **no
se fuerza** (sigue siendo opcional). La UI y el coach la sugieren; el coach alinea contra
los objetivos de nivel `empresa` del ciclo.

- **Por qué**: coherente con la filosofía bottom-up ya adoptada; no agrega constraints
  rígidos que empujen al Excel.

### Decisión 5: Migración aditiva con backfill
Nueva migración: crea `areas`/`area_members` (+RLS), agrega `level` (default individual,
backfill implícito) y `area_id` a `objectives`, crea `is_team_lead`, y **reescribe** las
policies `objectives_insert`/`objectives_update` (drop + create). Append-only, replayable.

## Risks / Trade-offs

- **[BREAKING RLS]** cambiar la escritura de objetivos podría bloquear flujos actuales →
  Mitigación: `level` default `individual` conserva exactamente la regla vieja (dueño o
  admin) para todo lo existente; empresa/área son opt-in.
- **[Fricción al borrar áreas]** `ON DELETE RESTRICT` obliga a reasignar objetivos antes
  de borrar un área → Mitigación: la UI lo explica; es el precio de no dejar huérfanos.
- **[Área sin líder]** si un área no tiene `lider`, solo un admin puede crear/editar sus
  objetivos → aceptable; la UI sugiere designar un líder.
- **[Complejidad de UI]** gestión de áreas + selectores por nivel puede recargar el alta
  → Mitigación: el selector de área aparece solo cuando el nivel es `area`.
