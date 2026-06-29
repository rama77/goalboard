## Context

El modelo de datos ya tiene `check_ins` (valor, confianza, nota, autor, fecha), el
trigger que pone `key_results.current_value` = último check-in, las columnas
`score` (0..1) en `key_results`/`objectives`, `cycles.status`, y las RLS
(check-in: dueño/admin; cerrar ciclo: admin). Falta la UI. Se construye sobre los
módulos existentes (`data.js`, `ui.js`, `app.js`) reusando los componentes `ap-`.

## Goals / Non-Goals

**Goals:**
- Ritual de check-in usable (valor + confianza + nota) con historial.
- Confianza visible por KR y rollup por objetivo.
- Cierre de ciclo con scoring 0.0–1.0 y ciclos cerrados de solo-lectura.

**Non-Goals:**
- IA que asista el check-in (change futuro).
- Notificaciones/recordatorios ("hace X que no actualizás").
- Editar/borrar check-ins (por ahora solo agregar; el historial es append-only).

## Decisions

### Dónde vive el check-in en la UI

La card del objetivo ya lista sus KRs. Se agrega por KR:
- un **indicador de confianza** (punto de color del último check-in),
- un botón **"Check-in"** que abre un modal con: nuevo valor, confianza
  (3 opciones) y nota.
- un acceso a **"Historial"** que abre un modal con la serie de check-ins.

Alternativa descartada: una pantalla aparte de check-ins → rompe el foco; el
check-in tiene que estar a un clic del KR.

### Rollup de confianza del objetivo

El objetivo muestra la **confianza más floja** entre sus KRs (orden trabado >
en_riesgo > en_camino > sin dato). Es la señal más útil ("¿algo está en riesgo?").
Se calcula en el front a partir del último check-in de cada KR.

### Datos del último check-in y confianza

`listObjectives` ya trae `key_results`. Para la confianza vigente se trae, por KR,
el último check-in. Opciones: (a) subconsulta anidada ordenada y limitada, o
(b) una vista/columna. Se elige **(a)**: en el `select` anidado de check-ins,
ordenar por fecha desc y tomar el más reciente en el front. El historial completo
se pide on-demand al abrir el modal (no se trae siempre).

### Cierre de ciclo + scoring

Acción **"Cerrar ciclo"** (visible solo si el usuario es admin y el ciclo está
`activo`). Abre un modal que lista todos los KRs del ciclo con un input de score
0.0–1.0 (con la guía de Doerr). Al confirmar: se actualizan los `score` de los KRs
y `cycles.status='cerrado'` (varias operaciones; si algo falla, error claro). El
score del objetivo se muestra como promedio de sus KRs (cálculo en el front).

### Estado solo-lectura

Si `cycle.status==='cerrado'`: no se muestran los botones de nuevo objetivo,
check-in ni cerrar; las cards muestran los `score` finales. El rol de admin se
deriva de la membresía (ya disponible en `listMyOrganizations`, que trae `role`).

## Risks / Trade-offs

- **Cerrar ciclo = varias escrituras sin transacción cliente** → Mitigación:
  actualizar scores y luego el status; si falla, mostrar error y permitir
  reintentar (idempotente). Una RPC transaccional puede venir después.
- **Traer el último check-in por KR** puede crecer → Mitigación: traer solo el
  más reciente para el indicador; historial completo on-demand.
- **Confianza "sin dato"** no debe parecer 🟢 → se usa un estado neutro explícito.

## Migration Plan

Sin cambios de esquema. Se desarrolla y verifica local (Supabase CLI): registrar
check-ins (incl. el trigger actualizando el KR), ver historial, ver rollup de
confianza, cerrar un ciclo con scores y comprobar el modo solo-lectura, y los
permisos (member no hace check-in ajeno; no-admin no cierra ciclo).

## Open Questions

- ¿El score del objetivo se persiste o se muestra como promedio de KRs? (propongo:
  mostrar promedio; persistir el del objetivo puede venir si se necesita reportar)
- ¿Se permite reabrir un ciclo cerrado? (propongo: no en este change)
