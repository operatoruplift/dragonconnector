#!/usr/bin/env bash
# Apply every migration to a throwaway local PostgreSQL, then run the SQL tests in supabase/tests.
# Needs PostgreSQL 15 or newer (initdb, pg_ctl, psql); set PG_BIN to its bin directory if it is not
# on the PATH. Nothing touches the real Supabase project.   npm run test:db
set -euo pipefail
cd "$(dirname "$0")/.."
INITDB="$(command -v initdb || ls -d /usr/lib/postgresql/*/bin/initdb 2>/dev/null | sort -V | tail -1 || true)"
BIN="${PG_BIN:-$(dirname "${INITDB:-/missing/initdb}")}"
[ -x "$BIN/initdb" ] || { echo "PostgreSQL (initdb) not found; set PG_BIN" >&2; exit 1; }
PORT="${PG_PORT:-54329}"
WORK="$(mktemp -d)"
AS=()
if [ "$(id -u)" = 0 ]; then chown postgres "$WORK"; AS=(runuser -u postgres --); fi # initdb refuses to run as root
stop() { "${AS[@]}" "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap stop EXIT
"${AS[@]}" "$BIN/initdb" -D "$WORK/data" -U postgres --auth=trust >/dev/null
"${AS[@]}" "$BIN/pg_ctl" -D "$WORK/data" -l "$WORK/log" -o "-p $PORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=''" -w start >/dev/null
sql() { "${AS[@]}" "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
sql -1 < supabase/tests/supabase.sql
for migration in supabase/migrations/*.sql; do
  sql -1 < "$migration" || { echo "not ok: $migration" >&2; exit 1; }
done
echo "ok - $(ls supabase/migrations/*.sql | wc -l | tr -d ' ') migrations apply"
for test in supabase/tests/*.test.sql; do
  sql -o /dev/null < "$test" || { echo "not ok: $test" >&2; exit 1; }
  echo "ok - $test"
done
