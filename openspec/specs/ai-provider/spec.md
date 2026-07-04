# ai-provider Specification

## Purpose
TBD - created by archiving change okr-ai-coach. Update Purpose after archive.
## Requirements
### Requirement: Elección de proveedor y modelo por empresa

El sistema SHALL permitir configurar, por empresa, el **proveedor** de IA y el
**modelo** a usar. La configuración SHALL ser administrable por un `admin` de la
empresa y SHALL tener un valor por defecto. El cliente SHALL poder leer la
configuración vigente (no las keys).

#### Scenario: Cambiar de proveedor/modelo

- **WHEN** un admin elige un proveedor y un modelo soportados
- **THEN** las siguientes llamadas de IA de esa empresa usan ese proveedor/modelo

#### Scenario: Default

- **WHEN** una empresa no configuró nada
- **THEN** se usa el proveedor/modelo por defecto del sistema

#### Scenario: Solo admin

- **WHEN** un `member` que no es admin intenta cambiar la configuración de IA
- **THEN** RLS lo bloquea

### Requirement: Keys del proveedor solo en el servidor

Las API keys de cada proveedor SHALL vivir únicamente como secretos del servidor
(Edge Function), nunca en el cliente ni en el repo. La llamada al modelo SHALL
ejecutarse del lado servidor con un usuario autenticado.

#### Scenario: Sin sesión

- **WHEN** se invoca la función de IA sin un JWT válido
- **THEN** la función rechaza la solicitud

#### Scenario: Proveedor sin key configurada

- **WHEN** el proveedor elegido no tiene su key configurada en el servidor
- **THEN** la app no rompe y la IA informa que ese proveedor no está disponible

### Requirement: Adaptador agnóstico

La Edge Function SHALL exponer una interfaz única (definir / revisar) y enrutar a
la API del proveedor configurado, normalizando entrada y salida, de modo que el
resto de la app no dependa de un proveedor específico.

#### Scenario: Mismo flujo, distinto proveedor

- **WHEN** dos empresas usan proveedores distintos
- **THEN** ambas obtienen la misma forma de respuesta (propuestas / hallazgos) sin
  cambios en el front-end

#### Scenario: Gateway agregador (OpenRouter)

- **WHEN** una empresa elige el proveedor `openrouter` con un modelo con formato
  `proveedor/modelo` (p. ej. `anthropic/claude-opus-4-8`)
- **THEN** la función enruta la llamada a través del gateway (API OpenAI-compatible)
  y devuelve la misma forma de respuesta, registrando el costo real informado por el
  gateway cuando está disponible

#### Scenario: Capacidad no soportada por el proveedor (PDF)

- **WHEN** se pide el modo "definir" con un PDF y el proveedor elegido no soporta
  entrada de PDF
- **THEN** la función no rompe: informa que esa capacidad requiere un proveedor
  compatible (hoy, Anthropic), sin registrar uso

