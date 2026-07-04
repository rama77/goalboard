## Why

Cuando alguien pega una **estrategia** (p. ej. la de la empresa, con varios pilares),
lo natural es esperar **varios OKRs**, no uno. Hoy el asistente vive dentro del modal
de "un objetivo": "Definir con IA" solo carga la **primera** propuesta y descarta el
resto, así que una estrategia rica se condensa en un único objetivo mal encuadrado.
Falta un flujo pensado para **generar un set de OKRs** de una, a nivel **empresa y
área**, y crearlos en bloque.

## What Changes

- **Nuevo modo de IA `estrategia`** en la Edge Function `okr-coach`: recibe texto o PDF
  y devuelve **varias `proposals`**, cada una con un **`level` sugerido**
  (`empresa`/`area`/`individual`), tipo, KRs medibles y nota de alineación. Favorece el
  **foco** (un set acotado y priorizado). Se agrega `level` al schema de cada proposal.
- **Alineación guiada por los objetivos padres**: el modo `estrategia` SHALL recibir los
  **objetivos padres existentes** (los de nivel empresa; y para proponer individuales,
  también los de área) como **anclas**. Al proponer objetivos de área o individuales, la
  IA los **alinea a un padre** (sugiere `parentId` de la lista de anclas) y **valida el
  aporte**: marca la propuesta que no contribuye a ningún padre. Se agrega `parentId` al
  schema de cada proposal (uno de los ids de anclas provistos, o vacío).
- **Nuevo flujo de UI "✨ Planificar con IA"** (entrada propia, separada del alta de un
  objetivo, que pasa a llamarse "+ Objetivo"): pegar estrategia / subir PDF → **Generar** → **lista de propuestas**
  editables (título, nivel, tipo, área si aplica, alineación, KRs) con **selección
  múltiple** → **Crear seleccionadas** en bloque.
- **Creación en bloque** reusando `createObjectiveWithKRs` (ya soporta
  `level`/`area_id`/`parentObjectiveId`), respetando **RLS por nivel** (empresa=admin,
  área=líder o admin, individual=dueño). Reusa el registro de **uso/costo** del coach.

## Capabilities

### New Capabilities
<!-- Ninguna nueva: extiende capabilities existentes. -->

### Modified Capabilities
- `ai-okr-assistant`: se agrega el modo **estrategia** (propone múltiples OKRs con nivel
  sugerido desde texto/PDF); complementa "definir" (un objetivo) y "revisar".
- `okr-management-ui`: nuevo flujo para **revisar propuestas y crear objetivos en
  bloque** desde una estrategia, con selección múltiple y asignación de nivel/área.

## Impact

- **Edge Function** `okr-coach`: modo `estrategia` + `level` en el schema de proposals +
  prompt que pide un set acotado y encuadra por nivel. Sin cambios de datos.
- **Front-end**: `js/data.js` (helper de creación en bloque), `js/ui.js` (modal/flujo de
  propuestas con selección y edición), `js/app.js` (handler + entrada).
- **Specs**: deltas en `ai-okr-assistant` y `okr-management-ui`.
- **Reusa**: `createObjectiveWithKRs`, niveles/áreas, RLS por nivel, `ai_usage`.
- **Sin cambios**: schema de datos, cadencia, check-ins, scoring.
- **Fuera de alcance (v1)**: enlazar propuestas **entre sí** dentro del mismo lote
  (área → empresa recién creada). La alineación en v1 apunta a objetivos **ya
  existentes**; el enlace intra-lote queda como mejora futura.
