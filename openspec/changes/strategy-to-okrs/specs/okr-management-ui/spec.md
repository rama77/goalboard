## ADDED Requirements

### Requirement: Crear objetivos en bloque desde una estrategia

La app SHALL ofrecer un flujo, separado del alta de un objetivo, para **generar y crear
varios objetivos** a partir de una estrategia. El flujo SHALL permitir pegar texto o subir
un PDF, invocar a la IA (modo estrategia) y mostrar las propuestas como una **lista
editable con selección múltiple**. Para cada propuesta el usuario SHALL poder ajustar
título, **nivel**, **área** (si el nivel es área), **alineación** a un objetivo existente y
sus key results. Al confirmar, la app SHALL crear **solo las propuestas seleccionadas** en
el ciclo activo, sujeto a RLS por nivel. La app SHALL ofrecer solo los niveles que el
usuario puede crear.

#### Scenario: Generar y crear un set

- **WHEN** el usuario pega una estrategia, genera con la IA, deselecciona las que no quiere
  y confirma
- **THEN** se crean únicamente los objetivos seleccionados (con su nivel/área/alineación y
  KRs) y aparecen en la cascada del ciclo

#### Scenario: Ajustar una propuesta antes de crear

- **WHEN** el usuario cambia el nivel de una propuesta a `area` y elige un área, o edita un KR
- **THEN** el objetivo se crea con esos ajustes

#### Scenario: Creación parcial por permisos

- **WHEN** entre las seleccionadas hay alguna que el usuario no puede crear (p. ej. un
  `member` con una propuesta de nivel `empresa`) y confirma
- **THEN** se crean las permitidas y la app informa cuáles no se pudieron crear, sin abortar
  el resto

#### Scenario: Sin guardar por su cuenta

- **WHEN** la IA devuelve propuestas
- **THEN** nada se guarda hasta que el usuario confirma "Crear seleccionadas"
