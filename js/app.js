// Bootstrap de goalboard: sesión → ¿tiene empresa? → onboarding o app.
import { getSession, onAuthChange, signInWithOtp, signOut } from './auth.js';
import * as data from './data.js';
import * as state from './state.js';
import * as ui from './ui.js';

const root = document.getElementById('app');
state.initTheme();

async function route(session) {
  if (!session) {
    ui.renderLogin(root, {
      onSubmit: async (email) => {
        const { error } = await signInWithOtp(email);
        if (error) throw new Error(error.message);
      },
    });
    return;
  }
  await renderForUser(session.user);
}

async function renderForUser(user) {
  const orgs = await data.listMyOrganizations();

  // Sin empresa → onboarding.
  if (!orgs.length) {
    ui.renderOnboarding(root, {
      email: user.email,
      onSignOut: () => signOut(),
      onCreate: async (name) => {
        const org = await data.createOrganization(name);
        state.setActiveOrgId(user.id, org.id);
        await renderForUser(user);
      },
    });
    return;
  }

  // Empresa activa (validada contra lo que existe).
  const activeOrg = orgs.find((o) => o.id === state.getActiveOrgId(user.id)) || orgs[0];
  state.setActiveOrgId(user.id, activeOrg.id);

  // Ciclo activo.
  const cycles = await data.listCycles(activeOrg.id);
  const activeCycle = cycles.find((c) => c.id === state.getActiveCycleId(user.id, activeOrg.id)) || cycles[0] || null;
  if (activeCycle) state.setActiveCycleId(user.id, activeOrg.id, activeCycle.id);

  const objectives = activeCycle ? await data.listObjectives(activeOrg.id, activeCycle.id) : [];
  const areas = await data.listAreas(activeOrg.id);
  // Objetivos de nivel empresa: ancla de alineación para el coach.
  const companyObjectives = objectives.filter((o) => o.level === 'empresa').map((o) => ({ title: o.title, kind: o.kind }));

  ui.renderApp(root, {
    user, orgs, activeOrg, cycles, activeCycle, objectives,
    handlers: {
      onSelectOrg: (id) => { state.setActiveOrgId(user.id, id); renderForUser(user); },
      onSelectCycle: (id) => { state.setActiveCycleId(user.id, activeOrg.id, id); renderForUser(user); },
      onNewCycle: () => ui.newCycleModal({
        defaultName: String(new Date().getFullYear()),
        onSubmit: async ({ name, cadence, periodMonths }) => {
          const c = await data.createCycle(activeOrg.id, { name, cadence, periodMonths });
          state.setActiveCycleId(user.id, activeOrg.id, c.id);
          await renderForUser(user);
        },
      }),
      onNewObjective: () => ui.newObjectiveModal({
        isAdmin: activeOrg.role === 'admin',
        areas: areas.map((a) => ({ id: a.id, name: a.name })),
        alignTargets: objectives.map((o) => ({ id: o.id, title: o.title, level: o.level })),
        onSubmit: async (payload) => {
          await data.createObjectiveWithKRs(activeOrg.id, activeCycle.id, payload);
          await renderForUser(user);
        },
        ai: {
          define: (input) => data.aiAssist({
            mode: 'definir', organizationId: activeOrg.id, input, companyObjectives,
          }),
          review: (draft) => data.aiAssist({
            mode: 'revisar', organizationId: activeOrg.id, draft, companyObjectives,
          }),
        },
      }),
      onPlanWithAI: () => {
        // Anclas / candidatos a padre: objetivos de empresa y área del ciclo.
        const parents = objectives
          .filter((o) => o.level === 'empresa' || o.level === 'area')
          .map((o) => ({ id: o.id, title: o.title, level: o.level }));
        ui.strategyModal({
          isAdmin: activeOrg.role === 'admin',
          areas: areas.map((a) => ({ id: a.id, name: a.name })),
          parents,
          onGenerate: (input) => data.aiStrategy({ organizationId: activeOrg.id, input, anchors: parents }),
          onCreate: async (items) => {
            const res = await data.createObjectivesBulk(activeOrg.id, activeCycle.id, items);
            await renderForUser(user);
            return res;
          },
        });
      },
      onOpenAreas: async () => {
        const [freshAreas, orgMembers] = await Promise.all([
          data.listAreas(activeOrg.id),
          data.listOrgMembers(activeOrg.id),
        ]);
        const emailById = new Map(orgMembers.map((u) => [u.user_id, u.email]));
        ui.areasModal({
          isAdmin: activeOrg.role === 'admin',
          areas: freshAreas, orgMembers,
          onCreateArea: (name) => data.createArea(activeOrg.id, name),
          onLoadMembers: async (areaId) => (await data.listAreaMembers(areaId)).map((m) => ({
            user_id: m.user_id, role: m.role, email: emailById.get(m.user_id) || m.user_id,
          })),
          onAddMember: (areaId, userId, role) => data.addAreaMember(areaId, userId, role),
          onRemoveMember: (areaId, userId) => data.removeAreaMember(areaId, userId),
        });
      },
      onOpenAI: async () => {
        const [settings, usage] = await Promise.all([
          data.getAISettings(activeOrg.id),
          data.getAIUsageSummary(activeOrg.id),
        ]);
        ui.aiPanelModal({
          settings, usage, isAdmin: activeOrg.role === 'admin',
          onSave: async (s) => { await data.setAISettings(activeOrg.id, s); },
        });
      },
      onCheckIn: (obj, kr) => ui.checkInModal({
        kr,
        onSubmit: async ({ value, confidence, note }) => {
          await data.createCheckIn(activeOrg.id, kr.id, { value, confidence, note });
          await renderForUser(user);
        },
      }),
      onHistory: async (kr) => {
        const [items, meId] = await Promise.all([data.listCheckIns(kr.id), data.getUserId()]);
        ui.historyModal({ kr, items, meId });
      },
      onCloseCycle: (objs) => ui.closeCycleModal({
        objectives: objs,
        onSubmit: async (scores) => {
          await data.closeCycle(activeCycle.id, scores);
          await renderForUser(user);
        },
      }),
      onSignOut: () => signOut(),
    },
  });
}

async function boot() {
  await route(await getSession());
  onAuthChange((session) => { route(session); });
}

boot();
