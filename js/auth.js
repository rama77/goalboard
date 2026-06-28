// Autenticación de goalboard, apoyada en Supabase Auth (magic link, sin
// contraseñas). El cliente de Supabase persiste y refresca la sesión solo.
import { supabase } from './supabase.js';

// Pide a Supabase que envíe un magic link al email indicado.
// Al abrir el enlace, el usuario vuelve a esta misma URL ya autenticado.
export function signInWithOtp(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  });
}

// Devuelve la sesión actual, o null si no hay ninguna.
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Se suscribe a los cambios de sesión (login / logout / refresh).
// Devuelve la subscription por si hace falta desuscribirse.
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

// Cierra la sesión actual.
export function signOut() {
  return supabase.auth.signOut();
}
