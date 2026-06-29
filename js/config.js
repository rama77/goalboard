// Configuración pública de goalboard — apunta al stack LOCAL de Supabase.
//
// Estos son los valores por defecto de la Supabase CLI (`supabase start`):
// son PÚBLICOS y compartidos por todas las instalaciones locales, así que
// versionarlos está bien. Para correr el proyecto: `supabase start` y serví
// el front por HTTP (ver README).
//
// IMPORTANTE: la publishable key es pública por diseño; lo que protege los datos
// son las políticas RLS. NUNCA pongas la SECRET key (`sb_secret_...`) en el repo.
//
// El despliegue contra un Supabase en la nube se configura aparte (no acá), para
// que el repo no quede atado a ninguna instancia productiva.

export const SUPABASE_URL = 'http://127.0.0.1:54321';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
