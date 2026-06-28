## ADDED Requirements

### Requirement: Organización y miembros

El sistema SHALL modelar una organización a la que pertenecen miembros, cada uno
con un rol (`admin` o `member`). Un miembro corresponde a un usuario autenticado
de Supabase Auth. La organización es el límite de visibilidad: los OKRs viven
dentro de una organización.

#### Scenario: Persona sola

- **WHEN** un usuario crea una organización para uso individual
- **THEN** queda como único miembro con rol `admin` y puede crear OKRs en ella

#### Scenario: Organización con varios miembros y roles

- **WHEN** un admin agrega a otro usuario a la organización
- **THEN** ese usuario queda como miembro con el rol asignado (`admin` o `member`)
  y pasa a ver los OKRs de la organización

### Requirement: Ciclos anual y trimestral

El sistema SHALL modelar ciclos con cadencia `anual` o `trimestral`, cada uno con
un rango de fechas y un estado (`activo` o `cerrado`). Un ciclo trimestral PUEDE
pertenecer a un ciclo anual de la misma organización.

#### Scenario: Crear ciclo anual y trimestrales

- **WHEN** un admin crea el ciclo anual 2027 y luego un ciclo trimestral Q1 2027
  enlazado a él
- **THEN** ambos ciclos quedan en la organización y el trimestral referencia al
  anual como su ciclo padre

#### Scenario: Cadencia válida

- **WHEN** se crea un ciclo
- **THEN** su cadencia es exactamente `anual` o `trimestral` (no se permiten otros
  valores)

### Requirement: Objetivos

El sistema SHALL modelar objetivos cualitativos que pertenecen a un ciclo y tienen
un dueño (un miembro de la organización). Cada objetivo SHALL marcarse como
`comprometido` o `aspiracional`.

#### Scenario: Crear objetivo en un ciclo

- **WHEN** un miembro crea un objetivo dentro de un ciclo, con un título y el tipo
  `comprometido` o `aspiracional`
- **THEN** el objetivo queda asociado a ese ciclo y a ese dueño

#### Scenario: Tipo obligatorio

- **WHEN** se crea un objetivo sin indicar si es comprometido o aspiracional
- **THEN** el sistema rechaza la creación

### Requirement: Key Results medibles

El sistema SHALL modelar Key Results que pertenecen a un objetivo. Cada KR SHALL
ser de tipo `numerico`, `porcentaje` o `hito`, y SHALL tener un valor inicial, un
target y un valor actual. El progreso de un KR SHALL derivarse de
(actual − inicial) / (target − inicial), acotado al rango 0–100%.

#### Scenario: KR numérico con progreso calculado

- **WHEN** un KR numérico tiene inicial 100, target 300 y actual 200
- **THEN** su progreso calculado es 50%

#### Scenario: KR de hito (binario)

- **WHEN** un KR de tipo `hito` se marca como cumplido
- **THEN** su progreso es 100% (y 0% mientras no esté cumplido)

#### Scenario: Foco — pocos KR por objetivo

- **WHEN** se intenta agregar un KR que haría superar el máximo recomendado (5)
  a un objetivo
- **THEN** el sistema advierte que el objetivo está perdiendo foco
  _(la regla de negocio se valida; el corte duro vs. advertencia se decide en diseño)_

### Requirement: Alineación flexible entre objetivos

El sistema SHALL permitir enlazar un objetivo a un objetivo "padre" de la misma
organización para expresar a qué contribuye, sin forzar una cascada. El enlace es
opcional.

#### Scenario: Enlazar objetivo de equipo a uno de empresa

- **WHEN** un miembro enlaza su objetivo al objetivo de empresa al que contribuye
- **THEN** queda registrada la relación de alineación y puede consultarse en ambos
  sentidos (a qué contribuye / qué contribuye a él)

#### Scenario: Objetivo sin alineación

- **WHEN** un objetivo no se enlaza a ningún padre
- **THEN** es válido igual (la alineación no es obligatoria)
