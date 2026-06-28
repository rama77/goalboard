// Configuración pública de goalboard.
//
// IMPORTANTE: estos valores son PÚBLICOS por diseño. La publishable key de
// Supabase está pensada para vivir en el front-end; lo que protege los datos son
// las políticas Row Level Security (RLS) en Supabase, no el secreto de esta clave.
//
// NUNCA pongas acá (ni en ningún archivo del repo) la SECRET key (`sb_secret_...`)
// u otro secreto: esos no van jamás al cliente.
//
// Reemplazá los valores por los de TU proyecto Supabase:
//   - SUPABASE_URL             → Project Settings → Data API → Project URL
//   - SUPABASE_PUBLISHABLE_KEY → Project Settings → API Keys → Publishable key

export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YOUR_KEY';
