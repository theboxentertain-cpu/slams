/* Guest-only compiled-browser acceptance for the school/Baseline visual pass.
 * Optional legacy self-report data below is an isolated browser fixture, never curriculum.
 * No account creation, authenticated writes, media recording or deployments.
 */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3101";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-training-design";
const capture = process.env.SLAMS_SCREENSHOTS !== "0";
const passed = [],
  errors = [],
  hydrationErrors = [],
  cloudWrites = [],
  screenshots = [];
let browserVersion = "",
  signupRequests = 0;
const setupKey = "slams.actor-setup.v1.guest";
const legacyFixture = {
  version: 1,
  experience: "Working actor",
  goals: ["Prepare for auditions", "Expand my range"],
  language: "en",
};
const schools = [
  ["stanislavski", "Stanislavski"],
  ["meisner", "Meisner"],
  ["adler", "Stella Adler"],
  ["practical-aesthetics", "Practical Aesthetics"],
  ["chekhov", "Michael Chekhov"],
  ["laban", "Laban / Bartenieff"],
  ["strasberg", "Lee Strasberg"],
  ["viewpoints", "Viewpoints"],
];
fs.mkdirSync(out, { recursive: true });
function check(value, label) {
  assert.ok(value, label);
  passed.push(label);
}
function report(success, failure) {
  fs.writeFileSync(
    path.join(out, "training-design-results.json"),
    JSON.stringify(
      {
        base,
        success,
        checks: passed.length,
        passed,
        uncaughtPageErrors: errors,
        hydrationErrors,
        cloudWrites,
        signupRequests,
        browser: browserVersion,
        screenshots,
        fixtureData: { key: setupKey, value: legacyFixture, isolatedGuestBrowserOnly: true },
        ...(failure ? { failure } : {}),
        limitations: [
          "Chromium viewport/touch emulation is not physical Android, TalkBack or OS text scaling.",
          "Guest browser contexts only; no live account, authenticated cloud write, email or deployed RLS verification.",
          "Legacy self-report is an explicitly injected test fixture, not an acting diagnosis or generated user result.",
          "Meisner editorial preview remains unreviewed, non-credit and session-only; written classification is not performance assessment.",
          "Published server curriculum depends on backend availability; this suite never seeds content or simulates academic progression.",
        ],
      },
      null,
      2,
    ) + "\n",
  );
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SLAMS_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  browserVersion = browser.version();
  async function guest(entered = true) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    if (entered)
      await context.addCookies([{ name: "slams_studio_entered", value: "1", url: base }]);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(25000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|server rendered HTML|didn't match/i.test(message.text())
      )
        hydrationErrors.push(message.text());
    });
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (/\/auth\/v1\/(signup|recover)/.test(pathname)) signupRequests++;
      if (
        !["GET", "HEAD", "OPTIONS"].includes(request.method()) &&
        /\/rest\/v1\/(passport_entries|audition_notes|unit_progress)(?:\/|$)/.test(pathname)
      )
        cloudWrites.push(request.method() + " " + pathname);
    });
    return { context, page };
  }
  const go = (page, route) => page.goto(base + route, { waitUntil: "networkidle" });
  async function shot(page, name) {
    if (!capture) return;
    await page.locator(".section-coach-note").evaluateAll(async (nodes) => {
      await Promise.all(
        nodes.flatMap((node) =>
          node
            .getAnimations()
            .filter(
              (a) =>
                a.playState !== "paused" && Number.isFinite(a.effect.getComputedTiming().endTime),
            )
            .map((a) => a.finished.catch(() => {})),
        ),
      );
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
    screenshots.push(name + ".png");
  }
  async function noOverflow(page, label) {
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label);
  }
  async function fiveNavigation(page, label) {
    const nav = page.getByRole("navigation", { name: "Main studio navigation", exact: true });
    check((await nav.count()) === 1 && (await nav.getByRole("link").count()) === 5, label);
  }
  async function visibleTarget(locator, label) {
    await locator.evaluate((node) => node.scrollIntoView({ block: "center" }));
    const hit = await locator.evaluate((node) => {
      const r = node.getBoundingClientRect();
      const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        large: r.width >= 43 && r.height >= 43,
        clear: node === target || node.contains(target),
      };
    });
    check(hit.large && hit.clear, label);
  }
  async function knowledgeToMode(workshop, label) {
    for (const [index, title] of [
      "Describe directly observable partner behavior",
      "Avoid inferring private emotions from appearance",
      "Say what you notice and receive the response",
    ].entries()) {
      check(
        await workshop.getByRole("heading", { name: title, exact: true }).isVisible(),
        `${label}: authored lesson ${index + 1}`,
      );
      await workshop
        .getByRole("button", {
          name: index === 2 ? "Try knowledge questions" : "Next lesson",
          exact: true,
        })
        .click();
    }
    await workshop.getByRole("button", { name: "Interpretation", exact: true }).click();
    check(
      await workshop.getByRole("button", { name: "Next example", exact: true }).isDisabled(),
      `${label}: incorrect written classification cannot advance`,
    );
    for (const [answer, next] of [
      ["Observation", "Next example"],
      ["Interpretation", "Next example"],
      ["My experience", "Next example"],
      ["Interpretation", "Choose practice mode"],
    ]) {
      await workshop.getByRole("button", { name: answer, exact: true }).click();
      check(
        (await workshop.getByRole("status").filter({ hasText: "Correct." }).count()) === 1,
        `${label}: ${answer} receives authored classification feedback`,
      );
      await workshop.getByRole("button", { name: next, exact: true }).click();
    }
    check(
      await workshop
        .getByRole("heading", { name: "Who can practise with you?", exact: true })
        .isVisible(),
      `${label}: practice choice reached`,
    );
  }
  async function reflection(workshop, partner) {
    await workshop
      .getByLabel(
        partner
          ? "What surprised you in the actual exchange?"
          : "What did you notice about your assumptions?",
        { exact: true },
      )
      .fill("Browser fixture: I noticed that my assumption was not an observable event.");
    check(
      await workshop
        .getByRole("button", { name: "Review private practice note", exact: true })
        .isDisabled(),
      `${partner ? "partner" : "solo"}: next adjustment is required`,
    );
    await workshop
      .getByLabel("What specific change will you try next?", { exact: true })
      .fill("Browser fixture: wait for the actual reply before choosing the next action.");
    await workshop
      .getByRole("button", { name: "Review private practice note", exact: true })
      .click();
    const note = workshop.getByRole("region", { name: "Private practice note", exact: true });
    const text = await note.innerText();
    check(
      text.includes("NO MASTERY OR TERM CREDIT") && text.includes("no Passport/cloud save"),
      `${partner ? "partner" : "solo"}: note accurately discloses no assessed or saved progression`,
    );
    check(
      text.includes(
        partner
          ? "partner practice (self-reported only)"
          : "solo preparation (not partner training)",
      ),
      `${partner ? "partner" : "solo"}: note describes the actual modality`,
    );
    check(
      (await note.getByRole("button", { name: "Copy my note", exact: true }).count()) === 1,
      `${partner ? "partner" : "solo"}: actor may explicitly copy their note`,
    );
  }
  try {
    const main = await guest();
    const { page } = main;
    await go(page, "/conservatory");
    const cards = page.locator(".school-gallery > li");
    check((await cards.count()) === 8, "Conservatory keeps all eight school cards");
    const positions = [];
    for (const [slug, name] of schools) {
      const card = page.locator(`.school-gallery > li[data-school='${slug}']`);
      const link = card.getByRole("link");
      check(
        (await link.getAttribute("href")) === "/conservatory/" + slug,
        `${name}: existing school route retained`,
      );
      check(
        (await card.locator(`[data-school-pose='${slug}']`).count()) === 1,
        `${name}: matching pose identity`,
      );
      check(
        (await card.innerText()).includes("Provisional structure"),
        `${name}: duration remains provisional`,
      );
      await visibleTarget(link, `${name}: card has a clear 44px touch target`);
      positions.push(
        await card
          .locator("[data-school-pose]")
          .evaluate((node) => getComputedStyle(node).backgroundPosition),
      );
    }
    check(new Set(positions).size === 8, "Eight school identities use eight distinct atlas cells");
    const atlas = await cards
      .first()
      .locator("[data-school-pose]")
      .evaluate(async (node) => {
        const url = getComputedStyle(node).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
        const image = new Image();
        image.src = url;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      });
    check(
      atlas.width / atlas.height === 2,
      "School atlas delivers a four-by-two grid of square scenes",
    );
    await page.getByRole("tab", { name: "In Progress", exact: true }).click();
    check(
      (await page
        .getByRole("tab", { name: "In Progress", exact: true })
        .getAttribute("aria-selected")) === "true",
      "In Progress is a real selected filter",
    );
    check(
      (await page.locator(".school-gallery:visible > li").count()) === 0,
      "Guest In Progress does not invent school activity",
    );
    await page.getByRole("tab", { name: "Completed", exact: true }).click();
    check(
      await page
        .getByRole("heading", { name: "School completion is not yet defined", exact: true })
        .isVisible(),
      "Completed filter discloses unavailable school certification",
    );
    await page.getByRole("tab", { name: "All Schools", exact: true }).click();
    check(
      (await page.locator(".school-gallery > li").count()) === 8,
      "All Schools restores the eight real entrances",
    );

    const pages = [
      ["/conservatory", "conservatory", false],
      ...schools.map(([slug]) => ["/conservatory/" + slug, "school-" + slug, false]),
      ["/conservatory/meisner/years/1", "meisner-year", false],
      ["/conservatory/meisner/years/1/terms/1", "meisner-term", false],
      ["/baseline", "baseline", false],
      ["/baseline?flow=welcome&tab=prepare", "welcome-baseline", true],
    ];
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
      for (const [route, name, welcome] of pages) {
        console.log(`${name}: ${width}px`);
        await go(page, route);
        check((await page.locator("h1").count()) === 1, `${name}: one heading at ${width}px`);
        await noOverflow(page, `${name}: no horizontal overflow at ${width}px`);
        if (welcome)
          check(
            (await page.getByRole("navigation", { name: "Main studio navigation" }).count()) === 0,
            `${name}: optional welcome stays immersive at ${width}px`,
          );
        else await fiveNavigation(page, `${name}: one five-destination bar at ${width}px`);
        if (name.startsWith("school-")) {
          const slug = name.slice("school-".length);
          check(
            (await page.locator(`.training-heading [data-school-pose='${slug}']`).count()) === 1,
            `${slug}: matching scenic school header at ${width}px`,
          );
        }
        if (
          (width === 390 || width === 1440) &&
          [
            "conservatory",
            "school-meisner",
            "meisner-term",
            "baseline",
            "welcome-baseline",
          ].includes(name)
        )
          await shot(page, `${name}-${width}`);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await go(page, "/baseline");
    await page.getByText("No self-description saved.", { exact: true }).waitFor();
    check(
      !/\d+%/.test(await page.locator(".baseline-experience").innerText()),
      "Fresh Baseline has no invented score or percentage",
    );
    check(
      (await page
        .getByRole("heading", { name: /your strengths|the verdict|acting profile score/i })
        .count()) === 0,
      "Fresh Baseline does not invent a diagnosis or strengths verdict",
    );
    check(
      (await page
        .getByRole("link", { name: "Skip to a first rehearsal", exact: true })
        .getAttribute("href")) === "/scene",
      "Baseline keeps its existing optional first-rehearsal route",
    );
    await visibleTarget(
      page.locator(".baseline-start"),
      "Baseline rehearsal action is large and unobstructed",
    );

    const legacy = await guest();
    await legacy.context.addInitScript(
      ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
      { key: setupKey, data: legacyFixture },
    );
    await go(legacy.page, "/baseline");
    await legacy.page
      .locator(".baseline-record")
      .getByText("Working actor", { exact: true })
      .waitFor();
    for (const goal of legacyFixture.goals)
      check(
        await legacy.page.locator(".baseline-record").getByText(goal, { exact: true }).isVisible(),
        "Legacy self-report fixture displays actual saved goal: " + goal,
      );
    check(
      (await legacy.page.locator(".baseline-self-report-note").innerText()).includes(
        "not a diagnosis or a training score",
      ),
      "Legacy values remain explicitly self-reported",
    );
    check(
      !/\d+%/.test(await legacy.page.locator(".baseline-experience").innerText()),
      "Legacy preferences do not produce an acting score",
    );
    check(
      await legacy.page.evaluate(
        ({ key, data }) => localStorage.getItem(key) === JSON.stringify(data),
        { key: setupKey, data: legacyFixture },
      ),
      "Viewing legacy preferences preserves their stored bytes",
    );
    await shot(legacy.page, "baseline-legacy-self-report-fixture-390");
    await legacy.context.close();

    const welcome = await guest(false);
    await go(welcome.page, "/");
    check(
      (await welcome.page
        .getByRole("link", { name: "Enter the Studio", exact: true })
        .getAttribute("href")) === "/scene",
      "Fresh entry remains directly connected to rehearsal, without mandatory Baseline",
    );
    await go(welcome.page, "/baseline?flow=welcome&tab=prepare");
    await welcome.page
      .getByRole("heading", { name: "Your Actor’s Baseline", exact: true })
      .waitFor();
    await welcome.page.getByRole("link", { name: "Start a first rehearsal", exact: true }).click();
    await welcome.page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
    check(
      new URL(welcome.page.url()).pathname === "/scene",
      "Optional welcome Baseline opens the real rehearsal",
    );
    await welcome.page
      .getByRole("link", { name: "Return to the Director’s Office", exact: true })
      .click();
    await welcome.page
      .getByRole("heading", { name: "The Director’s Office", exact: true })
      .waitFor();
    check(
      (await welcome.context.cookies()).some(
        (cookie) => cookie.name === "slams_studio_entered" && cookie.value === "1",
      ),
      "Welcome Baseline action remembers studio entry",
    );
    await welcome.context.close();

    for (const mode of ["on", "quiet", "off"]) {
      await go(page, "/director");
      await page
        .getByRole("group", { name: "Director mode", exact: true })
        .getByRole("button", { name: mode, exact: true })
        .click();
      for (const route of ["/baseline", "/conservatory/meisner"]) {
        await go(page, route);
        const coach = page
          .locator(".training-heading")
          .getByRole("complementary", { name: "Section coach", exact: true });
        if (mode === "off") {
          check((await coach.count()) === 0, `${route}: OFF hides the section coach`);
          continue;
        }
        check(
          (await coach.getAttribute("data-speaking")) === String(mode === "on"),
          `${route}: ${mode} retains its scripted presence rule`,
        );
        await coach.getByRole("button", { name: "Hear from the Director", exact: true }).click();
        await coach.getByRole("status").waitFor();
        if (mode === "quiet")
          check(
            (await coach.getByRole("status").innerText()).includes(
              route === "/baseline"
                ? "Your starting point, in your words."
                : "One school. One clear lens.",
            ),
            `${route}: QUIET uses the brief scripted note`,
          );
        check(
          await page.locator(".training-heading").evaluate((heading) => {
            const note = heading.querySelector(".section-coach-note").getBoundingClientRect();
            const frame = heading.getBoundingClientRect();
            const next = heading.nextElementSibling.getBoundingClientRect();
            return (
              note.top >= frame.top &&
              note.bottom <= frame.bottom + 1 &&
              note.bottom <= next.top + 1
            );
          }),
          `${route}: opened ${mode} note stays in the scenic header above working content`,
        );
        await visibleTarget(
          coach.getByRole("button"),
          `${route}: ${mode} coach control is large and unobstructed`,
        );
        if (route === "/baseline") await shot(page, `baseline-coach-${mode}-390`);
      }
    }
    await go(page, "/director");
    await page
      .getByRole("group", { name: "Director mode", exact: true })
      .getByRole("button", { name: "on", exact: true })
      .click();
    await go(page, "/baseline");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => document.querySelector(".app-shell").getAttribute("data-motion") === "off",
    );
    check(
      await page
        .locator(".section-coach-portrait")
        .evaluate((node) => node.getAnimations().length === 0),
      "Reduced motion stops the scenic-header portrait animation",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
      for (const route of ["/conservatory", "/baseline", "/conservatory/meisner/years/1/terms/1"]) {
        await go(page, route);
        await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
        await noOverflow(page, `${route}: 200% root text reflows at ${width}px`);
        await page.evaluate(() => document.documentElement.style.removeProperty("font-size"));
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await go(page, "/conservatory/meisner/years/1/terms/1");
    const workshop = page.getByRole("region", {
      name: "Interactive Meisner Workshop 1",
      exact: true,
    });
    check(
      (await page.locator("video,audio").count()) === 0,
      "Editorial lesson page introduces no simulated media player",
    );
    const storageBefore = await page.evaluate(() =>
      ["slams.passport.v1", "slams.audition.v1", "slams.actor-setup.v1.guest"].map((key) =>
        localStorage.getItem(key),
      ),
    );
    await knowledgeToMode(workshop, "solo attempt");
    check(
      await workshop.getByRole("radio", { name: "Solo preparation only", exact: true }).isChecked(),
      "Solo preparation is correctly identified as the default mode",
    );
    await workshop.getByRole("button", { name: "Begin practice", exact: true }).click();
    for (const [label, value] of [
      ["What observable event did you notice?", "Browser fixture: the chair moved."],
      ["What explanation or assumption occurred to you?", "Browser fixture: I assumed impatience."],
      [
        "How can you express this more accurately?",
        "Browser fixture: the chair moved to the left.",
      ],
    ])
      await workshop.getByLabel(label, { exact: true }).fill(value);
    check(
      (await workshop
        .getByRole("button", { name: "Exercise 02 — Receive", exact: true })
        .count()) === 0,
      "Solo preparation cannot masquerade as the second partner exercise",
    );
    await workshop.getByRole("button", { name: "Reflect on this attempt", exact: true }).click();
    await reflection(workshop, false);
    await shot(page, "meisner-solo-private-note-390");
    await workshop.getByRole("button", { name: "Start a new attempt", exact: true }).click();
    await knowledgeToMode(workshop, "human-partner attempt");
    await workshop.getByRole("radio", { name: "With a real human partner", exact: true }).check();
    const begin = workshop.getByRole("button", { name: "Begin practice", exact: true });
    check(await begin.isDisabled(), "Human-partner mode is gated before consent confirmations");
    await workshop
      .getByRole("checkbox", { name: "My partner voluntarily agreed.", exact: true })
      .check();
    check(
      await begin.isDisabled(),
      "One self-reported confirmation alone cannot begin partner practice",
    );
    await workshop.getByRole("checkbox", { name: /We can both pause or stop/ }).check();
    check(
      await begin.isEnabled(),
      "Both self-reported confirmations enable human-partner practice",
    );
    await begin.click();
    for (const [label, value] of [
      ["What observable event did you notice?", "Browser fixture: my partner looked away."],
      [
        "What explanation or assumption occurred to you?",
        "Browser fixture: I assumed they wanted to leave.",
      ],
      [
        "How can you express this more accurately?",
        "Browser fixture: they looked toward the door.",
      ],
    ])
      await workshop.getByLabel(label, { exact: true }).fill(value);
    check(
      await workshop
        .getByRole("button", { name: "Exercise 02 — Receive", exact: true })
        .isDisabled(),
      "Partner exercise requires the actual actor-written reply/correction field",
    );
    await workshop
      .getByLabel("How did your partner reply, confirm or correct you?", { exact: true })
      .fill("Browser fixture: they corrected my wording.");
    await workshop.getByRole("button", { name: "Exercise 02 — Receive", exact: true }).click();
    check(
      await workshop
        .getByRole("heading", { name: "Notice → Offer → Receive", exact: true })
        .isVisible(),
      "Human-partner path reaches the second authored exercise",
    );
    for (const [label, value] of [
      ["What reply did you originally predict?", "Browser fixture: yes."],
      ["What did your partner actually say or do?", "Browser fixture: they heard a noise."],
      ["How did your next response change?", "Browser fixture: I responded to the noise comment."],
    ])
      await workshop.getByLabel(label, { exact: true }).fill(value);
    await workshop.getByRole("button", { name: "Reflect on this attempt", exact: true }).click();
    await reflection(workshop, true);
    check(
      (await workshop
        .getByRole("button", {
          name: /mark complete|certify|award mastery|start recording|ai partner/i,
        })
        .count()) === 0,
      "Editorial practice offers no fabricated completion, mastery, recording or AI partner control",
    );
    check(
      JSON.stringify(
        await page.evaluate(() =>
          ["slams.passport.v1", "slams.audition.v1", "slams.actor-setup.v1.guest"].map((key) =>
            localStorage.getItem(key),
          ),
        ),
      ) === JSON.stringify(storageBefore),
      "Private workshop summary does not alter Passport, audition or actor setup storage",
    );
    await shot(page, "meisner-partner-private-note-390");

    await go(page, "/scene");
    await page.getByRole("button", { name: "Begin take", exact: true }).click();
    check(
      (await page.getByRole("complementary", { name: "Section coach", exact: true }).count()) ===
        0 &&
        (await page.getByRole("complementary", { name: "The Director", exact: true }).count()) ===
          0,
      "Director remains silent during an actual Living Scene take",
    );
    await go(page, "/");
    const opener = page.getByRole("button", { name: /^Explore the eight acting-school books/ });
    await opener.click();
    check(
      (await page
        .getByRole("dialog")
        .getByRole("link", { name: /^Open .+ school$/ })
        .count()) === 8,
      "Existing Office library still exposes eight school choices",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() =>
      document.activeElement
        ?.getAttribute("aria-label")
        ?.startsWith("Explore the eight acting-school books"),
    );
    check(
      await opener.evaluate((node) => document.activeElement === node),
      "Library Escape restores the exact opener focus",
    );
    check(signupRequests === 0, "No account creation or recovery request was made");
    check(cloudWrites.length === 0, "No cloud progress or record write was made");
    check(errors.length === 0, "No uncaught browser errors");
    check(hydrationErrors.length === 0, "No hydration errors");
    await main.context.close();
    report(true);
    console.log(JSON.stringify({ checks: passed.length, errors: errors.length, artifacts: out }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  report(false, error.message);
  console.error(error);
  process.exitCode = 1;
});
