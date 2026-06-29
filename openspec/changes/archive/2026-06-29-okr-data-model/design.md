## Context

goalboard tiene auth y cliente de Supabase, pero no persiste OKRs. Este change
crea el modelo de datos y las políticas RLS en Postgres. El front-end habla
directo a Supabase, así que **toda la autorización vive en RLS** — no hay capa
intermedia donde meter lógica de permisos. El modelo debe servir desde una
persona sola hasta AccionPoint entera, y entrar en el free tier.

## Goals / Non-Goals

**Goals:**
- Esquema relacional para organización, miembros/roles, ciclos, objetivos, KRs,
  alineación y check-ins.
- Políticas RLS que impongan transparencia (lectura org-wide) y escritura
  acotada (dueño/admin).
- `supabase/schema.sql` idempotente y versionado, aplicado en un proyecto real.

**Non-Goals:**
- IA / coaching (change posterior).
- UI / pantallas (change posterior).
- Cascada forzada de objetivos (se eligió alineación flexible).

## Decisions

### Tablas (todas con `id uuid` y `created_at`)

```
organizations ── memberships ──> auth.users
      │              (role: admin|member)
      ├── cycles (cadence: anual|trimestral, parent_cycle_id?, status)
      │      │
      └──────┴── objectives (cycle_id, owner_id, kind: comprometido|aspiracional,
                              parent_objective_id?, score 0..1?)
                     │
                     └── key_results (type: numerico|porcentaje|hito,
                                      start_value, target_value, current_value,
                                      score 0..1?)
                            │
                            └── check_ins (kr_id, author_id, value,
                                           confidence: en_camino|en_riesgo|trabado,
                                           note?)
```

- **Multi-org**: `memberships` es N:M entre `auth.users` y `organizations` (un
  usuario puede estar en varias orgs; una persona sola es una org de un miembro).
- **Alineación**: `objectives.parent_objective_id` (self-FK, nullable) — enlace
  flexible, no cascada.
- **Progreso**: se calcula, no se guarda. Vía columna generada o vista
  (`(current-start)/(target-start)`, acotado 0–1; el hito es booleano → 0/1). Se
  evita duplicar estado.
- **Scoring**: `score numeric` nullable en `key_results` y `objectives`, con
  CHECK 0..1; se completa al cerrar el ciclo.
- **Enums**: como tipos Postgres `enum` o columnas `text` + CHECK (se decide al
  escribir; CHECK es más simple de migrar).

### Estrategia RLS (lo más delicado)

- RLS activado en todas las tablas. Nadie llega sin pasar por política.
- La pertenencia se resuelve con una función `SECURITY DEFINER`
  (p. ej. `is_member(org_id)` / `is_admin(org_id)` / `current_member_id(org_id)`)
  para **evitar recursión** de RLS al consultar `memberships` desde las políticas
  de otras tablas (trampa clásica de Supabase).
- **Lectura**: política `USING (is_member(org_id))` en las tablas con `org_id`;
  para tablas hijas (KR, check-ins) la pertenencia se deriva por join al objetivo
  → ciclo → org.
- **Escritura**: `WITH CHECK` que exige `owner_id = current_member` OR
  `is_admin(org_id)`. Ciclos/miembros: solo `is_admin`.

Alternativa considerada: resolver permisos en el front → descartado, viola la
regla central (la seguridad es RLS).

### Despliegue y prueba (este change no se cierra sin esto)

`supabase/schema.sql` se aplica en un proyecto Supabase real. Se cargan datos de
prueba (una org, dos usuarios con roles distintos, un ciclo, objetivos y KRs) y
se **verifica RLS con dos sesiones distintas**: que un member lea todo pero no
edite lo ajeno, y que el aislamiento entre orgs funcione.

## Risks / Trade-offs

- **Recursión de RLS** al chequear membership → Mitigación: funciones
  `SECURITY DEFINER`, probadas explícitamente.
- **Progreso calculado mal en bordes** (target = inicial, división por cero) →
  Mitigación: CHECK/COALESCE y casos de prueba en los bordes.
- **Modelo multi-org agrega complejidad** que una persona sola no necesita →
  Mitigación: una persona = una org de un miembro; la UI lo oculta luego.
- **Free tier**: volumen chico, sin riesgo de límites en esta etapa.

## Migration Plan

Repo nuevo, sin datos productivos. Se aplica `schema.sql` en el proyecto Supabase;
rollback = script de `drop` o reset del proyecto de prueba. La verificación con
dos usuarios es parte del cierre.

## Open Questions

- ¿Enums Postgres vs `text + CHECK`? (se decide al escribir el SQL)
- ¿El máximo de 5 KR es corte duro o advertencia? (la spec deja la regla; el
  enforcement se afina acá — propongo advertencia en UI, sin bloquear en DB)
- ¿`progreso` como columna generada o como vista? (impacta cómo se consulta)
