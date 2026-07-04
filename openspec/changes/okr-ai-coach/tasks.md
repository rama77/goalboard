## 1. Datos (schema + RLS)

- [x] 1.1 Migración: tabla `ai_settings` (org, provider, model) — lectura miembros, escritura admin (RLS)
- [x] 1.2 Migración: tabla `ai_usage` (org, user, feature, provider, model, input/output tokens, est_cost_usd, created_at) — lectura miembros de la org (RLS); inserción server-side
- [x] 1.3 Verificar con el harness/local que las RLS aíslan por empresa

## 2. Edge Function (agnóstica)

- [x] 2.1 `supabase functions new okr-coach`; validar JWT (401 sin sesión)
- [x] 2.2 Adaptador de proveedor: dado provider+model (de `ai_settings` o default), enrutar por `fetch` a Anthropic (default `claude-opus-4-8`) y a OpenAI; normalizar salida + tokens
- [x] 2.3 Modo `revisar`: hallazgos (structured outputs) sobre un borrador
- [x] 2.4 Modo `definir`: propone OKRs desde **texto**; alinea/valida contra los objetivos de empresa recibidos; favorece el foco
- [x] 2.5 Modo `definir` con **PDF** (proveedor por defecto)
- [x] 2.6 Registrar uso en `ai_usage` (tokens + costo estimado por mapa de precios); manejar "proveedor sin key" sin romper

## 3. Front-end

- [x] 3.1 `data.js`: `aiAssist({mode,input,draft})`, `getAISettings`/`setAISettings`, `getAIUsageSummary`
- [x] 3.2 UI "Definir con IA": pegar texto / subir PDF → propuestas editables que rellenan el formulario de objetivo+KRs
- [x] 3.3 UI "Revisar con IA": hallazgos con color por severidad (tokens existentes)
- [x] 3.4 Config de proveedor+modelo (admin) y resumen de **uso de IA** por empresa
- [x] 3.5 Estados "no configurado / sin sesión / revisando…" sin romper el flujo

## 4. Secreto del modelo (local)

- [x] 4.1 `supabase/functions/.env` con la(s) key(s) (gitignored); documentar en el README
- [x] 4.2 `supabase functions serve` y confirmar respuesta local

## 4b. Proveedor OpenRouter (gateway agregador)

- [x] 4b.1 Edge Function: `callOpenRouter` (OpenAI-compatible, base URL propia, `usage.include` para costo real) + ruteo por `provider === 'openrouter'` (key `OPENROUTER_API_KEY`)
- [x] 4b.2 PDF-guard: `definir` con PDF y proveedor ≠ anthropic → aviso suave `pdf_needs_anthropic` (no rompe, no registra uso)
- [x] 4b.3 Costo: usar el costo real de OpenRouter cuando viene; si no, el mapa de precios
- [x] 4b.4 UI: opción "OpenRouter" en el selector + ayuda de formato de modelo (`proveedor/modelo`) y aviso de PDF
- [x] 4b.5 `env.example`: `OPENROUTER_API_KEY`; documentar en README
- [ ] 4b.6 Verificación local: con `OPENROUTER_API_KEY`, definir/revisar por texto funcionan; PDF+openrouter avisa; el uso queda registrado con costo real

## 5. Verificación local (cierre condicionado a esto)

- [ ] 5.1 Definir desde texto → propuestas de OKR editables y medibles
- [ ] 5.2 Definir desde PDF → propuestas basadas en el documento
- [ ] 5.3 Alineación: el borrador que aporta a un objetivo de empresa lo indica; el que no aporta, lo señala
- [ ] 5.4 Foco: ante demasiados objetivos/KRs, propone un set acotado y prioriza
- [ ] 5.5 Revisar: objetivo-que-es-tarea y KR sin número se detectan; OKR bien formado se confirma
- [x] 5.6 Cambiar proveedor/modelo (admin) cambia el motor usado; sin key → avisa, no rompe
- [ ] 5.7 Uso/costo: cada llamada deja registro; el resumen por empresa lo muestra (RLS aísla)
- [x] 5.8 Opcional/no bloqueante: se puede crear y guardar sin IA. Consola limpia; keys nunca en el front
