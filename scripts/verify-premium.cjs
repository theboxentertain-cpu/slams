/* Guest-only art, coaching and reflow checks. No account creation or cloud writes. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3101";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-premium";
const passed = [],
  errors = [],
  hydrationErrors = [];
fs.mkdirSync(out, { recursive: true });
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
      hasTouch: true,
    });
    await context.addCookies([{ name: "slams_studio_entered", value: "1", url: base }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|server rendered HTML|didn't match/i.test(message.text())
      )
        hydrationErrors.push(message.text());
    });
    const go = (route) => page.goto(base + route, { waitUntil: "networkidle" });
    const shot = async (name) => {
      await page.locator(".section-coach-note").evaluateAll(async (nodes) => {
        await Promise.all(
          nodes.flatMap((node) => node.getAnimations().map((a) => a.finished.catch(() => {}))),
        );
      });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
    };
    await go("/");
    await page.getByText("Guest actor", { exact: true }).waitFor();
    const tasks = page.getByRole("navigation", { name: "Choose your studio task" });
    check((await tasks.getByRole("link").count()) === 4, "Office has four task entrances");
    check(
      (
        await tasks
          .getByRole("link")
          .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")))
      ).join() === "/conservatory,/rehearsal,/work,/stuck",
      "Four task cards retain real routes",
    );
    check(
      await page
        .locator(".premium-office-scene img")
        .evaluate((n) => n.complete && n.naturalWidth === 1536),
      "New Director illustration loads at its intrinsic dimensions",
    );
    check(
      !/\d+%/.test(await page.locator(".office-training-card").innerText()),
      "Guest training card has no invented percentage",
    );
    check(
      (await page
        .getByRole("navigation", { name: "Main studio navigation" })
        .getByRole("link")
        .count()) === 5,
      "One five-destination primary bar is retained",
    );
    await page.getByRole("button", { name: /Explore the eight acting-school books/ }).click();
    check(
      (await page
        .getByRole("dialog")
        .getByRole("link", { name: /^Open .+ school$/ })
        .count()) === 8,
      "Library keeps eight individually selectable schools",
    );
    check(
      (await page
        .getByRole("dialog")
        .getByText(/Provisional structure/)
        .count()) === 8,
      "School durations remain explicitly provisional",
    );
    await shot("library-mobile");
    await page.keyboard.press("Escape");
    check(
      await page
        .getByRole("button", { name: /Explore the eight acting-school books/ })
        .evaluate((n) => document.activeElement === n),
      "Library closes back to its opener",
    );

    for (const [mode, speaking] of [
      ["quiet", "false"],
      ["on", "true"],
      ["off", null],
    ]) {
      await go("/director");
      await page
        .getByRole("group", { name: "Director mode" })
        .getByRole("button", { name: mode, exact: true })
        .click();
      await go("/work");
      const coach = page.getByRole("complementary", { name: "Section coach" });
      if (mode === "off") {
        check((await coach.count()) === 0, "OFF hides the section coach");
        continue;
      }
      check(
        (await coach.getAttribute("data-speaking")) === speaking,
        `${mode}: original presence rule retained`,
      );
      const portrait = coach.locator("[data-expression]");
      check(
        (await portrait.getAttribute("data-expression")) === "critical",
        `${mode}: Work uses its technique-specific expression`,
      );
      const atlas = await portrait.evaluate(async (node) => {
        const url = getComputedStyle(node).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
        const img = new Image();
        img.src = url;
        await img.decode();
        const r = node.getBoundingClientRect();
        return {
          ratio: img.naturalWidth / img.naturalHeight,
          square: Math.abs(r.width - r.height) < 1,
        };
      });
      check(
        atlas.ratio === 2 && atlas.square,
        `${mode}: 4-by-2 atlas preserves square portrait cells`,
      );
      await coach.getByRole("button", { name: "Hear from the Director" }).click();
      check(await coach.getByRole("status").isVisible(), `${mode}: scripted note opens`);
      if (mode === "quiet")
        check(
          (await coach.getByRole("status").innerText()).includes("Make the objective specific."),
          "QUIET retains the brief note",
        );
      check(
        await page.evaluate(
          () =>
            document.querySelector(".section-coach-note").getBoundingClientRect().bottom <
            document.querySelector(".studio-page main > p").getBoundingClientRect().top,
        ),
        `${mode}: note stays above the working page content`,
      );
      await shot(`coach-${mode}-mobile`);
      await page.emulateMedia({ reducedMotion: "reduce" });
      check(
        await portrait.evaluate((n) => n.getAnimations().length === 0),
        `${mode}: reduced motion stops portrait animation`,
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    await go("/director");
    await page
      .getByRole("group", { name: "Director mode" })
      .getByRole("button", { name: "on", exact: true })
      .click();
    await go("/scene");
    await page.getByRole("button", { name: "Begin take", exact: true }).click();
    check(
      (await page.getByRole("complementary", { name: "Section coach" }).count()) === 0,
      "Section coach remains silent during the actual take",
    );
    check(
      (await page.getByRole("complementary", { name: "The Director", exact: true }).count()) === 0,
      "Director note remains silent during the actual take",
    );

    await go("/");
    await page.getByRole("tab", { name: /The desk/ }).click();
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 699 ? 1000 : 844 });
      await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Office reflows at 200% root text and ${width}px`,
      );
      await page.evaluate(() => document.documentElement.style.removeProperty("font-size"));
    }
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const [route, name] of [
        ["/", "office"],
        ["/welcome", "welcome"],
        ["/welcome/account", "account"],
        ["/conservatory", "schools"],
        ["/conservatory/meisner", "school"],
        ["/rehearsal", "rehearsal"],
        ["/work", "work"],
        ["/passport", "passport"],
      ]) {
        await go(route);
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name}: no overflow at ${width}px`,
        );
        check(
          (await page.locator("h1").count()) === 1,
          `${name}: one semantic page heading at ${width}px`,
        );
        await shot(`${name}-${width}`);
      }
    }
    check(errors.length === 0, "No uncaught browser errors");
    check(hydrationErrors.length === 0, "No hydration errors in the compiled page flow");
    fs.writeFileSync(
      path.join(out, "premium-results.json"),
      JSON.stringify(
        {
          base,
          checks: passed.length,
          passed,
          uncaughtPageErrors: errors,
          hydrationErrors,
          browser: browser.version(),
          limitations: [
            "Guest Chromium verification; live account, cloud writes and physical-device testing not performed.",
            "Reviewed curriculum and other unavailable product features remain unavailable.",
          ],
        },
        null,
        2,
      ) + "\n",
    );
    console.log(JSON.stringify({ checks: passed.length, errors, artifacts: out }));
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
