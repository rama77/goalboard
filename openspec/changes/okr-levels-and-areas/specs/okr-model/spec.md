## MODIFIED Requirements

### Requirement: Objetivos

El sistema SHALL modelar objetivos cualitativos que pertenecen a un ciclo y tienen
un dueño (un miembro de la organización). Cada objetivo SHALL marcarse como
`comprometido` o `aspiracional`. Cada objetivo SHALL tener un **nivel**: `empresa`,
`area` o `individual` (por defecto `individual`). Un objetivo de nivel `area` SHALL
referenciar el **área** a la que pertenece; los de nivel `empresa` e `individual` no
requieren área.

#### Scenario: Crear objetivo en un ciclo

- **WHEN** un miembro crea un objetivo dentro de un ciclo, con un título, el tipo
  `comprometido` o `aspiracional`, y un nivel
- **THEN** el objetivo queda asociado a ese ciclo, a ese dueño y a ese nivel

#### Scenario: Tipo obligatorio

- **WHEN** se crea un objetivo sin indicar si es comprometido o aspiracional
- **THEN** el sistema rechaza la creación

#### Scenario: Objetivo de área requiere área

- **WHEN** se crea un objetivo de nivel `area` sin indicar un área
- **THEN** el sistema rechaza la creación (los de empresa/individual no llevan área)

#### Scenario: Nivel por defecto

- **WHEN** se crea un objetivo sin indicar nivel
- **THEN** queda como `individual`

### Requirement: Alineación flexible entre objetivos

El sistema SHALL permitir enlazar un objetivo a un objetivo "padre" de la misma
organización para expresar a qué contribuye, sin forzar una cascada. El enlace es
opcional. La alineación sugerida entre niveles es `individual` → `area` → `empresa`,
pero NO SHALL ser obligatoria (se mantiene bottom-up y flexible).

#### Scenario: Enlazar objetivo de área a uno de empresa

- **WHEN** un usuario enlaza un objetivo de área al objetivo de empresa al que
  contribuye
- **THEN** queda registrada la relación de alineación y puede consultarse en ambos
  sentidos (a qué contribuye / qué contribuye a él)

#### Scenario: Objetivo sin alineación

- **WHEN** un objetivo no se enlaza a ningún padre
- **THEN** es válido igual (la alineación no es obligatoria, en ningún nivel)
