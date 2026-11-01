/* Optional browser regression. Install Playwright separately; uses system Chromium.
 * No authenticated sessions, live mutations or invented curriculum are used.
 */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-office-verification";
fs.mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
function check(value, label) {
  assert.ok(value, label);
  checks.push(label);
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
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    async function settle() {
      await page.locator(".office-world").evaluate(async (n) => {
        await Promise.all(
          n.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})),
        );
      });
    }
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 });
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `No page overflow at ${width}px`,
      );
      const targets = await page
        .locator(".office-shell button:visible,.office-shell a:visible")
        .evaluateAll((nodes) =>
          nodes
            .map((n) => ({
              name: n.getAttribute("aria-label") || n.textContent.trim(),
              rect: n.getBoundingClientRect(),
            }))
            .filter((n) => n.rect.width < 43 || n.rect.height < 43),
        );
      // The footer's inline sign-in text is an ordinary prose link, not a scene control.
      check(
        targets.filter((n) => !n.name.includes("Sign in to save")).length === 0,
        `Scene/header/tab hit areas at least 44px at ${width}px`,
      );
      await settle();
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: path.join(out, width === 390 ? "office-mobile.png" : "office-desktop.png"),
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const routes = [
      [
        "The desk",
        [
          ["Start rehearsal", "/scene"],
          ["The Stuck Desk", "/stuck"],
          ["The Director —", "/director"],
        ],
      ],
      [
        "Work wall",
        [
          ["Actor at Work", "/work"],
          ["Passport", "/passport"],
          ["Technique Matrix", "/matrix"],
        ],
      ],
      [
        "Rehearsal corner",
        [
          ["Baseline", "/baseline"],
          ["Performance Lab", "/lab"],
          ["Rehearsal Lounge", "/lounge"],
        ],
      ],
    ];
    for (const [view, objects] of routes) {
      await page.getByRole("tab", { name: new RegExp(view) }).click();
      for (const [label, route] of objects) {
        const link = page.getByRole("link", { name: new RegExp(label) });
        await link.waitFor({ state: "visible" });
        check((await link.getAttribute("href")) === route, `${label} maps to ${route}`);
        await link.click();
        await page.waitForURL(base + route);
        check((await page.locator("h1").count()) > 0, `${route} renders its real page`);
        await page.getByRole("link", { name: "Return to the Director’s Office" }).click();
        await page.getByRole("tab", { name: new RegExp(view), selected: true }).waitFor();
        check(true, `Return to office restores ${view}`);
      }
      await settle();
      await page.screenshot({
        path: path.join(
          out,
          view === "Work wall"
            ? "work-wall-mobile.png"
            : view === "Rehearsal corner"
              ? "rehearsal-corner-mobile.png"
              : "desk-mobile.png",
        ),
        fullPage: true,
      });
    }
    await page.getByRole("tab", { name: /The desk/ }).click();
    await page.getByRole("tab", { name: /The desk/ }).focus();
    await page.keyboard.press("ArrowRight");
    check(
      await page
        .getByRole("tab", { name: /Work wall/ })
        .evaluate((n) => n === document.activeElement),
      "Arrow key changes view and focus",
    );
    await page.keyboard.press("Home");
    check(
      (await page.getByRole("tab", { name: /The desk/ }).getAttribute("aria-selected")) === "true",
      "Home key returns to desk",
    );
    await page.getByRole("button", { name: /Explore the eight/ }).click();
    const dialog = page.getByRole("dialog");
    const schoolLinks = dialog.getByRole("link", { name: /^Open .+ school$/ });
    check((await schoolLinks.count()) === 8, "Eight individually selectable school books");
    const slugs = [
      "stanislavski",
      "meisner",
      "adler",
      "practical-aesthetics",
      "chekhov",
      "laban",
      "strasberg",
      "viewpoints",
    ];
    for (const slug of slugs)
      check(
        (await dialog.locator(`a[href='/conservatory/${slug}']`).count()) === 1,
        `Book preserves ${slug} route`,
      );
    await page.screenshot({ path: path.join(out, "books-mobile.png"), fullPage: true });
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("aria-label") ===
        "Explore the eight acting-school books",
    );
    check(
      await page
        .getByRole("button", { name: /Explore the eight/ })
        .evaluate((n) => n === document.activeElement),
      "Escape closes books and restores focus",
    );
    await page.getByRole("button", { name: "Office preferences" }).click();
    check(
      (await page.getByRole("button", { name: /Sound off/ }).getAttribute("aria-pressed")) ===
        "false",
      "Sound is opt-in",
    );
    await page.getByRole("button", { name: "Motion on" }).click();
    check(
      (await page.locator(".office-shell").getAttribute("data-motion")) === "off",
      "User can disable motion",
    );
    await page.getByRole("button", { name: /Explore the eight/ }).click();
    check(
      (await page.getByRole("dialog").getAttribute("data-motion")) === "off",
      "Book close-up inherits motion preference",
    );
    await page.keyboard.press("Escape");
    await page.emulateMedia({ reducedMotion: "reduce" });
    check(
      (await page.locator(".office-shell").getAttribute("data-motion")) === "off",
      "Reduced-motion media is respected",
    );
    await page.getByRole("button", { name: "Office preferences" }).click();
    // Actual touch events, beginning on the background instead of an interactive prop.
    await page.locator(".office-world").scrollIntoViewIfNeeded();
    const rect = await page.locator(".office-world").boundingBox();
    const cdp = await context.newCDPSession(page);
    const y = Math.max(30, rect.y + 30);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 300, y }],
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 120, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.getByRole("tab", { name: /Work wall/, selected: true }).waitFor();
    check(true, "Touch swipe moves to connected work wall");
    // Browser-only scripted rehearsal: exercise all 3x3 existing branches.
    const obstacles = new Set();
    const tactics = ["To plead", "To tease", "To confront"];
    const interventions = [
      "Meisner — Listening",
      "Stanislavski — Playable action",
      "Stella Adler — Given circumstances",
    ];
    for (const tactic of tactics)
      for (const intervention of interventions) {
        await page.goto(base + "/scene", { waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Begin take" }).click();
        check(
          (await page.getByRole("complementary", { name: "The Director" }).count()) === 0,
          `Director silent during take 1: ${tactic}/${intervention}`,
        );
        await page.getByRole("button", { name: new RegExp(tactic) }).click();
        await page.getByRole("button", { name: "Cut — call an intervention" }).click();
        await page.getByRole("button", { name: new RegExp(intervention) }).click();
        await page.getByLabel("Your exercise").fill("Browser regression: a concrete observation.");
        await page.getByRole("button", { name: "Go to retake" }).click();
        check(
          (await page.getByRole("complementary", { name: "The Director" }).count()) === 0,
          `Director silent during retake: ${tactic}/${intervention}`,
        );
        obstacles.add(await page.locator(".border-crimson").innerText());
      }
    check(obstacles.size === 9, "All nine scripted retake obstacles remain distinct");
    await page.getByLabel("Your new line or action").fill("Browser regression: I stay and listen.");
    await page.getByRole("button", { name: "Cut — end take" }).click();
    await page
      .getByLabel("Reflection")
      .fill("Browser regression: the circumstances changed the action.");
    await page.getByRole("button", { name: "Save to Passport" }).click();
    await page.getByRole("heading", { name: "Saved to your Passport" }).waitFor();
    check(true, "Real signed-out rehearsal save completed");
    await page.getByRole("link", { name: "Open Passport" }).click();
    await page
      .getByText("Browser regression: the circumstances changed the action.", { exact: false })
      .waitFor();
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page.getByText(/the circumstances changed the action/).count()) > 0,
      "Local Passport record survives reload",
    );
    await page.getByRole("link", { name: "Return to the Director’s Office" }).click();
    await page.getByRole("tab", { name: /The desk/ }).click();
    check(
      (await page.locator("[data-expression=proud]").count()) === 1,
      "Office reacts to an actual persisted rehearsal",
    );
    check(
      (await page.getByText(/1 rehearsal record saved/).count()) === 1,
      "Office shows a factual saved-record count",
    );
    await page.goto(base + "/work", { waitUntil: "networkidle" });
    await page.getByLabel("Role & project").fill("Browser regression fixture");
    await page.getByRole("button", { name: "Save audition prep" }).click();
    await page.getByRole("status").filter({ hasText: "Saved in this browser." }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page.getByLabel("Role & project").inputValue()) === "Browser regression fixture",
      "Local audition prep survives reload",
    );
    await page.goto(base + "/auth", { waitUntil: "networkidle" });
    check(
      (await page.getByLabel("Email", { exact: true }).count()) === 1 &&
        (await page.getByLabel("Password", { exact: true }).count()) === 1,
      "Existing signed-out authentication form remains available",
    );
    await page.goto(base + "/director", { waitUntil: "networkidle" });
    await page.getByText("The many faces of a very long day").click();
    check(
      (await page.locator(".director-expression-gallery button").count()) === 7,
      "All seven reusable expressions available",
    );
    await page.screenshot({ path: path.join(out, "director-mobile.png"), fullPage: true });
    check(errors.length === 0, "No uncaught page errors in browser regression");
    const report = {
      base,
      checks: checks.length,
      passed: checks,
      uncaughtPageErrors: errors,
      browser: await browser.version(),
      limitations: [
        "Chromium mobile emulation is not a physical Android/TalkBack test.",
        "Signed-out local persistence tested; live authentication, two-account isolation and school backend loaders remain unverified.",
      ],
    };
    fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify({ passed: checks.length, uncaughtPageErrors: errors.length, artifacts: out }),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
