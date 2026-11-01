#!/usr/bin/env bash
# Never connects to a supplied URL: all changes are confined to a fresh container.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_cmd=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
container="slams-account-deletion-$$"
guard_log="$(mktemp /tmp/slams-deletion-guard.XXXXXX)"
trap '"${docker_cmd[@]}" rm -fv "$container" >/dev/null 2>&1 || true; rm -f "$guard_log"' EXIT
"${docker_cmd[@]}" run --detach --name "$container" --network none \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,src=$PWD/drizzle/migrations,dst=/audit/migrations,readonly" \
  --mount "type=bind,src=$PWD/ops/proposals/account-deletion,dst=/audit/proposals,readonly" \
  --mount "type=bind,src=$PWD/scripts,dst=/audit/scripts,readonly" \
  --mount "type=bind,src=$PWD/scripts/rls.sql,dst=/audit/rls.sql,readonly" \
  postgres:17-alpine >/dev/null
ready=false
for _ in {1..30}; do
  # The image's temporary initialization server accepts Unix sockets before it
  # restarts. TCP readiness waits for the final server instead of racing it.
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
"${docker_cmd[@]}" exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -f /audit/rls.sql
# Both scripts must refuse execution with no explicit phase-specific opt-in.
for phase in 01-prevent-orphans 02-quarantine-and-validate; do
  if "${docker_cmd[@]}" exec "$container" psql -U postgres -v ON_ERROR_STOP=1 \
    -f "/audit/proposals/$phase.sql" >"$guard_log" 2>&1; then
    echo "ERROR: $phase unexpectedly ran without approval" >&2
    exit 1
  fi
  if ! rg -q 'Requires manual .* approval' "$guard_log"; then
    cat "$guard_log" >&2
    exit 1
  fi
done
"${docker_cmd[@]}" exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -f /audit/scripts/account-deletion.sql
