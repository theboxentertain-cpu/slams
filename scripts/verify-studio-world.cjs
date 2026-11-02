/* Actual signed-out browser verification; no live account, fake curriculum or cloud writes. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-studio-world";
fs.mkdirSync(out, { recursive: true });
const passed = [],
  errors = [];
function check(value, label) {
  assert.ok(value, label);
  passed.push(label);
}
const pages = [
  ["/conservatory", "conservatory"],
  ["/conservatory/meisner", "school"],
  ["/conservatory/meisner/years/1/terms/1", "term"],
  ["/rehearsal", "rehearsal"],
  ["/scene", "scene"],
  ["/work", "work"],
  ["/work/audition", "audition"],
  ["/stuck", "stuck"],
  ["/passport", "passport"],
  ["/progress", "progress"],
  ["/matrix", "matrix"],
  ["/settings", "settings"],
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
    await context.addCookies([{ name: "slams_studio_entered", value: "1", url: base }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    page.on("pageerror", (error) => errors.push(error.message));
    const shot = async (name) => {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
    };
    await page.goto(base, { waitUntil: "networkidle" });
    // SSR deliberately renders the unresolved account state. Wait for the existing
    // session and local-record effects instead of assuming network idle means hydration.
    await page.getByText("Guest actor", { exact: true }).waitFor();
    await page.locator(".office-journey").getByText("0", { exact: true }).waitFor();
    check(
      (await page.getByText("Guest actor", { exact: true }).count()) === 1,
      "Guest profile does not copy the reference's example identity",
    );
    check(
      await page
        .locator(".office-journey dd")
        .allTextContents()
        .then((v) => v.join(",") === "0,—"),
      "Journey distinguishes loaded zero from unknown cloud milestones",
    );
    check(
      !/\d+%/.test(await page.locator(".office-journey").innerText()),
      "Journey does not invent a curriculum completion percentage",
    );
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 699 ? 1000 : 844 });
      for (const [view, name] of [
        ["The desk", "desk"],
        ["Work wall", "wall"],
        ["Rehearsal corner", "corner"],
      ]) {
        console.log(`Office ${name}: ${width}px`);
        await page.getByRole("tab", { name: new RegExp(view) }).click();
        await page.locator(`#office-panel-${name}`).waitFor({ state: "visible" });
        await page.waitForFunction(() => !document.querySelector(".office-loading"));
        await page
          .locator(".office-world")
          .evaluate(async (n) =>
            Promise.all(n.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))),
          );
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name}: no horizontal overflow at ${width}px`,
        );
        const objects = page.locator(
          ".office-world .office-object:visible,.office-world .reference-rehearsal-sign:visible,.office-world .desk-casting-sign:visible,.office-world .wall-progress-sheet:visible,.office-world .wall-scene-notes:visible,.office-world .bad-acting-wall:visible,.office-world .corner-stage-link:visible",
        );
        for (let i = 0; i < (await objects.count()); i++) {
          const object = objects.nth(i);
          await object.scrollIntoViewIfNeeded();
          const result = await object.evaluate((n) => {
            const r = n.getBoundingClientRect();
            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return {
              large: r.width >= 43 && r.height >= 43,
              hit: n === hit || n.contains(hit),
              name: n.getAttribute("aria-label") || n.textContent.trim().slice(0, 50),
            };
          });
          check(result.large, `${name}/${result.name}: touch target at ${width}px`);
          check(result.hit, `${name}/${result.name}: center unobstructed at ${width}px`);
        }
        if (width === 390 || width === 1440)
          await shot(`${name}-${width === 390 ? "mobile" : "desktop"}`);
      }
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 699 ? 1000 : 844 });
      for (const [route, name] of pages) {
        console.log(`${route}: ${width}px`);
        await page.goto(base + route, { waitUntil: "networkidle" });
        check((await page.locator("main h1").count()) === 1, `${name}: real heading at ${width}px`);
        check(
          (await page.locator(".studio-page .studio-heading").count()) === 1,
          `${name}: shared illustrated world at ${width}px`,
        );
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name}: no horizontal overflow at ${width}px`,
        );
        check(
          (await page
            .getByRole("navigation", { name: "Main studio navigation" })
            .getByRole("link")
            .count()) === 5,
          `${name}: one five-route studio bar at ${width}px`,
        );
        if (width === 390 || width === 1440)
          await shot(`${name}-${width === 390 ? "mobile" : "desktop"}`);
      }
    }
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
      await page.goto(base + "/conservatory/" + slug, { waitUntil: "networkidle" });
      check(
        (await page.locator(".studio-page").getAttribute("data-school")) === slug,
        `${slug}: actual school identity retained`,
      );
      check(
        (await page.locator(".studio-heading-book .school-book").count()) === 1,
        `${slug}: matching original book in chapter heading`,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base + "/conservatory", { waitUntil: "networkidle" });
    await page.evaluate(() => (document.documentElement.style.fontSize = "24px"));
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "Conservatory stays readable at enlarged text size",
    );
    check(
      (await page.locator(".school-selector > li").count()) === 8,
      "All eight school entrances remain present",
    );
    check(
      await page
        .locator(".studio-page")
        .evaluate((n) => n.getAnimations({ subtree: true }).length === 0),
      "Reduced motion disables shared-world animation",
    );
    await page.evaluate(() => document.documentElement.style.removeProperty("font-size"));
    check(errors.length === 0, "No uncaught browser errors");
    const result = {
      base,
      checks: passed.length,
      passed,
      uncaughtPageErrors: errors,
      browser: browser.version(),
      limitations: [
        "Isolated guest contexts; no live account, cloud persistence, email or deployed RLS verification.",
        "Unavailable curriculum and tools remain disclosed; no example lessons, grades or scores added.",
        "Chromium emulation is not physical Android or TalkBack.",
      ],
    };
    fs.writeFileSync(path.join(out, "studio-world-results.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ checks: passed.length, uncaughtPageErrors: errors }));
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
