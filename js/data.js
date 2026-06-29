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

export async function createCycle(orgId, { name, cadence, parentCycleId = null }) {
  return unwrap(
    await supabase
      .from('cycles')
      .insert({ organization_id: orgId, name, cadence, parent_cycle_id: parentCycleId })
      .select()
      .single()
  );
}

// --- Objetivos + Key Results -----------------------------------------------

// Objetivos del ciclo (con sus KRs anidados). RLS da la transparencia intra-org.
export async function listObjectives(orgId, cycleId) {
  return unwrap(
    await supabase
      .from('objectives')
      .select('*, key_results(*)')
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
