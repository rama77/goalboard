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
      el('span', { class: 'ncount', text: c.cadence === 'anual' ? 'A' : 'Q' }),
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

  // Main
  const topbar = el('div', { class: 'ap-topbar' }, [
    el('div', { class: 'ap-topbar-left' }, [
      el('span', { class: 'ap-topbar-title', text: activeCycle ? activeCycle.name : (activeOrg?.name || 'goalboard') }),
    ]),
    el('div', { class: 'ap-actions' }, [
      themeBtn(),
      activeCycle && el('button', { class: 'ap-btn', text: '+ Nuevo objetivo', onclick: handlers.onNewObjective }),
    ]),
  ]);

  const page = el('div', { class: 'ap-page' }, [
    el('div', { class: 'ap-header' }, [
      el('div', {}, [
        el('h1', { class: 'ap-title', text: activeOrg?.name || 'goalboard' }),
        el('p', { class: 'ap-subtitle', text: activeCycle ? `Objetivos del ciclo ${activeCycle.name}` : 'Creá un ciclo para empezar a cargar objetivos.' }),
      ]),
    ]),
    objectivesView(objectives, activeCycle, handlers),
  ]);

  root.append(el('div', { class: 'ap-app' }, [sidebar, el('main', { class: 'ap-main' }, [topbar, page])]));
}

function objectivesView(objectives, activeCycle, handlers) {
  if (!activeCycle) {
    return el('div', { class: 'ap-empty' }, [
      el('span', { text: 'Todavía no hay un ciclo seleccionado.' }),
      el('button', { class: 'ap-btn', text: '+ Crear ciclo', onclick: handlers.onNewCycle }),
    ]);
  }
  if (!objectives.length) {
    return el('div', { class: 'ap-empty' }, [
      el('span', { text: 'Sin objetivos en este ciclo.' }),
      el('button', { class: 'ap-btn', text: '+ Crear el primer objetivo', onclick: handlers.onNewObjective }),
    ]);
  }
  return el('div', { class: 'ap-okr-grid' }, objectives.map(objectiveCard));
}

function objectiveCard(obj) {
  const ratio = objectiveProgress(obj);
  const krs = (obj.key_results || []).map((kr) => {
    const r = Number(kr.progress || 0);
    return el('div', { class: 'ap-kr' }, [
      el('div', { class: 'ap-kr-head' }, [
        el('span', { class: 'ap-kr-title', text: kr.title }),
        el('span', { class: 'ap-kr-val', text: krValueLabel(kr) }),
      ]),
      progressBar(r),
    ]);
  });
  return el('div', { class: 'ap-card' }, [
    el('div', { class: 'ap-card-top' }, [
      el('div', { class: 'ap-card-title', text: obj.title }),
      el('span', { class: `ap-otype ${obj.kind}`, text: obj.kind }),
    ]),
    el('div', { class: 'ap-obj-progress' }, [progressBar(ratio), el('span', { class: 'pct', text: `${Math.round(ratio * 100)}%` })]),
    krs.length ? el('div', { class: 'ap-kr-list' }, krs) : el('span', { class: 'ap-muted', text: 'Sin key results.' }),
  ]);
}

function krValueLabel(kr) {
  if (kr.type === 'hito') return Number(kr.current_value) >= Number(kr.target_value) ? 'Hecho' : 'Pendiente';
  const suffix = kr.type === 'porcentaje' ? '%' : '';
  return `${fmt(kr.current_value)}${suffix} → ${fmt(kr.target_value)}${suffix}`;
}
function fmt(n) { const v = Number(n); return Number.isInteger(v) ? String(v) : v.toFixed(1); }

// --- Modales ---------------------------------------------------------------
function openModal(titleText, bodyNodes, buildActions) {
  const overlay = el('div', { class: 'ap-overlay open' });
  const close = () => overlay.remove();
  const modal = el('div', { class: 'ap-modal' }, [el('h3', { text: titleText }), ...bodyNodes]);
  modal.append(el('div', { class: 'ap-modal-actions' }, buildActions(close)));
  overlay.append(modal);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.body.append(overlay);
  return close;
}

// onSubmit({name, cadence}) -> Promise
export function newCycleModal({ defaultName, onSubmit }) {
  const name = el('input', { type: 'text', value: defaultName || '', placeholder: 'Ej: 2027 o Q1 2027' });
  const cadence = el('select', {}, [
    el('option', { value: 'anual', text: 'Anual' }),
    el('option', { value: 'trimestral', text: 'Trimestral' }),
  ]);
  const err = el('p', { class: 'ap-status' });
  openModal('Nuevo ciclo', [
    el('div', { class: 'ap-field' }, [el('label', { text: 'Nombre' }), name]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Cadencia' }), cadence]),
    err,
  ], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cancelar', onclick: close }),
    el('button', {
      class: 'ap-btn', text: 'Crear', onclick: async (e) => {
        const v = name.value.trim();
        if (!v) { err.dataset.kind = 'error'; err.textContent = 'Poné un nombre.'; return; }
        e.target.disabled = true;
        try { await onSubmit({ name: v, cadence: cadence.value }); close(); }
        catch (er) { err.dataset.kind = 'error'; err.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ]);
}

// onSubmit({title, kind, keyResults}) -> Promise
export function newObjectiveModal({ onSubmit }) {
  const title = el('input', { type: 'text', placeholder: 'Ej: Crecer en el mercado' });
  const kind = el('select', {}, [
    el('option', { value: 'comprometido', text: 'Comprometido' }),
    el('option', { value: 'aspiracional', text: 'Aspiracional (moonshot)' }),
  ]);
  const krList = el('div', { class: 'ap-kr-list' });
  const warn = el('p', { class: 'ap-warn', style: 'display:none', text: 'Más de 5 key results: el objetivo pierde foco.' });
  const err = el('p', { class: 'ap-status' });

  function krRow() {
    const t = el('input', { type: 'text', placeholder: 'Key result (medible)' });
    const type = el('select', {}, [
      el('option', { value: 'numerico', text: 'Número' }),
      el('option', { value: 'porcentaje', text: '%' }),
      el('option', { value: 'hito', text: 'Hito' }),
    ]);
    const start = el('input', { type: 'number', placeholder: 'Inicial', value: '0' });
    const target = el('input', { type: 'number', placeholder: 'Target' });
    const current = el('input', { type: 'number', placeholder: 'Actual', value: '0' });
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
  function addKr() { krList.append(krRow()); refreshWarn(); }
  addKr();

  openModal('Nuevo objetivo', [
    el('div', { class: 'ap-field' }, [el('label', { text: 'Objetivo' }), title]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Tipo' }), kind]),
    el('div', { class: 'ap-field' }, [el('label', { text: 'Key results' }), krList]),
    el('button', { class: 'ap-side-add', type: 'button', text: '+ Agregar key result', onclick: addKr }),
    warn, err,
  ], (close) => [
    el('button', { class: 'ap-btn ghost', text: 'Cancelar', onclick: close }),
    el('button', {
      class: 'ap-btn', text: 'Crear objetivo', onclick: async (e) => {
        const t = title.value.trim();
        const krs = [...krList.children].map((r) => r._read()).filter((k) => k.title);
        err.dataset.kind = '';
        if (!t) { err.dataset.kind = 'error'; err.textContent = 'El objetivo necesita un título.'; return; }
        for (const k of krs) {
          if (k.type !== 'hito' && !Number.isFinite(k.target_value)) {
            err.dataset.kind = 'error'; err.textContent = 'Cada key result necesita un target.'; return;
          }
        }
        e.target.disabled = true;
        try { await onSubmit({ title: t, kind: kind.value, keyResults: krs }); close(); }
        catch (er) { err.dataset.kind = 'error'; err.textContent = er.message; e.target.disabled = false; }
      },
    }),
  ]);
}
