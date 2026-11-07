#!/usr/bin/env bash
# SLAMS — private, isolated Lovable export recovery rehearsal.
# Runs ONLY inside a disposable Docker container with network disabled.
# NEVER connects to Lovable, real Supabase staging, or any remote DB.
# No backup bytes, auth records or SQL errors are printed to stdout.
set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PRIVATE="$ROOT/recovery_private"
mkdir -p "$PRIVATE"
chmod 700 "$PRIVATE"
LOG="$PRIVATE/.restore-last.log"
: > "$LOG"
chmod 600 "$LOG"

abort() {
  printf 'BLOCKED: %s\n' "$1" >&2
  exit 2
}

if ! command -v docker >/dev/null 2>&1; then
  abort "Docker is unavailable in this Codespace; the backup was NOT imported."
fi
if ! docker info >/dev/null 2>&1; then
  abort "Docker is not running or accessible; the backup was NOT imported."
fi

# Auto-select exactly one private backup, unless explicitly given a path.
if [[ $# -eq 0 ]]; then
  mapfile -d '' candidates < <(
    find "$PRIVATE" -maxdepth 1 -type f \( -iname '*.sql' -o -iname '*.backup' -o -iname '*.dump' \) -print0
  )
  if [[ ${#candidates[@]} -ne 1 ]]; then
    abort "Put exactly one .sql/.backup/.dump in recovery_private, or provide its private path."
  fi
  INPUT="${candidates[0]}"
elif [[ $# -eq 1 ]]; then
  INPUT="$1"
else
  abort "Usage: bash scripts/db/verify-lovable-export-recovery.sh [recovery_private/backup.sql]"
fi

[[ -f "$INPUT" && ! -L "$INPUT" ]] || abort "The supplied backup is not a regular file."
INPUT="$(realpath "$INPUT")"
case "$INPUT" in
  "$PRIVATE/"*) ;;
  *) abort "Only files inside $PRIVATE can be restored." ;;
esac
[[ -r "$INPUT" && -s "$INPUT" ]] || abort "The private backup is empty or unreadable."

# Detect actual content, not the filename extension.
MAGIC="$(head -c 5 "$INPUT" || true)"
FIRST_HEX="$(head -c 4 "$INPUT" | od -An -tx1 | tr -d ' \n')"
if [[ "$MAGIC" == "PGDMP" ]]; then
  MODE=archive
elif [[ "$FIRST_HEX" == "504b0304" || "$FIRST_HEX" == 1f8b* ]]; then
  abort "The backup is a ZIP/gzip wrapper; extract it privately into recovery_private first."
else
  MODE=sql
  if ! LC_ALL=C grep -Eiq '^[[:space:]]*CREATE[[:space:]]+TABLE' "$INPUT"; then
    abort "The file does not look like a plain SQL schema dump; not safe to claim restore success."
  fi
fi

# Only the read-only backup file is mounted; no repo, SSH keys, host data
# or secrets are accessible inside the network-isolated container.
CONTAINER="slams-recovery-$$"
cleanup() {
  docker rm -fv "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

printf 'Isolated PostgreSQL 17 recovery test starting (offline container).\n'
printf 'Detected backup mode: %s\n' "$MODE"

if ! docker run --detach \
  --name "$CONTAINER" \
  --network none \
  --security-opt no-new-privileges \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,src=$INPUT,dst=/recovery/input,readonly" \
  postgres:17-alpine >>"$LOG" 2>&1; then
  abort "Could not create the isolated PostgreSQL container; see private .restore-last.log."
fi

ready=0
for _ in {1..40}; do
  if docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]] || abort "The isolated PostgreSQL server did not become ready."

# Placeholder roles for owners/GRANTs that a normal pg_dump may reference.
# These are NOLOGIN, and do NOT recreate Supabase Auth, its extensions or APIs.
ROLE_BOOTSTRAP=$(cat <<'SQL'
DO $roles$
DECLARE name text;
BEGIN
  FOREACH name IN ARRAY ARRAY[
    'anon','authenticated','service_role','authenticator',
    'supabase_admin','supabase_auth_admin','supabase_storage_admin',
    'supabase_realtime_admin','supabase_functions_admin',
    'dashboard_user','migrator','pgbouncer','pgsodium_keyholder'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=name) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', name);
    END IF;
  END LOOP;
END;
$roles$;
SQL
)
docker exec "$CONTAINER" psql -X -v ON_ERROR_STOP=1 -U postgres \
  -d postgres -c "$ROLE_BOOTSTRAP" >>"$LOG" 2>&1 ||
  abort "Unable to create placeholder roles in the isolated container."
docker exec "$CONTAINER" createdb -U postgres -T template0 slams_recovery >>"$LOG" 2>&1 ||
  abort "Unable to create the disposable recovery database."

if [[ "$MODE" == sql ]]; then
  if ! docker exec "$CONTAINER" psql -X -v ON_ERROR_STOP=1 \
    --single-transaction -U postgres -d slams_recovery \
    -f /recovery/input >>"$LOG" 2>&1; then
    abort "SQL restore failed in vanilla PostgreSQL. May need a Supabase-native environment. Private details: recovery_private/.restore-last.log"
  fi
else
  if ! docker exec "$CONTAINER" pg_restore -v --exit-on-error \
    --single-transaction -U postgres -d slams_recovery \
    /recovery/input >>"$LOG" 2>&1; then
    abort "Archive restore failed in vanilla PostgreSQL. May need Supabase-specific services. Private details: recovery_private/.restore-last.log"
  fi
fi

# Only object names and counts are output. No user details or records.
check=0
for object in auth.users public.profiles public.passport_entries \
              public.audition_prep public.schools public.curriculum_terms \
              drizzle.__drizzle_migrations; do
  present="$(docker exec "$CONTAINER" psql -XAt -U postgres -d slams_recovery \
    -c "SELECT to_regclass('$object') IS NOT NULL" 2>>"$LOG" || true)"
  if [[ "$present" != "t" ]]; then
    printf '%s: MISSING\n' "$object"
    check=1
    continue
  fi
  count="$(docker exec "$CONTAINER" psql -XAt -U postgres -d slams_recovery \
    -c "SELECT COUNT(*) FROM $object" 2>>"$LOG" || true)"
  if [[ ! "$count" =~ ^[0-9]+$ ]]; then
    printf '%s: COULD NOT COUNT\n' "$object"
    check=1
  else
    printf '%s: %s rows\n' "$object" "$count"
  fi
done

if [[ "$check" != 0 ]]; then
  abort "SQL imported, but some required SLAMS structures are missing. Full recovery NOT verified."
fi

printf 'PASS: private export restored to an isolated PostgreSQL 17 container; required tables are readable.\n'
printf 'LIMITATION: this does not prove a complete Supabase Auth/service restore.\n'
