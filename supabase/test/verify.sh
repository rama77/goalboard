#!/usr/bin/env bash
# Valida las migraciones de supabase/migrations/ + RLS en un Postgres efímero
# (Docker), simulando usuarios de Supabase (auth.uid(), roles anon/authenticated).
# No toca ningún proyecto Supabase real.
#
# Uso:  ./supabase/test/verify.sh
# Requiere: Docker corriendo.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$HERE/../migrations"
CT=gb-pg-verify

cleanup() { docker rm -f "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT

cleanup
docker run -d --name "$CT" -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=goalboard postgres:15 >/dev/null
for _ in $(seq 1 30); do docker exec "$CT" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

apply() { docker exec -i "$CT" psql -U postgres -d goalboard -v ON_ERROR_STOP=1 -q "$@"; }
apply < "$HERE/shim.sql"
# Aplica las migraciones en orden (mismo SQL que corre la Supabase CLI en local).
for m in "$MIGRATIONS"/*.sql; do apply < "$m"; done
apply < "$HERE/seed.sql"

CONTAINER="$CT" bash "$HERE/run_tests.sh"
