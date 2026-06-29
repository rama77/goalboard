# okr-access-control Specification

## Purpose
TBD - created by archiving change okr-data-model. Update Purpose after archive.
## Requirements
### Requirement: Transparencia dentro de la organización

Todo miembro de una organización SHALL poder LEER todos los OKRs (objetivos, key
results, check-ins, ciclos) de esa organización. La transparencia se impone con
políticas Row Level Security en Postgres, no con lógica en el front-end.

#### Scenario: Un miembro ve los OKRs de otra área

- **WHEN** un miembro consulta los objetivos de su organización
- **THEN** obtiene también los de otras personas y áreas de la misma organización

#### Scenario: Aislamiento entre organizaciones

- **WHEN** un usuario que no pertenece a una organización intenta leer sus OKRs
- **THEN** RLS no devuelve ninguna fila de esa organización

### Requirement: Permisos de escritura

La escritura de un objetivo y sus key results SHALL estar restringida a su dueño y
a los `admin` de la organización. La gestión de organización, miembros y ciclos
SHALL estar restringida a los `admin`. Todo SHALL imponerse vía RLS.

#### Scenario: El dueño edita lo suyo

- **WHEN** el dueño de un objetivo modifica su objetivo o sus KRs
- **THEN** la operación se permite

#### Scenario: Un miembro no edita lo ajeno

- **WHEN** un `member` que no es dueño intenta modificar el objetivo de otra
  persona
- **THEN** RLS bloquea la escritura (aunque sí pueda leerlo)

#### Scenario: Solo admin gestiona ciclos y miembros

- **WHEN** un `member` intenta crear un ciclo o agregar un miembro
- **THEN** RLS bloquea la operación; solo un `admin` puede hacerla

### Requirement: Check-ins por el dueño

Registrar un check-in sobre un KR SHALL estar permitido al dueño del objetivo y a
los `admin`; el resto de los miembros solo lo lee.

#### Scenario: Member no hace check-in ajeno

- **WHEN** un `member` que no es dueño intenta registrar un check-in en un KR
  ajeno
- **THEN** RLS bloquea la escritura

