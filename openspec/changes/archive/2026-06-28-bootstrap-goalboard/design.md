## Context

goalboard es un front-end estático vanilla que habla directo a Supabase (auth +
Postgres + RLS), sin backend propio. Hereda el espíritu de simpleza de mindboard
(sin frameworks, sin build), pero a diferencia de mindboard —que es single-file y
guarda todo en `localStorage`— goalboard es multiusuario y comparte estado vía
Supabase. Este change define la base del repo y la conexión con Supabase; no
define el modelo de datos, las pantallas ni las políticas RLS concretas.

Restricciones heredadas:
- Sin frameworks ni paso de build. HTML + CSS + JS vanilla.
- "Sin CDN", con una única excepción: `@supabase/supabase-js`.
- Solo claves públicas en el cliente; ningún secreto en el repo.
- Colores por tokens semánticos (variables CSS); dark mode; consola limpia.
- Debe correr dentro del free tier de Supabase y servirse por HTTP (no `file://`).

## Goals / Non-Goals

**Goals:**
- Estructura de archivos clara y mínima, entendible de un vistazo.
- Archivos de gobernanza espejados de mindboard, adaptados a goalboard.
- Forma definida de cargar el cliente de Supabase y manejar la sesión de auth.
- README con el paso a paso para crear el proyecto Supabase y configurar variables.

**Non-Goals:**
- Modelo de datos de OKRs (tablas, relaciones).
- Pantallas/flujos de la app más allá del gate de login.
- Políticas RLS concretas (solo se reserva el lugar `supabase/schema.sql`).
- Proveedores de login adicionales (OAuth); por ahora solo magic link.

## Decisions

### Estructura del repo

```
goalboard/
├── index.html              # única página; punto de entrada
├── css/
│   └── styles.css          # tokens semánticos + dark mode + componentes
├── js/
│   ├── config.js           # config pública (URL + anon key) con placeholders
│   ├── supabase.js         # crea y exporta el cliente único de Supabase
│   ├── auth.js             # magic link, sesión, guard de UI
│   └── app.js              # bootstrap: arranca auth y monta la UI
├── supabase/
│   └── schema.sql          # (a futuro) DDL + políticas RLS, versionado
├── README.md
├── CONTRIBUTING.md
├── AGENTS.md
├── CLAUDE.md               # apunta a AGENTS.md
├── LICENSE                 # MIT, © 2026 Ramiro Galván
└── .gitignore
```

Rationale: separar el JS en módulos ESM (en vez de un único archivo como
mindboard) porque ya se carga Supabase como ESM y conviene aislar config,
cliente, auth y bootstrap. Sigue sin haber build ni dependencias npm.
Alternativa considerada: single-file como mindboard → descartada porque el
manejo de auth + cliente compartido se lee mucho mejor en módulos separados.

### Carga del cliente de Supabase

Se importa `createClient` de `@supabase/supabase-js@2` por ESM desde CDN, y se
exporta una instancia única desde `js/supabase.js`. `index.html` tiene un único
entry point `<script type="module" src="./js/app.js">`.

Alternativas: bundle UMD por `<script>` clásico → descartado, menos limpio que
ESM y obliga a globals. npm + bundler → descartado, rompe "sin build".

### Configuración pública (`config.js` versionado con placeholders)

`config.js` se versiona con valores de ejemplo y se documenta que cada quien
ponga los suyos. Razón: la anon key es **pública por diseño** (la seguridad la da
RLS), así que no es un secreto que ocultar; y como goalboard se despliega por
instancia (cada equipo levanta la suya), commitear las claves de una instancia
particular no aporta. Además, al no haber build, un sitio estático (p. ej. GitHub
Pages) no tiene dónde inyectar la config en deploy: tenerla versionada hace que
"clona y anda".

Alternativas consideradas:
- `config.js` en `.gitignore` + `config.example.js` → descartado: rompe el deploy
  estático más simple (no hay paso que genere `config.js`) y oculta algo que no es
  secreto.
- Commitear claves reales de una instancia → descartado: a un tercero no le
  sirven y las reemplaza igual.

### Manejo de sesión (magic link)

Se usa Supabase Auth con magic link (OTP por email), sin contraseñas. El cliente
de Supabase persiste la sesión (por defecto en `localStorage`), la auto-refresca,
y expone `onAuthStateChange` para reaccionar a login/logout. `js/auth.js`
encapsula `signInWithOtp`, `getSession`, `onAuthStateChange` y `signOut`;
`js/app.js` renderiza login vs. app según la sesión.

Alternativa: OAuth (Google/GitHub) → descartado para el bootstrap por requerir
configurar proveedores; magic link es lo más cercano a "cada uno se loguea y sale
andando" con cero fricción. Queda como extensión futura.

### Gobernanza

Archivos espejados de mindboard, adaptados: README (qué es + setup Supabase),
LICENSE (MIT © 2026 Ramiro Galván), CONTRIBUTING (fork → PR acotado → PR contra
`main` protegida con ≥1 aprobación; cambios no triviales vía OpenSpec), AGENTS.md
(reglas no negociables para IA/humanos) y CLAUDE.md apuntando a AGENTS.md.

## Risks / Trade-offs

- **`config.js` versionado puede confundir** (parece que esconde claves) →
  Mitigación: comentarios claros + sección en README explicando que la anon key
  es pública y que el secreto real (`service_role`) nunca va al front.
- **Dependencia de CDN para Supabase** (disponibilidad/versión) → Mitigación:
  fijar versión mayor (`@2`) en la URL ESM; documentar el origen del CDN.
- **Magic link depende del envío de emails de Supabase** (límites del free tier,
  spam) → Mitigación: documentar la config de Auth; OAuth queda como alternativa
  futura si el volumen lo pide.
- **Sin RLS aún**, la base no está protegida hasta el próximo change →
  Mitigación: este change no crea tablas con datos; el modelo de datos y RLS
  llegan juntos en un change posterior.

## Migration Plan

Repo nuevo, sin migración. Pasos de puesta en marcha (documentados en README):
crear proyecto Supabase → habilitar Auth magic link → copiar URL + anon key a
`config.js` → servir por HTTP. Rollback: trivial (revertir el PR de scaffold).

## Open Questions

- ¿Hosting de referencia para el README (GitHub Pages vs. Netlify/Vercel)? No
  bloquea; se puede documentar más de uno.
- Nombre exacto del archivo de schema y si se incluye un seed mínimo: se decide
  en el change del modelo de datos.
