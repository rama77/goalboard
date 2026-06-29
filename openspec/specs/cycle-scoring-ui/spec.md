# cycle-scoring-ui Specification

## Purpose
TBD - created by archiving change okr-checkins-scoring-ui. Update Purpose after archive.
## Requirements
### Requirement: Cerrar el ciclo con scoring

La app SHALL permitir a un admin cerrar el ciclo activo, asignando a cada key
result un puntaje entre `0.0` y `1.0`. Al confirmar, los puntajes SHALL quedar
guardados y el ciclo SHALL pasar a estado `cerrado`.

#### Scenario: Cierre con puntajes

- **WHEN** un admin abre el cierre del ciclo, asigna un puntaje 0.0–1.0 a cada KR
  y confirma
- **THEN** los puntajes se guardan y el ciclo queda `cerrado`

#### Scenario: Rango inválido

- **WHEN** el admin ingresa un puntaje fuera de 0.0–1.0
- **THEN** la app no permite confirmar y lo señala (coherente con el CHECK de la base)

#### Scenario: Solo admin

- **WHEN** un miembro que no es admin intenta cerrar el ciclo
- **THEN** la acción no está disponible / es rechazada por RLS

### Requirement: Ciclo cerrado es de solo-lectura

Cuando un ciclo está `cerrado`, la app SHALL mostrarlo en modo solo-lectura: no
ofrece crear objetivos, ni check-ins, ni re-cerrar; muestra los puntajes finales.

#### Scenario: Ver un ciclo cerrado

- **WHEN** el usuario selecciona un ciclo `cerrado`
- **THEN** ve los objetivos con sus puntajes finales y las acciones de edición no
  están disponibles

#### Scenario: Guía de scoring

- **WHEN** el admin está asignando puntajes
- **THEN** la UI muestra la guía de Doerr (0.7 es un buen resultado; 1.0 sostenido
  sugiere objetivos poco ambiciosos) como ayuda contextual

