#!/usr/bin/env bash
# Apply repository migrations only to a disposable, network-isolated database.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_cmd=(env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock)
container="slams-rls-$$"
trap '"${docker_cmd[@]}" rm -fv "$container" >/dev/null 2>&1 || true' EXIT
"${docker_cmd[@]}" run --detach --name "$container" --network none \
  --env POSTGRES_HOST_AUTH_METHOD=trust \
  --mount "type=bind,src=$PWD/drizzle/migrations,dst=/audit/migrations,readonly" \
  --mount "type=bind,src=$PWD/scripts/rls.sql,dst=/audit/rls.sql,readonly" \
  postgres:17-alpine >/dev/null
ready=false
for _ in {1..30}; do
  if "${docker_cmd[@]}" exec "$container" pg_isready -U postgres >/dev/null 2>&1; then
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
