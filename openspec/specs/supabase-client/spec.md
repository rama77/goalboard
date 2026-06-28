# supabase-client Specification

## Purpose
TBD - created by archiving change bootstrap-goalboard. Update Purpose after archive.
## Requirements
### Requirement: Configuración pública del cliente

El front-end SHALL leer la configuración de conexión a Supabase (Project URL y
anon key) desde un archivo de configuración versionado (`config.js`) que solo
contiene valores **públicos**. El repositorio NO SHALL contener secretos (la
`service_role` key u otros) ni en el repo ni en el cliente.

#### Scenario: Configuración con valores de ejemplo en el repo

- **WHEN** alguien clona el repositorio por primera vez
- **THEN** `config.js` existe versionado con valores de ejemplo (placeholders)
  y comentarios que indican que deben reemplazarse por los de la propia instancia
  de Supabase

#### Scenario: Solo claves públicas

- **WHEN** se inspecciona la configuración cargada por el front-end
- **THEN** únicamente contiene la Project URL y la anon key (claves públicas por
  diseño), y ninguna clave secreta

### Requirement: Cliente único de Supabase

El front-end SHALL crear e inicializar un único cliente de
`@supabase/supabase-js` (cargado por ESM/CDN) y compartirlo entre todos los
módulos que necesiten acceder a Supabase.

#### Scenario: Instancia compartida

- **WHEN** dos módulos distintos del front-end importan el cliente de Supabase
- **THEN** ambos reciben la misma instancia ya inicializada con la configuración
  pública

#### Scenario: Carga sin errores en consola

- **WHEN** la app se sirve por HTTP y se carga en el browser
- **THEN** el cliente de Supabase se inicializa correctamente y la consola del
  browser queda sin errores ni warnings

