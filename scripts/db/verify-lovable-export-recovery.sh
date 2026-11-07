#!/usr/bin/env bash
# Private SQL replay in a disposable local, offline PostgreSQL container.
# PASS covers the foundation SQL baseline, not native Auth/Storage recovery.
set -euo pipefail
umask 077

abort() {
  printf 'BLOCKED: %s\n' "$1" >&2
  exit 2
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PRIVATE="$ROOT/recovery_private"
[[ ! -L "$PRIVATE" ]] || abort "The private recovery directory must not be a symbolic link."
mkdir -p "$PRIVATE"
[[ -d "$PRIVATE" ]] || abort "The private recovery directory is unavailable."
chmod 700 "$PRIVATE"

# Never follow or truncate an old .restore-last.log. Every invocation gets an
# exclusively created private log; failure details and SQL stay in that file.
LOG="$(mktemp "$PRIVATE/.restore-XXXXXXXX.log")"
chmod 600 "$LOG"

if [[ $# -eq 0 ]]; then
  mapfile -d '' candidates < <(
    find "$PRIVATE" -maxdepth 1 -type f \( -iname '*.sql' -o -iname '*.backup' -o -iname '*.dump' \) -print0
  )
  [[ ${#candidates[@]} -eq 1 ]] ||
    abort "Supply exactly one private SQL/custom-format export, or its explicit private path."
  INPUT="${candidates[0]}"
elif [[ $# -eq 1 ]]; then
  INPUT="$1"
else
  abort "Usage: bash scripts/db/verify-lovable-export-recovery.sh [recovery_private/backup.sql]"
fi

[[ -f "$INPUT" && ! -L "$INPUT" ]] || abort "The supplied export must be a regular file, not a symbolic link."
INPUT="$(realpath "$INPUT")"
case "$INPUT" in
  "$PRIVATE/"*) ;;
  *) abort "The export must be inside this checkout's private recovery directory." ;;
esac
[[ -r "$INPUT" && -s "$INPUT" ]] || abort "The private export is empty or unreadable."
command -v sha256sum >/dev/null 2>&1 || abort "SHA-256 verification is unavailable."
INPUT_HASH="$(sha256sum < "$INPUT" | cut -d ' ' -f 1)"
[[ "$INPUT_HASH" =~ ^[0-9a-f]{64}$ ]] || abort "Could not fingerprint the private export."
printf 'Input SHA-256: %s\nInput bytes: %s\n' "$INPUT_HASH" "$(wc -c < "$INPUT")" >> "$LOG"

# Detect bytes, not extensions. Do not rewrite exports, remove failing SQL or
# manufacture missing platform schemas/functions to force a successful replay.
FIRST_HEX="$(head -c 5 "$INPUT" | od -An -tx1 | tr -d ' \n')"
TAR_HEX="$(dd if="$INPUT" bs=1 skip=257 count=5 2>/dev/null | od -An -tx1 | tr -d ' \n')"
if [[ "$FIRST_HEX" == "5047444d50" ]]; then
  MODE=archive
elif [[ "$FIRST_HEX" == 504b0304* || "$FIRST_HEX" == 1f8b* || "$TAR_HEX" == "7573746172" ]]; then
  abort "Compressed/tar wrappers are not supported here; preserve the original and inspect/extract privately first."
else
  MODE=sql
  LC_ALL=C grep -Iq . "$INPUT" || abort "The export is not supported plain SQL or a PostgreSQL custom archive."
  LC_ALL=C grep -Eiq '^[[:space:]]*CREATE[[:space:]]+TABLE' "$INPUT" ||
    abort "A data-only or unrecognized SQL export cannot establish schema recovery."
fi

command -v docker >/dev/null 2>&1 || abort "Docker is unavailable; no export was imported."
# An inherited Docker context/host must never redirect this private-file mount
# to a remote daemon. Explicit local socket plus cleared endpoint/TLS settings.
DOCKER=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY
  -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
"${DOCKER[@]}" info >> "$LOG" 2>&1 || abort "The local Docker socket is unavailable; no export was imported."

RUN_ID="$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')"
CONTAINER="slams-recovery-$RUN_ID"
CLEANED=0
container_absent() {
  local remaining
  remaining="$("${DOCKER[@]}" container ls --all --quiet \
    --filter "name=^/$CONTAINER$" 2>> "$LOG")" || return 1
  [[ -z "$remaining" ]]
}
cleanup() {
  [[ "$CLEANED" == 1 ]] && return 0
  local ownership container_id owner
  if ownership="$("${DOCKER[@]}" inspect --type container \
    --format '{{.Id}} {{ index .Config.Labels "slams.recovery.run" }}' \
    "$CONTAINER" 2>> "$LOG")"; then
    read -r container_id owner <<< "$ownership"
    [[ "$container_id" =~ ^[0-9a-f]{64}$ && "$owner" == "$RUN_ID" ]] || return 1
    # Remove by the verified ID, never an unverified or newly reused name.
    "${DOCKER[@]}" rm -fv "$container_id" >> "$LOG" 2>&1 || true
  fi
  container_absent || return 1
  CLEANED=1
}
cleanup_on_exit() {
  if ! cleanup; then
    printf 'BLOCKED: isolated container cleanup could not be confirmed; inspect the private log before retrying.\n' >&2
    return 2
  fi
}
trap cleanup_on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

printf 'Isolated PostgreSQL 17 SQL replay starting (local offline container).\n'
printf 'Detected export mode: %s\n' "$MODE"
# --pull=never prevents any registry request. The only host mount is the input,
# read-only; no repository, credentials, Docker socket or host network is shared.
if ! "${DOCKER[@]}" run --detach --pull=never \
  --name "$CONTAINER" --label "slams.recovery.run=$RUN_ID" \
  --network none --security-opt no-new-privileges \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,src=$INPUT,dst=/recovery/input,readonly" \
  postgres:17-alpine >> "$LOG" 2>&1; then
  abort "The local PostgreSQL 17 image/container is unavailable; inspect the private recovery log."
fi
ready=0
for _ in {1..40}; do
  if "${DOCKER[@]}" exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres >> "$LOG" 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]] || abort "The isolated PostgreSQL server did not become ready."

mounted_hash() {
  "${DOCKER[@]}" exec "$CONTAINER" sha256sum /recovery/input 2>> "$LOG" | cut -d ' ' -f 1
}
[[ "$(mounted_hash)" == "$INPUT_HASH" ]] || abort "The mounted export does not match the recorded SHA-256."

# Only role names required by normal owner/GRANT clauses are scaffolded.
# These NOLOGIN placeholders are not Supabase Auth, role topology or services.
ROLE_BOOTSTRAP=$(cat <<'SQL'
DO $roles$
DECLARE name text;
BEGIN
  FOREACH name IN ARRAY ARRAY[
    'anon','authenticated','service_role','authenticator',
    'supabase_admin','supabase_auth_admin','supabase_storage_admin',
    'supabase_realtime_admin','supabase_functions_admin',
    'dashboard_user','migrator','pgbouncer','pgsodium_keyholder','sandbox_exec'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=name) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', name);
    END IF;
  END LOOP;
END;
$roles$;
SQL
)
"${DOCKER[@]}" exec "$CONTAINER" psql -X -v ON_ERROR_STOP=1 -U postgres \
  -d postgres -c "$ROLE_BOOTSTRAP" >> "$LOG" 2>&1 ||
  abort "Unable to create placeholder owner roles in the isolated container."
"${DOCKER[@]}" exec "$CONTAINER" createdb -U postgres -T template0 slams_recovery >> "$LOG" 2>&1 ||
  abort "Unable to create the disposable recovery database."

if [[ "$MODE" == sql ]]; then
  "${DOCKER[@]}" exec "$CONTAINER" psql -X -v ON_ERROR_STOP=1 \
    --single-transaction -U postgres -d slams_recovery \
    -f /recovery/input >> "$LOG" 2>&1 ||
    abort "SQL replay failed. Missing Supabase schemas/extensions or export incompatibility need a compatible isolated target; inspect the private log."
else
  "${DOCKER[@]}" exec "$CONTAINER" pg_restore --list /recovery/input >> "$LOG" 2>&1 ||
    abort "The archive format/version is unsupported by this isolated PostgreSQL target."
  "${DOCKER[@]}" exec "$CONTAINER" pg_restore -v --exit-on-error \
    --single-transaction -U postgres -d slams_recovery \
    /recovery/input >> "$LOG" 2>&1 ||
    abort "Archive replay failed. Preserve it unchanged and inspect dependencies in the private log."
fi

# A matching row count is insufficient. These are minimum foundation safety
# checks, not a complete snapshot schema/content manifest comparison.
if ! "${DOCKER[@]}" exec -i "$CONTAINER" psql -X -v ON_ERROR_STOP=1 \
  -U postgres -d slams_recovery >> "$LOG" 2>&1 <<'SQL'
SET search_path = pg_catalog;
DO $baseline$
DECLARE
  item record;
  object_id oid;
  ledger_hashes text[];
BEGIN
  IF to_regclass('auth.users') IS NULL OR to_regclass('drizzle.__drizzle_migrations') IS NULL THEN
    RAISE EXCEPTION 'Required Auth/ledger structures are absent';
  END IF;
  FOR item IN SELECT * FROM (VALUES
    ('profiles',3),('passport_entries',4),('audition_prep',4),('unit_progress',4),
    ('schools',1),('curriculum_years',1),('curriculum_terms',1),
    ('curriculum_courses',1),('curriculum_workshops',1),('curriculum_lessons',1),
    ('curriculum_exercises',1),('curriculum_assessments',1),('curriculum_imports',1)
  ) AS required(table_name, policy_count) LOOP
    SELECT c.oid INTO object_id FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=item.table_name
        AND c.relkind='r' AND c.relrowsecurity;
    IF object_id IS NULL THEN RAISE EXCEPTION 'Foundation table/RLS baseline is incomplete'; END IF;
    IF (SELECT count(*) FROM pg_policy WHERE polrelid=object_id) <> item.policy_count THEN
      RAISE EXCEPTION 'Foundation policy baseline is incomplete';
    END IF;
  END LOOP;
  SELECT array_agg(hash ORDER BY id) INTO ledger_hashes FROM drizzle.__drizzle_migrations;
  IF ledger_hashes IS DISTINCT FROM ARRAY[
    'db2e37b4fff52904e009a075655318b69343d11215c79f0f7ec06987a1b51adc',
    '2d105d575f3b84d1f2dbe93d9d19c558ff050a03847c9921ed029e5585109ff1',
    '4f2820cfad7fa38e202add86c2b39f3d9273d5c9c5077fb998e57ffc232722a9'
  ]::text[] THEN RAISE EXCEPTION 'Foundation ledger hashes/order do not match the reviewed baseline'; END IF;
  FOR item IN SELECT * FROM (VALUES
    ('handle_new_user',true),('validate_unit_progress',false),('require_reviewed_curriculum',false)
  ) AS required(function_name, definer) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname=item.function_name AND p.pronargs=0
        AND p.prokind='f' AND p.prorettype='trigger'::regtype
        AND p.prosecdef=item.definer AND p.proconfig @> ARRAY['search_path=public']
    ) THEN RAISE EXCEPTION 'Foundation trigger-function baseline is incomplete'; END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES
    ('auth','users','on_auth_user_created','handle_new_user',5),
    ('public','unit_progress','validate_actual_unit_before_progress','validate_unit_progress',23),
    ('public','curriculum_courses','reviewed_course','require_reviewed_curriculum',23),
    ('public','curriculum_workshops','reviewed_workshop','require_reviewed_curriculum',23),
    ('public','curriculum_lessons','reviewed_lesson','require_reviewed_curriculum',23),
    ('public','curriculum_exercises','reviewed_exercise','require_reviewed_curriculum',23),
    ('public','curriculum_assessments','reviewed_assessment','require_reviewed_curriculum',23)
  ) AS required(schema_name, table_name, trigger_name, function_name, trigger_type) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace pn ON pn.oid=p.pronamespace
      WHERE n.nspname=item.schema_name AND c.relname=item.table_name
        AND t.tgname=item.trigger_name AND NOT t.tgisinternal AND t.tgenabled='O'
        AND t.tgtype=item.trigger_type AND pn.nspname='public' AND p.proname=item.function_name
    ) THEN RAISE EXCEPTION 'Foundation trigger baseline is incomplete'; END IF;
  END LOOP;
END;
$baseline$;
SQL
then
  abort "SQL replay completed, but the foundation schema/security/ledger baseline failed; recovery is NOT proven. Inspect the private log."
fi

# Controlled aggregate output only: no raw rows, filenames, auth values or SQL
# diagnostics. Counts establish readability, not equality with the source snapshot.
for object in auth.users public.profiles public.passport_entries public.audition_prep \
  public.unit_progress public.schools public.curriculum_years public.curriculum_terms \
  public.curriculum_courses public.curriculum_workshops public.curriculum_lessons \
  public.curriculum_exercises public.curriculum_assessments public.curriculum_imports \
  drizzle.__drizzle_migrations; do
  count="$("${DOCKER[@]}" exec "$CONTAINER" psql -XAt -v ON_ERROR_STOP=1 -U postgres \
    -d slams_recovery -c "SELECT COUNT(*) FROM $object" 2>> "$LOG")" ||
    abort "A restored required table could not be counted; inspect the private log."
  [[ "$count" =~ ^[0-9]+$ ]] || abort "A required table returned an invalid aggregate result."
  printf '%s: %s rows\n' "$object" "$count"
done

[[ ! -L "$INPUT" && "$(sha256sum < "$INPUT" | cut -d ' ' -f 1)" == "$INPUT_HASH" ]] ||
  abort "The source export changed during replay; this result cannot be trusted."
[[ "$(mounted_hash)" == "$INPUT_HASH" ]] || abort "The mounted export changed during replay."
cleanup || abort "Isolated container cleanup could not be confirmed; recovery proof remains blocked."
printf 'Input SHA-256 verified before and after replay.\n'
printf 'PASS: isolated SQL replay and foundation baseline only (13 RLS tables, 24 policies, 3 functions, 7 triggers, exact ledger hashes).\n'
printf 'NOT PROVEN: full snapshot schema/data parity, working Supabase Auth/Storage services, private file recovery or complete disaster recovery.\n'
printf 'Diagnostics remain in a unique private recovery_private/.restore-*.log file.\n'
