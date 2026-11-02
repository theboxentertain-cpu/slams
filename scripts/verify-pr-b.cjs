/* Compiled-build first-use acceptance. Guest-only browser records; no live accounts or email. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-pr-b-verification";
fs.mkdirSync(out, { recursive: true });
const passed = [],
  errors = [],
  journeys = [];
let authRequests = 0;
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
  async function guest(viewport = { width: 390, height: 844 }) {
    const context = await browser.newContext({
      viewport,
      isMobile: viewport.width < 700,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.startsWith("/auth/v1/")) authRequests++;
    });
    return { context, page };
  }
  async function go(page, route) {
    await page.goto(base + route, { waitUntil: "networkidle" });
  }
  async function shot(page, name) {
    await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
  }
  async function toReflection(page, name) {
    const routes = [],
      start = Date.now();
    page.on("framenavigated", (f) => {
      if (f === page.mainFrame()) routes.push(new URL(f.url()).pathname);
    });
    await go(page, "/");
    await page.getByRole("link", { name: "Enter the Studio", exact: true }).click();
    await page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
    check(
      new URL(page.url()).pathname === "/scene",
      name + ": first click enters actual rehearsal",
    );
    check(
      (await page.getByText(/responses are fixed and scripted/).count()) === 1,
      name + ": task discloses scripted responses",
    );
    await page.getByRole("button", { name: "Begin take", exact: true }).click();
    await page.getByRole("heading", { name: "Take 1 — choose your tactic" }).waitFor();
    check(
      (await page.getByRole("button", { name: /^To plead/ }).count()) === 1,
      name + ": two clicks reach an acting choice with no account/profile/assessment",
    );
    await page.getByRole("button", { name: /^To plead/ }).click();
    check(
      (await page.getByText(/Sam softens/).count()) === 1,
      name + ": authored response follows choice",
    );
    await page.getByRole("button", { name: "Cut — call an intervention" }).click();
    await page.getByRole("button", { name: /Meisner — Listening/ }).click();
    check(
      await page.getByRole("button", { name: "Go to retake" }).isDisabled(),
      name + ": exercise requires an actor contribution",
    );
    await page
      .getByLabel("Your exercise", { exact: true })
      .fill("Sam looked at the door. I repeated what I observed.");
    await page.getByRole("button", { name: "Go to retake" }).click();
    check(
      (await page.getByText(/You have only their silence/).count()) === 1,
      name + ": retake has existing changed circumstance",
    );
    await page
      .getByLabel("Your new line or action", { exact: true })
      .fill("I put the keys down beside us and wait.");
    await page.getByRole("button", { name: "Cut — end take" }).click();
    await page.getByRole("heading", { name: "Reflection", exact: true }).waitFor();
    check(
      (await page.getByText(/Only you can judge this/).count()) === 1,
      name + ": reflection remains actor judgment",
    );
    journeys.push({
      name,
      routes: [...routes],
      clicksToActingChoices: 2,
      clicksToReflection: 7,
      automatedElapsedMs: Date.now() - start,
    });
  }
  try {
    const first = await guest();
    await toReflection(first.page, "continue-without-save");
    await first.page.getByLabel("Reflection", { exact: true }).fill("Unsaved reflection fixture");
    await shot(first.page, "reflection-mobile");
    await first.page.getByRole("link", { name: "Continue to the Office without saving" }).click();
    await first.page.getByRole("heading", { name: "The Director’s Office", exact: true }).waitFor();
    check(
      await first.page.evaluate(() => localStorage.getItem("slams.passport.v1") === null),
      "Continuing without save creates no Passport record",
    );
    await first.page.reload({ waitUntil: "networkidle" });
    await first.page.getByText("Guest actor", { exact: true }).waitFor();
    check(
      (await first.page.locator(".office-world").count()) === 1,
      "Returning guest receives Office after reload",
    );
    check(
      (await first.page.getByRole("link", { name: /Resume/ }).count()) === 0,
      "Unsaved work does not produce a fabricated resume",
    );
    await first.context.close();
    const saved = await guest();
    await toReflection(saved.page, "save-reflection");
    await saved.page
      .getByLabel("Reflection", { exact: true })
      .fill("Waiting changed my action. I noticed the silence instead of planning a reply.");
    await saved.page.getByRole("button", { name: "Save to Passport", exact: true }).click();
    await saved.page.getByRole("heading", { name: "Saved to your Passport" }).waitFor();
    check(
      (await saved.page.getByText(/Stored in this browser only/).count()) === 1,
      "Save identifies guest browser storage",
    );
    await saved.page.getByRole("link", { name: "Open Passport", exact: true }).click();
    await saved.page
      .getByText("Waiting changed my action. I noticed the silence instead of planning a reply.", {
        exact: false,
      })
      .waitFor();
    await saved.page.reload({ waitUntil: "networkidle" });
    await saved.page
      .getByText("Waiting changed my action. I noticed the silence instead of planning a reply.", {
        exact: false,
      })
      .waitFor();
    check(
      await saved.page.evaluate(
        () => JSON.parse(localStorage.getItem("slams.passport.v1")).length === 1,
      ),
      "One actual reflection survives a page reload",
    );
    await shot(saved.page, "passport-mobile");
    await go(saved.page, "/");
    await saved.page.getByText("Guest actor", { exact: true }).waitFor();
    check(
      (await saved.page.getByRole("link", { name: /Resume/ }).count()) === 0,
      "Completed reflection is not offered as a resumable draft",
    );
    await shot(saved.page, "returning-office-mobile");
    await saved.context.close();
    const settings = await guest();
    await go(settings.page, "/welcome/setup");
    const legacy = JSON.stringify({
      version: 1,
      experience: "Working actor",
      goals: ["Prepare for auditions"],
      language: "en",
    });
    await settings.page.evaluate(
      (value) => localStorage.setItem("slams.actor-setup.v1.guest", value),
      legacy,
    );
    check(
      (await settings.page.getByRole("radio").count()) === 0,
      "Optional setup asks no unused experience questions",
    );
    check(
      (await settings.page.getByRole("checkbox").count()) === 2,
      "Only implemented motion and sound controls are offered",
    );
    await settings.page.getByRole("checkbox", { name: "Reduce motion", exact: true }).check();
    await settings.page.getByRole("checkbox", { name: "Office sounds", exact: true }).check();
    await settings.page.reload({ waitUntil: "networkidle" });
    check(
      await settings.page.getByRole("checkbox", { name: "Reduce motion", exact: true }).isChecked(),
      "Motion preference survives reload",
    );
    check(
      await settings.page.getByRole("checkbox", { name: "Office sounds", exact: true }).isChecked(),
      "Sound preference survives reload",
    );
    check(
      await settings.page.evaluate(
        (value) => localStorage.getItem("slams.actor-setup.v1.guest") === value,
        legacy,
      ),
      "Earlier actor setup remains byte-for-byte intact",
    );
    await settings.page.getByRole("link", { name: "Start a first rehearsal", exact: true }).click();
    await settings.page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
    check(
      new URL(settings.page.url()).pathname === "/scene",
      "Optional controls lead straight to rehearsal",
    );
    await settings.context.close();
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      const { page, context } = await guest({ width, height: width < 700 ? 844 : 1000 });
      await go(page, "/");
      const entry = page.getByRole("link", { name: "Enter the Studio", exact: true });
      await entry.waitFor();
      const box = await entry.boundingBox();
      check(
        box.y >= 0 && box.y + box.height <= (width < 700 ? 844 : 1000),
        width + "px: entry fully visible before scrolling",
      );
      check(box.width >= 44 && box.height >= 44, width + "px: entry touch target meets 44px");
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        width + "px: no horizontal overflow",
      );
      check(
        (await page.locator(".welcome-primary:visible").count()) === 1,
        width + "px: one dominant entry action",
      );
      check(
        (await page.getByText(/Step \d of 5/).count()) === 0,
        width + "px: no compulsory multi-step counter",
      );
      check(
        (await page.getByRole("navigation", { name: "Inside the studio" }).count()) === 0,
        width + "px: optional navigation starts collapsed",
      );
      // Keyboard must reach entry even with the exploration panel closed.
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      check(
        await entry.evaluate((n) => n === document.activeElement),
        width + "px: keyboard focus reaches entry after skip link",
      );
      if (width === 390 || width === 1440)
        await shot(page, "landing-" + (width === 390 ? "mobile" : "desktop"));
      if (width === 390) {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(
          () => document.querySelector(".app-shell").getAttribute("data-motion") === "off",
        );
        check(
          (await page.locator(".app-shell").getAttribute("data-motion")) === "off",
          "Fresh welcome honors device reduced motion",
        );
        await page.setViewportSize({ width: 844, height: 390 });
        await entry.scrollIntoViewIfNeeded();
        const landscape = await entry.boundingBox();
        check(
          landscape.y >= 0 && landscape.y + landscape.height <= 390,
          "Landscape can scroll entry fully into view",
        );
        await shot(page, "landing-landscape");
        await page.setViewportSize({ width: 320, height: 844 });
        await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          "Enlarged root text causes no horizontal overflow",
        );
        await entry.scrollIntoViewIfNeeded();
        check(await entry.isVisible(), "Enlarged-text entry remains reachable");
        await shot(page, "landing-enlarged-text");
      }
      await context.close();
    }
    const blocked = await guest();
    await blocked.context.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      };
    });
    await go(blocked.page, "/");
    await blocked.page.getByRole("link", { name: "Enter the Studio", exact: true }).click();
    await blocked.page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
    check(true, "Storage write failure does not gate first rehearsal");
    await blocked.context.close();
    check(authRequests === 0, "Guest journeys made no authentication requests");
    check(errors.length === 0, "No uncaught page errors");
    fs.writeFileSync(
      path.join(out, "pr-b-results.json"),
      JSON.stringify(
        {
          base,
          checks: passed.length,
          passed,
          journeys,
          authRequests,
          uncaughtPageErrors: errors,
          browser: await browser.version(),
          limitations: [
            "Scripted guest workflow only; no live authenticated backend writes, signup or email.",
            "Automated click timings are not human completion-time or production performance measurements.",
            "Chromium viewport emulation does not establish physical Android/TalkBack support.",
            "Complete denial of the localStorage getter still fails in the unchanged auth storage adapter; separately diagnosed and recorded in the PR B report.",
          ],
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({ passed: passed.length, uncaughtPageErrors: errors.length, artifacts: out }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
