#!/usr/bin/env bash
# Valida supabase/schema.sql + RLS en un Postgres efímero (Docker), simulando
# usuarios de Supabase (auth.uid(), roles anon/authenticated). No toca ningún
# proyecto Supabase real.
#
# Uso:  ./supabase/test/verify.sh
# Requiere: Docker corriendo.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCHEMA="$HERE/../schema.sql"
CT=gb-pg-verify

cleanup() { docker rm -f "$CT" >/dev/null 2>&1 || true; }
trap cleanup EXIT

cleanup
docker run -d --name "$CT" -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=goalboard postgres:15 >/dev/null
for _ in $(seq 1 30); do docker exec "$CT" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

apply() { docker exec -i "$CT" psql -U postgres -d goalboard -v ON_ERROR_STOP=1 -q "$@"; }
apply < "$HERE/shim.sql"
apply < "$SCHEMA"   # corre idempotente; los NOTICE de "drop ... if exists" son esperados
apply < "$HERE/seed.sql"

CONTAINER="$CT" bash "$HERE/run_tests.sh"
