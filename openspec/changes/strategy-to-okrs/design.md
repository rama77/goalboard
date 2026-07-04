## Context

El coach (`okr-coach`) ya expone modos `definir` (un objetivo desde texto/PDF) y
`revisar`, con `proposals`/`findings` (structured outputs) y registro en `ai_usage`.
El schema de `proposals` tiene `title/kind/alignment/keyResults` pero **no `level`**.
El front consume solo `proposals[0]` dentro del modal de un objetivo. Ya existen niveles
(`objectives.level`), áreas y RLS por nivel; `createObjectiveWithKRs` acepta
`level`/`area_id`/`parentObjectiveId`. Filosofía: co-creación (nunca guarda solo), foco,
free tier, front vanilla.

## Goals / Non-Goals

**Goals:**
- Desde una estrategia (texto/PDF), proponer **varios OKRs** con nivel sugerido y crearlos
  en bloque, para **empresa y área** (e individual).
- Reusar al máximo lo existente (coach, structured outputs, niveles/áreas, RLS, uso/costo).
- Mantener co-creación y foco: la IA propone; la persona edita, deselecciona y crea.

**Non-Goals:**
- Enlazar propuestas entre sí dentro del mismo lote (área→empresa recién creada) — v1.
- Roll-up de scoring por nivel; sub-áreas; edición masiva posterior.
- Auto-crear sin revisión (siempre pasa por la lista y el botón "Crear seleccionadas").

## Decisions

### Decisión 1: modo `estrategia` nuevo (no reusar `definir`)
Se agrega `mode: 'estrategia'` a la función. Reusa el mismo `SCHEMA` de salida pero con
`level` agregado a cada proposal. El prompt pide **un set acotado** (pocos objetivos,
priorizados), con `level` coherente (una estrategia de compañía → varios `empresa`;
material de un equipo → `area`).

- **Por qué**: separar del modal de "un objetivo" evita ambigüedad de UX y permite un
  prompt propio orientado a *conjunto*. `definir` (un objetivo) y `revisar` quedan igual.
- **Alternativa**: reusar `definir` y que la UI consuma todas las proposals → mezcla dos
  intenciones en un mismo botón; se descarta por claridad.

### Decisión 2: `level` + `parentId` en el schema de proposals; anclas de alineación
`proposals[].level` ∈ `empresa|area|individual` (sugerido, editable). Se agrega
`proposals[].parentId`: el id del **objetivo padre** al que la propuesta se alinea, o vacío.

La llamada al modo `estrategia` SHALL pasar las **anclas**: los objetivos existentes que
pueden ser padre, como `[{id, title, level}]` — los de nivel `empresa` siempre; también los
de `area` (para que las propuestas individuales puedan alinearse a un objetivo de área). El
prompt le pide a la IA:
- proponer objetivos de área/individual **que contribuyan** a alguna ancla y setear
  `parentId` a ese id (copiado de la lista provista);
- **validar/marcar** en `alignment` (o un `finding`) cuando una propuesta **no aporta** a
  ningún padre, para que el usuario lo revise.

- **Por qué**: es lo que da sentido a los niveles — un objetivo de área/individual existe
  para aportar a uno de empresa. Pasar anclas con id permite **prellenar el padre** en la
  lista de revisión. Se pide copiar un id de la lista (no inventarlo); si no matchea, se
  ignora y queda sin alineación (editable por el usuario).
- **Alternativa**: alinear por texto y matchear en el cliente → frágil; el id explícito es
  más robusto.

### Decisión 3: flujo de UI = generar → lista → crear en bloque
Entrada propia (botón "✨ Planificar con IA"); el botón de a uno pasa de "+ Nuevo objetivo"
a "+ Objetivo". Modal ancho:
- Arriba: textarea + adjuntar PDF + botón **Generar**.
- Abajo: **lista de propuestas**, cada una con checkbox (seleccionada por defecto),
  título editable, selector de **nivel** (empresa solo si admin), **área** (si nivel=área),
  **alineación** opcional a un objetivo existente, y sus KRs (compactos, reusando el editor).
- Pie: **Crear seleccionadas**.

- **Por qué**: la revisión es el corazón de la co-creación (la persona se queda dueña).
  Reusa el editor de KRs y `createObjectiveWithKRs`.

### Decisión 4: creación en bloque secuencial, tolerante a fallos
`data.js` recorre las seleccionadas y llama `createObjectiveWithKRs` una por una. Si alguna
falla (p. ej. RLS: un `member` intenta crear `empresa`), se informa **cuáles** se crearon y
cuáles no, sin abortar el resto. La UI ofrece solo los niveles que el usuario puede crear.

- **Por qué**: sin transacción cliente; el registro por-objetivo es aceptable y da feedback
  claro. Prevenir por permiso en la UI + tolerar el rechazo de RLS como red de seguridad.

## Risks / Trade-offs

- **[La IA propone niveles que el usuario no puede crear]** (p. ej. `member` con `empresa`)
  → Mitigación: la UI limita el selector de nivel por permiso; RLS como respaldo; el bloque
  informa los fallos por propuesta.
- **[PDF de estrategia grande]** puede exceder tokens/costo → Mitigación: el modo reusa el
  registro de uso/costo; el prompt favorece un set acotado; el usuario ve el costo luego.
- **[Alineación intra-lote no soportada]** un objetivo de área que aporta a uno de empresa
  del mismo lote no puede enlazarse hasta que exista → Mitigación (v1): alinear solo a
  objetivos existentes; documentar el enlace intra-lote como mejora.
- **[Estrategia ambigua]** la IA podría sobre-generar → Mitigación: prompt de foco; el
  usuario deselecciona lo que sobra antes de crear.
