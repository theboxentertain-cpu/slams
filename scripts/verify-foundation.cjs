/* Optional signed-out Chromium regression; no backend writes or published fixtures. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-foundation-verification";
fs.mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
function check(value, label) {
  assert.ok(value, label);
  checks.push(label);
}
const pages = [
  ["/conservatory", ["All Schools", "In Progress", "Completed"]],
  ["/conservatory/meisner", ["Overview", "Curriculum", "Practice", "Assessments", "Progress"]],
  ["/rehearsal", ["My Scenes", "New Scene", "Sessions"]],
  ["/work", ["Auditions", "Projects", "Characters", "Self-Tapes"]],
  ["/work/audition", ["Brief", "Script", "Character", "Preparation"]],
  ["/work/character", ["Biography", "Relationships", "Objectives", "Behavior", "Notes"]],
  ["/work/breakdown", ["Beats", "Objectives", "Obstacles", "Tactics"]],
  ["/work/self-tape", ["Setup", "Takes", "Review", "Export"]],
  ["/work/journal", ["Scenes", "Notes", "History"]],
  ["/stuck", ["Describe", "Scene", "Identify"]],
  ["/stuck/diagnosis", ["Observations", "Possible Causes"]],
  ["/stuck/intervention", ["Technique Options", "Instructions"]],
  ["/stuck/retry", ["First Attempt", "New Attempt", "Compare"]],
  ["/stuck/saved", ["History", "Useful Exercises"]],
  ["/baseline", ["Prepare", "Perform", "Reflect", "Next Steps"]],
  ["/lab", ["Takes", "Compare", "Notes"]],
  ["/matrix", ["Compare", "Apply", "Cautions"]],
  ["/lounge", ["Sessions", "Partners", "Shared Scenes"]],
  ["/passport", ["Journey", "Evidence", "Portfolio", "Badges"]],
  ["/progress", ["By School", "By Skill", "History"]],
  ["/settings", ["Account", "Privacy", "Language", "Accessibility"]],
];
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SLAMS_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    async function go(route) {
      console.log("Checking " + route);
      await page.goto(base + route, { waitUntil: "networkidle" });
    }
    for (const [route, tabs] of pages) {
      await go(route);
      check(
        (await page.locator("main h1").count()) === 1,
        `${route} directly renders one page heading`,
      );
      const nav = page.getByRole("navigation", { name: "Main studio navigation" });
      check(
        (await nav.count()) === 1 && (await nav.getByRole("link").count()) === 5,
        `${route} has exactly one five-item navigation`,
      );
      check(
        (await page.getByRole("tab").allTextContents()).join("|") === tabs.join("|"),
        `${route} has directive tabs in order`,
      );
      for (const label of [...tabs.slice(1), tabs[0]]) {
        await page.getByRole("tab", { name: label, exact: true }).click();
        await page.getByRole("tab", { name: label, exact: true, selected: true }).waitFor();
        const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await page.waitForURL((url) => url.searchParams.get("tab") === key);
        check(
          (await page.getByRole("tabpanel").count()) === 1,
          `${route}/${key} is URL-addressable with one active pane`,
        );
      }
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} stays within portrait width`,
      );
    }
    await go("/work/audition?tab=preparation");
    await page.getByLabel("Role & project").fill("Unsaved browser tab regression");
    await page.getByRole("tab", { name: "Brief", exact: true }).click();
    await page.getByRole("tab", { name: "Preparation", exact: true }).click();
    check(
      (await page.getByLabel("Role & project").inputValue()) === "Unsaved browser tab regression",
      "Unsaved audition preparation survives section changes",
    );
    await go("/work/character?tab=notes");
    await page.getByRole("tab", { name: "Biography", exact: true }).click();
    await page.goBack();
    await page.getByRole("tab", { name: "Notes", exact: true, selected: true }).waitFor();
    check(true, "Browser Back restores tab state");
    await go("/conservatory/meisner?tab=not-a-section");
    check(
      (await page.getByRole("tab", { name: "Overview", selected: true }).count()) === 1,
      "Invalid tab falls back safely",
    );
    for (const slug of [
      "stanislavski",
      "meisner",
      "adler",
      "practical-aesthetics",
      "chekhov",
      "laban",
      "strasberg",
      "viewpoints",
    ]) {
      await go("/conservatory/" + slug + "?tab=curriculum");
      check(
        (await page.locator('main a[href*="/years/"]').count()) > 0,
        `${slug} retains real year and term navigation without cloud content`,
      );
    }
    await go("/conservatory/meisner/years/1");
    await page.getByRole("link", { name: "Term 1", exact: true }).click();
    await page.getByRole("heading", { name: /Meisner · Term 1/ }).waitFor();
    check(true, "Canonical year-to-term navigation works");
    await page.getByRole("link", { name: "← Year 1" }).click();
    check(
      new URL(page.url()).pathname === "/conservatory/meisner/years/1",
      "Direct term has a functioning parent link",
    );
    for (const route of [
      "/conservatory/unknown",
      "/conservatory/meisner/years/99",
      "/conservatory/meisner/years/1/terms/99",
      "/conservatory/meisner/units/nonsense/not-an-id",
    ]) {
      await go(route);
      check(
        (await page.getByRole("heading", { name: "Page not found" }).count()) === 1,
        `Invalid hierarchy rejected: ${route}`,
      );
      check(
        (await page.locator("#page-content").count()) === 1,
        `Error route retains a skip-link target: ${route}`,
      );
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter");
      check(
        await page.locator("#page-content").evaluate((n) => n === document.activeElement),
        `Skip link focuses error content: ${route}`,
      );
    }
    await go("/");
    await page.getByRole("button", { name: "Open profile menu" }).click();
    check(
      (await page.getByRole("menuitem").count()) === 9,
      "Profile menu exposes all supporting/account destinations",
    );
    await page.keyboard.press("Escape");
    check(
      await page
        .getByRole("button", { name: "Open profile menu" })
        .evaluate((n) => n === document.activeElement),
      "Profile menu restores keyboard focus",
    );
    await go("/settings?tab=accessibility");
    await page.getByRole("button", { name: "Motion on", exact: true }).click();
    await page.getByRole("button", { name: "Office interaction sound off" }).click();
    await page
      .getByRole("navigation", { name: "Main studio navigation" })
      .getByRole("link", { name: "Office", exact: true })
      .click();
    check(
      (await page.locator(".office-shell").getAttribute("data-motion")) === "off",
      "Settings motion preference updates the office",
    );
    await page.getByRole("button", { name: "Office preferences" }).click();
    check(
      (await page
        .getByRole("button", { name: "Sound on", exact: true })
        .getAttribute("aria-pressed")) === "true",
      "Settings and office share the existing sound preference",
    );
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page.locator(".app-shell").getAttribute("data-motion")) === "off",
      "Global motion preference survives reload",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    check(
      (await page.locator(".app-shell").getAttribute("data-motion")) === "off",
      "Global shell honors reduced motion",
    );
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 });
      for (const route of [
        "/",
        "/conservatory",
        "/settings?tab=accessibility",
        "/work/audition?tab=preparation",
      ]) {
        await go(route);
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${route}: no overflow at ${width}px`,
        );
        check(
          await page.locator(".primary-navigation a").evaluateAll((nodes) =>
            nodes.every((n) => {
              const r = n.getBoundingClientRect();
              return r.width >= 48 && r.height >= 48;
            }),
          ),
          `${route}: primary targets >=48px at ${width}px`,
        );
      }
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await go("/settings?tab=accessibility");
    await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    await page.waitForFunction(
      () =>
        parseFloat(getComputedStyle(document.querySelector(".app-shell")).paddingBottom) >=
        document.querySelector(".primary-navigation").getBoundingClientRect().height,
    );
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "200% root text size has no horizontal overflow",
    );
    check(true, "Content reserves measured navigation height with enlarged text");
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [route, name] of [
      ["/", "office"],
      ["/conservatory", "schools"],
      ["/conservatory/meisner?tab=curriculum", "school"],
      ["/rehearsal", "rehearsal"],
      ["/work", "work"],
      ["/stuck", "stuck"],
      ["/settings?tab=accessibility", "settings"],
      ["/progress", "progress"],
    ]) {
      await go(route);
      await page.screenshot({ path: path.join(out, name + "-mobile.png"), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go("/");
    await page.screenshot({ path: path.join(out, "office-desktop.png"), fullPage: true });
    check(errors.length === 0, "No uncaught page errors in foundation browser checks");
    fs.writeFileSync(
      path.join(out, "foundation-results.json"),
      JSON.stringify(
        {
          base,
          checks: checks.length,
          passed: checks,
          uncaughtPageErrors: errors,
          browser: await browser.version(),
          limitations: [
            "Signed-out Chromium; no live account/backend writes.",
            "Android dimensions and root text scaling are emulation, not physical Android/TalkBack.",
            "No recording, Arabic or unpublished teaching content is claimed.",
          ],
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({ passed: checks.length, uncaughtPageErrors: errors.length, artifacts: out }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
