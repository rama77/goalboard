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

La escritura de un objetivo y sus key results SHALL depender del **nivel** del objetivo:
un objetivo de nivel `empresa` SHALL poder crearlo/editarlo solo un `admin` de la
organización; uno de nivel `area`, el `lider` de esa área o un `admin`; uno de nivel
`individual`, su dueño o un `admin`. La gestión de organización, miembros, ciclos y
**áreas** SHALL estar restringida a los `admin`. Todo SHALL imponerse vía RLS.

#### Scenario: El dueño edita su objetivo individual

- **WHEN** el dueño de un objetivo de nivel `individual` modifica su objetivo o sus KRs
- **THEN** la operación se permite

#### Scenario: Solo admin escribe objetivos de empresa

- **WHEN** un `member` que no es admin intenta crear o editar un objetivo de nivel
  `empresa`
- **THEN** RLS bloquea la escritura (aunque sí pueda leerlo)

#### Scenario: El líder del área escribe los objetivos de su área

- **WHEN** el `lider` de un área crea o edita un objetivo de nivel `area` de esa área
- **THEN** la operación se permite

#### Scenario: Un no-líder no escribe objetivos de otra área

- **WHEN** un usuario que no es líder de un área (ni admin) intenta crear/editar un
  objetivo de nivel `area` de esa área
- **THEN** RLS bloquea la escritura

#### Scenario: Solo admin gestiona ciclos, miembros y áreas

- **WHEN** un `member` intenta crear un ciclo, agregar un miembro o crear un área
- **THEN** RLS bloquea la operación; solo un `admin` puede hacerla

### Requirement: Check-ins por el dueño

Registrar un check-in sobre un KR SHALL estar permitido al dueño del objetivo y a
los `admin`; el resto de los miembros solo lo lee.

#### Scenario: Member no hace check-in ajeno

- **WHEN** un `member` que no es dueño intenta registrar un check-in en un KR
  ajeno
- **THEN** RLS bloquea la escritura

