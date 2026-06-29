# okr-check-ins Specification

## Purpose
TBD - created by archiving change okr-data-model. Update Purpose after archive.
## Requirements
### Requirement: Check-in de progreso

El sistema SHALL permitir registrar check-ins sobre un Key Result: un nuevo valor
actual, un indicador de confianza (`en_camino` 🟢 / `en_riesgo` 🟡 / `trabado` 🔴)
y una nota opcional. Cada check-in SHALL registrar quién lo hizo y cuándo.

#### Scenario: Registrar un check-in

- **WHEN** el dueño actualiza un KR con un nuevo valor actual y una confianza
- **THEN** se crea un check-in con autor y fecha, y el valor actual del KR pasa a
  ser el del check-in (recalculando su progreso)

#### Scenario: Confianza obligatoria

- **WHEN** se registra un check-in sin indicador de confianza
- **THEN** el sistema lo rechaza

### Requirement: Historial de check-ins

El sistema SHALL conservar el historial completo de check-ins de cada KR, de modo
que un KR pueda verse como una serie temporal de avances, no solo como su valor
actual.

#### Scenario: Ver la evolución de un KR

- **WHEN** se consultan los check-ins de un KR con varias actualizaciones
- **THEN** se obtienen todos en orden cronológico, con su valor y confianza, para
  reconstruir cómo se movió en el tiempo

### Requirement: Scoring al cierre del ciclo

El sistema SHALL permitir asignar un puntaje `0.0`–`1.0` a cada KR (y por
agregación al objetivo) al cerrar un ciclo. Cerrar un ciclo SHALL marcarlo como
`cerrado`.

#### Scenario: Puntuar al cierre

- **WHEN** un admin cierra un ciclo y asigna el puntaje de cada KR
- **THEN** los puntajes quedan persistidos y el ciclo pasa a estado `cerrado`

#### Scenario: Rango de puntaje válido

- **WHEN** se intenta asignar un puntaje fuera de 0.0–1.0
- **THEN** el sistema lo rechaza

