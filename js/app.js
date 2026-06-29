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

  ui.renderApp(root, {
    user, orgs, activeOrg, cycles, activeCycle, objectives,
    handlers: {
      onSelectOrg: (id) => { state.setActiveOrgId(user.id, id); renderForUser(user); },
      onSelectCycle: (id) => { state.setActiveCycleId(user.id, activeOrg.id, id); renderForUser(user); },
      onNewCycle: () => ui.newCycleModal({
        defaultName: String(new Date().getFullYear()),
        onSubmit: async ({ name, cadence }) => {
          const c = await data.createCycle(activeOrg.id, { name, cadence });
          state.setActiveCycleId(user.id, activeOrg.id, c.id);
          await renderForUser(user);
        },
      }),
      onNewObjective: () => ui.newObjectiveModal({
        onSubmit: async (payload) => {
          await data.createObjectiveWithKRs(activeOrg.id, activeCycle.id, payload);
          await renderForUser(user);
        },
      }),
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
