// Cliente único de Supabase, compartido por toda la app.
//
// Única excepción a la regla "sin CDN": el cliente oficial se carga como módulo
// ESM desde un CDN, porque goalboard ya es online-first y lo necesita.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
