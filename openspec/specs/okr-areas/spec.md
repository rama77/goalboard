# okr-areas Specification

## Purpose
TBD - created by archiving change okr-levels-and-areas. Update Purpose after archive.
## Requirements
### Requirement: Áreas como entidad de la organización

El sistema SHALL modelar **áreas** (equipos/departamentos) que pertenecen a una
organización. Un área SHALL tener un nombre no vacío y vivir dentro de una única
organización. Las áreas son planas (sin sub-áreas).

#### Scenario: Crear un área

- **WHEN** un admin crea un área con un nombre dentro de su organización
- **THEN** el área queda registrada en esa organización y disponible para agrupar
  objetivos y asignar miembros

#### Scenario: Nombre obligatorio

- **WHEN** se intenta crear un área sin nombre
- **THEN** el sistema rechaza la creación

### Requirement: Membresía de usuarios a áreas con rol

El sistema SHALL permitir que un miembro de la organización pertenezca a **cero o más
áreas**, y en cada una con un rol `lider` o `miembro`. Un usuario SHALL tener a lo sumo
una membresía por área.

#### Scenario: Asignar un miembro a un área

- **WHEN** un admin agrega a un usuario (que ya es miembro de la organización) a un
  área con rol `lider` o `miembro`
- **THEN** ese usuario queda asociado al área con ese rol

#### Scenario: Un líder por objetivo de área

- **WHEN** un usuario con rol `lider` en un área gestiona los objetivos de nivel área
  de esa área
- **THEN** la operación se permite (ver okr-access-control)

### Requirement: Acceso a las áreas

El sistema SHALL permitir a todo miembro de la organización **leer** las áreas y sus
membresías (transparencia). La **creación/edición de áreas y la gestión de su
membresía** SHALL estar restringida a los `admin` de la organización. Todo SHALL
imponerse vía RLS.

#### Scenario: Miembro ve las áreas

- **WHEN** un `member` consulta las áreas de su organización
- **THEN** las ve, junto con quién las integra

#### Scenario: Solo admin gestiona áreas

- **WHEN** un `member` que no es admin intenta crear un área o asignar un miembro
- **THEN** RLS bloquea la operación

