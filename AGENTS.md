# AGENTS.md

Guía para agentes de IA (y humanos apurados) que trabajen en goalboard.

## Qué es goalboard

App web para gestionar OKRs en equipo. Front-end vanilla estático que habla
directo a Supabase (Auth + Postgres + RLS). Sin backend propio. Online-first y
multiusuario: el source of truth es Supabase, compartido por todo el equipo.

## Reglas que NO se negocian

- **Sin frameworks ni build.** HTML + CSS + JS vanilla, con módulos ESM.
- **Sin CDN**, con la única excepción de `@supabase/supabase-js` (vía ESM/CDN).
- **Solo claves públicas** en el cliente (URL + anon key). Jamás la
  `service_role` ni secretos en el repo.
- **La autorización es RLS** en Supabase, no lógica de permisos en el front.
- **Colores por tokens semánticos** (variables CSS); nada de hex sueltos en los
  componentes. **Dark mode** siempre.
- **Consola limpia**: cero errores y cero warnings.
- Pensar dentro del **free tier** de Supabase.
- La app se sirve por **HTTP** (no `file://`).

## Estructura del repo

- `index.html` — única página; punto de entrada (`<script type="module">`).
- `css/styles.css` — tokens semánticos + dark mode.
- `js/config.js` — config pública (URL + anon key), con valores de ejemplo.
- `js/supabase.js` — cliente único de Supabase.
- `js/auth.js` — magic link y ciclo de sesión.
- `js/app.js` — bootstrap: decide login vs. app según la sesión.
- `supabase/schema.sql` — tablas + políticas RLS (a futuro, versionado).
- `openspec/` — propuestas de cambios (workflow spec-driven).

## Flujo de cambios

- `main` está protegida. Todo entra por PR con **≥1 aprobación**.
- Features / cambios no triviales: **OpenSpec** antes de codear
  (`/opsx:propose` → revisión → `/opsx:apply` → `/opsx:archive`).
- Un PR = un tema.

Ver también [CONTRIBUTING.md](CONTRIBUTING.md).
