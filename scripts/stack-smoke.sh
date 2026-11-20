#!/usr/bin/env bash
# Stack smoke: builds app1 on the host, brings the compose stack up, and checks
# health, seed, login, library and a ranged stream through the ui container.
# Prints STACK-SMOKE-OK as the last stdout line on success only. Never echoes .env values.
# Docker settings (DOCKER_CONFIG, DOCKER_HOST) come from the caller's inline env;
# they are captured here and applied to docker commands only.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${repo_root}"

dk_config="${DOCKER_CONFIG:-}"
dk_host="${DOCKER_HOST:-}"
unset DOCKER_CONFIG DOCKER_HOST

dk() {
  if [ -n "${dk_host}" ]; then
    DOCKER_CONFIG="${dk_config}" docker -H "${dk_host}" "$@"
  else
    DOCKER_CONFIG="${dk_config}" docker "$@"
  fi
}
# Compose command, decided once here (not per call, and before any subshell use):
# the Docker Compose plugin when it answers, else the standalone docker-compose.
dkc_cmd=(docker-compose)
if DOCKER_CONFIG="${dk_config}" DOCKER_HOST="${dk_host}" docker compose version >/dev/null 2>&1; then
  dkc_cmd=(docker compose)
fi
dkc() {
  DOCKER_CONFIG="${dk_config}" DOCKER_HOST="${dk_host}" "${dkc_cmd[@]}" "$@"
}
fail() { echo "STACK-SMOKE-FAIL: $*" >&2; exit 1; }

bash scripts/stack-env.sh

# Exactly one published port mapping (ui only).
ports="$(grep -c -E '^\s+- "?[$0-9]' docker-compose.yml || true)"
[ "${ports}" = "1" ] || fail "docker-compose.yml has ${ports} published port mappings, expected 1"

npx --no-install nx build app1

dkc build
# --wait treats an exited one-shot as a failure, so the long-running services are
# waited on here and the one-shot seed is started and checked separately below.
dkc up -d --wait --wait-timeout 180 postgres redis db-server app-server ui
dkc up -d seed

# Long-running services healthy.
for svc in postgres redis db-server app-server ui; do
  cid="$(dkc ps -q "${svc}")"
  [ -n "${cid}" ] || fail "service ${svc} has no container"
  health="$(dk inspect -f '{{.State.Health.Status}}' "${cid}")"
  [ "${health}" = "healthy" ] || fail "service ${svc} is ${health}"
done

# Seed exited 0 (wait up to 120 s).
seed_cid="$(dkc ps -a -q seed)"
[ -n "${seed_cid}" ] || fail "seed container missing"
seed_state=""
for _ in $(seq 1 60); do
  seed_state="$(dk inspect -f '{{.State.Status}} {{.State.ExitCode}}' "${seed_cid}")"
  case "${seed_state}" in
    "exited 0") break ;;
    exited*) fail "seed ${seed_state}" ;;
  esac
  sleep 2
done
[ "${seed_state}" = "exited 0" ] || fail "seed did not exit 0 (${seed_state})"

port="${UI_HOST_PORT:-36000}"
base="http://localhost:${port}"
work="$(mktemp -d)"
jar="${work}/cookies.txt"

pw="$(grep -E '^DEMO_USER1_PASSWORD=' .env | head -n 1 | cut -d= -f2-)"
[ -n "${pw}" ] || fail "DEMO_USER1_PASSWORD missing from .env"

# Login as demo1 (body goes over stdin, not argv).
code="$(printf '{"username":"demo1","password":"%s"}' "${pw}" | curl --max-time 10 -s -o /dev/null -w '%{http_code}' \
  -c "${jar}" -H 'Content-Type: application/json' --data-binary @- "${base}/api/v1/auth/login")"
unset pw
[ "${code}" = "200" ] || fail "login answered ${code}, expected 200"

# Library.
lib_body="${work}/library.json"
code="$(curl --max-time 10 -s -o "${lib_body}" -w '%{http_code}' -b "${jar}" "${base}/api/v1/library")"
[ "${code}" = "200" ] || fail "library answered ${code}, expected 200"

stream_path="$(grep -o '"stream_url":"[^"]*"' "${lib_body}" | head -n 1 | cut -d'"' -f4)"
[ -n "${stream_path}" ] || fail "library has no stream_url for demo1"

# Ranged stream request answers 206.
code="$(curl --max-time 10 -s -o /dev/null -w '%{http_code}' -b "${jar}" -H 'Range: bytes=0-99' "${base}${stream_path}")"
[ "${code}" = "206" ] || fail "stream with Range answered ${code}, expected 206"

echo "STACK-SMOKE-OK"
