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
- SQL output/errors go to a unique `recovery_private/.restore-*.log` with private
  permissions. The terminal displays only aggregate counts or generic blockers.
- The Docker container is destroyed on exit even after failure.
- `recovery_private/` is gitignored. **Do not put the backup in a
  tracked folder, GitHub issue, PR, Actions artifact or chat attachment.**
  Codespaces is a third-party cloud development environment; the user's
  private backup must only be uploaded there with their explicit knowledge.

## Obtain the actual private export

Use the original SLAMS Lovable project and its supported private export/download
operation. Keep the export in the operator's approved private recovery location;
the assistant can run verification once the actual file is available there.
No new backend or Codespace is required. A file that exists only in Android
Downloads is not accessible to this executor without an approved private transfer.
Do not put export bytes, authentication records or download credentials in source
control, public links, CI artifacts or chat text.

The connector can report private export metadata without providing a supported
download operation. If the actual file cannot be retrieved, mark recovery
BLOCKED and resolve the native owner access or approved private transfer first.
Object creation/upload time is not necessarily database snapshot time. Metadata
alone is not recovery proof.

## Run in the authorized private executor

```bash
bash scripts/db/verify-lovable-export-recovery.sh
```

The script automatically detects one `.sql`, `.backup` or `.dump` file
inside `recovery_private`. If there are multiple, pass the intended private
path explicitly. It refuses to read from anywhere else.

## Interpretation

- **PASS (limited):** Plain SQL/custom-format archive replay succeeded against
  isolated vanilla PostgreSQL 17; minimum foundation checks cover 13 RLS tables,
  24 policies, three trigger-function signatures/configuration, seven triggers,
  and the exact three deployed migration hashes. The input SHA-256 matches
  before and after replay. Policy counts/signatures do not prove their bodies,
  full catalog equality or real-user privacy. The script prints aggregate counts.
- **BLOCKED / failure:** See the unique log *locally* in the private folder. Export
  may depend on Supabase-managed extensions, system objects, schemas or roles
  missing from vanilla PostgreSQL. **A vanilla-Postgres incompatibility does not
  prove the backup is damaged.** No production data were modified.
- Regardless of PASS, a separate **Supabase-native environment restore
  rehearsal and functional Auth/Storage tests** remain necessary before a
  complete disaster-recovery claim or production migration release.

## Required evidence beyond SQL replay

Keep the original file unchanged and record its private provenance, byte size,
SHA-256 and snapshot time. Verify that checksum again after replay. Restore with
stop-on-error; do not remove failing SQL or manufacture missing managed schemas
to obtain a pass. Missing dependencies require the supported native environment.

Compare the restored foundation with its snapshot-time schema/manifest: all 13
public tables, columns/defaults/types, constraints and validation flags, indexes,
owners, grants, RLS policies, functions, triggers and the exact three deployed
migration hashes. Verify every exported table and legacy owner/hierarchy links.
Current live counts and server-side canonical hashes are comparison references;
the candidate object's creation time predates them, but the export's actual
snapshot time remains unverified. Changes after the snapshot must be reconciled.

Test owner saves, cross-owner/anonymous denial and trigger guards only in the
isolated copy, with rollback where appropriate. Report SQL replay, full snapshot
parity, actual Auth-service recovery and Storage file-byte recovery separately.
Storage metadata cannot prove that object bytes were backed up or restored.

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
