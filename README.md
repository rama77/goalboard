# goalboard

Herramienta web simple y **compartida** para gestionar OKRs (Objectives & Key
Results) con tu equipo. Hermana de mindboard, pero multiusuario desde el día uno:
los OKRs viven en una base compartida, no en el `localStorage` de un browser.

## Filosofía

- Front-end estático y vanilla: HTML + CSS + JS, sin frameworks ni paso de build.
- Sin backend propio: el front habla **directo a Supabase** (Auth + Postgres + RLS).
- Online-first. Supabase es el único source of truth compartido.
- La autorización se resuelve con **Row Level Security** en Supabase, no con un
  servidor intermedio.
- Pensado para correr dentro del **free tier** de Supabase.

## Stack

- HTML / CSS / JS vanilla, con módulos ESM.
- [`@supabase/supabase-js`](https://github.com/supabase/supabase-js) v2, cargado
  por ESM/CDN (única excepción a la regla "sin CDN").
- Supabase: Auth (magic link), Postgres y Row Level Security.

## Puesta en marcha

### 1. Crear el proyecto Supabase

1. Entrá a <https://supabase.com> y creá un proyecto (el free tier alcanza).
2. En **Project Settings → API** copiá:
   - **Project URL**
   - **anon public** key (clave pública; **no** la `service_role`).
3. En **Authentication → Providers → Email** habilitá el login por email y
   asegurate de tener activado el **magic link** (Supabase lo trae por defecto).
4. En **Authentication → URL Configuration** agregá la URL desde la que vas a
   servir la app (p. ej. `http://localhost:8000` en local) como redirect válida.
5. _(Más adelante)_ cuando exista el modelo de datos, vas a correr el SQL de
   `supabase/schema.sql` en el **SQL Editor** para crear tablas y políticas RLS.

### 2. Configurar el front-end

Editá `js/config.js` y reemplazá los valores de ejemplo por los de tu proyecto:

```js
export const SUPABASE_URL = 'https://TU-PROYECTO-ref.supabase.co';
export const SUPABASE_ANON_KEY = 'tu-anon-public-key';
```

> La anon key es **pública por diseño**: está pensada para vivir en el
> front-end, y lo que protege los datos son las políticas RLS de Supabase.
> Nunca pongas la `service_role` ni otros secretos en el front-end ni en el repo.

### 3. Servir la app

Tiene que servirse por **HTTP** (no `file://`), porque los módulos ESM y el auth
de Supabase necesitan un origen HTTP real. Cualquier servidor estático sirve —
elegí el que ya tengas a mano:

```bash
python3 -m http.server 8000   # Python (viene preinstalado en macOS/Linux)
npx serve                     # Node
php -S localhost:8000         # PHP
```

(O la extensión "Live Server" de VS Code, etc.) Después abrí la URL que te
indique, por ejemplo <http://localhost:8000>.

> Ninguna de estas herramientas es parte del stack ni queda registrada en el
> repo: son solo para levantar los archivos estáticos en local. goalboard es
> HTML + CSS + JS vanilla; no hay `package.json` ni dependencias de build.

En producción: cualquier hosting estático (GitHub Pages, Netlify, Vercel, …).
Acordate de agregar esa URL como redirect válida en Supabase (paso 1.4).

## Variables de configuración

| Variable            | Dónde         | Qué es                                      |
| ------------------- | ------------- | ------------------------------------------- |
| `SUPABASE_URL`      | `js/config.js`| Project URL de tu proyecto Supabase         |
| `SUPABASE_ANON_KEY` | `js/config.js`| anon **public** key (pública, no secreta)   |

## Estructura del repo

```
goalboard/
├── index.html          # única página; punto de entrada
├── css/styles.css      # tokens semánticos + dark mode
├── js/
│   ├── config.js       # config pública (URL + anon key)
│   ├── supabase.js     # cliente único de Supabase
│   ├── auth.js         # magic link + sesión
│   └── app.js          # bootstrap: login vs. app
├── supabase/schema.sql # (a futuro) tablas + políticas RLS
└── openspec/           # propuestas de cambios (spec-driven)
```

## Contribuir

Mirá [CONTRIBUTING.md](CONTRIBUTING.md). `main` está protegida: todo entra por
Pull Request con al menos una aprobación.

## Licencia

MIT © 2026 Ramiro Galván. Ver [LICENSE](LICENSE).
