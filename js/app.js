// Bootstrap de goalboard: decide qué mostrar según la sesión de auth y reacciona
// en vivo a los cambios (login / logout) sin recargar la página.
import { getSession, onAuthChange, signInWithOtp, signOut } from './auth.js';

const root = document.getElementById('app');

// --- Vista: no autenticado (ingreso por magic link) -------------------------
function renderLogin() {
  root.replaceChildren();

  const card = document.createElement('section');
  card.className = 'card';

  const title = document.createElement('h1');
  title.textContent = 'goalboard';

  const subtitle = document.createElement('p');
  subtitle.className = 'muted';
  subtitle.textContent =
    'Ingresá con tu email y te mandamos un enlace para entrar.';

  const form = document.createElement('form');
  form.className = 'stack';
  form.noValidate = false;

  const field = document.createElement('label');
  field.className = 'field';
  const fieldLabel = document.createElement('span');
  fieldLabel.textContent = 'Email';
  const input = document.createElement('input');
  input.type = 'email';
  input.name = 'email';
  input.required = true;
  input.autocomplete = 'email';
  input.placeholder = 'vos@ejemplo.com';
  field.append(fieldLabel, input);

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'btn';
  button.textContent = 'Enviarme el enlace';

  const status = document.createElement('p');
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  form.append(field, button, status);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.dataset.kind = '';
    status.textContent = 'Enviando…';

    const { error } = await signInWithOtp(input.value.trim());

    if (error) {
      status.dataset.kind = 'error';
      status.textContent = 'No se pudo enviar el enlace: ' + error.message;
      button.disabled = false;
      return;
    }

    status.dataset.kind = 'ok';
    status.textContent = 'Listo. Revisá tu correo y abrí el enlace para entrar.';
  });

  card.append(title, subtitle, form);
  root.append(card);
}

// --- Vista: autenticado (shell mínimo) --------------------------------------
function renderApp(session) {
  root.replaceChildren();

  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  const brand = document.createElement('strong');
  brand.className = 'brand';
  brand.textContent = 'goalboard';

  const spacer = document.createElement('div');
  spacer.className = 'spacer';

  const email = document.createElement('span');
  email.className = 'muted';
  email.textContent = session.user?.email ?? '';

  const logout = document.createElement('button');
  logout.className = 'btn btn-ghost';
  logout.textContent = 'Cerrar sesión';
  logout.addEventListener('click', () => signOut());

  topbar.append(brand, spacer, email, logout);

  const main = document.createElement('main');
  main.className = 'content';
  const placeholder = document.createElement('p');
  placeholder.className = 'muted';
  placeholder.textContent = 'Sesión iniciada. Acá vivirá la app de OKRs.';
  main.append(placeholder);

  root.append(topbar, main);
}

// --- Render según estado de sesión ------------------------------------------
function render(session) {
  if (session) {
    renderApp(session);
  } else {
    renderLogin();
  }
  root.removeAttribute('aria-busy');
}

async function boot() {
  render(await getSession());
  onAuthChange((session) => render(session));
}

boot();
