import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Recorded from the actual Lovable Cloud SLAMS Drizzle ledger on 2026-11-07.
// These reflect deployed migrations, not proposed journal entries.
const appliedMigrations = [
  {
    tag: "0000_sprint01b_foundation",
    hash: "db2e37b4fff52904e009a075655318b69343d11215c79f0f7ec06987a1b51adc",
  },
  {
    tag: "0001_validate_actual_unit_progress",
    hash: "2d105d575f3b84d1f2dbe93d9d19c558ff050a03847c9921ed029e5585109ff1",
  },
  {
    tag: "0002_curriculum_reviewed_material",
    hash: "4f2820cfad7fa38e202add86c2b39f3d9273d5c9c5077fb998e57ffc232722a9",
  },
] as const;

describe("SLAMS deployed migration file integrity", () => {
  it.each(appliedMigrations)(
    "keeps the applied $tag SQL unchanged from its live ledger hash",
    ({ tag, hash }) => {
      const sql = readFileSync(
        new URL(`../../drizzle/migrations/${tag}.sql`, import.meta.url),
      );
      expect(createHash("sha256").update(sql).digest("hex")).toBe(hash);
    },
  );
});
