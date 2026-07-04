## ADDED Requirements

### Requirement: Proponer un set de OKRs desde una estrategia

La IA SHALL ofrecer un modo **estrategia** que, a partir de un texto o un PDF que describe
una estrategia o contexto, proponga **varios objetivos** de una sola vez. Cada propuesta
SHALL incluir un **nivel sugerido** (`empresa`, `area` o `individual`), su tipo
(`comprometido`/`aspiracional`), sus key results medibles y una nota de alineación. La IA
SHALL favorecer el **foco** (un set acotado y priorizado, no una lista exhaustiva) y NUNCA
SHALL crear los objetivos por su cuenta: solo propone.

#### Scenario: Estrategia de empresa → varios objetivos de empresa

- **WHEN** el usuario pega una estrategia de compañía con varios pilares y pide generar
- **THEN** la IA devuelve varias propuestas de objetivos, la mayoría con nivel sugerido
  `empresa`, cada una con sus KRs medibles

#### Scenario: Material de un equipo → objetivos de área

- **WHEN** el material describe el foco de un equipo/área
- **THEN** la IA sugiere propuestas de nivel `area` (además de las de empresa/individual que
  correspondan), encuadradas a ese nivel

#### Scenario: Nivel sugerido, no impuesto

- **WHEN** la IA devuelve las propuestas
- **THEN** cada una trae un `level` sugerido que el usuario puede cambiar antes de crear

#### Scenario: Favorecer el foco

- **WHEN** la estrategia es amplia y daría para muchos objetivos
- **THEN** la IA propone un set acotado y prioriza, en vez de enumerar todo

### Requirement: Alinear las propuestas de área/individual a los objetivos padres

En el modo estrategia, la IA SHALL recibir los **objetivos padres existentes** (los de
nivel `empresa`; y, para proponer individuales, también los de `area`) como anclas de
alineación. Al proponer objetivos de nivel `area` o `individual`, la IA SHALL **alinearlos
a un padre** indicando cuál de las anclas provistas es su padre, y SHALL **señalar** la
propuesta que no contribuye a ningún objetivo padre.

#### Scenario: Objetivo de área alineado a uno de empresa

- **WHEN** existen objetivos de empresa y el usuario genera OKRs de área desde una estrategia
- **THEN** cada propuesta de área indica a qué objetivo de empresa aporta (padre sugerido)

#### Scenario: Objetivo individual alineado a área o empresa

- **WHEN** existen objetivos de empresa y/o área y el usuario genera OKRs individuales
- **THEN** cada propuesta individual indica a qué objetivo de área o empresa aporta

#### Scenario: Propuesta sin aporte a un padre

- **WHEN** una propuesta de área/individual no contribuye a ningún objetivo padre existente
- **THEN** la IA la marca como posible desalineación, para que el usuario la revise o la
  ajuste antes de crearla
