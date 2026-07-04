## Context

goalboard crea/ve OKRs y hace check-ins contra Supabase, sin cómputo server-side
propio. La IA necesita llamar a un modelo con una key secreta que no puede estar
en el front estático → **Edge Function** (Deno). Además se pide: asistente que
**defina** (desde texto o PDF, alineando a los OKRs de la empresa, con foco) y
**revise**; **agnóstico de proveedor/modelo**; y **observabilidad** de uso/costo.

## Goals / Non-Goals

**Goals:** definir (co-crear) + revisar; proveedor/modelo configurable por empresa;
keys server-side; uso/costo registrados; local-first; co-creación (no autopiloto).

**Non-Goals:** chat largo conversacional; IA en el check-in; dashboard de costos
avanzado; desplegar la function a la nube. (Todo en changes futuros.)

## Decisions

### Datos nuevos (schema + RLS)

- `ai_settings` (por empresa): `organization_id`, `provider`, `model`. Lectura:
  miembros; escritura: `admin`. Default si no hay fila.
- `ai_usage`: `organization_id`, `user_id`, `feature` (`definir`|`revisar`),
  `provider`, `model`, `input_tokens`, `output_tokens`, `est_cost_usd`,
  `created_at`. Lectura: miembros de la empresa (RLS); inserción: desde la Edge
  Function (service role), no desde el cliente.

### Edge Function `okr-coach` (agnóstica)

- `supabase/functions/okr-coach/index.ts`. Valida JWT (sin sesión → 401).
- **Interfaz única**: `{ mode: "definir"|"revisar", input: {text?, pdf_base64?}, draft?, companyObjectives? }`.
  - `definir`: arma el prompt con el texto/PDF + los **objetivos de empresa** que
    le pasa el front (o que la función lee con el contexto del usuario) para
    alinear/validar; devuelve propuestas + notas de alineación + foco.
  - `revisar`: hallazgos sobre el `draft`.
- **Adaptador de proveedor**: dado `provider`+`model` (de `ai_settings`), enruta a
  la API del proveedor por `fetch` (Anthropic / OpenAI al inicio), normaliza la
  salida (propuestas/hallazgos vía structured outputs / JSON) y los **tokens
  usados**. Default: Anthropic `claude-opus-4-8`.
- **PDF**: se manda como documento al proveedor que lo soporte (Anthropic acepta
  PDF base64); para proveedores sin soporte nativo, se degrada a texto extraído o
  se avisa. Empezamos por texto + PDF en el proveedor por defecto.
- **Registro**: tras cada llamada, inserta una fila en `ai_usage` con tokens y
  costo estimado (mapa de precios por modelo en la función).
- **Co-creación, no autopiloto**: el system prompt propone y pregunta, nunca
  guarda; el guardado siempre es acción del usuario en el front.

### Front-end

- `data.js`: `aiAssist({mode, input, draft})` → `functions.invoke('okr-coach', ...)`;
  `getAISettings()` / `setAISettings()`; `getAIUsageSummary()`.
- `ui.js`: en el modal, modo **"Definir con IA"** (pegar texto / subir PDF →
  propuestas editables que rellenan el formulario) y **"Revisar con IA"**
  (hallazgos). Panel/admin de **proveedor+modelo**. Resumen de **uso de IA**.

### Keys / secretos

Local: `supabase/functions/.env` con `ANTHROPIC_API_KEY` y/o `OPENAI_API_KEY`
(gitignored). Nube: `supabase secrets set` (change de despliegue).

## Risks / Trade-offs

- **Alcance grande** (datos + función + adaptador + 2 modos + observabilidad) →
  Mitigación: implementar por fases (revisar → definir-texto → PDF → multi-proveedor
  → resumen de uso); el spec captura la visión, las tasks van por fases.
- **Costo / dependencia de proveedor** → la IA es opcional; sin key, avisa.
- **PDF agnóstico es desparejo entre proveedores** → arrancamos por el default.
- **Costo estimado puede desfasarse de la factura real** → es estimación
  (tokens × precio configurado), etiquetada como tal.
- **Alineación depende de pasar bien los OKRs de empresa como contexto** →
  acotar a los objetivos relevantes (empresa/ciclo) para no inflar tokens.

## Migration Plan

Schema: agregar `ai_settings` + `ai_usage` + RLS a `supabase/migrations/`. Local:
`supabase functions serve` + keys en `.env`. Verificar definir/revisar/alineación/
foco/uso con borradores buenos y malos. Despliegue a la nube: change aparte.

## Open Questions

- ¿`provider`/`model` por empresa (admin) o también override por usuario?
  (propongo: por empresa ahora; override por usuario después)
- ¿Qué proveedores al inicio? (propongo: Anthropic como default + OpenAI)
- ¿El resumen de uso es solo totales o por usuario/feature? (propongo: totales por
  empresa ahora; desglose después)
