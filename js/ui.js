// UI de goalboard: render de vistas y modales con DOM plano (sin framework),
// usando los componentes `ap-` heredados de mindboard.
import { toggleTheme } from './state.js';

// --- Helpers de DOM --------------------------------------------------------
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

function clear(node) { node.replaceChildren(); }

function logo() {
  return el('div', { class: 'ap-logo' }, [
    el('div', { class: 'ap-logo-mark', text: 'g' }),
    el('div', { class: 'ap-logo-text', html: 'goal<span class="dot">board</span>' }),
  ]);
}

function themeBtn() {
  return el('button', {
    class: 'ap-icon-btn', title: 'Cambiar tema', 'aria-label': 'Cambiar tema',
    text: '◐', onclick: () => toggleTheme(),
  });
}

// --- Progreso --------------------------------------------------------------
export function objectiveProgress(obj) {
  const krs = obj.key_results || [];
  if (!krs.length) return 0;
  const sum = krs.reduce((a, k) => a + Number(k.progress || 0), 0);
  return sum / krs.length; // 0..1
}
function progressBar(ratio) {
  const pct = Math.round(ratio * 100);
  const band = pct < 34 ? 'lo' : pct < 67 ? 'mid' : 'hi';
  return el('div', { class: `ap-progress ${band}` }, [
    el('span', { style: `width:${pct}%` }),
  ]);
}

// --- Confianza (check-ins) -------------------------------------------------
const CONF = {
  en_camino: { label: 'En camino', cls: 'ok', rank: 1 },
  en_riesgo: { label: 'En riesgo', cls: 'warn', rank: 2 },
  trabado: { label: 'Trabado', cls: 'bad', rank: 3 },
};
export const CONF_OPTIONS = [
  { value: 'en_camino', label: '🟢 En camino' },
  { value: 'en_riesgo', label: '🟡 En riesgo' },
  { value: 'trabado', label: '🔴 Trabado' },
];

// Confianza del último check-in de un KR (o null si no tiene).
function latestConfidence(kr) {
  const cs = kr.check_ins || [];
  if (!cs.length) return null;
  let best = cs[0];
  for (const c of cs) if (c.created_at > best.created_at) best = c;
  return best.confidence;
}
// Rollup del objetivo: la confianza más floja entre sus KRs (null si ninguna).
function objectiveConfidence(obj) {
  let worst = null, rank = 0;
  for (const kr of obj.key_results || []) {
    const c = latestConfidence(kr);
    if (c && CONF[c].rank > rank) { rank = CONF[c].rank; worst = c; }
  }
  return worst;
}
function confBadge(conf) {
  if (!conf) return el('span', { class: 'ap-conf none' }, [el('span', { class: 'cd' }), 'Sin check-in']);
  const c = CONF[conf];
  return el('span', { class: `ap-conf ${c.cls}` }, [el('span', { class: 'cd' }), c.label]);
}

// --- Login -----------------------------------------------------------------
// onSubmit(email) -> Promise (throws on error)
export function renderLogin(root, { onSubmit }) {
  clear(root);
  const status = el('p', { class: 'ap-status', role: 'status', 'aria-live': 'polite' });
  const input = el('input', { type: 'email', required: 'true', autocomplete: 'email', placeholder: 'vos@ejemplo.com' });
  const btn = el('button', { class: 'ap-btn', type: 'submit', text: 'Enviarme el enlace' });

  const form = el('form', {
    class: 'ap-field', onsubmit: async (e) => {
      e.preventDefault();
      btn.disabled = true; status.dataset.kind = ''; status.textContent = 'Enviando…';
      try {
        await onSubmit(input.value.trim());
        status.dataset.kind = 'ok';
        status.textContent = 'Listo. Revisá tu correo y abrí el enlace para entrar.';
      } catch (err) {
        status.dataset.kind = 'error';
        status.textContent = 'No se pudo enviar el enlace: ' + err.message;
        btn.disabled = false;
      }
    },
  }, [el('label', { text: 'Email' }), input, btn, status]);

  root.append(el('div', { class: 'ap-center' }, [
    el('div', { class: 'ap-panel' }, [
      logo(),
      el('h1', { text: 'Entrá a goalboard' }),
      el('p', { class: 'ap-muted', text: 'Ingresá con tu email y te mandamos un enlace para entrar.' }),
      form,
    ]),
  ]));
}

// --- Onboarding: crear empresa ---------------------------------------------
// onCreate(name) -> Promise
export function renderOnboarding(root, { email, onCreate, onSignOut }) {
  clear(root);
  const status = el('p', { class: 'ap-status', role: 'status', 'aria-live': 'polite' });
  const input = el('input', { type: 'text', required: 'true', placeholder: 'Ej: Mi empresa' });
  const btn = el('button', { class: 'ap-btn', type: 'submit', text: 'Crear empresa' });

  const form = el('form', {
    class: 'ap-field', onsubmit: async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) { status.dataset.kind = 'error'; status.textContent = 'Poné un nombre.'; return; }
      btn.disabled = true; status.dataset.kind = ''; status.textContent = 'Creando…';
      try { await onCreate(name); } catch (err) {
        status.dataset.kind = 'error'; status.textContent = 'Error: ' + err.message; btn.disabled = false;
      }
    },
  }, [el('label', { text: 'Nombre de la empresa' }), input, btn, status]);

  root.append(el('div', { class: 'ap-center' }, [
    el('div', { class: 'ap-panel' }, [
      logo(),
      el('h1', { text: 'Creá tu empresa' }),
      el('p', { class: 'ap-muted', text: 'Tus OKRs viven dentro de una empresa. Creá la tuya para empezar.' }),
      form,
      el('div', { class: 'ap-side-foot' }, [
        el('span', { class: 'ap-side-user', text: email || '' }),
        el('button', { class: 'ap-btn ghost', text: 'Cerrar sesión', onclick: onSignOut }),
      ]),
    ]),
  ]));
}

// --- App (shell + objetivos) -----------------------------------------------
export function renderApp(root, ctx) {
  const { user, orgs, activeOrg, cycles, activeCycle, objectives, handlers } = ctx;
  clear(root);

  // Sidebar
  const orgSelect = el('select', {
    class: 'ap-select', onchange: (e) => handlers.onSelectOrg(e.target.value),
  }, orgs.map((o) => el('option', { value: o.id, selected: o.id === activeOrg?.id ? 'true' : null, text: o.name })));

  const cycleNav = el('div', { class: 'ap-nav' }, [
    el('div', { class: 'ap-nav-label', text: 'Ciclos' }),
    ...(cycles.length ? cycles.map((c) => el('button', {
      class: 'ap-nav-item' + (c.id === activeCycle?.id ? ' is-active' : ''),
      onclick: () => handlers.onSelectCycle(c.id),
    }, [
      el('span', { class: 'nlbl', text: c.name }),
      el('span', { class: 'ncount', text: cadenceBadge(c.cadence) }),
    ])) : [el('div', { class: 'ap-side-user', text: 'Sin ciclos todavía' })]),
    el('button', { class: 'ap-side-add', text: '+ Nuevo ciclo', onclick: handlers.onNewCycle }),
  ]);

  const sidebar = el('aside', { class: 'ap-sidebar' }, [
    el('div', { class: 'ap-side-head' }, [logo()]),
    el('div', { style: 'padding:.6rem .6rem 0' }, [
      el('div', { class: 'ap-nav-label', text: 'Empresa' }), orgSelect,
    ]),
    cycleNav,
    el('div', { class: 'ap-side-foot' }, [
      el('span', { class: 'ap-side-user', text: user.email || '' }),
      el('button', { class: 'ap-btn ghost', text: 'Cerrar sesión', onclick: handlers.onSignOut }),
    ]),
  ]);

  // Contexto de vista: solo-lectura si el ciclo está cerrado; admin según rol.
  const view = {
    readOnly: activeCycle?.status === 'cerrado',
    isAdmin: activeOrg?.role === 'admin',
    handlers,
  };

  // Main
  const topbar = el('div', { class: 'ap-topbar' }, [
    el('div', { class: 'ap-topbar-left' }, [
      el('span', { class: 'ap-topbar-title', text: activeCycle ? activeCycle.name : (activeOrg?.name || 'goalboard') }),
      activeCycle && view.readOnly && el('span', { class: 'ap-conf none' }, [el('span', { class: 'cd' }), 'Cerrado']),
    ]),
    el('div', { class: 'ap-actions' }, [
      themeBtn(),
      el('button', { class: 'ap-icon-btn', title: 'Áreas', 'aria-label': 'Áreas', text: '👥', onclick: handlers.onOpenAreas }),
      el('button', { class: 'ap-icon-btn', title: 'IA', 'aria-label': 'IA', text: '✨', onclick: handlers.onOpenAI }),
      activeCycle && view.isAdmin && !view.readOnly && objectives.length
        && el('button', { class: 'ap-btn ghost', text: 'Cerrar ciclo', onclick: () => handlers.onCloseCycle(objectives) }),
      activeCycle && !view.readOnly && el('button', { class: 'ap-btn', text: '+ Nuevo objetivo', onclick: handlers.onNewObjective }),
    ]),
  ]);

  const page = el('div', { class: 'ap-page' }, [
    el('div', { class: 'ap-header' }, [
      el('div', {}, [
        el('h1', { class: 'ap-title', text: activeOrg?.name || 'goalboard' }),
        el('p', { class: 'ap-subtitle', text: activeCycle ? `Objetivos del ciclo ${activeCycle.name}${view.readOnly ? ' (cerrado)' : ''}` : 'Creá un ciclo para empezar a cargar objetivos.' }),
      ]),
    ]),
    objectivesView(objectives, activeCycle, view),
  ]);

  root.append(el('div', { class: 'ap-app' }, [sidebar, el('main', { class: 'ap-main' }, [topbar, page])]));
}

function objectivesView(objectives, activeCycle, view) {
  const handlers = view.handlers;
  if (!activeCycle) {
    return el('div', { class: 'ap-empty' }, [
      el('span', { text: 'Todavía no hay un ciclo seleccionado.' }),
      el('button', { class: 'ap-btn', text: '+ Crear ciclo', onclick: handlers.onNewCycle }),
    ]);
  }
  if (!objectives.length) {
    return el('div', { class: 'ap-empty' }, [
      el('span', { text: 'Sin objetivos en este ciclo.' }),
      !view.readOnly && el('button', { class: 'ap-btn', text: '+ Crear el primer objetivo', onclick: handlers.onNewObjective }),
    ]);
  }
  // Cascada: agrupar por nivel (empresa → áreas → individuales).
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const sections = [
    { key: 'empresa', label: 'Empresa' },
    { key: 'area', label: 'Áreas' },
    { key: 'individual', label: 'Individuales' },
  ].map(({ key, label }) => {
    const items = objectives.filter((o) => (o.level || 'individual') === key);
    if (!items.length) return null;
    return el('section', { class: 'ap-level' }, [
      el('div', { class: 'ap-nav-label', text: label }),
      el('div', { class: 'ap-okr-grid' }, items.map((o) => objectiveCard(o, view, byId))),
    ]);
  }).filter(Boolean);
  return el('div', { class: 'ap-levels' }, sections);
}

function objectiveCard(obj, view, byId = null) {
  const ratio = objectiveProgress(obj);
  const krs = (obj.key_results || []).map((kr) => {
    const r = Number(kr.progress || 0);
    const conf = latestConfidence(kr);
    const actions = view.readOnly
      ? [kr.score != null && el('span', { class: 'ap-score', text: `score ${fmt(kr.score)}` })]
      : [
          el('button', { class: 'ap-mini-btn', text: '✎ Check-in', onclick: () => view.handlers.onCheckIn(obj, kr) }),
          el('button', { class: 'ap-mini-btn', text: 'Historial', onclick: () => view.handlers.onHistory(kr) }),
        ];
    return el('div', { class: 'ap-kr' }, [
      el('div', { class: 'ap-kr-head' }, [
        el('span', { class: 'ap-kr-title', text: kr.title }),
        el('span', { class: 'ap-kr-val', text: krValueLabel(kr) }),
      ]),
      progressBar(r),
      el('div', { class: 'ap-kr-head' }, [confBadge(conf), el('div', { class: 'ap-kr-actions' }, actions)]),
    ]);
  });
  const objConf = objectiveConfidence(obj);
  return el('div', { class: 'ap-card' }, [
    el('div', { class: 'ap-card-top' }, [
      el('div', { class: 'ap-card-title', text: obj.title }),
      el('span', { class: `ap-otype ${obj.kind}`, text: obj.kind }),
    ]),
    el('div', { class: 'ap-card-meta' }, [
      confBadge(objConf),
      obj.level === 'area' && obj.areas?.name && el('span', { class: 'ap-lvl', text: obj.areas.name }),
      (() => {
        const p = obj.parent_objective_id && byId?.get(obj.parent_objective_id);
        return p ? el('span', { class: 'ap-align', text: `→ ${p.title}` }) : null;
      })(),
      view.readOnly && el('span', { class: 'ap-score', text: `score ${fmt(objectiveScore(obj))}` }),
    ]),
    el('div', { class: 'ap-obj-progress' }, [progressBar(ratio), el('span', { class: 'pct', text: `${Math.round(ratio * 100)}%` })]),
    krs.length ? el('div', { class: 'ap-kr-list' }, krs) : el('span', { class: 'ap-muted', text: 'Sin key results.' }),
  ]);
}

// Score del objetivo = promedio de los scores de sus KRs (los que tengan).
function objectiveScore(obj) {
  const scored = (obj.key_results || []).filter((k) => k.score != null);
  if (!scored.length) return 0;
  return scored.reduce((a, k) => a + Number(k.score), 0) / scored.length;
}

function krValueLabel(kr) {
  if (kr.type === 'hito') return Number(kr.current_value) >= Number(kr.target_value) ? 'Hecho' : 'Pendiente';
  const suffix = kr.type === 'porcentaje' ? '%' : '';
  return `${fmt(kr.current_value)}${suffix} → ${fmt(kr.target_value)}${suffix}`;
}
function fmt(n) { const v = Number(n); return Number.isInteger(v) ? String(v) : v.toFixed(1); }

// Lee un File como base64 (sin el prefijo data:).
function fileToB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
// Mensaje legible para errores suaves de la IA.
function aiErr(res) {
  if (res.error === 'provider_not_configured') return 'La IA no está configurada (falta la API key del proveedor).';
  if (res.error === 'pdf_needs_anthropic') return 'El PDF solo funciona con el proveedor Anthropic. Cambiá el proveedor o pegá el texto.';
  if (res.error === 'auth_required') return 'Necesitás estar logueado para usar la IA.';
  if (res.error === 'forbidden') return 'No tenés acceso a esta empresa.';
  return 'No se pudo usar la IA: ' + (res.detail || res.error || 'error');
}

// --- Modales ---------------------------------------------------------------
function openModal(titleText, bodyNodes, buildActions, opts = {}) {
  const overlay = el('div', { class: 'ap-overlay open' });
  const close = () => overlay.remove();
  const modal = el('div', { class: 'ap-modal' + (opts.wide ? ' ap-modal-wide' : '') }, [el('h3', { text: titleText }), ...bodyNodes]);
  modal.append(el('div', { class: 'ap-modal-actions' }, buildActions(close)));
  overlay.append(modal);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.body.append(overlay);
  return close;
}

// Presets de cadencia (etiqueta + duración en meses). "Otro…" habilita valores
// libres: el schema ya no fuerza un conjunto fijo.
const CADENCE_PRESETS = [
  { label: 'anual', text: 'Anual', months: 12 },
  { label: 'semestral', text: 'Semestral', months: 6 },
  { label: 'cuatrimestral', text: 'Cuatrimestral', months: 4 },
  { label: 'trimestral', text: 'Trimestral', months: 3 },
  { label: 'mensual', text: 'Mensual', months: 1 },
];
const CADENCE_BADGE = { anual: 'A', semestral: 'S', cuatrimestral: 'C', trimestral: 'Q', mensual: 'M' };

// Sigla para el badge del ciclo: mapa conocido, con fallback a la inicial.
function cadenceBadge(cadence) {
  const key = (cadence || '').trim().toLowerCase();
  return CADENCE_BADGE[key] || (key ? key.charAt(0).toUpperCase() : '·');
}

// onSubmit({name, cadence, periodMonths}) -> Promise
export function newCycleModal({ defaultName, onSubmit }) {
  const name = el('input', { type: 'text', value: defaultName || '', placeholder: 'Ej: 2027 o Q1 2027' });
  const cadence = el('select', {}, [
    ...CADENCE_PRESETS.map((p) => el('option', { value: p.label, text: p.text })),
    el('option', { value: '__otro__', text: 'Otro…' }),
  ]);
  const customLabel = el('input', { type: 'text', placeholder: 'Cadencia (ej: bimestral)' });
  const customMonths = el('input', { type: 'number', min: '1', step: '1', placeholder: 'Meses' });
  const customWrap = el('div', { class: 'ap-field', style: 'display:none' }, [
    el('label', { text: 'Cadencia personalizada' }),
    el('div', { style: 'display:flex; gap:.5rem' }, [customLabel, customMonths]),
  ]);
  cadence.onchange = () => { customWrap.style.display = cadence.value === '__otro__' ? '' : 'none'; };
  const err = el('p', { class: 'ap-status' });
  openModal('Nuevo ciclo', [
    el('div', { class: 'ap-field' }, [el('label', { text: 'Nombre' }), name]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Cadencia' }), cadence]),
    customWrap,
    err,
  ], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cancelar', onclick: close }),
    el('button', {
      class: 'ap-btn', text: 'Crear', onclick: async (e) => {
        const v = name.value.trim();
        if (!v) { err.dataset.kind = 'error'; err.textContent = 'Poné un nombre.'; return; }
        let label, months;
        if (cadence.value === '__otro__') {
          label = customLabel.value.trim().toLowerCase();
          months = parseInt(customMonths.value, 10);
          if (!label) { err.dataset.kind = 'error'; err.textContent = 'Poné una cadencia.'; return; }
          if (!(months > 0)) { err.dataset.kind = 'error'; err.textContent = 'Los meses tienen que ser mayores a 0.'; return; }
        } else {
          const preset = CADENCE_PRESETS.find((p) => p.label === cadence.value);
          label = preset.label; months = preset.months;
        }
        e.target.disabled = true;
        try { await onSubmit({ name: v, cadence: label, periodMonths: months }); close(); }
        catch (er) { err.dataset.kind = 'error'; err.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ]);
}

// onSubmit({title, kind, keyResults, level, areaId, parentObjectiveId}) -> Promise
// areas: [{id,name}]; alignTargets: [{id,title,level}] (candidatos a padre)
export function newObjectiveModal({ onSubmit, ai = null, isAdmin = false, areas = [], alignTargets = [] }) {
  const title = el('input', { type: 'text', placeholder: 'Ej: Crecer en el mercado' });
  const kind = el('select', {}, [
    el('option', { value: 'comprometido', text: 'Comprometido' }),
    el('option', { value: 'aspiracional', text: 'Aspiracional (moonshot)' }),
  ]);
  // Nivel: empresa solo si es admin.
  const level = el('select', {}, [
    el('option', { value: 'individual', text: 'Individual' }),
    el('option', { value: 'area', text: 'Área' }),
    ...(isAdmin ? [el('option', { value: 'empresa', text: 'Empresa' })] : []),
  ]);
  const area = el('select', {},
    areas.length
      ? areas.map((a) => el('option', { value: a.id, text: a.name }))
      : [el('option', { value: '', text: '(no hay áreas — creá una primero)' })]);
  const LEVEL_LABEL = { empresa: 'Empresa', area: 'Área', individual: 'Individual' };
  const areaField = el('div', { class: 'ap-field', style: 'display:none' }, [el('label', { text: 'Área' }), area]);
  level.onchange = () => { areaField.style.display = level.value === 'area' ? '' : 'none'; };
  const align = el('select', {}, [
    el('option', { value: '', text: '— Sin alineación —' }),
    ...alignTargets.map((o) => el('option', { value: o.id, text: `${LEVEL_LABEL[o.level] || o.level}: ${o.title}` })),
  ]);
  const krList = el('div', { class: 'ap-kr-list' });
  const warn = el('p', { class: 'ap-warn', style: 'display:none', text: 'Más de 5 key results: el objetivo pierde foco.' });
  const err = el('p', { class: 'ap-status' });

  function krRow(init = {}) {
    const t = el('input', { type: 'text', placeholder: 'Key result (medible)', value: init.title || '' });
    const type = el('select', {}, [
      el('option', { value: 'numerico', text: 'Número', selected: init.type === 'numerico' ? 'true' : null }),
      el('option', { value: 'porcentaje', text: '%', selected: init.type === 'porcentaje' ? 'true' : null }),
      el('option', { value: 'hito', text: 'Hito', selected: init.type === 'hito' ? 'true' : null }),
    ]);
    const start = el('input', { type: 'number', placeholder: 'Inicial', value: String(init.start ?? 0) });
    const target = el('input', { type: 'number', placeholder: 'Target', value: init.target != null ? String(init.target) : '' });
    const current = el('input', { type: 'number', placeholder: 'Actual', value: String(init.current ?? init.start ?? 0) });
    const row = el('div', { class: 'ap-kr-edit' }, [
      el('div', { class: 'ap-kr-edit-top' }, [t, el('button', { class: 'ap-icon-btn', text: '✕', title: 'Quitar', onclick: () => { row.remove(); refreshWarn(); } })]),
      type,
      el('div', { class: 'ap-field-row' }, [
        el('div', { class: 'ap-field' }, [el('label', { text: 'Inicial' }), start]),
        el('div', { class: 'ap-field' }, [el('label', { text: 'Target' }), target]),
        el('div', { class: 'ap-field' }, [el('label', { text: 'Actual' }), current]),
      ]),
    ]);
    row._read = () => ({
      title: t.value.trim(), type: type.value,
      start_value: Number(start.value || 0), target_value: Number(target.value),
      current_value: Number(current.value || 0),
    });
    return row;
  }
  function refreshWarn() { warn.style.display = krList.children.length > 5 ? '' : 'none'; }
  function addKr(init) { krList.append(krRow(init)); refreshWarn(); }
  addKr();

  // --- Controles de IA (opcionales) ---
  const aiBox = el('details', { class: 'ap-ai-box', open: 'true', style: ai ? '' : 'display:none' });
  function readDraft() {
    return { title: title.value.trim(), kind: kind.value, level: level.value, keyResults: [...krList.children].map((r) => r._read()).filter((k) => k.title) };
  }
  function fillFromProposal(p) {
    title.value = p.title || '';
    if (p.kind) kind.value = p.kind;
    krList.replaceChildren();
    (p.keyResults || []).forEach((kr) => addKr(kr));
    if (!krList.children.length) addKr();
    refreshWarn();
  }
  function renderFindings(box, findings, summary) {
    box.replaceChildren();
    if (summary) box.append(el('p', { class: 'ap-muted', text: summary }));
    if (findings?.length) {
      const list = el('div', { class: 'ap-findings' });
      findings.forEach((f) => list.append(el('div', { class: `ap-finding ${f.severity === 'warn' ? 'warn' : ''}` }, [
        el('span', { text: f.message }),
        f.suggestion ? el('span', { class: 'sug', text: ' — ' + f.suggestion }) : null,
      ])));
      box.append(list);
    }
  }
  if (ai) {
    const defText = el('textarea', { rows: '3', placeholder: 'Contá qué tenés que hacer (o subí un PDF) y la IA propone OKRs…' });
    const pdf = el('input', { type: 'file', accept: 'application/pdf', style: 'display:none' });
    const pdfName = el('span', { class: 'ap-file-name', text: 'Ningún archivo' });
    pdf.onchange = () => { pdfName.textContent = pdf.files?.[0]?.name || 'Ningún archivo'; };
    const pdfPicker = el('div', { class: 'ap-file' }, [
      el('label', { class: 'ap-file-btn' }, ['📎 Adjuntar PDF', pdf]), pdfName,
    ]);
    const aiStatus = el('p', { class: 'ap-status' });
    const out = el('div', {});
    const btnDefine = el('button', { class: 'ap-btn', type: 'button', text: '✨ Definir con IA', onclick: async () => {
      aiStatus.dataset.kind = ''; aiStatus.textContent = 'Pensando…'; btnDefine.disabled = true;
      try {
        const input = { text: defText.value.trim(), level: level.value };
        const file = pdf.files?.[0];
        if (file) input.pdf_base64 = await fileToB64(file);
        const res = await ai.define(input);
        if (res.error) { aiStatus.dataset.kind = 'error'; aiStatus.textContent = aiErr(res); return; }
        const p = res.result?.proposals?.[0];
        if (p) {
          fillFromProposal(p);
          aiStatus.dataset.kind = 'ok'; aiStatus.textContent = 'Propuesta cargada — editala a tu gusto.';
          title.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        renderFindings(out, res.result?.findings, res.result?.summary);
      } catch (e) { aiStatus.dataset.kind = 'error'; aiStatus.textContent = String(e.message || e); }
      finally { btnDefine.disabled = false; }
    } });
    const btnReview = el('button', { class: 'ap-btn ghost', type: 'button', text: 'Revisar con IA', onclick: async () => {
      aiStatus.dataset.kind = ''; aiStatus.textContent = 'Revisando…'; btnReview.disabled = true;
      try {
        const res = await ai.review(readDraft());
        if (res.error) { aiStatus.dataset.kind = 'error'; aiStatus.textContent = aiErr(res); return; }
        renderFindings(out, res.result?.findings, res.result?.summary);
        aiStatus.textContent = '';
      } catch (e) { aiStatus.dataset.kind = 'error'; aiStatus.textContent = String(e.message || e); }
      finally { btnReview.disabled = false; }
    } });
    aiBox.append(
      el('summary', { text: 'Asistente de IA' }),
      el('div', { class: 'ap-ai-body' }, [
        defText,
        pdfPicker,
        el('div', { class: 'ap-modal-actions', style: 'justify-content:flex-start' }, [btnDefine, btnReview]),
        el('p', { class: 'ap-ai-hint', text: 'Definir: partís de tus notas o un PDF y te propongo el objetivo con sus KRs. Revisar: feedback sobre lo que ya cargaste abajo.' }),
        aiStatus, out,
      ]),
    );
  }

  const formCol = el('div', { class: 'ap-obj-col' }, [
    el('div', { class: 'ap-field' }, [el('label', { text: 'Objetivo' }), title]),
    el('div', { class: 'ap-field-row' }, [
      el('div', { class: 'ap-field' }, [el('label', { text: 'Nivel' }), level]),
      el('div', { class: 'ap-field' }, [el('label', { text: 'Tipo' }), kind]),
    ]),
    areaField,
    el('div', { class: 'ap-field' }, [el('label', { text: 'Alinea a (opcional)' }), align]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Key results' }), krList]),
    el('button', { class: 'ap-side-add', type: 'button', text: '+ Agregar key result', onclick: () => addKr() }),
    warn, err,
  ]);
  const layout = ai
    ? el('div', { class: 'ap-obj-grid' }, [el('div', { class: 'ap-obj-col' }, [aiBox]), formCol])
    : formCol;

  openModal('Nuevo objetivo', [layout], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cancelar', onclick: close }),
    el('button', {
      class: 'ap-btn', text: 'Crear objetivo', onclick: async (e) => {
        const t = title.value.trim();
        const krs = [...krList.children].map((r) => r._read()).filter((k) => k.title);
        err.dataset.kind = '';
        if (!t) { err.dataset.kind = 'error'; err.textContent = 'El objetivo necesita un título.'; return; }
        if (level.value === 'area' && !area.value) { err.dataset.kind = 'error'; err.textContent = 'Un objetivo de área necesita un área.'; return; }
        for (const k of krs) {
          if (k.type !== 'hito' && !Number.isFinite(k.target_value)) {
            err.dataset.kind = 'error'; err.textContent = 'Cada key result necesita un target.'; return;
          }
        }
        e.target.disabled = true;
        try {
          await onSubmit({
            title: t, kind: kind.value, keyResults: krs,
            level: level.value,
            areaId: level.value === 'area' ? area.value : null,
            parentObjectiveId: align.value || null,
          });
          close();
        }
        catch (er) { err.dataset.kind = 'error'; err.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ], { wide: !!ai });
}

// Gestión de áreas. Callbacks: onCreateArea(name), onLoadMembers(areaId) -> [{user_id,email,role}],
// onAddMember(areaId,userId,role), onRemoveMember(areaId,userId). orgMembers: [{user_id,email}].
export function areasModal({ isAdmin, areas, orgMembers, onCreateArea, onLoadMembers, onAddMember, onRemoveMember }) {
  const err = el('p', { class: 'ap-status' });
  const list = el('div', { class: 'ap-kr-list' });

  async function renderMembers(areaId, box) {
    box.replaceChildren(el('p', { class: 'ap-muted', text: 'Cargando…' }));
    try {
      const members = await onLoadMembers(areaId);
      box.replaceChildren();
      if (!members.length) box.append(el('p', { class: 'ap-muted', text: 'Sin miembros.' }));
      members.forEach((m) => box.append(el('div', { class: 'ap-file' }, [
        el('span', { class: 'ap-file-name', text: `${m.email} · ${m.role}` }),
        isAdmin ? el('button', { class: 'ap-icon-btn', text: '✕', title: 'Quitar', onclick: async () => {
          try { await onRemoveMember(areaId, m.user_id); await renderMembers(areaId, box); } catch (e) { err.dataset.kind = 'error'; err.textContent = e.message; }
        } }) : null,
      ])));
      if (isAdmin) {
        const who = el('select', {}, orgMembers.map((u) => el('option', { value: u.user_id, text: u.email })));
        const role = el('select', {}, [el('option', { value: 'miembro', text: 'Miembro' }), el('option', { value: 'lider', text: 'Líder' })]);
        box.append(el('div', { class: 'ap-file', style: 'margin-top:.4rem' }, [
          who, role,
          el('button', { class: 'ap-btn ghost', type: 'button', text: 'Agregar', onclick: async () => {
            if (!who.value) return;
            try { await onAddMember(areaId, who.value, role.value); await renderMembers(areaId, box); } catch (e) { err.dataset.kind = 'error'; err.textContent = e.message; }
          } }),
        ]));
      }
    } catch (e) { box.replaceChildren(el('p', { class: 'ap-status', dataset: { kind: 'error' }, text: e.message })); }
  }

  function renderList() {
    list.replaceChildren();
    if (!areas.length) list.append(el('p', { class: 'ap-muted', text: 'No hay áreas todavía.' }));
    areas.forEach((a) => {
      const box = el('div', { class: 'ap-ai-body', style: 'padding:.5rem 0 0' });
      const det = el('details', { class: 'ap-ai-box' }, [
        el('summary', { text: a.name }),
        el('div', { style: 'padding:0 .75rem .5rem' }, [box]),
      ]);
      det.addEventListener('toggle', () => { if (det.open && !box.dataset.loaded) { box.dataset.loaded = '1'; renderMembers(a.id, box); } });
      list.append(det);
    });
  }
  renderList();

  const newName = el('input', { type: 'text', placeholder: 'Nombre del área' });
  const createRow = isAdmin ? el('div', { class: 'ap-file' }, [
    newName,
    el('button', { class: 'ap-btn', type: 'button', text: 'Crear área', onclick: async () => {
      const n = newName.value.trim();
      if (!n) { err.dataset.kind = 'error'; err.textContent = 'Poné un nombre.'; return; }
      try { const a = await onCreateArea(n); areas.push(a); newName.value = ''; err.textContent = ''; renderList(); }
      catch (e) { err.dataset.kind = 'error'; err.textContent = e.message; }
    } }),
  ]) : el('p', { class: 'ap-muted', text: 'Solo un admin puede crear o editar áreas.' });

  openModal('Áreas', [createRow, list, err], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cerrar', onclick: close }),
  ]);
}

function fmtDate(s) { try { return new Date(s).toLocaleString(); } catch { return s; } }
function round1(x) { return Math.round(x * 10) / 10; }

// Check-in sobre un KR. onSubmit({value, confidence, note}) -> Promise
export function checkInModal({ kr, onSubmit }) {
  const isHito = kr.type === 'hito';
  let valueInput;
  if (isHito) {
    valueInput = el('select', {}, [el('option', { value: '1', text: 'Hecho' }), el('option', { value: '0', text: 'Pendiente' })]);
    valueInput.value = Number(kr.current_value) >= Number(kr.target_value) ? '1' : '0';
  } else {
    valueInput = el('input', { type: 'number', step: 'any', value: String(kr.current_value ?? 0) });
  }
  let confidence = null;
  const group = el('div', { class: 'ap-radio-group' });
  CONF_OPTIONS.forEach((o) => {
    const input = el('input', { type: 'radio', name: 'gb-conf', value: o.value });
    const label = el('label', { class: 'ap-radio' }, [input, o.label]);
    input.addEventListener('change', () => {
      confidence = o.value;
      [...group.children].forEach((c) => c.classList.remove('sel'));
      label.classList.add('sel');
    });
    group.append(label);
  });
  const note = el('textarea', { rows: '2', placeholder: 'Nota (opcional)' });
  const err = el('p', { class: 'ap-status' });

  openModal(`Check-in · ${kr.title}`, [
    el('div', { class: 'ap-field' }, [el('label', { text: 'Nuevo valor' }), valueInput]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Confianza' }), group]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Nota' }), note]),
    err,
  ], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cancelar', onclick: close }),
    el('button', {
      class: 'ap-btn', text: 'Guardar check-in', onclick: async (e) => {
        if (!confidence) { err.dataset.kind = 'error'; err.textContent = 'Elegí la confianza.'; return; }
        e.target.disabled = true;
        try { await onSubmit({ value: Number(valueInput.value), confidence, note: note.value.trim() }); close(); }
        catch (er) { err.dataset.kind = 'error'; err.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ]);
}

// Historial de check-ins de un KR (cronológico).
export function historyModal({ kr, items, meId }) {
  const body = items.length
    ? el('div', { class: 'ap-history' }, items.map((it) => el('div', { class: 'ap-history-item' }, [
        el('div', { class: 'ap-history-meta' }, [confBadge(it.confidence), el('span', { text: fmtDate(it.created_at) })]),
        el('div', {}, [
          el('strong', { text: `Valor: ${fmt(it.value)} ` }),
          el('span', { class: 'ap-muted', text: it.author_id === meId ? '· vos' : '· otra persona' }),
        ]),
        it.note && el('div', { class: 'ap-history-note', text: it.note }),
      ])))
    : el('p', { class: 'ap-muted', text: 'Todavía no hay check-ins en este KR.' });
  openModal(`Historial · ${kr.title}`, [body], (close) => [
    el('button', { class: 'ap-btn', text: 'Cerrar', onclick: close }),
  ]);
}

// Cierre de ciclo con scoring. onSubmit([{krId, score}]) -> Promise
export function closeCycleModal({ objectives, onSubmit }) {
  const inputs = [];
  const rows = [];
  for (const obj of objectives) {
    rows.push(el('div', { class: 'ap-nav-label', text: obj.title }));
    for (const kr of obj.key_results || []) {
      const input = el('input', {
        type: 'number', min: '0', max: '1', step: '0.1',
        value: kr.score != null ? String(kr.score) : String(round1(Number(kr.progress || 0))),
      });
      inputs.push({ krId: kr.id, input });
      rows.push(el('div', { class: 'ap-score-row' }, [el('span', { class: 'lbl', text: kr.title }), input]));
    }
  }
  const err = el('p', { class: 'ap-status' });
  openModal('Cerrar ciclo', [
    el('p', { class: 'ap-guide', text: 'Puntuá cada key result de 0.0 a 1.0. Guía de Doerr: 0.7 ya es un buen resultado; sacar 1.0 siempre sugiere que los objetivos eran poco ambiciosos.' }),
    ...rows, err,
  ], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cancelar', onclick: close }),
    el('button', {
      class: 'ap-btn danger', text: 'Cerrar ciclo', onclick: async (e) => {
        const scores = [];
        for (const { krId, input } of inputs) {
          const v = Number(input.value);
          if (!(v >= 0 && v <= 1)) { err.dataset.kind = 'error'; err.textContent = 'Los scores van de 0.0 a 1.0.'; return; }
          scores.push({ krId, score: v });
        }
        e.target.disabled = true;
        try { await onSubmit(scores); close(); }
        catch (er) { err.dataset.kind = 'error'; err.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ]);
}

// Panel de IA: configuración de proveedor/modelo (admin) + resumen de uso.
export function aiPanelModal({ settings, isAdmin, usage, onSave }) {
  const provider = el('select', { disabled: isAdmin ? null : 'true' }, [
    el('option', { value: 'anthropic', text: 'Anthropic', selected: settings.provider === 'anthropic' ? 'true' : null }),
    el('option', { value: 'openai', text: 'OpenAI', selected: settings.provider === 'openai' ? 'true' : null }),
    el('option', { value: 'openrouter', text: 'OpenRouter', selected: settings.provider === 'openrouter' ? 'true' : null }),
  ]);
  const model = el('input', { type: 'text', value: settings.model || '', disabled: isAdmin ? null : 'true' });
  const modelHint = el('p', { class: 'ap-muted', text: 'Ej: claude-opus-4-8 (Anthropic) · gpt-4o (OpenAI) · anthropic/claude-opus-4-8 (OpenRouter). El PDF solo anda con Anthropic.' });
  const status = el('p', { class: 'ap-status' });
  const u = usage || { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };

  const body = [
    el('div', { class: 'ap-field' }, [el('label', { text: 'Proveedor' }), provider]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Modelo' }), model, modelHint]),
    !isAdmin && el('p', { class: 'ap-muted', text: 'Solo un admin puede cambiar el proveedor/modelo.' }),
    el('div', { class: 'ap-field' }, [
      el('label', { text: 'Uso de IA (esta empresa)' }),
      el('div', { class: 'ap-muted', text: `${u.calls} llamadas · ${u.inputTokens + u.outputTokens} tokens · ~US$${u.costUsd.toFixed(4)} (estimado)` }),
    ]),
    status,
  ];
  openModal('IA', body, (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cerrar', onclick: close }),
    isAdmin && el('button', {
      class: 'ap-btn', text: 'Guardar', onclick: async (e) => {
        e.target.disabled = true; status.dataset.kind = ''; status.textContent = 'Guardando…';
        try { await onSave({ provider: provider.value, model: model.value.trim() }); close(); }
        catch (er) { status.dataset.kind = 'error'; status.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ]);
}
