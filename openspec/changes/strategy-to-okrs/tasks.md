## 1. Edge Function (modo estrategia)

- [x] 1.1 `okr-coach`: agregar `level` (`empresa`/`area`/`individual`) al schema de cada `proposal`
- [x] 1.2 Nuevo `mode: 'estrategia'`: prompt que propone varios OKRs con nivel sugerido, favorece foco y encuadra por nivel; valida el modo
- [x] 1.3 `parentId` en el schema de cada proposal; recibir **anclas** `[{id,title,level}]` (empresa + área) y prompt para alinear las de área/individual a un padre y marcar las desalineadas
- [x] 1.4 Reusa el registro en `ai_usage` (feature='estrategia') y el ruteo de proveedor existente

## 2. Front-end (data)

- [x] 2.1 `js/data.js`: `aiStrategy({organizationId, input, anchors})` (invoca modo estrategia con los objetivos padres)
- [x] 2.2 `js/data.js`: `createObjectivesBulk(orgId, cycleId, items)` — recorre `createObjectiveWithKRs`, devuelve {creados, fallidos:[{title,error}]}

## 3. Front-end (UI)

- [x] 3.1 Renombrar el botón de a uno "+ Nuevo objetivo" → "+ Objetivo"; agregar entrada "✨ Planificar con IA"
- [x] 3.2 Modal ancho: textarea + adjuntar PDF + botón Generar (estados pensando/error)
- [x] 3.3 Lista de propuestas: checkbox (sel. por defecto), título, nivel (empresa solo admin), área (si nivel=área), alineación **prellenada con el padre sugerido** por la IA (editable), KRs (reusa editor compacto); marcar visualmente las desalineadas
- [x] 3.4 "Crear seleccionadas" → `createObjectivesBulk`; muestra resumen (creados/fallidos) y refresca la cascada
- [ ] 3.5 `js/app.js`: handler que pasa la key de estrategia y arma los targets de alineación/áreas; consola limpia, tokens, dark mode

## 4. Specs

- [x] 4.1 Deltas reflejados (ai-okr-assistant modo estrategia + okr-management-ui creación en bloque)

## 5. Verificación local (cierre condicionado a esto)

- [x] 5.1 Pegar la estrategia de la empresa → varias propuestas con KRs _(verificado: 3 propuestas con nivel + KRs)_
- [x] 5.2 Propuestas de área **alineadas a un objetivo de empresa** (parentId seteado); las de empresa sin padre _(verificado end-to-end)_
- [ ] 5.3 Deseleccionar y editar (nivel/área/KR) antes de crear; solo se crean las elegidas
- [ ] 5.4 Creación parcial: member con una propuesta empresa → se crean las permitidas, se informan los fallos (RLS)
- [ ] 5.5 Los objetivos creados aparecen en la cascada con su nivel/área/alineación
- [ ] 5.6 Uso/costo registrado para el modo estrategia; nada se guarda sin confirmar
