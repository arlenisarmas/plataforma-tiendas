#!/usr/bin/env bash
# Corre las migraciones y los escenarios de seguridad y negocio sobre un
# PostgreSQL limpio (sin Supabase). Uso: DATABASE_URL=postgres://... ./ejecutar.sh
# La base indicada se BORRA y se recrea.
set -euo pipefail
: "${DATABASE_URL:?Definí DATABASE_URL apuntando a una base descartable}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$DIR/../.."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "drop schema if exists public, auth, storage, vault, storefront, t cascade; create schema public;"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$DIR/00_simulacion_supabase.sql"
# The standalone PostgreSQL scenario runner has no pg_cron extension. The
# Supabase CI reset applies and verifies the cron migration against the real stack.
for f in "$ROOT"/migrations/*.sql; do
  case "$f" in *_release_expired_reservations_cron.sql) continue ;; esac
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f" > /dev/null
done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -t -f "$DIR/10_escenarios_etapa1.sql" 2>&1 | grep -E "PASA|FALLA|ERROR|TODAS" | sed 's/^psql:[^ ]* NOTICE:  //'
