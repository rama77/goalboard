## Why

goalboard tiene base (auth), modelo de datos multi-tenant y RLS, y entorno de
dev local — pero **no tiene ni una sola pantalla**. Después del login, el usuario
ve un shell vacío. Este change construye la **primera UI usable**: que una
persona se loguee, cree su empresa (tenant) y empiece a cargar y ver OKRs.

Para que goalboard sienta familiar y consistente, la UI **reusa el sistema de
diseño de su app hermana mindboard** (tokens, dark mode y componentes), en vez de
inventar uno nuevo.

## What Changes

- **Sistema de diseño**: goalboard adopta los tokens y componentes de mindboard
  — paleta `oklch` (shadcn-style) con marca teal/azul, `--radius`, **dark mode
  por clase `.dark`** (con `localStorage` + preferencia del sistema), y los
  patrones `ap-` (shell con sidebar, topbar, page header, botones, cards,
  modales). Reemplaza los tokens hex provisorios del bootstrap.
- **App shell**: layout con sidebar (navegación: empresa actual + ciclos) +
  topbar + área de página, al estilo mindboard. Toggle de tema claro/oscuro.
- **Onboarding de empresa (tenant)**: al loguearse, si el usuario no pertenece a
  ninguna organización, se le ofrece **crear su empresa** (usa la función
  `create_organization`, que lo deja como admin). Si pertenece a una o más,
  puede **elegir/cambiar** la empresa activa.
- **Ciclos (mínimo)**: dentro de la empresa, ver y **crear un ciclo** (anual o
  trimestral) y seleccionar el ciclo activo a visualizar.
- **Ver OKRs**: listar los objetivos de la empresa para el ciclo seleccionado,
  cada uno con su tipo (comprometido/aspiracional), sus key results y el
  **progreso calculado** (barra), respetando RLS (transparencia dentro de la org).
- **Crear OKRs**: crear un objetivo y sus key results (de tipo numérico /
  porcentaje / hito) desde un modal.

Pensado SaaS-ready: el modelo ya aísla cada empresa por RLS, así que esta UI ya
es multi-tenant (varias empresas, datos separados).

## Capabilities

### New Capabilities
- `org-onboarding`: flujo de tenant en el cliente — crear empresa al no tener
  ninguna, y elegir/cambiar la empresa activa cuando hay varias.
- `okr-management-ui`: pantallas para ver objetivos + key results con progreso de
  la empresa/ciclo actual, y crear ciclo, objetivo y key results.

### Modified Capabilities
<!-- `auth-session`, `supabase-client`, `okr-model`, `okr-check-ins`,
`okr-access-control` no cambian sus requisitos: esta es la capa de UI encima. -->

## Impact

- **Front-end**: nuevos módulos JS de UI (render de vistas, modales, estado de la
  empresa/ciclo activos) y reescritura de `css/styles.css` con los tokens y
  componentes de mindboard. `index.html` pasa de shell vacío a la app real.
- **Sin cambios de backend**: usa el modelo y las RLS ya existentes vía el cliente
  de Supabase; se desarrolla y prueba contra el stack local.
- **Fuera de alcance (changes futuros)**: UI de **check-ins** y **scoring**,
  **gestión/invitación de miembros**, **IA coach**, y toda la capa de
  **planes/suscripciones y billing** de la SaaS.
