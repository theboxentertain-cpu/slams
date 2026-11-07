#!/usr/bin/env bash
# CI-only dry run with synthetic, non-user data and the same offline Docker path.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p recovery_private
fixture="$(mktemp "$PWD/recovery_private/slams-synthetic-XXXXXX.sql")"
cleanup() {
  rm -f "$fixture" "$PWD/recovery_private/.restore-last.log"
}
trap cleanup EXIT

cat > "$fixture" <<'SQL'
CREATE SCHEMA auth;
CREATE SCHEMA drizzle;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
INSERT INTO auth.users SELECT gen_random_uuid() FROM generate_series(1,3);
CREATE TABLE public.profiles (id UUID PRIMARY KEY);
INSERT INTO public.profiles SELECT id FROM auth.users;
CREATE TABLE public.passport_entries (id integer PRIMARY KEY);
INSERT INTO public.passport_entries SELECT n FROM generate_series(1,8) AS n;
CREATE TABLE public.audition_prep (id integer PRIMARY KEY);
INSERT INTO public.audition_prep VALUES (1);
CREATE TABLE public.schools (id integer PRIMARY KEY);
INSERT INTO public.schools SELECT n FROM generate_series(1,8) AS n;
CREATE TABLE public.curriculum_terms (id integer PRIMARY KEY);
INSERT INTO public.curriculum_terms SELECT n FROM generate_series(1,36) AS n;
CREATE TABLE drizzle.__drizzle_migrations (id integer PRIMARY KEY);
INSERT INTO drizzle.__drizzle_migrations SELECT n FROM generate_series(1,3) AS n;
SQL

bash -n scripts/db/verify-lovable-export-recovery.sh
out="$(bash scripts/db/verify-lovable-export-recovery.sh "$fixture")"
printf '%s\n' "$out"
grep -q '^PASS: private export restored' <<< "$out"
grep -q '^auth.users: 3 rows$' <<< "$out"
grep -q '^public.passport_entries: 8 rows$' <<< "$out"
grep -q '^drizzle.__drizzle_migrations: 3 rows$' <<< "$out"
printf 'PASS: synthetic offline backup-recovery harness.\n'
