-- ai_usage se inserta desde el servidor (Edge Function con service_role); los
-- miembros solo la LEEN vía RLS. Pero service_role no tenía INSERT en la tabla,
-- así que el registro de uso fallaba en silencio. Le damos el grant explícito.
grant insert on table public.ai_usage to service_role;
