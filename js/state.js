// Estado de UI persistido en localStorage: empresa y ciclo activos (por usuario),
// y el tema (claro/oscuro), igual que mindboard.

const THEME_KEY = 'goalboard.theme.v1';
const ORG_KEY = 'goalboard.activeOrg.v1';
const CYCLE_KEY = 'goalboard.activeCycle.v1';

function readMap(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function writeMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}

// --- Empresa activa (por usuario) ------------------------------------------
export function getActiveOrgId(userId) {
  return readMap(ORG_KEY)[userId] ?? null;
}
export function setActiveOrgId(userId, orgId) {
  const m = readMap(ORG_KEY); m[userId] = orgId; writeMap(ORG_KEY, m);
}

// --- Ciclo activo (por usuario + empresa) ----------------------------------
export function getActiveCycleId(userId, orgId) {
  return readMap(CYCLE_KEY)[`${userId}:${orgId}`] ?? null;
}
export function setActiveCycleId(userId, orgId, cycleId) {
  const m = readMap(CYCLE_KEY); m[`${userId}:${orgId}`] = cycleId; writeMap(CYCLE_KEY, m);
}

// --- Tema ------------------------------------------------------------------
export function applyTheme(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}
export function toggleTheme() {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  return next;
}
