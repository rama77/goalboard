## Why

goalboard ya tiene la base (auth + cliente Supabase), pero todavía no puede
guardar ni un solo OKR. El intento previo de gestionar OKRs en planillas Excel
fracasó por **adopción y mal uso**, no por falta de una grilla: nadie veía lo de
los demás, cada área los cargaba mal, y el seguimiento moría. Para revertir eso
necesitamos primero un **modelo de datos compartido y con permisos sólidos** que
imponga la metodología correcta (OKRs medibles, pocos, transparentes, con
cadencia) y que sea la base sobre la que después se monta el coaching de IA.

Este change define **solo la fundación**: el modelo de datos y las políticas Row
Level Security. Es el piso del que cuelga todo lo demás.

## What Changes

- **Organización y miembros**: una organización con miembros y roles
  (admin / miembro). Soporta desde una persona sola hasta AccionPoint entera.
- **Ciclos**: períodos con cadencia **anual** (estratégico) y **trimestral**
  (táctico), donde un ciclo trimestral puede pertenecer a uno anual.
- **Objetivos**: cualitativos, marcados como **comprometido** o **aspiracional**,
  pertenecientes a un ciclo y con un dueño (persona o equipo/área).
- **Key Results**: 3–5 por objetivo, de tres tipos (**numérico**, **porcentaje**,
  **hito/binario**), con valor **inicial → target → actual** y progreso calculado.
- **Alineación flexible**: un objetivo puede enlazarse a un objetivo "padre" de un
  nivel superior para mostrar a qué contribuye (sin cascada forzada).
- **Check-ins**: actualizaciones periódicas de un KR (nuevo valor + indicador de
  confianza 🟢/🟡/🔴 + nota), con historial. Atacan el "set and forget".
- **Scoring de cierre**: al cerrar un ciclo, cada KR/objetivo recibe un puntaje
  0.0–1.0.
- **Transparencia + permisos por RLS**: todos los miembros LEEN todos los OKRs de
  su organización; la escritura queda restringida al dueño y a los admins. Todo
  resuelto en Postgres con Row Level Security, sin lógica de permisos en el front.
- **Esquema versionado**: el DDL + las políticas RLS quedan en `supabase/schema.sql`.

Fuera de alcance (otros changes): el **coaching de IA** (validación inline, chat,
ritual de check-in) y toda la **UI/pantallas**. Acá solo el modelo de datos y RLS.

## Capabilities

### New Capabilities
- `okr-model`: estructura central de OKRs — organización, miembros y roles,
  ciclos anual/trimestral, objetivos (comprometido/aspiracional), key results
  (numérico/%/hito) con inicial→target→actual y progreso, y enlaces de alineación
  entre objetivos.
- `okr-check-ins`: actualizaciones de progreso de los KR con confianza e
  historial, y el scoring 0.0–1.0 al cierre del ciclo.
- `okr-access-control`: transparencia y permisos vía Row Level Security —
  lectura para todos los miembros de la organización, escritura para dueño/admin.

### Modified Capabilities
<!-- Ninguna: `auth-session` y `supabase-client` ya existen y no cambian sus requisitos. -->

## Impact

- **Supabase / Postgres**: nuevas tablas, relaciones, índices y **políticas RLS**.
  Se llena `supabase/schema.sql` (hoy placeholder) y se aplica en el proyecto real.
- **Auth**: se apoya en `auth-session` (el `auth.uid()` de Supabase es la
  identidad sobre la que operan las políticas RLS).
- **Front-end**: aún sin pantallas; el modelo se valida vía consultas con el
  cliente de Supabase ya existente.
- **Despliegue**: este change **no se cierra hasta probarlo y desplegarlo** contra
  un proyecto Supabase real con datos de prueba.
- **Free tier**: el modelo debe entrar cómodo en el free tier de Supabase.
