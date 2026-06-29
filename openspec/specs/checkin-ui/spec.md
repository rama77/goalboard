# checkin-ui Specification

## Purpose
TBD - created by archiving change okr-checkins-scoring-ui. Update Purpose after archive.
## Requirements
### Requirement: Registrar un check-in desde la UI

La app SHALL permitir registrar un check-in sobre un key result indicando el nuevo
valor actual, un indicador de confianza (`en_camino` / `en_riesgo` / `trabado`) y
una nota opcional. Al confirmar, el valor del KR SHALL quedar actualizado y su
progreso recalculado, y la vista SHALL reflejar el cambio.

#### Scenario: Check-in exitoso

- **WHEN** el dueño (o un admin) abre un KR y registra un nuevo valor con su
  confianza
- **THEN** se crea el check-in, el valor actual del KR pasa a ser el ingresado, y
  la barra de progreso se actualiza en la vista

#### Scenario: Confianza obligatoria

- **WHEN** el usuario intenta confirmar un check-in sin elegir confianza
- **THEN** la app no envía la operación y señala que falta la confianza

#### Scenario: Sin permiso

- **WHEN** un miembro que no es dueño del objetivo intenta registrar un check-in
  en un KR ajeno
- **THEN** la operación es rechazada (RLS) y la app muestra el error sin romperse

### Requirement: Ver el historial de check-ins de un KR

La app SHALL permitir ver el historial de check-ins de un key result, en orden
cronológico, con valor, confianza, nota, fecha y autor.

#### Scenario: Historial como serie temporal

- **WHEN** un KR tiene varios check-ins y el usuario abre su historial
- **THEN** ve todos los check-ins ordenados en el tiempo, para leer cómo evolucionó

### Requirement: Confianza visible en KRs y objetivos

La app SHALL mostrar, en cada key result, el indicador de confianza de su último
check-in, y en cada objetivo un rollup que refleje la confianza más floja entre
sus KRs (para detectar de un vistazo lo que está en riesgo).

#### Scenario: Indicador por KR

- **WHEN** un KR tiene al menos un check-in
- **THEN** muestra el color/indicador de la confianza del último check-in

#### Scenario: Rollup del objetivo

- **WHEN** un objetivo tiene KRs con confianzas distintas (p. ej. uno 🔴 y otro 🟢)
- **THEN** el objetivo muestra la confianza más floja (🔴) como señal de riesgo

#### Scenario: Sin check-ins

- **WHEN** un KR todavía no tiene check-ins
- **THEN** se muestra un estado neutro (sin confianza) y no un falso 🟢

