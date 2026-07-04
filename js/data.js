// Acceso a datos de goalboard sobre el cliente de Supabase.
// Toda lectura/escritura pasa por las políticas RLS (la seguridad vive en la base).
import { supabase } from './supabase.js';

function unwrap({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// --- Organizaciones (tenants) ----------------------------------------------

// Organizaciones a las que pertenece el usuario actual.
export async function listMyOrganizations() {
  const rows = unwrap(
    await supabase
      .from('memberships')
      .select('role, organizations(id, name)')
      .order('created_at', { ascending: true })
  );
  return rows
    .filter((r) => r.organizations)
    .map((r) => ({ id: r.organizations.id, name: r.organizations.name, role: r.role }));
}

// Crea una empresa y deja al usuario como admin (RPC SECURITY DEFINER).
export async function createOrganization(name) {
  const data = unwrap(await supabase.rpc('create_organization', { p_name: name }));
  return Array.isArray(data) ? data[0] : data;
}

// --- Ciclos ----------------------------------------------------------------

export async function listCycles(orgId) {
  return unwrap(
    await supabase
      .from('cycles')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
  );
}

export async function createCycle(orgId, { name, cadence, periodMonths, parentCycleId = null }) {
  return unwrap(
    await supabase
      .from('cycles')
      .insert({
        organization_id: orgId,
        name,
        cadence,
        period_months: periodMonths,
        parent_cycle_id: parentCycleId,
      })
      .select()
      .single()
  );
}

// --- Objetivos + Key Results -----------------------------------------------

// Objetivos del ciclo (con sus KRs y los check-ins anidados, para la confianza
// vigente). RLS da la transparencia intra-org.
export async function listObjectives(orgId, cycleId) {
  return unwrap(
    await supabase
      .from('objectives')
      .select('*, key_results(*, check_ins(confidence, created_at))')
      .eq('organization_id', orgId)
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: true })
  );
}

// Crea un objetivo (el usuario queda como dueño) y sus key results.
export async function createObjectiveWithKRs(orgId, cycleId, { title, kind, keyResults }) {
  const ownerId = await currentUserId();
  const objective = unwrap(
    await supabase
      .from('objectives')
      .insert({ organization_id: orgId, cycle_id: cycleId, owner_id: ownerId, title, kind })
      .select()
      .single()
  );

  if (keyResults && keyResults.length) {
    const rows = keyResults.map((kr) => ({
      organization_id: orgId,
      objective_id: objective.id,
      title: kr.title,
      type: kr.type,
      start_value: kr.start_value,
      target_value: kr.target_value,
      current_value: kr.current_value,
    }));
    objective.key_results = unwrap(await supabase.from('key_results').insert(rows).select());
  } else {
    objective.key_results = [];
  }
  return objective;
}

// --- Check-ins -------------------------------------------------------------

// Registra un check-in sobre un KR. El trigger de la base actualiza el
// current_value del KR (y su progreso). author_id = usuario actual (lo exige RLS).
export async function createCheckIn(orgId, krId, { value, confidence, note }) {
  const authorId = await currentUserId();
  return unwrap(
    await supabase
      .from('check_ins')
      .insert({
        organization_id: orgId,
        key_result_id: krId,
        author_id: authorId,
        value,
        confidence,
        note: note || null,
      })
      .select()
      .single()
  );
}

// Historial de check-ins de un KR (cronológico). Incluye author_id para marcar
// "vos" vs otra persona en la UI.
export async function listCheckIns(krId) {
  return unwrap(
    await supabase
      .from('check_ins')
      .select('value, confidence, note, created_at, author_id')
      .eq('key_result_id', krId)
      .order('created_at', { ascending: true })
  );
}

// id del usuario actual (para distinguir autoría en la UI).
export async function getUserId() {
  return currentUserId();
}

// --- Cierre de ciclo + scoring ---------------------------------------------

// Asigna scores 0..1 a los KRs y cierra el ciclo. Varias escrituras (sin
// transacción cliente): si alguna falla, se propaga el error para reintentar.
export async function closeCycle(cycleId, scores) {
  for (const { krId, score } of scores) {
    unwrap(await supabase.from('key_results').update({ score }).eq('id', krId));
  }
  return unwrap(
    await supabase.from('cycles').update({ status: 'cerrado' }).eq('id', cycleId).select().single()
  );
}

// --- IA coach (Edge Function `okr-coach`) ----------------------------------

// Invoca la Edge Function. mode: 'definir' | 'revisar'.
// Devuelve { result, usage } o un objeto de error suave (provider_not_configured, etc.).
export async function aiAssist({ mode, organizationId, input = {}, draft = null, companyObjectives = [] }) {
  const { data, error } = await supabase.functions.invoke('okr-coach', {
    body: { mode, organizationId, input, draft, companyObjectives },
  });
  if (error) {
    // El cuerpo de error de la función (p. ej. provider_not_configured) viene en error.context
    try {
      const ctx = error.context && (await error.context.json());
      if (ctx) return { error: ctx.error || 'coach_failed', detail: ctx.detail, available: ctx.available };
    } catch { /* noop */ }
    return { error: 'coach_failed', detail: error.message };
  }
  return data;
}

// --- Config de IA por empresa ----------------------------------------------
export async function getAISettings(orgId) {
  const rows = unwrap(
    await supabase.from('ai_settings').select('provider, model').eq('organization_id', orgId)
  );
  return rows[0] || { provider: 'anthropic', model: 'claude-opus-4-8' };
}

export async function setAISettings(orgId, { provider, model }) {
  return unwrap(
    await supabase.from('ai_settings')
      .upsert({ organization_id: orgId, provider, model, updated_at: new Date().toISOString() })
      .select().single()
  );
}

// --- Resumen de uso de IA por empresa --------------------------------------
export async function getAIUsageSummary(orgId) {
  const rows = unwrap(
    await supabase.from('ai_usage')
      .select('input_tokens, output_tokens, est_cost_usd')
      .eq('organization_id', orgId)
  );
  return rows.reduce(
    (a, r) => ({
      calls: a.calls + 1,
      inputTokens: a.inputTokens + Number(r.input_tokens || 0),
      outputTokens: a.outputTokens + Number(r.output_tokens || 0),
      costUsd: a.costUsd + Number(r.est_cost_usd || 0),
    }),
    { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }
  );
}
