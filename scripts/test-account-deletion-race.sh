#!/usr/bin/env bash
# Disposable PostgreSQL ONLY; no remote URLs, credentials, ports or host networking.
# Proves SQL transaction ordering, not managed Storage HTTP upload behavior.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_cmd=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
container="slams-deletion-race-$$"
logs=$(mktemp -d /tmp/slams-deletion-race.XXXXXX)
cleanup() {
  "${docker_cmd[@]}" rm -fv "$container" >/dev/null 2>&1 || true
  rm -rf "$logs"
}
trap cleanup EXIT
"${docker_cmd[@]}" run --detach --name "$container" --network none \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,src=$PWD/drizzle/migrations,dst=/audit/migrations,readonly" \
  --mount "type=bind,src=$PWD/scripts/rls.sql,dst=/audit/rls.sql,readonly" \
  --mount "type=bind,src=$PWD/scripts/rls-actor-work.sql,dst=/audit/rls-actor-work.sql,readonly" \
  --mount "type=bind,src=$PWD/scripts/rls-actor-continuity.sql,dst=/audit/rls-actor-continuity.sql,readonly" \
  postgres:17-alpine >/dev/null
ready=false
for _ in {1..30}; do
  if "${docker_cmd[@]}" exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [ "$ready" != true ]; then
  "${docker_cmd[@]}" logs "$container"
  exit 1
fi
psql_run() {
  "${docker_cmd[@]}" exec -i --env "PGAPPNAME=$1" "$container" \
    psql -X -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 "${@:2}"
}
if ! psql_run race_setup -f /audit/rls.sql -f /audit/rls-actor-work.sql -f /audit/rls-actor-continuity.sql >"$logs/setup" 2>&1; then
  cat "$logs/setup"
  exit 1
fi
wait_for_activity() {
  local app="$1" event="$2" found
  for _ in {1..60}; do
    found=$(psql_run race_observer -Atc "SELECT count(*) FROM pg_stat_activity WHERE application_name='$app' AND wait_event='$event'")
    if [ "$found" = 1 ]; then return; fi
    sleep 0.05
  done
  echo "Expected $app to wait on $event" >&2
  cat "$logs"/* >&2
  exit 1
}
psql_run race_setup <<'SQL' >"$logs/seed" 2>&1
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-4000-8000-000000000031'),
 ('00000000-0000-4000-8000-000000000032'),
 ('00000000-0000-4000-8000-000000000033');
SQL

# A request authorized before deletion holds the same transaction lock. The
# pending marker must wait, then cleanup must include the committed owned rows.
psql_run prior_writer <<'SQL' >"$logs/prior_writer" 2>&1 &
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000031';
INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection)
 VALUES(auth.uid(),'Race test','Observed prior write','Disposable');
INSERT INTO storage.objects(bucket_id,name)
 VALUES('actor-script-sources',auth.uid()::text||'/prior.txt');
SELECT pg_sleep(4);
COMMIT;
SQL
prior_pid=$!
wait_for_activity prior_writer PgSleep
psql_run prior_deletion <<'SQL' >"$logs/prior_deletion" 2>&1 &
SET ROLE service_role;
INSERT INTO public.account_deletion_jobs(user_id,status)
 VALUES('00000000-0000-4000-8000-000000000031','pending');
DELETE FROM storage.objects WHERE name LIKE '00000000-0000-4000-8000-000000000031/%';
DELETE FROM public.passport_entries WHERE user_id='00000000-0000-4000-8000-000000000031';
RESET ROLE;
DELETE FROM auth.users WHERE id='00000000-0000-4000-8000-000000000031';
SELECT public.audit_assert(NOT EXISTS(SELECT 1 FROM public.passport_entries WHERE user_id='00000000-0000-4000-8000-000000000031'),'Prior Passport write was cleaned');
SELECT public.audit_assert(NOT EXISTS(SELECT 1 FROM storage.objects WHERE name LIKE '00000000-0000-4000-8000-000000000031/%'),'Prior source metadata was cleaned');
SQL
delete_pid=$!
wait_for_activity prior_deletion advisory
if ! wait "$prior_pid" || ! wait "$delete_pid"; then
  cat "$logs/prior_writer" "$logs/prior_deletion"
  exit 1
fi

# Writers with snapshots taken before the pending marker commits queue behind
# it. Their VOLATILE guard must refresh state after the lock and reject them.
psql_run pending_marker <<'SQL' >"$logs/pending_marker" 2>&1 &
BEGIN;
SET LOCAL ROLE service_role;
INSERT INTO public.account_deletion_jobs(user_id,status)
 VALUES('00000000-0000-4000-8000-000000000032','pending');
SELECT pg_sleep(4);
COMMIT;
SQL
marker_pid=$!
wait_for_activity pending_marker PgSleep
psql_run queued_passport <<'SQL' >"$logs/queued_passport" 2>&1 &
SET ROLE authenticated;
SET request.jwt.claim.sub='00000000-0000-4000-8000-000000000032';
SELECT public.audit_denied($q$INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection) VALUES(auth.uid(),'Queued','Must fail','Disposable')$q$,'42501');
SQL
passport_pid=$!
psql_run queued_source <<'SQL' >"$logs/queued_source" 2>&1 &
SET ROLE authenticated;
SET request.jwt.claim.sub='00000000-0000-4000-8000-000000000032';
SELECT public.audit_denied($q$INSERT INTO storage.objects(bucket_id,name) VALUES('actor-script-sources',auth.uid()::text||'/queued.txt')$q$,'42501');
SQL
source_pid=$!
wait_for_activity queued_passport advisory
wait_for_activity queued_source advisory
if ! wait "$marker_pid" || ! wait "$passport_pid" || ! wait "$source_pid"; then
  cat "$logs/pending_marker" "$logs/queued_passport" "$logs/queued_source"
  exit 1
fi
psql_run race_assert <<'SQL' >"$logs/assert" 2>&1
SELECT public.audit_assert(NOT EXISTS(SELECT 1 FROM public.passport_entries WHERE user_id='00000000-0000-4000-8000-000000000032'),'Queued Passport write was rejected');
SELECT public.audit_assert(NOT EXISTS(SELECT 1 FROM storage.objects WHERE name LIKE '00000000-0000-4000-8000-000000000032/%'),'Queued source metadata was rejected');
BEGIN ISOLATION LEVEL REPEATABLE READ;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000033';
SELECT public.audit_denied($q$INSERT INTO public.passport_entries(user_id,tactic,intervention,reflection) VALUES(auth.uid(),'Old snapshot','Must fail','Disposable')$q$,'42501');
ROLLBACK;
SQL
echo 'DISPOSABLE account deletion race audit passed: prior writers drain; queued Passport and source writes fail after pending commits; older-isolation writes fail closed. Managed Storage HTTP behavior remains unproven.'
