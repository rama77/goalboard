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

La app SHALL permitir crear un objetivo (título + tipo comprometido/aspiracional +
**nivel** empresa/área/individual) en la empresa y ciclo activos, y agregarle key
results indicando tipo (numérico / porcentaje / hito) con valor inicial, target y
actual. Cuando el nivel es `area`, la app SHALL pedir el **área**. El objetivo creado
SHALL pertenecer al usuario como dueño. La app SHALL ofrecer solo los niveles que el
usuario puede crear según sus permisos (p. ej. `empresa` solo a admin).

#### Scenario: Crear objetivo con nivel

- **WHEN** el usuario completa el formulario de nuevo objetivo eligiendo un nivel (y el
  área si es de nivel área) con uno o más key results y confirma
- **THEN** el objetivo y sus KRs quedan guardados (vía el cliente de Supabase, sujeto a
  RLS) con su nivel/área y aparecen en la lista

#### Scenario: Selector de área contextual

- **WHEN** el usuario elige el nivel `area`
- **THEN** la app muestra el selector de área; para `empresa`/`individual` no lo muestra

#### Scenario: Validación mínima

- **WHEN** el usuario intenta crear un objetivo sin título, sin tipo, sin área cuando el
  nivel es área, o un KR sin target
- **THEN** la app no envía la operación y señala lo que falta

#### Scenario: Foco (pocos KR)

- **WHEN** el usuario agrega más de 5 key results a un objetivo
- **THEN** la app advierte que el objetivo está perdiendo foco (sin bloquear)

### Requirement: Gestión de áreas

La app SHALL permitir a un `admin` crear áreas y asignar/quitar miembros con rol
(`lider`/`miembro`). Todo miembro SHALL poder ver las áreas y quiénes las integran.

#### Scenario: Admin crea un área y asigna un líder

- **WHEN** un admin crea un área y le asigna un usuario como `lider`
- **THEN** el área y su membresía quedan guardadas y visibles para la organización

#### Scenario: Miembro sin permiso

- **WHEN** un `member` que no es admin abre la gestión de áreas
- **THEN** puede verlas pero las acciones de crear/editar no están disponibles

### Requirement: Vista de cascada por niveles

La app SHALL permitir visualizar los objetivos del ciclo **agrupados por nivel**
(empresa / área / individual) y mostrar su **alineación** (a qué objetivo padre
contribuye cada uno).

#### Scenario: Ver la cascada del ciclo

- **WHEN** el usuario abre la vista de objetivos del ciclo activo
- **THEN** ve los objetivos organizados por nivel y puede identificar, para cada uno, el
  objetivo padre al que se alinea

