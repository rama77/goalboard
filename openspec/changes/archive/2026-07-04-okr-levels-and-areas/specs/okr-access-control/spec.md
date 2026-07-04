## MODIFIED Requirements

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
