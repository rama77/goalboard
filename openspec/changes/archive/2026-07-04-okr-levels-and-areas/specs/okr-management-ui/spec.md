## MODIFIED Requirements

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

## ADDED Requirements

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
