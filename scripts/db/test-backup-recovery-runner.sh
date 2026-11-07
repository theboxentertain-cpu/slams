#!/usr/bin/env bash
# Synthetic regression checks. Never reads real exports or targets a remote DB.
set -euo pipefail
umask 077
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
[[ ! -L "$ROOT/recovery_private" ]] || { printf 'BLOCKED: private test parent is a symlink.\n' >&2; exit 2; }
mkdir -p "$ROOT/recovery_private"
TEST_ROOT="$(mktemp -d "$ROOT/recovery_private/.runner-tests-XXXXXXXX")"
DOCKER_BIN="$(command -v docker)"
DOCKER=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY
  -u DOCKER_CERT_PATH "$DOCKER_BIN" --host=unix:///var/run/docker.sock)
SOURCE_RUN="$(od -An -N12 -tx1 /dev/urandom | tr -d ' \n')"
SOURCE_CONTAINER="slams-synthetic-source-$SOURCE_RUN"
cleanup_source() {
  local ownership container_id owner remaining
  if ownership="$("${DOCKER[@]}" inspect --type container \
    --format '{{.Id}} {{ index .Config.Labels "slams.recovery.test" }}' \
    "$SOURCE_CONTAINER" 2>> "$TEST_ROOT/cleanup.log")"; then
    read -r container_id owner <<< "$ownership"
    [[ "$container_id" =~ ^[0-9a-f]{64}$ && "$owner" == "$SOURCE_RUN" ]] || return 1
    "${DOCKER[@]}" rm -fv "$container_id" >> "$TEST_ROOT/cleanup.log" 2>&1 || true
  fi
  remaining="$("${DOCKER[@]}" container ls --all --quiet \
    --filter "name=^/$SOURCE_CONTAINER$" 2>> "$TEST_ROOT/cleanup.log")" || return 1
  [[ -z "$remaining" ]]
}
cleanup() {
  local result=$?
  if ! cleanup_source; then
    printf 'FAIL: synthetic source cleanup could not be confirmed.\n' >&2
    result=1
  fi
  if [[ "$result" == 0 ]]; then rm -rf -- "$TEST_ROOT";
  else printf 'Synthetic diagnostics retained in the owned private test directory.\n' >&2; fi
  exit "$result"
}
trap cleanup EXIT
mkdir -p "$TEST_ROOT/scripts/db" "$TEST_ROOT/recovery_private"
cp "$ROOT/scripts/db/verify-lovable-export-recovery.sh" "$TEST_ROOT/scripts/db/"
RUNNER="$TEST_ROOT/scripts/db/verify-lovable-export-recovery.sh"
PRIVATE="$TEST_ROOT/recovery_private"
FIXTURE="$PRIVATE/synthetic-foundation.sql"

# Auth scaffold is synthetic test infrastructure only. The real runner never
# supplies a fake Auth schema/helper to make an actual export pass.
cat > "$FIXTURE" <<'SQL'
CREATE SCHEMA auth;
CREATE SCHEMA drizzle;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
SQL
for migration in 0000_sprint01b_foundation.sql 0001_validate_actual_unit_progress.sql 0002_curriculum_reviewed_material.sql; do
  cat "$ROOT/drizzle/migrations/$migration" >> "$FIXTURE"
  printf '\n' >> "$FIXTURE"
done
cat >> "$FIXTURE" <<'SQL'
INSERT INTO auth.users VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');
INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection)
  SELECT '00000000-0000-4000-8000-000000000001'::uuid,'Synthetic action','Synthetic note','Synthetic reflection'
  FROM generate_series(1,8);
INSERT INTO public.audition_prep(user_id,data)
  VALUES('00000000-0000-4000-8000-000000000001','{"synthetic":true}');
CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);
INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES
  ('db2e37b4fff52904e009a075655318b69343d11215c79f0f7ec06987a1b51adc',1792801308611),
  ('2d105d575f3b84d1f2dbe93d9d19c558ff050a03847c9921ed029e5585109ff1',1793074008283),
  ('4f2820cfad7fa38e202add86c2b39f3d9273d5c9c5077fb998e57ffc232722a9',1793074036504);
SQL

bash -n "$RUNNER"
ORIGINAL_HASH="$(sha256sum < "$FIXTURE")"
printf 'Synthetic sentinel: must remain unchanged.\n' > "$PRIVATE/sentinel"
SENTINEL_HASH="$(sha256sum < "$PRIVATE/sentinel")"
ln -s "$PRIVATE/sentinel" "$PRIVATE/.restore-last.log"

# Invalid inherited endpoint/TLS settings must be ignored; a non-local Docker
# endpoint could not complete this positive test if pinning were removed.
out="$(DOCKER_HOST=tcp://127.0.0.1:1 DOCKER_CONTEXT=unavailable-recovery-context \
  DOCKER_TLS_VERIFY=1 DOCKER_CERT_PATH=/nonexistent \
  bash "$RUNNER" "$FIXTURE" 2>&1)"
grep -q '^PASS: isolated SQL replay and foundation baseline only' <<< "$out"
grep -q '^auth.users: 3 rows$' <<< "$out"
grep -q '^public.passport_entries: 8 rows$' <<< "$out"
grep -q '^drizzle.__drizzle_migrations: 3 rows$' <<< "$out"
grep -q '^Input SHA-256 verified before and after replay.$' <<< "$out"
[[ "$(sha256sum < "$FIXTURE")" == "$ORIGINAL_HASH" ]]
[[ -L "$PRIVATE/.restore-last.log" && "$(sha256sum < "$PRIVATE/sentinel")" == "$SENTINEL_HASH" ]]
printf 'PASS: unchanged foundation migrations restore; all baseline checks and local endpoint pinning pass.\n'
printf 'PASS: original input checksum and legacy log symlink target remain unchanged.\n'

# Exercise the expected PGDMP path using an actual pg_dump custom archive.
# Only this generated synthetic fixture is mounted into the separate source.
"${DOCKER[@]}" run --detach --pull=never --name "$SOURCE_CONTAINER" \
  --label "slams.recovery.test=$SOURCE_RUN" --network none \
  --security-opt no-new-privileges --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,src=$FIXTURE,dst=/synthetic/input.sql,readonly" \
  postgres:17-alpine > "$PRIVATE/archive-source.log" 2>&1
ready=0
for _ in {1..40}; do
  if "${DOCKER[@]}" exec "$SOURCE_CONTAINER" pg_isready -h 127.0.0.1 -U postgres >> "$PRIVATE/archive-source.log" 2>&1; then
    ready=1; break
  fi
  sleep 1
done
[[ "$ready" == 1 ]]
"${DOCKER[@]}" exec "$SOURCE_CONTAINER" psql -X -v ON_ERROR_STOP=1 -U postgres \
  -c 'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;' \
  >> "$PRIVATE/archive-source.log" 2>&1
"${DOCKER[@]}" exec "$SOURCE_CONTAINER" psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -U postgres -f /synthetic/input.sql >> "$PRIVATE/archive-source.log" 2>&1
"${DOCKER[@]}" exec "$SOURCE_CONTAINER" pg_dump --format=custom -U postgres -d postgres \
  > "$PRIVATE/synthetic-foundation.backup" 2>> "$PRIVATE/archive-source.log"
cleanup_source
archive_hash="$(sha256sum < "$PRIVATE/synthetic-foundation.backup")"
archive_out="$(bash "$RUNNER" "$PRIVATE/synthetic-foundation.backup" 2>&1)"
grep -q '^Detected export mode: archive$' <<< "$archive_out"
grep -q '^PASS: isolated SQL replay and foundation baseline only' <<< "$archive_out"
grep -q '^public.passport_entries: 8 rows$' <<< "$archive_out"
[[ "$(sha256sum < "$PRIVATE/synthetic-foundation.backup")" == "$archive_hash" ]]
if grep -q 'ignored null byte' <<< "$archive_out"; then
  printf 'FAIL: binary format detection emitted a shell warning.\n' >&2
  exit 1
fi
printf 'PASS: real synthetic PGDMP custom archive restores unchanged and cleans its offline containers.\n'

# Simulate a lost run acknowledgement after Docker has actually created and
# started a container. The runner must find its label, remove its verified ID,
# and confirm absence even though docker run reported failure.
mkdir -p "$TEST_ROOT/docker-shim"
cat > "$TEST_ROOT/docker-shim/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${2:-}" == run ]]; then
  previous=''
  for argument in "$@"; do
    if [[ "$previous" == --name ]]; then printf '%s\n' "$argument" > "$SLAMS_TEST_NAME_FILE"; fi
    previous="$argument"
  done
  "$SLAMS_TEST_DOCKER_BIN" "$@"
  exit 1
fi
exec "$SLAMS_TEST_DOCKER_BIN" "$@"
SH
chmod 700 "$TEST_ROOT/docker-shim/docker"
if failed_out="$(PATH="$TEST_ROOT/docker-shim:$PATH" SLAMS_TEST_DOCKER_BIN="$DOCKER_BIN" \
  SLAMS_TEST_NAME_FILE="$PRIVATE/failed-run-name" bash "$RUNNER" "$FIXTURE" 2>&1)"; then
  printf 'FAIL: failed Docker acknowledgement was accepted as successful recovery.\n' >&2
  exit 1
fi
grep -q '^BLOCKED:' <<< "$failed_out"
failed_name="$(cat "$PRIVATE/failed-run-name")"
remaining="$("${DOCKER[@]}" container ls --all --quiet --filter "name=^/$failed_name$")"
[[ -z "$remaining" ]]
printf 'PASS: failed post-create acknowledgement still removes the verified owned container.\n'

expect_blocked() {
  local path="$1" output
  if output="$(bash "$RUNNER" "$path" 2>&1)"; then
    printf 'FAIL: an invalid synthetic fixture was accepted.\n' >&2
    exit 1
  fi
  grep -q '^BLOCKED:' <<< "$output"
  if grep -q 'SYNTHETIC_PRIVATE_ERROR' <<< "$output"; then
    printf 'FAIL: private SQL diagnostics escaped to terminal.\n' >&2
    exit 1
  fi
}

cp "$FIXTURE" "$PRIVATE/missing-table.sql"
printf '\nDROP TABLE public.unit_progress;\n' >> "$PRIVATE/missing-table.sql"
expect_blocked "$PRIVATE/missing-table.sql"
printf 'PASS: missing foundation table fails closed.\n'
head -c 32 "$PRIVATE/synthetic-foundation.backup" > "$PRIVATE/truncated.backup"
expect_blocked "$PRIVATE/truncated.backup"
printf 'PASS: truncated custom-format archive fails closed.\n'
cp "$FIXTURE" "$PRIVATE/bad-ledger.sql"
printf "\nUPDATE drizzle.__drizzle_migrations SET hash='incorrect' WHERE id=2;\n" >> "$PRIVATE/bad-ledger.sql"
expect_blocked "$PRIVATE/bad-ledger.sql"
printf 'PASS: incorrect migration hash fails closed.\n'
cp "$FIXTURE" "$PRIVATE/private-error.sql"
printf "\nDO \$\$ BEGIN RAISE EXCEPTION 'SYNTHETIC_PRIVATE_ERROR'; END; \$\$;\n" >> "$PRIVATE/private-error.sql"
expect_blocked "$PRIVATE/private-error.sql"
printf 'PASS: SQL error details stay in private logs.\n'

ln -s "$FIXTURE" "$PRIVATE/input-link.sql"
expect_blocked "$PRIVATE/input-link.sql"
printf 'PASS: symbolic-link inputs are rejected.\n'
mkdir -p "$TEST_ROOT/symlink-root/scripts/db" "$TEST_ROOT/outside"
cp "$RUNNER" "$TEST_ROOT/symlink-root/scripts/db/"
ln -s "$TEST_ROOT/outside" "$TEST_ROOT/symlink-root/recovery_private"
if bash "$TEST_ROOT/symlink-root/scripts/db/verify-lovable-export-recovery.sh" "$FIXTURE" > "$PRIVATE/symlink-output" 2>&1; then
  printf 'FAIL: symbolic-link private directory was accepted.\n' >&2
  exit 1
fi
[[ -z "$(find "$TEST_ROOT/outside" -mindepth 1 -print -quit)" ]]
printf 'PASS: symbolic-link private directory is rejected before file creation.\n'
printf 'PASS: synthetic offline recovery regression suite; no actual backup was inspected.\n'
