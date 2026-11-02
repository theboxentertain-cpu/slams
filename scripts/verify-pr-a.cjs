/* Architecture acceptance in isolated guest contexts. No live account or backend mutations. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-pr-a-verification";
fs.mkdirSync(out, { recursive: true });
const passed = [],
  errors = [];
function check(value, label) {
  assert.ok(value, label);
  passed.push(label);
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SLAMS_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addCookies([{ name: "slams_studio_entered", value: "1", url: base }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    const go = async (route) => {
      console.log("Checking " + route);
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.locator("main h1").waitFor();
    };
    const shot = async (name) => {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
    };
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 699 ? 1000 : 844 });
      for (const [route, name] of [
        ["/work", "work"],
        ["/stuck", "stuck"],
        ["/lab", "lab"],
        ["/work/character?tab=notes", "character"],
      ]) {
        await go(route);
        check(
          (await page.getByRole("tab").count()) === 0,
          `${name}: no empty navigation tabs at ${width}px`,
        );
        const nav = page.getByRole("navigation", { name: "Main studio navigation" });
        check(
          (await nav.count()) === 1 && (await nav.getByRole("link").count()) === 5,
          `${name}: one five-route navigation at ${width}px`,
        );
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name}: no horizontal overflow at ${width}px`,
        );
        const actions = page.locator("main .studio-action-primary");
        check((await actions.count()) === 1, `${name}: one primary next action at ${width}px`);
        const rect = await actions.boundingBox();
        check(
          rect && rect.width >= 43 && rect.height >= 43,
          `${name}: primary action is at least 44px at ${width}px`,
        );
        if (width === 390 || width === 1440)
          await shot(`${name}-${width === 390 ? "mobile" : "desktop"}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go("/work");
    const statusLink = page.getByRole("link", { name: "View Character File availability" });
    check(!(await statusLink.isVisible()), "Planned tools are outside the default working task");
    await page.getByText("Tools in development", { exact: true }).focus();
    await page.keyboard.press("Enter");
    check(await statusLink.isVisible(), "Keyboard opens the explicit planned-tool disclosure");
    await statusLink.click();
    await page.getByRole("heading", { name: "Character File", exact: true }).waitFor();
    check(
      (await page.getByRole("heading", { name: "In development", exact: true }).count()) === 1,
      "Planned character entry remains honest",
    );
    await page.getByRole("link", { name: "Open audition preparation", exact: true }).click();
    await page.getByRole("tab", { name: "Preparation", exact: true }).click();
    await page.getByLabel("Role & project", { exact: true }).fill("PR A saved preparation");
    await page.getByRole("button", { name: "Save audition prep", exact: true }).click();
    await page.getByText("Saved in this browser.", { exact: true }).waitFor();
    const saved = await page.evaluate(() => localStorage.getItem("slams.audition.v1"));
    check(
      saved && JSON.parse(saved).role === "PR A saved preparation",
      "Existing audition storage confirms the real save",
    );
    await go("/work");
    check(
      (await page.getByText("PR A saved preparation", { exact: true }).count()) === 1,
      "Working hub reflects real saved preparation",
    );
    for (const tab of ["projects", "characters", "self-tapes"]) {
      await go("/work?tab=" + tab);
      await page.getByRole("button", { name: "Back to audition preparation", exact: true }).click();
      await page.waitForURL((u) => u.searchParams.get("tab") === "auditions");
      check(
        (await page.getByText("PR A saved preparation", { exact: true }).count()) === 1,
        `Legacy ${tab} returns to the saved working task`,
      );
    }
    for (const tab of ["scene", "identify"]) {
      await go("/stuck?tab=" + tab);
      check(
        (await page.getByRole("heading", { name: "In development", exact: true }).count()) === 1,
        `Old Stuck Desk ${tab} stays truthful`,
      );
      await page.getByRole("button", { name: "View draft interventions", exact: true }).click();
      await page.waitForURL((u) => u.searchParams.get("tab") === "describe");
      check(
        (await page.getByRole("link", { name: "Try the Living Scene", exact: true }).count()) === 1,
        `Old Stuck Desk ${tab} returns to actual suggestions`,
      );
    }
    for (const tab of ["technique-options", "instructions"]) {
      await go("/stuck/intervention?tab=" + tab);
      check(
        new URL(page.url()).pathname === "/stuck",
        "Duplicate intervention bookmark redirects to its canonical owner: " + tab,
      );
      await page.getByRole("link", { name: "Try the Living Scene", exact: true }).click();
      await page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
      check(
        new URL(page.url()).pathname === "/scene",
        "Consolidated intervention reaches the actual rehearsal: " + tab,
      );
    }
    check(
      (await page.evaluate(() => localStorage.getItem("slams.audition.v1"))) === saved,
      "Architecture navigation does not alter saved preparation",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await go("/work");
    await page.evaluate(() => (document.documentElement.style.fontSize = "24px"));
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "Simplified work page supports enlarged text",
    );
    check(
      await page
        .locator(".studio-page")
        .evaluate((n) => n.getAnimations({ subtree: true }).length === 0),
      "Reduced motion remains effective",
    );
    check(errors.length === 0, "No uncaught browser errors");
    fs.writeFileSync(
      path.join(out, "pr-a-results.json"),
      JSON.stringify(
        {
          base,
          checks: passed.length,
          passed,
          uncaughtPageErrors: errors,
          browser: browser.version(),
          limitations: [
            "Guest contexts; no live authentication, confirmed-account isolation or deployed RLS test.",
            "Chromium emulation is not physical Android/TalkBack.",
          ],
        },
        null,
        2,
      ),
    );
    console.log(JSON.stringify({ checks: passed.length, uncaughtPageErrors: errors }));
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
