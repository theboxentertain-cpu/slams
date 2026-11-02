/* Actual guest/validation browser checks. Never creates accounts or sends email. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-welcome-verification";
fs.mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
function check(value, label) {
  assert.ok(value, label);
  checks.push(label);
}
const screens = [
  ["/welcome", "landing"],
  ["/welcome/account", "account"],
  ["/auth?mode=signup&flow=welcome", "signup"],
  ["/welcome/setup", "setup"],
  ["/baseline?tab=prepare&flow=welcome", "baseline"],
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
    let signups = 0;
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.endsWith("/auth/v1/signup")) signups++;
    });
    async function go(route) {
      console.log("Checking " + route);
      await page.goto(base + route, { waitUntil: "networkidle" });
    }
    await go("/");
    await page.getByRole("heading", { name: "Welcome to SLAMS", exact: true }).waitFor();
    check(
      (await page.locator(".welcome-world").count()) === 1,
      "Fresh signed-out home opens Welcome",
    );
    check(
      (await page.getByRole("navigation", { name: "Main studio navigation" }).count()) === 0,
      "Welcome is immersive with no competing studio bar",
    );
    const books = page.getByRole("button", { name: "Explore the eight acting-school books" });
    await books.click();
    check(
      (await page
        .getByRole("dialog")
        .getByRole("link", { name: /^Open .+ school$/ })
        .count()) === 8,
      "Welcome book collection opens eight accessible school choices",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("aria-label") ===
        "Explore the eight acting-school books",
    );
    check(true, "Welcome library restores opener focus");
    await page.getByRole("link", { name: "Enter the Studio", exact: true }).click();
    await page.getByRole("heading", { name: "Welcome, Actor.", exact: true }).waitFor();
    check(true, "Enter the Studio opens account choice");
    await page.getByText("Why create an account?", { exact: true }).click();
    check(
      (await page.locator(".welcome-why[open]").count()) === 1,
      "Account benefits are accessible native disclosure",
    );
    check(
      (await page.getByRole("button", { name: /Google|Apple/ }).count()) === 0,
      "Unconfigured social sign-in is not presented as functional",
    );
    await page.getByRole("link", { name: "Create a new account", exact: true }).click();
    await page.getByLabel("Confirm password", { exact: true }).waitFor();
    check(
      new URL(page.url()).pathname === "/auth" &&
        new URL(page.url()).searchParams.get("mode") === "signup",
      "Signup uses the existing auth route with a bounded mode",
    );
    await page.screenshot({ path: path.join(out, "signup-mobile.png"), fullPage: true });
    await page.getByLabel("Email", { exact: true }).fill("browser-fixture@example.test");
    await page.getByLabel("Password", { exact: true }).fill("FixturePassword1");
    await page.getByLabel("Confirm password", { exact: true }).fill("DifferentFixture1");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Passwords do not match" }).waitFor();
    check(signups === 0, "Mismatched passwords are rejected without signup or email");
    await page.getByRole("button", { name: "Show password", exact: true }).click();
    check(
      (await page.getByLabel("Password", { exact: true }).getAttribute("type")) === "text",
      "Password visibility toggle functions",
    );
    await page.getByRole("link", { name: "Back to previous welcome step" }).click();
    await page.getByRole("link", { name: /Explore as Guest/ }).click();
    await page.getByRole("heading", { name: "Actor Setup", exact: true }).waitFor();
    check(
      (await page.getByRole("radio", { checked: true }).count()) === 0,
      "Experience is not fabricated or preselected",
    );
    // Existing browser records must survive onboarding; all fixtures are local only.
    await page.evaluate(() => {
      localStorage.setItem(
        "slams.passport.v1",
        JSON.stringify([
          {
            id: "10000000-0000-4000-8000-000000000001",
            date: "2026-01-01T00:00:00Z",
            tactic: "Fixture",
            intervention: "Fixture",
            exerciseNote: "Existing fixture",
            obstacle: "Existing fixture",
            retakeLine: "Existing fixture",
            reflection: "Preserved through welcome",
          },
        ]),
      );
      localStorage.setItem(
        "slams.audition.v1",
        JSON.stringify({ role: "Existing browser preparation" }),
      );
    });
    await page.getByRole("radio", { name: "Working actor", exact: true }).check();
    await page.getByRole("checkbox", { name: "Prepare for auditions", exact: true }).check();
    await page.getByRole("checkbox", { name: "Reduce motion", exact: true }).check();
    check(
      (await page.locator(".app-shell").getAttribute("data-motion")) === "off",
      "Setup uses the existing functional motion preference",
    );
    check(
      (await page.getByRole("checkbox", { name: /Recording|Captions|Coach audio/ }).count()) === 0,
      "Unsupported media capabilities have no fake enabled switches",
    );
    await page.getByRole("button", { name: "Continue to Baseline", exact: true }).click();
    await page.getByRole("heading", { name: "Your Actor’s Baseline", exact: true }).waitFor();
    check(
      (await page.evaluate(
        () => JSON.parse(localStorage.getItem("slams.actor-setup.v1.guest")).experience,
      )) === "Working actor",
      "Guest actor setup is genuinely saved",
    );
    check(
      (await page.getByText("Prepare for auditions", { exact: true }).count()) === 1,
      "Baseline shows the actor’s selected direction, not an inferred assessment",
    );
    check(
      (await page.getByText(/Guided baseline assessments are still in development/).count()) === 1,
      "Baseline accurately identifies its unavailable assessment",
    );
    await page.getByRole("link", { name: /Start a first rehearsal/ }).click();
    await page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
    check(
      new URL(page.url()).pathname === "/scene",
      "Baseline introduction opens the existing working rehearsal",
    );
    await page.getByRole("link", { name: "Return to the Director’s Office" }).click();
    await page.getByRole("heading", { name: "The Director’s Office", exact: true }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page.locator(".office-world").count()) === 1,
      "Returning visitor opens Office after reload",
    );
    check(
      (await context.cookies()).some((c) => c.name === "slams_studio_entered" && c.value === "1"),
      "Studio entry is a remembered device preference",
    );
    check(
      (await page.evaluate(
        () => JSON.parse(localStorage.getItem("slams.passport.v1"))[0].reflection,
      )) === "Preserved through welcome",
      "Onboarding preserves existing Passport records",
    );
    check(
      (await page.evaluate(() => JSON.parse(localStorage.getItem("slams.audition.v1")).role)) ===
        "Existing browser preparation",
      "Onboarding preserves existing audition notes",
    );
    const legacy = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await legacy.addInitScript(() => localStorage.setItem("slams.passport.v1", "[]"));
    const oldPage = await legacy.newPage();
    await oldPage.goto(base, { waitUntil: "networkidle" });
    await oldPage.locator(".office-world").waitFor();
    check(true, "Legacy browser users with saved records skip compulsory onboarding");
    await legacy.close();
    const direct = await browser.newContext();
    const deep = await direct.newPage();
    await deep.goto(base + "/scene", { waitUntil: "networkidle" });
    check(
      (await deep.getByRole("button", { name: "Begin take", exact: true }).count()) === 1,
      "A fresh visitor’s direct rehearsal link is not intercepted",
    );
    await direct.close();
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 600 ? 1000 : 844 });
      for (const [route, name] of screens) {
        await go(route);
        check(
          (await page.locator("main h1").count()) === 1,
          `${name}: one clear heading at ${width}px`,
        );
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name}: no horizontal overflow at ${width}px`,
        );
        check(
          await page.evaluate(
            () =>
              document.querySelector(".welcome-director").getBoundingClientRect().top >=
              document.querySelector(".welcome-brand").getBoundingClientRect().bottom - 1,
          ),
          `${name}: character stays clear of the masthead at ${width}px`,
        );
        const tiny = await page
          .locator(".welcome-world button:visible,.welcome-world a:visible")
          .evaluateAll((ns) =>
            ns
              .filter((n) => {
                const r = n.getBoundingClientRect();
                return r.width < 43 || r.height < 43;
              })
              .map((n) => n.textContent.trim()),
          );
        check(tiny.length === 0, `${name}: touch actions >=44px at ${width}px`);
        if (width === 390 || width === 1440)
          await page.screenshot({
            path: path.join(out, `${name}-${width === 390 ? "mobile" : "desktop"}.png`),
            fullPage: true,
          });
      }
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await go("/welcome/setup");
    await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "Setup supports enlarged root text without horizontal overflow",
    );
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page.emulateMedia({ reducedMotion: "reduce" });
    check(
      (await page.locator(".app-shell").getAttribute("data-motion")) === "off",
      "Welcome honors device reduced motion",
    );
    check(signups === 0, "Browser suite made no signup request or email attempt");
    check(errors.length === 0, "No uncaught page errors in welcome regression");
    fs.writeFileSync(
      path.join(out, "welcome-results.json"),
      JSON.stringify(
        {
          base,
          checks: checks.length,
          passed: checks,
          uncaughtPageErrors: errors,
          browser: await browser.version(),
          limitations: [
            "No live signup, confirmation email, OAuth or authenticated backend write.",
            "Setup is device-local and account namespaced, not cloud profile synchronization.",
            "Baseline is an introduction to existing practice, not a completed assessment.",
            "Chromium emulation is not physical Android/TalkBack.",
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
