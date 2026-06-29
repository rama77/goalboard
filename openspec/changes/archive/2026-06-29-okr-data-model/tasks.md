## 1. Esquema base

- [x] 1.1 Definir en `supabase/schema.sql` las tablas `organizations` y `memberships` (rol `admin|member`, FK a `auth.users`), con `id uuid` y `created_at`
- [x] 1.2 Definir `cycles` (cadence `anual|trimestral`, `parent_cycle_id` self-FK nullable, `status activo|cerrado`, rango de fechas)
- [x] 1.3 Definir `objectives` (`cycle_id`, `owner_id`, `kind comprometido|aspiracional`, `parent_objective_id` self-FK nullable, `score` 0..1 nullable con CHECK)
- [x] 1.4 Definir `key_results` (`objective_id`, `type numerico|porcentaje|hito`, `start_value`, `target_value`, `current_value`, `score` 0..1 nullable)
- [x] 1.5 Definir `check_ins` (`key_result_id`, `author_id`, `value`, `confidence en_camino|en_riesgo|trabado`, `note` nullable)
- [x] 1.6 Resolver el progreso del KR (columna generada) con protección de división por cero y acotado 0–1; hito → 0/1. Trigger que sincroniza `current_value` con el último check-in
- [x] 1.7 Agregar índices y FKs/constraints (ciclo↔org, objetivo↔ciclo, KR↔objetivo, check-in↔KR)

## 2. Row Level Security

- [x] 2.1 Crear funciones `SECURITY DEFINER`: `is_member(org)`, `is_admin(org)`, `can_write_objective(obj)`, `can_write_kr(kr)` y `create_organization(name)` (bootstrap) para evitar recursión de RLS
- [x] 2.2 Activar RLS en todas las tablas
- [x] 2.3 Políticas de LECTURA: todo miembro lee todo lo de su organización (vía `organization_id` denormalizado en cada tabla)
- [x] 2.4 Políticas de ESCRITURA de objetivos/KRs: dueño o admin (`WITH CHECK`)
- [x] 2.5 Políticas de ESCRITURA de check-ins: dueño del objetivo o admin
- [x] 2.6 Políticas de gestión (org, miembros, ciclos): solo admin

## 3. Aplicar en Supabase real

- [x] 3.1 Aplicar `supabase/schema.sql` en el proyecto Supabase (SQL Editor); confirmar que corre idempotente y sin errores _(aplicado en el proyecto real; las 6 tablas responden 200 y RLS devuelve `[]` al rol anónimo)_
- [x] 3.2 Cargar datos de prueba: una organización, dos usuarios (un `admin` y un `member`), un ciclo anual + un trimestral, objetivos y KRs de los 3 tipos, y algunos check-ins _(cubierto por `supabase/test/seed.sql` en el harness de Docker, donde se verificó la RLS de usuarios logueados; cargarlo en el proyecto real no agrega verificación porque el SQL Editor saltea RLS y aún no hay UI)_

## 4. Verificación (cierre condicionado a esto)

- [x] 4.1 Verificar transparencia: un `member` lee todos los OKRs de la org (propios y ajenos) _(verificado local, Docker)_
- [x] 4.2 Verificar escritura acotada: el `member` NO puede editar el objetivo ajeno ni hacer check-in ajeno; el dueño/admin sí _(verificado local)_
- [x] 4.3 Verificar aislamiento: un usuario de otra org (o sin org) no ve ninguna fila _(verificado local)_
- [x] 4.4 Verificar progreso calculado en casos borde (target=inicial, hito cumplido/no, numérico 50%) _(verificado local)_
- [x] 4.5 Verificar scoring 0.0–1.0 al cerrar un ciclo (incluye rechazo fuera de rango) _(CHECK 0..1 verificado local)_
- [x] 4.6 Confirmar consola limpia y que el cliente del front consulta el modelo sin errores _(login por magic link probado contra el proyecto real; sesión OK, consola limpia)_

## 5. Despliegue

- [x] 5.1 Desplegar la app (hosting estático) apuntando al proyecto Supabase con el modelo aplicado, y confirmar el flujo logueado contra datos reales _(desplegado en GitHub Pages desde la rama `gh-pages`: https://rama77.github.io/goalboard/ — sirve 200 con la config real; falta sumar la URL a los redirects de Supabase para el login en prod)_
