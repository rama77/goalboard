# auth-session Specification

## Purpose
TBD - created by archiving change bootstrap-goalboard. Update Purpose after archive.
## Requirements
### Requirement: Login por magic link

El sistema SHALL permitir que una persona inicie sesión ingresando su email y
recibiendo un magic link, sin manejar contraseñas propias. La autenticación
SHALL delegarse en Supabase Auth.

#### Scenario: Solicitud de magic link

- **WHEN** una persona no autenticada ingresa su email y solicita ingresar
- **THEN** el sistema pide a Supabase Auth el envío de un magic link a ese email
  y muestra un mensaje indicando que revise su correo

#### Scenario: Ingreso desde el magic link

- **WHEN** la persona abre el magic link recibido por email
- **THEN** Supabase establece una sesión autenticada y la app muestra el estado
  logueado

### Requirement: Persistencia y refresco de sesión

La sesión autenticada SHALL persistir entre recargas de la página y SHALL
refrescarse automáticamente antes de expirar, apoyándose en el manejo de sesión
del cliente de Supabase.

#### Scenario: Sesión sobrevive a una recarga

- **WHEN** una persona autenticada recarga la página
- **THEN** sigue autenticada sin tener que solicitar un nuevo magic link

### Requirement: Estado de UI según autenticación

La interfaz SHALL reflejar el estado de autenticación: una vista para personas
no autenticadas (con el ingreso por email) y la app para personas autenticadas.
La app SHALL reaccionar a los cambios de sesión sin requerir recarga manual.

#### Scenario: No autenticado

- **WHEN** no hay sesión activa
- **THEN** la app muestra la pantalla de ingreso por email y no muestra el
  contenido de la app

#### Scenario: Cambio de estado en vivo

- **WHEN** el estado de autenticación cambia (la persona inicia o cierra sesión)
- **THEN** la UI se actualiza para reflejar el nuevo estado sin recarga manual

### Requirement: Cerrar sesión

El sistema SHALL permitir a una persona autenticada cerrar su sesión.

#### Scenario: Logout

- **WHEN** una persona autenticada cierra sesión
- **THEN** la sesión se elimina y la app vuelve a mostrar la pantalla de ingreso

