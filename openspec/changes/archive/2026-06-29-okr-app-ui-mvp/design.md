## Context

goalboard tiene auth, modelo multi-tenant + RLS, y dev local (Supabase CLI). No
hay UI. Su app hermana **mindboard** (`/Users/rgalvan/Documents/git/mindboard`,
single-file vanilla) ya tiene un sistema de diseño maduro; goalboard debe sentirse
hermana. Este change construye la primera UI y adopta ese sistema de diseño.

## Goals / Non-Goals

**Goals:**
- Misma UX que mindboard (tokens, dark mode, componentes).
- Login → crear empresa (tenant) → ver/crear OKRs, todo local-first.
- Multi-tenant desde el front (empresa activa, aislada por RLS).

**Non-Goals:**
- Check-ins, scoring, gestión/invitación de miembros (changes futuros).
- IA coach.
- Planes / suscripciones / billing (la capa de comercialización SaaS).

## Decisions

### Reusar el sistema de diseño de mindboard

Se copian a goalboard los **tokens** y **patrones de componentes** de mindboard
(no se inventan):

- **Tokens** (`:root` + `.dark`): paleta `oklch` shadcn-style — `--background`,
  `--foreground`, `--card`, `--muted(-foreground)`, `--accent`, `--border`,
  `--primary(-foreground)`, `--ring`, semánticos `--success/--warning/--danger/
  --info`; marca `--brand-blue:#1F2F98` / `--brand-teal:#06CBC1` / `--brand-sky`;
  `--radius:.75rem`. Reemplaza los tokens hex provisorios del bootstrap.
- **Dark mode**: por clase `.dark` en `<html>`, persistida en `localStorage` y
  con default según `prefers-color-scheme` (igual que mindboard).
- **Componentes** (prefijo `ap-`): shell `ap-app`/`ap-sidebar`/`ap-main`, topbar,
  `ap-header`/`ap-title`/`ap-subtitle`, `ap-btn`(+`.ghost`)/`ap-icon-btn`,
  `ap-card`, `ap-modal`, badges. Se reusan tal cual donde apliquen.

Alternativa descartada: diseñar tokens propios → rompería la hermandad visual y
duplicaría esfuerzo.

### Mapeo OKR sobre las estructuras de mindboard

```
sidebar    → empresa activa (+ switch) y lista de ciclos
topbar     → ciclo activo + acciones (nuevo objetivo, tema)
página     → objetivos del ciclo como cards
card       → objetivo: título, tipo, dueño, KRs y barra de progreso
modal      → crear/editar objetivo y sus KRs
```

### Estructura de módulos JS (vanilla ESM, sin build)

Sobre lo ya existente (`config.js`, `supabase.js`, `auth.js`, `app.js`):

- `js/data.js` — funciones de acceso a datos sobre el cliente de Supabase
  (listar orgs del usuario, crear org vía RPC `create_organization`, listar/crear
  ciclos, listar objetivos+KRs, crear objetivo+KRs). Toda lectura/escritura pasa
  por RLS.
- `js/state.js` — estado de UI mínimo: empresa activa y ciclo activo
  (persistidos en `localStorage` por usuario).
- `js/ui/` — render de las vistas (shell, onboarding, lista de objetivos, modales)
  con funciones que crean DOM (sin framework), siguiendo el estilo de `app.js`.

El `app.js` orquesta: sesión → ¿tiene org? → onboarding o app.

### Progreso

Se muestra el `progress` que ya calcula la base (columna generada del KR). El
progreso del objetivo es el promedio de sus KRs (cálculo en el front para
mostrar; no se persiste).

## Risks / Trade-offs

- **Copiar CSS de un archivo de 3681 líneas** → se extrae solo lo necesario
  (tokens + componentes usados), no todo mindboard.
- **Crear objetivo + N KRs en varias operaciones** sin transacción del lado del
  cliente → Mitigación: crear el objetivo y luego sus KRs; si algo falla, mostrar
  error claro. (Una RPC transaccional puede venir después.)
- **Estado de empresa/ciclo activos en `localStorage`** puede quedar apuntando a
  algo borrado → Mitigación: validar contra lo que devuelve Supabase y caer al
  primero disponible.

## Migration Plan

Sin migración de datos. Se desarrolla y prueba contra el stack local
(`supabase start` + servir el front). Verificación con el flujo real: crear
empresa → crear ciclo → crear objetivo + KRs → ver progreso, y transparencia con
un segundo usuario.

## Open Questions

- ¿Editar/borrar objetivos y KRs entra en este MVP o solo crear+ver? (propongo:
  crear + ver ahora; editar/borrar en un change chico siguiente)
- ¿Se auto-crea un ciclo por defecto al crear la empresa, o siempre lo crea el
  usuario? (propongo: lo crea el usuario, con el año actual sugerido)
