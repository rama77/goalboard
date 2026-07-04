// okr-coach — Edge Function (Deno) agnóstica de proveedor.
//
// Modos:
//   - "revisar": hallazgos sobre un borrador de objetivo + KRs.
//   - "definir": propone OKRs desde texto o PDF, alineando a los OKRs de la
//     empresa y favoreciendo el foco.
//
// La API key del proveedor vive SOLO acá (secreto del server), nunca en el front.
// Co-creación, no autopiloto: devuelve propuestas/hallazgos; el front guarda.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Precio estimado por 1M tokens (input, output). Estimación, no factura real.
const PRICING: Record<string, [number, number]> = {
  'claude-opus-4-8': [5, 25],
  'claude-sonnet-4-6': [3, 15],
  'gpt-4o': [2.5, 10],
  'gpt-4o-mini': [0.15, 0.6],
};

// Esquema de salida compartido por ambos modos.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['info', 'warn'] },
          field: { type: 'string' },
          message: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['severity', 'field', 'message', 'suggestion'],
      },
    },
    proposals: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          kind: { type: 'string', enum: ['comprometido', 'aspiracional'] },
          alignment: { type: 'string' },
          keyResults: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false,
              properties: {
                title: { type: 'string' },
                type: { type: 'string', enum: ['numerico', 'porcentaje', 'hito'] },
                start: { type: 'number' },
                target: { type: 'number' },
              },
              required: ['title', 'type', 'start', 'target'],
            },
          },
        },
        required: ['title', 'kind', 'alignment', 'keyResults'],
      },
    },
  },
  required: ['summary', 'findings', 'proposals'],
};

function systemPrompt(companyObjectives: { title: string; kind?: string }[]) {
  const list = companyObjectives?.length
    ? companyObjectives.map((o) => `- ${o.title}${o.kind ? ` (${o.kind})` : ''}`).join('\n')
    : '(sin objetivos de empresa cargados)';
  return [
    'Sos un coach de OKRs experto en el método de John Doerr ("Mide lo que importa").',
    'Principios: un Objetivo es un RESULTADO cualitativo e inspirador, NO una tarea/proyecto.',
    'Cada Key Result es MEDIBLE con un número (de un valor inicial a un target). Pocos y enfocados: 3–5 KR.',
    'Distinguí objetivos comprometidos vs aspiracionales (moonshots).',
    'NUNCA guardes ni decidas por la persona: proponé y sugerí; ella edita y se queda como dueña.',
    'Favorecé el FOCO: si hay demasiados objetivos o KRs, proponé un set acotado y priorizá.',
    '',
    'OKRs ya existentes de la empresa (para ALINEAR/validar el aporte):',
    list,
    '',
    'En modo "definir": devolvé `proposals` (objetivos + KRs medibles) alineados a la empresa; en `alignment` indicá a qué objetivo de empresa aporta o si está desalineado. `findings` puede llevar notas de foco. ',
    'En modo "revisar": devolvé `findings` (severity info|warn, field, message, suggestion) sobre el borrador; `proposals` vacío. ',
    'Respondé SIEMPRE en español, conciso y accionable.',
  ].join('\n');
}

function userPrompt(mode: string, input: { text?: string }, draft: unknown) {
  if (mode === 'definir') {
    return `Modo: definir.\nEl usuario describe qué tiene que hacer:\n"""${input?.text ?? ''}"""\nProponé OKRs.`;
  }
  return `Modo: revisar.\nBorrador a revisar (JSON):\n${JSON.stringify(draft ?? {}, null, 2)}\nDevolvé hallazgos.`;
}

async function callAnthropic(key: string, model: string, sys: string, user: string, pdfB64?: string) {
  const content: unknown[] = [];
  if (pdfB64) content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfB64 } });
  content.push({ type: 'text', text: user });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model, max_tokens: 4096, system: sys,
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
  return { parsed: JSON.parse(text), inTok: data.usage?.input_tokens ?? 0, outTok: data.usage?.output_tokens ?? 0 };
}

async function callOpenAI(key: string, model: string, sys: string, user: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_schema', json_schema: { name: 'okr_coach', schema: SCHEMA, strict: true } },
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  return { parsed: JSON.parse(text), inTok: data.usage?.prompt_tokens ?? 0, outTok: data.usage?.completion_tokens ?? 0 };
}

// OpenRouter: gateway OpenAI-compatible a muchos modelos. `model` lleva prefijo de
// proveedor (ej: "anthropic/claude-opus-4-8"). `usage.include` pide el costo real.
async function callOpenRouter(key: string, model: string, sys: string, user: string) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      'HTTP-Referer': 'https://github.com/rama77/goalboard',
      'X-Title': 'goalboard',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_schema', json_schema: { name: 'okr_coach', schema: SCHEMA, strict: true } },
      usage: { include: true },
    }),
  });
  if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  return {
    parsed: JSON.parse(text),
    inTok: data.usage?.prompt_tokens ?? 0,
    outTok: data.usage?.completion_tokens ?? 0,
    cost: typeof data.usage?.cost === 'number' ? data.usage.cost : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'auth_required' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: 'auth_required' }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const { mode, organizationId, input = {}, draft = null, companyObjectives = [] } = body;
    if (!['definir', 'revisar'].includes(mode)) return json({ error: 'bad_mode' }, 400);
    if (!organizationId) return json({ error: 'org_required' }, 400);

    // Verificar membresía (RLS deja leer la propia membership).
    const { data: mem } = await userClient.from('memberships')
      .select('role').eq('organization_id', organizationId).eq('user_id', userId).maybeSingle();
    if (!mem) return json({ error: 'forbidden' }, 403);

    // Config de IA de la empresa (o default).
    const { data: settings } = await userClient.from('ai_settings')
      .select('provider, model').eq('organization_id', organizationId).maybeSingle();
    const provider = settings?.provider ?? 'anthropic';
    const model = settings?.model ?? 'claude-opus-4-8';

    const keyName = provider === 'openai' ? 'OPENAI_API_KEY'
      : provider === 'openrouter' ? 'OPENROUTER_API_KEY'
      : 'ANTHROPIC_API_KEY';
    const apiKey = Deno.env.get(keyName);
    if (!apiKey) return json({ error: 'provider_not_configured', provider, available: false });

    // El PDF es nativo de Anthropic; con otros proveedores avisamos en vez de ignorarlo.
    const wantsPdf = mode === 'definir' && !!input.pdf_base64;
    if (wantsPdf && provider !== 'anthropic') {
      return json({ error: 'pdf_needs_anthropic', provider, available: true });
    }

    const sys = systemPrompt(companyObjectives);
    const user = userPrompt(mode, input, draft);

    let out: { parsed: unknown; inTok: number; outTok: number; cost?: number };
    if (provider === 'openai') out = await callOpenAI(apiKey, model, sys, user);
    else if (provider === 'openrouter') out = await callOpenRouter(apiKey, model, sys, user);
    else out = await callAnthropic(apiKey, model, sys, user, wantsPdf ? input.pdf_base64 : undefined);

    // Registrar uso (service role; ai_usage no tiene policy de insert). OpenRouter
    // devuelve costo real; para el resto se estima con el mapa de precios.
    const [pin, pout] = PRICING[model] ?? [0, 0];
    const estCost = out.cost ?? ((out.inTok / 1e6) * pin + (out.outTok / 1e6) * pout);
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: usageErr } = await serviceClient.from('ai_usage').insert({
      organization_id: organizationId, user_id: userId, feature: mode,
      provider, model, input_tokens: out.inTok, output_tokens: out.outTok, est_cost_usd: estCost,
    });
    if (usageErr) console.error('ai_usage insert failed:', usageErr.message);

    return json({ result: out.parsed, usage: { provider, model, input_tokens: out.inTok, output_tokens: out.outTok, est_cost_usd: estCost } });
  } catch (e) {
    return json({ error: 'coach_failed', detail: String(e instanceof Error ? e.message : e) }, 500);
  }
});
