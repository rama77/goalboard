## Why

goalboard arranca desde cero y necesita una base sólida antes de construir
features de OKRs. A diferencia de su app hermana mindboard (single-file, vanilla,
offline-first sobre `localStorage`), goalboard es **compartida y multiusuario
desde el día uno**: los OKRs solo tienen sentido si todo el equipo ve y edita lo
mismo. Eso exige un source of truth compartido (Supabase) y, por lo tanto, una
forma definida de conectar el front-end estático con ese backend y de manejar la
sesión de autenticación en el browser. Definir esto bien ahora evita rehacer la
base cuando empecemos con el modelo de datos y las pantallas.

## What Changes

- Se define la **estructura de archivos/carpetas** del repo: front-end estático
  vanilla (HTML + CSS + JS por módulos ESM), sin frameworks ni paso de build.
- Se agregan los **archivos de gobernanza** espejados de mindboard, adaptados a
  goalboard: `README.md`, `LICENSE` (MIT, © 2026 Ramiro Galván),
  `CONTRIBUTING.md`, `AGENTS.md` y `CLAUDE.md` (este último apuntando a
  `AGENTS.md`), más `.gitignore`.
- Se establece el **enfoque de conexión con Supabase**: el cliente
  `@supabase/supabase-js` se carga por ESM/CDN (única excepción a la regla
  "sin CDN"), un único cliente compartido, y la config pública (URL + anon key)
  vive en un `config.js` versionado **con valores de ejemplo** (placeholders),
  que cada quien reemplaza por los de su propia instancia de Supabase.
- Se define el **manejo de sesión de auth en el browser** vía **magic link**
  (login por email, sin contraseñas), apoyándose en la persistencia y el
  auto-refresh de sesión del cliente de Supabase.
- Se documenta en el README **cómo crear el proyecto Supabase** y qué variables
  configurar.

Sin alcance en este change (explícitamente fuera): el **modelo de datos** de
OKRs, las **pantallas/UI** de la app, y las **políticas RLS** concretas (más allá
de dejar el lugar `supabase/schema.sql` donde vivirán).

## Capabilities

### New Capabilities
- `auth-session`: login por magic link y ciclo de vida de la sesión en el
  browser — iniciar sesión por email, persistencia y refresco automático de la
  sesión entre recargas, estado de UI logueado/no-logueado, y cerrar sesión.
- `supabase-client`: carga e inicialización de un único cliente de Supabase en
  el front-end a partir de configuración pública (URL + anon key), sin secretos
  en el repo ni en el cliente.

### Modified Capabilities
<!-- Ninguna: el repo no tiene specs previas. -->

## Impact

- **Repo nuevo**: crea la estructura de carpetas y todos los archivos de
  gobernanza y configuración. Hoy el repo solo tiene un `README.md` de una línea.
- **Dependencia externa**: `@supabase/supabase-js` v2 cargado por ESM/CDN; ningún
  paquete npm ni node_modules.
- **Supabase**: requiere un proyecto Supabase con Auth (magic link) habilitado;
  RLS será la capa de autorización (definida en changes posteriores).
- **Hosting**: la app debe servirse por HTTP (no `file://`); compatible con
  hosting estático (GitHub Pages, Netlify, Vercel) dentro del free tier.
- **Gobernanza**: `main` protegida, contribución por PR con aprobación, y cambios
  no triviales vía OpenSpec.
