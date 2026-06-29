# okr-management-ui Specification

## Purpose
TBD - created by archiving change okr-app-ui-mvp. Update Purpose after archive.
## Requirements
### Requirement: Seleccionar el ciclo a visualizar

La app SHALL permitir ver los ciclos de la empresa activa y seleccionar uno como
**ciclo activo**, y SHALL permitir crear un ciclo nuevo (nombre + cadencia anual o
trimestral). Las vistas de objetivos SHALL mostrar los del ciclo seleccionado.

#### Scenario: Crear el primer ciclo

- **WHEN** la empresa activa no tiene ningún ciclo
- **THEN** la app invita a crear uno (p. ej. el año actual, anual) y, al crearlo,
  pasa a ser el ciclo activo

#### Scenario: Cambiar de ciclo

- **WHEN** existen varios ciclos y el usuario selecciona otro
- **THEN** la lista de objetivos se actualiza para mostrar los de ese ciclo

### Requirement: Ver objetivos con sus key results y progreso

La app SHALL listar los objetivos de la empresa y ciclo activos, mostrando para
cada uno su título, su tipo (comprometido/aspiracional), su dueño, y sus key
results con el **progreso calculado** (barra/porcentaje). SHALL mostrar todos los
objetivos visibles según RLS (transparencia dentro de la organización).

#### Scenario: Lista con progreso

- **WHEN** el ciclo activo tiene objetivos con key results
- **THEN** cada objetivo se muestra como una card con sus KRs y una barra de
  progreso derivada del progreso de los KRs

#### Scenario: Estado vacío

- **WHEN** el ciclo activo no tiene objetivos
- **THEN** la app muestra un estado vacío que invita a crear el primer objetivo

#### Scenario: Transparencia

- **WHEN** otra persona de la empresa cargó objetivos
- **THEN** el usuario los ve también (no solo los propios), respetando RLS

### Requirement: Crear objetivo con sus key results

La app SHALL permitir crear un objetivo (título + tipo comprometido/aspiracional)
en la empresa y ciclo activos, y agregarle key results indicando tipo (numérico /
porcentaje / hito) con valor inicial, target y actual. El objetivo creado SHALL
pertenecer al usuario como dueño.

#### Scenario: Crear objetivo y KRs

- **WHEN** el usuario completa el formulario de nuevo objetivo con uno o más key
  results y confirma
- **THEN** el objetivo y sus KRs quedan guardados (vía el cliente de Supabase,
  sujeto a RLS) y aparecen en la lista

#### Scenario: Validación mínima

- **WHEN** el usuario intenta crear un objetivo sin título o sin elegir el tipo,
  o un KR sin target
- **THEN** la app no envía la operación y señala lo que falta

#### Scenario: Foco (pocos KR)

- **WHEN** el usuario agrega más de 5 key results a un objetivo
- **THEN** la app advierte que el objetivo está perdiendo foco (sin bloquear)

