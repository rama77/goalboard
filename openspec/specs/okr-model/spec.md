# okr-model Specification

## Purpose
TBD - created by archiving change okr-data-model. Update Purpose after archive.
## Requirements
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

El sistema SHALL modelar ciclos con una **cadencia flexible**: una etiqueta de texto
no vacía (p. ej. `anual`, `semestral`, `cuatrimestral`, `trimestral`, `mensual`, u
otra) acompañada de un `period_months` entero mayor que 0 que expresa la duración del
período. Cada ciclo SHALL tener un rango de fechas y un estado (`activo` o
`cerrado`). Un ciclo PUEDE pertenecer a un ciclo padre de la misma organización
(alineación de alcance, sin forzar una jerarquía fija). El sistema NO SHALL limitar
la cadencia a un conjunto fijo de valores.

#### Scenario: Crear ciclo con cadencia común

- **WHEN** un admin crea un ciclo eligiendo un preset de cadencia (p. ej. Semestral)
- **THEN** el ciclo queda con la etiqueta `semestral` y `period_months = 6` en la
  organización

#### Scenario: Crear ciclo anual y trimestral enlazados

- **WHEN** un admin crea el ciclo anual 2027 (`period_months = 12`) y luego un ciclo
  trimestral Q1 2027 (`period_months = 3`) enlazado a él
- **THEN** ambos ciclos quedan en la organización y el trimestral referencia al anual
  como su ciclo padre

#### Scenario: Cadencia personalizada

- **WHEN** un admin usa la opción "Otro…" e ingresa una etiqueta propia con una
  cantidad de meses (p. ej. `bimestral`, 2)
- **THEN** el ciclo se crea con esa cadencia sin necesidad de cambiar el schema

#### Scenario: Cadencia inválida

- **WHEN** se intenta crear un ciclo con etiqueta de cadencia vacía o con
  `period_months` menor o igual a 0
- **THEN** el sistema rechaza la creación (lo garantizan los CHECK de la base)

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

