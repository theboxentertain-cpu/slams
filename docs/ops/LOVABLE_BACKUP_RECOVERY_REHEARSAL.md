# SLAMS — Private Lovable SQL backup recovery rehearsal

**Purpose:** Establish whether the independently downloaded database export can
be replayed in a disposable PostgreSQL environment. This is NOT a production
restore and NOT a Supabase Auth/Storage disaster-recovery test.

## Safe boundaries

- Existing Lovable Cloud database ref `edrchrzqsrfrlcfbnxhs` is **production**.
  Never restore into it during verification.
- Separate Supabase ref `bfoukjcissyardeokfev` is **staging** with the Actor
  at Work migration/security test fixtures. Never restore over it.
- This runner creates an **ephemeral PostgreSQL 17-alpine container with
  `--network none`**, mounting only the downloaded file read-only.
  There are no remote database URLs, credentials or live API requests.
- The script uses `psql -X -v ON_ERROR_STOP=1 --single-transaction` for
  actual plain SQL, or `pg_restore --single-transaction --exit-on-error` when
  the magic bytes identify a PostgreSQL custom-format archive.
- SQL output/errors go to `recovery_private/.restore-last.log` with private
  permissions. The terminal displays only aggregate counts or generic blockers.
- The Docker container is destroyed on exit even after failure.
- `recovery_private/` is gitignored. **Do not put the backup in a
  tracked folder, GitHub issue, PR, Actions artifact or chat attachment.**
  Codespaces is a third-party cloud development environment; the user's
  private backup must only be uploaded there with their explicit knowledge.

## One-time user step on Android

The assistant cannot access the file in Android Downloads or directly control
the user's Codespace. In the Codespaces Explorer, create/open
`/workspaces/slams/recovery_private/`; use **Upload Files** on that directory
to upload the downloaded SQL file. Do not commit it.

## Run (Codespaces terminal)

```bash
cd /workspaces/slams
git pull --ff-only
bash scripts/db/verify-lovable-export-recovery.sh
```

The script automatically detects one `.sql`, `.backup` or `.dump` file
inside `recovery_private`. If there are multiple, pass the intended private
path explicitly. It refuses to read from anywhere else.

## Interpretation

- **PASS:** Plain SQL/custom-format archive replay succeeded against isolated
  vanilla PostgreSQL 17; expected `auth.users`, foundation public tables and
  Drizzle migration ledger are readable. The script prints only row counts.
- **BLOCKED / failure:** See the log *locally* in the private folder. Export
  may depend on Supabase-managed extensions, system objects, schemas or roles
  missing from vanilla PostgreSQL. **A vanilla-Postgres incompatibility does not
  prove the backup is damaged.** No production data were modified.
- Regardless of PASS, a separate **Supabase-native environment restore
  rehearsal and functional Auth/Storage tests** remain necessary before a
  complete disaster-recovery claim or production migration release.

## Reference read-only Lovable counts (2026-11-07)

| Object | Live rows |
| --- | ---: |
| `auth.users` | 3 |
| `public.profiles` | 3 |
| `public.passport_entries` | 8 |
| `public.audition_prep` | 1 |
| `public.schools` | 8 |
| `public.curriculum_terms` | 36 |
| `drizzle.__drizzle_migrations` | 3 |

The actual snapshot may be older than the inventory and therefore differ.
Never infer failure solely from a modest count difference.
