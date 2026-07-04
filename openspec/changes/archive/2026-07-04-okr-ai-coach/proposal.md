## Why

El problema #1 de goalboard (lo que mató al Excel) es **adopción y mal uso**:
objetivos que son tareas, KRs sin número, demasiados KRs. Una IA que **ayude a
definir y a revisar** los OKRs ataca eso de raíz — siempre que **co-cree** (propone
borradores, hace preguntas, sugiere) en vez de autopilotear, para no matar la
apropiación, que es lo que hace que la gente cumpla sus OKRs.

Además, la IA tiene que ser **agnóstica del proveedor** (elegir proveedor y modelo)
y dar **observabilidad** de uso y costo, para no quedar atados ni a ciegas.

## What Changes

- **Asistente de IA en dos modos**, vía una **Edge Function** (Deno/TS), con la(s)
  key(s) del modelo **del lado servidor** y autenticación por JWT:
  - **Definir (co-crear)**: el usuario cuenta qué tiene que hacer (**texto o un
    PDF**) y la IA **propone OKRs** (objetivo + KRs), los **alinea/valida contra
    los OKRs de la empresa** (los objetivos de la organización que ya existen), y
    **ayuda al foco** (pocos, priorizados). El usuario edita y se queda como dueño;
    la IA nunca guarda por él.
  - **Revisar (analizar)**: sobre un borrador existente, devuelve hallazgos
    (objetivo-que-es-tarea, KR no medible, exceso de KRs) con sugerencias.
- **Agnóstico de proveedor/modelo**: una capa de adaptador en la Edge Function
  permite elegir **proveedor** (p. ej. Anthropic, OpenAI) y **modelo**. La elección
  se guarda como configuración de la empresa (la define un admin). Default:
  Anthropic `claude-opus-4-8`. Cada proveedor tiene su key como secreto del server.
- **Observabilidad de uso/costo**: cada llamada registra proveedor, modelo, tokens
  in/out, costo estimado, feature (definir/revisar), usuario y fecha en una tabla
  con RLS. La app muestra un resumen de uso por empresa.

## Capabilities

### New Capabilities
- `ai-provider`: capa agnóstica de proveedor/modelo — configuración por empresa
  (proveedor + modelo), keys server-side, y el adaptador de la Edge Function que
  enruta al proveedor elegido. Sin secretos en el cliente.
- `ai-okr-assistant`: asistente de OKRs en modo **definir (co-crear)** y modo
  **revisar (analizar)**; co-crea y asesora, nunca guarda ni autopilotea.
- `ai-usage-observability`: registro de uso y costo estimado por llamada (RLS por
  empresa) y un resumen consultable.

### Modified Capabilities
<!-- Se apoya en `okr-management-ui` y `auth-session`; no cambia sus requisitos. -->

## Impact

- **Nueva pieza**: Supabase **Edge Functions** (primer cómputo server-side propio).
- **Datos nuevos**: tabla de **configuración de IA por empresa** (proveedor+modelo)
  y tabla de **uso de IA** (tokens/costo), ambas con RLS. Se agregan al schema.
- **Dependencia externa**: al menos **una API key** del proveedor elegido (de pago)
  como secreto del server. Sin key, la app sigue andando y la IA avisa.
- **Front-end**: `data.js` para invocar la función y leer config/uso; UI para
  definir/revisar en el modal y un resumen de uso de IA.
- **Dev/verificación**: local con `supabase functions serve` (Docker, ya en uso).
- **Fuera de alcance (futuros)**: chat coach conversacional largo, IA en el
  check-in, dashboard de costos avanzado, y el **despliegue** de la function a la
  nube.
