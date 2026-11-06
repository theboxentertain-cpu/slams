import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** Static guards only. Real Android browser checks are still required. */
const css = readFileSync(resolve(process.cwd(), "src/foundation.css"), "utf8");

describe("Arabic visual baseline contracts", () => {
  it("places back navigation and the language switch on opposite edges in RTL", () => {
    expect(css).toMatch(
      /:root\[dir="rtl"\] \.welcome-back\s*\{[^}]*right:\s*6px/s,
    );
    expect(css).toMatch(
      /:root\[dir="rtl"\] \.welcome-language-control\s*\{[^}]*right:\s*auto;[^}]*left:\s*10px/s,
    );
  });

  it("uses Arabic-readable headline typography instead of the Latin-only script font", () => {
    expect(css).toMatch(
      /:root\[dir="rtl"\] \.welcome-tagline,[\s\S]*?font-family:\s*"Noto Sans Arabic"/,
    );
    expect(css).toMatch(
      /:root\[dir="rtl"\] \.office-premium \.office-tagline,[\s\S]*?white-space:\s*normal/,
    );
  });

  it("keeps sensitive structured inputs LTR and language targets at least 44px high", () => {
    expect(css).toMatch(
      /:root\[dir="rtl"\] :is\(input\[type="email"\], input\[type="password"\][^}]*direction:\s*ltr/s,
    );
    expect(css).toMatch(/\.language-switch button\s*\{\s*min-height:\s*44px/s);
  });
});
