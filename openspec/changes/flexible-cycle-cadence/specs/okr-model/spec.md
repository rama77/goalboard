## MODIFIED Requirements

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
