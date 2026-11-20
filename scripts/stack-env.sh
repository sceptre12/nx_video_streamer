#!/usr/bin/env bash
# Creates the git-ignored .env at the repo root with random run-time secrets.
# Never overwrites an existing .env (prints "kept"). Never prints a value.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="${repo_root}/.env"

if [ -e "${env_file}" ]; then
  echo "kept"
  exit 0
fi

# random_str <bytes> <base64|hex>: random string, never logged.
random_str() {
  local bytes="$1" enc="$2"
  if command -v openssl >/dev/null 2>&1; then
    if [ "${enc}" = "hex" ]; then openssl rand -hex "${bytes}"; else openssl rand -base64 "${bytes}" | tr -d '\n'; fi
  else
    if [ "${enc}" = "hex" ]; then
      od -An -N "${bytes}" -tx1 /dev/urandom | tr -d ' \n'
    else
      od -An -N "${bytes}" -tx1 /dev/urandom | tr -d ' \n' | head -c $((bytes * 2))
    fi
  fi
}

umask 077
tmp_file="${env_file}.tmp.$$"
{
  printf 'JWT_SECRET=%s\n' "$(random_str 48 base64)"
  printf 'POSTGRES_USER=%s\n' "nvs"
  printf 'POSTGRES_DB=%s\n' "nvs"
  printf 'POSTGRES_PASSWORD=%s\n' "$(random_str 24 hex)"
  printf 'DEMO_USER1_PASSWORD=%s\n' "$(random_str 18 hex)"
  printf 'DEMO_USER2_PASSWORD=%s\n' "$(random_str 18 hex)"
} > "${tmp_file}"
mv -n "${tmp_file}" "${env_file}"

echo "created .env with keys: JWT_SECRET POSTGRES_USER POSTGRES_DB POSTGRES_PASSWORD DEMO_USER1_PASSWORD DEMO_USER2_PASSWORD"
