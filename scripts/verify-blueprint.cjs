/* Compiled guest checks for each of the 47 contracts. No live signup/email/cloud mutation. */
const { chromium } = require(process.env.SLAMS_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const base = process.env.SLAMS_BASE_URL || "http://localhost:3100";
const out = process.env.SLAMS_ARTIFACT_DIR || "/tmp/slams-blueprint-verification";
fs.mkdirSync(out, { recursive: true });
const passed = [],
  cases = [],
  errors = [];
let activeChecks = [],
  authRequests = 0;
function check(value, message) {
  assert.ok(value, message);
  passed.push(message);
  activeChecks.push(message);
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SLAMS_CHROMIUM || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/auth/v1/")) authRequests++;
  });
  const go = async (route) => {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.locator("h1").waitFor();
  };
  const shot = async (name) => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
  };
  const count = async (locator) => locator.count();
  async function contract(id, work, result = "PASS") {
    activeChecks = [];
    await work();
    cases.push({
      id,
      testId: "BP-" + id,
      result,
      assertionResult: "PASS",
      checks: [...activeChecks],
      url: new URL(page.url()).pathname + new URL(page.url()).search,
      scope:
        result === "BLOCKED"
          ? "Only unavailable/invalid-unit handling checked; no reviewed unit was supplied."
          : "Implemented surface and stated clicks only; not full target functionality or live backend acceptance.",
    });
    console.log(id + " " + result);
  }
  async function gate(route, target, label) {
    await go(route);
    check(
      (await count(page.getByRole("heading", { name: "In development", exact: true }))) === 1,
      label + " explicitly gated",
    );
    check(
      (await page.locator("main").getByRole("link", { name: target }).getAttribute("href")) !==
        null,
      label + " has a real supported next step",
    );
  }
  async function toReflection(p, afterBegin = async () => {}) {
    await p.getByRole("button", { name: "Begin take", exact: true }).click();
    await afterBegin();
    await p.getByRole("button", { name: /^To plead/ }).click();
    await p.getByRole("button", { name: "Cut — call an intervention" }).click();
    await p.getByRole("button", { name: /Meisner — Listening/ }).click();
    await p
      .getByLabel("Your exercise", { exact: true })
      .fill("I observed Sam looking at the door.");
    await p.getByRole("button", { name: "Go to retake" }).click();
    await p.getByLabel("Your new line or action", { exact: true }).fill("I wait beside the door.");
    await p.getByRole("button", { name: "Cut — end take" }).click();
  }
  try {
    await contract("P01", async () => {
      await go("/");
      check(
        (await count(page.getByRole("heading", { name: "Welcome to SLAMS", exact: true }))) === 1,
        "Fresh visitor receives welcome",
      );
      await page.getByRole("link", { name: "Enter the Studio", exact: true }).click();
      check(
        new URL(page.url()).pathname === "/welcome/account",
        "Blueprint Enter opens Account Choice",
      );
    });
    await contract("P02", async () => {
      await page.getByRole("heading", { name: "Welcome, Actor.", exact: true }).waitFor();
      await page.getByRole("link", { name: /Explore as Guest/ }).waitFor();
      check(
        (await count(page.getByRole("link", { name: /Explore as Guest/ }))) === 1,
        "Guest is a real optional account choice",
      );
      check(
        (await count(page.getByText(/Rehearsals and notes stay in this browser/))) === 1,
        "Guest storage disclosed",
      );
      await page.getByRole("link", { name: "Skip to the Office", exact: true }).click();
      await page.getByRole("heading", { name: "The Director’s Office", exact: true }).waitFor();
      check(true, "Account/setup can be skipped to Office");
    });
    await contract("P03", async () => {
      await go("/auth?mode=signup&flow=welcome");
      await page.getByLabel("Confirm password", { exact: true }).waitFor();
      check(
        (await count(page.getByLabel("Confirm password", { exact: true }))) === 1,
        "Existing signup confirmation field remains",
      );
      check(
        (await count(page.getByRole("button", { name: "Forgot password?" }))) === 1,
        "Recovery path remains available",
      );
      check(
        (await count(page.getByRole("button", { name: /Google|Apple/ }))) === 0,
        "No fake OAuth provider enabled",
      );
    });
    await contract("P04", async () => {
      await go("/welcome/setup");
      await page.getByRole("checkbox", { name: "Reduce motion", exact: true }).waitFor();
      check(
        (await count(page.getByRole("heading", { name: "Actor Setup", exact: true }))) === 1,
        "Optional actor setup owner exists",
      );
      check(
        (await count(page.getByRole("checkbox", { name: "Reduce motion", exact: true }))) === 1,
        "Real motion preference offered",
      );
      check(
        (await count(page.getByRole("link", { name: "Skip setup for now" }))) === 1,
        "Setup skip remains available",
      );
    });
    await contract("P05", async () => {
      await gate("/baseline", "Skip to a first rehearsal", "Baseline");
      check(
        (await count(page.getByRole("button", { name: /Score|Diagnose/ }))) === 0,
        "No invented baseline diagnostic",
      );
    });
    await contract("P06", async () => {
      await go("/");
      await page.getByText("Guest actor", { exact: true }).waitFor();
      check(
        (await count(
          page.getByRole("navigation", { name: "Main studio navigation" }).getByRole("link"),
        )) === 5,
        "Exactly five studio destinations",
      );
      check(
        (await count(page.getByRole("tab", { name: /The desk/ }))) === 1,
        "Office has explicit desk room entrance",
      );
      check(
        (await count(page.getByRole("link", { name: "Go to the rehearsal studio" }))) === 1,
        "Rehearsal entrance needs no swipe",
      );
    });
    await contract("P07", async () => {
      await page.getByRole("button", { name: /The Director — Acting Coach/ }).click();
      await page.getByRole("dialog").waitFor();
      check(
        (await count(page.getByRole("dialog").getByRole("group", { name: "Director mode" }))) === 1,
        "Coach modal uses existing Director modes",
      );
      check(
        (await page
          .getByRole("dialog")
          .getByRole("link", { name: /Meet the Director/ })
          .getAttribute("href")) === "/director",
        "Coach points to single Director profile",
      );
      await page.keyboard.press("Escape");
    });
    await contract("P08", async () => {
      const books = page.getByRole("button", {
        name: "Explore the eight acting-school books — The Conservatory",
      });
      await books.focus();
      await page.keyboard.press("Enter");
      await page.getByRole("dialog").waitFor();
      check(
        (await count(page.getByRole("dialog").getByRole("link", { name: /^Open .+ school$/ }))) ===
          8,
        "Bookcase has eight real school destinations",
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") ===
          "Explore the eight acting-school books — The Conservatory",
      );
      await books
        .evaluate((n) => n === document.activeElement)
        .then((v) => check(v, "Closing bookcase restores trigger focus"));
    });
    await contract("P09", async () => {
      await page.getByRole("tab", { name: /Work wall/ }).click();
      await page.getByRole("heading", { name: "The Work Wall", exact: true }).waitFor();
      check(
        (await count(page.locator(".office-room-wall a[href='/work']"))) >= 1,
        "Casting wall leads to actual Work owner",
      );
      check(
        (await count(page.locator(".office-room-wall a[href='/matrix']"))) === 1,
        "Wall technique board retains gated Matrix entrance",
      );
    });
    await contract("P10", async () => {
      await page.getByRole("tab", { name: /Rehearsal corner/ }).click();
      await page.locator(".corner-stage-link").waitFor();
      for (const route of ["/baseline", "/lab", "/lounge"])
        check(
          (await count(page.locator(`.office-room-corner a[href='${route}']`))) === 1,
          "Corner object points to " + route,
        );
    });
    await contract("P11", async () => {
      await go("/conservatory");
      check(
        (await count(page.locator(".school-selector li"))) === 8,
        "Library retains all eight schools",
      );
      check((await count(page.getByRole("tab"))) === 3, "Library three states remain");
    });
    await contract("P12", async () => {
      await go("/conservatory/meisner");
      check((await count(page.getByRole("tab"))) === 5, "School retains five actual tabs");
      await page.getByRole("tab", { name: "Curriculum", exact: true }).click();
      check(
        (await count(page.locator("main a[href='/conservatory/meisner/years/1']"))) === 1,
        "School curriculum resolves real Year 1",
      );
    });
    await contract("P13", async () => {
      await go("/conservatory/meisner/years/1");
      check(
        (await count(page.locator("main a[href='/conservatory/meisner/years/1/terms/1']"))) === 1,
        "Year resolves canonical term",
      );
      check(
        (await count(page.locator("main a[href*='tab=curriculum']"))) === 1,
        "Year preserves school curriculum return",
      );
    });
    await contract("P14", async () => {
      await go("/conservatory/meisner/years/1/terms/1");
      check(
        (await count(page.locator("main a[href='/conservatory/meisner/years/1']"))) === 1,
        "Term preserves inline Year return",
      );
      check(
        (await count(page.getByRole("button", { name: /Mark complete/ }))) === 0,
        "Term shell cannot award progress",
      );
    });
    for (const [id, kind] of [
      ["P15", "course"],
      ["P16", "lesson"],
      ["P17", "exercise"],
      ["P18", "assessment"],
    ])
      await contract(
        id,
        async () => {
          await go(`/conservatory/meisner/units/${kind}/00000000-0000-4000-8000-000000000001`);
          check(
            (await count(page.getByRole("button", { name: "Mark complete", exact: true }))) === 0,
            id + " unavailable synthetic unit cannot complete",
          );
          check(
            (await count(page.locator("main h1"))) === 1,
            id + " missing/unavailable material has a page state",
          );
        },
        "BLOCKED",
      );
    await contract("P19", async () => {
      await go("/conservatory/meisner?tab=progress");
      check(
        (await page
          .getByRole("tab", { name: "Progress", exact: true })
          .getAttribute("aria-selected")) === "true",
        "School Progress is the same school owner",
      );
      check(
        (await page.getByRole("link", { name: "Open detailed progress" }).getAttribute("href")) ===
          "/progress",
        "School progress connects to real activity",
      );
    });
    await contract("P20", () => gate("/matrix", "Explore the schools", "Matrix"));
    await contract("P21", async () => {
      await go("/rehearsal");
      check(
        (await page
          .getByRole("link", { name: "Start rehearsal", exact: true })
          .getAttribute("href")) === "/scene",
        "One action from Hub enters working briefing",
      );
    });
    await contract("P22", async () => {
      check(
        (await count(page.getByText("“Stay”", { exact: true }))) === 1,
        "Library contains authored Stay demo",
      );
      await page.getByRole("tab", { name: "New Scene", exact: true }).click();
      check(
        (await count(page.getByRole("heading", { name: "In development", exact: true }))) === 1,
        "Personal scene creation remains gated",
      );
      await page.getByRole("tab", { name: "My Scenes", exact: true }).click();
      await page.getByRole("link", { name: "Start rehearsal", exact: true }).click();
    });
    await contract("P23", async () => {
      await page.getByRole("button", { name: "Begin take", exact: true }).waitFor();
      check(
        (await count(page.getByText(/Objective: Get Sam to stay/))) === 1,
        "Briefing states actual authored objective",
      );
      check(
        (await count(page.getByText(/responses are fixed and scripted/))) === 1,
        "Briefing declares fixed partner responses",
      );
    });
    await contract("P24", async () => {
      const modes = page.getByRole("group", { name: "Director mode" });
      await modes.getByRole("button", { name: "off", exact: true }).click();
      check(
        (await count(page.getByRole("complementary", { name: "The Director" }))) === 0,
        "OFF removes note",
      );
      await modes.getByRole("button", { name: "quiet", exact: true }).click();
      await page.getByRole("complementary", { name: "The Director" }).waitFor();
      check(
        await page
          .getByRole("complementary", { name: "The Director" })
          .innerText()
          .then((v) => !v.includes("I'll stay silent")),
        "QUIET uses brief note",
      );
      await modes.getByRole("button", { name: "on", exact: true }).click();
      await page.getByRole("button", { name: "Begin take", exact: true }).click();
      check(
        (await count(page.getByRole("complementary", { name: "The Director" }))) === 0,
        "Director stays silent during take",
      );
      await page.getByRole("button", { name: /^To plead/ }).click();
      check(
        (await count(page.getByText(/Sam softens/))) === 1,
        "Authored tactic produces its fixed response",
      );
    });
    await contract("P25", async () => {
      await page.getByRole("button", { name: "Cut — call an intervention" }).click();
      await page.getByRole("button", { name: /Meisner — Listening/ }).click();
      check(
        await page.getByRole("button", { name: "Go to retake" }).isDisabled(),
        "Practice requires actor input",
      );
      await page
        .getByLabel("Your exercise", { exact: true })
        .fill("I observed Sam looking at the door.");
      await page.getByRole("button", { name: "Go to retake" }).click();
    });
    await contract("P26", async () => {
      check(
        (await count(page.getByText(/Earlier tactic: To plead/))) === 1,
        "Retake retains earlier tactic context",
      );
      await page
        .getByLabel("Your new line or action", { exact: true })
        .fill("I wait beside the door.");
      await page.getByRole("button", { name: "Back to exercise", exact: true }).click();
      check(
        (await page.getByLabel("Your exercise", { exact: true }).inputValue()) ===
          "I observed Sam looking at the door.",
        "Returning to exercise retains draft note",
      );
      await page.getByRole("button", { name: "Go to retake" }).click();
      check(
        (await page.getByLabel("Your new line or action", { exact: true }).inputValue()) ===
          "I wait beside the door.",
        "Exercise round trip retains retake",
      );
      await shot("retake-mobile");
      await page.getByRole("button", { name: "Cut — end take" }).click();
    });
    await contract("P27", async () => {
      const summary = page.getByRole("region", { name: "Rehearsal summary" });
      check(
        await summary
          .innerText()
          .then((v) => v.includes("Sam softens") && v.includes("I wait beside the door.")),
        "Review shows authored response and actor retake",
      );
      await page
        .getByLabel("Reflection", { exact: true })
        .fill("Waiting changed my action. This is my own observation.");
      await page.getByRole("button", { name: "Practice again", exact: true }).click();
      await page
        .getByLabel("Your new line or action", { exact: true })
        .fill("I put the keys down and wait.");
      await page.getByRole("button", { name: "Cut — end take" }).click();
      check(
        (await page.getByLabel("Reflection", { exact: true }).inputValue()) ===
          "Waiting changed my action. This is my own observation.",
        "Practice again preserves reflection",
      );
      check(
        (await page
          .getByRole("link", { name: "Return to rehearsal without saving" })
          .getAttribute("href")) === "/rehearsal",
        "Unsaved exit returns to Hub explicitly",
      );
      await shot("reflection-mobile");
    });
    await contract("P28", async () => {
      await page.getByRole("button", { name: "Save to Passport", exact: true }).click();
      await page.getByRole("heading", { name: "Saved to your Passport", exact: true }).waitFor();
      check(
        (await count(page.getByText(/Stored in this browser only/))) === 1,
        "Save confirms guest storage only",
      );
      check(
        (await page
          .getByRole("link", { name: "Open Passport", exact: true })
          .getAttribute("href")) === "/passport",
        "Saved confirmation connects to Passport",
      );
      await page.getByRole("link", { name: "Return to the rehearsal studio" }).click();
      await page.getByRole("heading", { name: "Rehearsal Studio", exact: true }).waitFor();
      check(true, "Saved confirmation returns to Hub");
    });
    await contract("P29", () => gate("/lab", "Run a text-only take", "Lab"));
    await contract("P30", () => gate("/lounge", "Rehearse solo", "Lounge"));
    await contract("P31", async () => {
      await go("/work");
      check(
        (await page
          .getByRole("link", { name: "Open audition preparation", exact: true })
          .getAttribute("href")) === "/work/audition?tab=preparation",
        "Work anchors actual preparation",
      );
      await page.getByText("Tools in development", { exact: true }).click();
      check(
        (await count(page.locator("details[open] a"))) === 4,
        "Four professional tools remain availability links",
      );
    });
    await contract("P32", async () => {
      await go("/work/audition?tab=preparation");
      await page.getByLabel("Role & project").fill("Ada — browser-owned audition");
      await page
        .getByLabel("What do you want from the other person?", { exact: true })
        .fill("Get Sam to stay");
      await page.getByRole("tab", { name: "Character", exact: true }).click();
      await page.getByRole("tab", { name: "Character", exact: true, selected: true }).waitFor();
      await page.getByRole("tab", { name: "Preparation", exact: true }).click();
      await page.getByRole("tab", { name: "Preparation", exact: true, selected: true }).waitFor();
      check(
        (await page.getByLabel("Role & project").inputValue()) === "Ada — browser-owned audition",
        "Unsaved audition edits survive tabs",
      );
      await page.getByRole("button", { name: "Save audition prep", exact: true }).click();
      await page.getByText("Saved in this browser.", { exact: true }).waitFor();
      await page.reload({ waitUntil: "networkidle" });
      check(
        (await page.getByLabel("Role & project").inputValue()) === "Ada — browser-owned audition",
        "Actual audition save survives reload",
      );
    });
    await contract("P33", async () => {
      await go("/work");
      await page.getByText("Ada — browser-owned audition", { exact: true }).waitFor();
      check(
        (await count(
          page.getByText(/Multiple audition files and deadlines are in development/),
        )) === 1,
        "Single saved workspace is not presented as a multi-audition list",
      );
    });
    for (const [id, route, target] of [
      ["P34", "/work/character", "Open audition preparation"],
      ["P35", "/work/breakdown", "Rehearse the demonstration scene"],
      ["P36", "/work/self-tape", "Run a text-only take"],
      ["P37", "/work/journal", "Open saved reflections"],
    ])
      await contract(id, () => gate(route, target, id));
    await contract("P38", async () => {
      await go("/stuck");
      check(
        (await count(page.getByText(/pending faculty review/))) === 1,
        "Stuck suggestions retain review disclosure",
      );
      await page
        .getByRole("button", { name: "I'm in my head / planning lines", exact: true })
        .click();
      check(
        (await count(
          page.getByRole("link", { name: "Practice in the scripted demonstration" }),
        )) === 1,
        "Supported remedy reaches a real rehearsal",
      );
    });
    await contract("P39", () =>
      gate("/stuck/diagnosis", "Explore existing draft interventions", "Diagnosis"),
    );
    await contract("P40", async () => {
      await go("/stuck/intervention?tab=exercises");
      check(
        new URL(page.url()).pathname === "/stuck",
        "Legacy intervention redirects to canonical inline owner",
      );
      check(
        (await count(
          page.getByRole("button", { name: "I'm in my head / planning lines", exact: true }),
        )) === 1,
        "Canonical authored remedy remains reachable",
      );
    });
    await contract("P41", () => gate("/stuck/retry", "Try the Living Scene", "Retry"));
    await contract("P42", () => gate("/stuck/saved", "Open rehearsal records", "Saved fixes"));
    await contract("P43", async () => {
      await go("/passport");
      await page
        .getByText("“Waiting changed my action. This is my own observation.”", { exact: true })
        .waitFor();
      check(
        (await count(page.getByText("I put the keys down and wait.", { exact: false }))) === 1,
        "Passport stores the revised actual retake",
      );
      await page.reload({ waitUntil: "networkidle" });
      await page
        .getByText("“Waiting changed my action. This is my own observation.”", { exact: true })
        .waitFor();
      check(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("slams.passport.v1")).length === 1,
        ),
        "One actual record survives reload",
      );
      await shot("passport-mobile");
    });
    await contract("P44", async () => {
      await go("/progress");
      check(
        (await count(
          page.getByText(/Whole-school completion and advancement require reviewed requirements/),
        )) === 1,
        "Progress does not convert counts into mastery",
      );
      check(
        (await count(page.getByRole("link", { name: /Resume.*rehearsal/i }))) === 0,
        "Completed reflections do not become draft resumes",
      );
    });
    await contract("P45", async () => {
      await go("/director");
      const mode = page.getByRole("group", { name: "Director mode" });
      await mode.getByRole("button", { name: "off", exact: true }).click();
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(
        () =>
          document.querySelector('.director-controls button[aria-pressed="true"]')?.textContent ===
          "off",
      );
      check(true, "Director preference persists through reload");
    });
    await contract("P46", async () => {
      for (const tab of ["account", "privacy", "language", "accessibility"]) {
        await go("/settings?tab=" + tab);
        check(
          (await page.getByRole("link", { name: "Help & Studio Guide" }).getAttribute("href")) ===
            "/help",
          "Help directly reachable from " + tab,
        );
      }
      await shot("settings-mobile");
      await page.getByRole("link", { name: "Help & Studio Guide" }).click();
    });
    await contract("P47", async () => {
      await page.getByRole("heading", { name: "Your studio, explained", exact: true }).waitFor();
      const task = page.getByRole("navigation", { name: "Choose your studio task" });
      for (const [label, route] of [
        ["Train", "/conservatory"],
        ["Rehearse", "/rehearsal"],
        ["Work", "/work"],
        ["Get Unstuck", "/stuck"],
      ])
        check(
          (await task.getByRole("link", { name: label, exact: true }).getAttribute("href")) ===
            route,
          label + " opens canonical destination",
        );
      await shot("help-mobile");
    });
    // A separate first-use context proves the explicit unsaved exit makes no completion record.
    const unsavedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const unsaved = await unsavedContext.newPage();
    unsaved.on("pageerror", (e) => errors.push(e.message));
    await unsaved.goto(base + "/", { waitUntil: "networkidle" });
    await unsaved.getByRole("link", { name: "Enter the Studio", exact: true }).click();
    await unsaved.getByRole("link", { name: "Skip to the Office", exact: true }).click();
    await unsaved.getByRole("heading", { name: "The Director’s Office", exact: true }).waitFor();
    await unsaved.getByRole("link", { name: /^Start rehearsal —/ }).click();
    await toReflection(unsaved, async () =>
      check(
        (await unsaved.getByRole("button", { name: /^To plead/ }).count()) === 1,
        "Four entry activations reach acting choices using optional setup skip",
      ),
    );
    await unsaved.getByLabel("Reflection", { exact: true }).fill("Discard this unsaved note");
    await unsaved.getByRole("link", { name: "Return to rehearsal without saving" }).click();
    await unsaved.getByRole("heading", { name: "Rehearsal Studio", exact: true }).waitFor();
    check(
      await unsaved.evaluate(() => localStorage.getItem("slams.passport.v1") === null),
      "Unsaved exit creates no Passport entry",
    );
    await unsavedContext.close();
    for (const width of [320, 360, 390, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
      for (const route of ["/help", "/settings?tab=accessibility", "/scene"]) {
        await go(route);
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          route + ": no horizontal overflow at " + width,
        );
        check(
          (await count(
            page.getByRole("navigation", { name: "Main studio navigation" }).getByRole("link"),
          )) === 5,
          route + ": sole five-item studio bar at " + width,
        );
      }
      await toReflection(page);
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        "Reflection summary wraps at " + width,
      );
      const actions = page.locator(
        "main .studio-action-primary:visible,main .studio-action-secondary:visible",
      );
      check(
        await actions.evaluateAll((nodes) =>
          nodes.every((n) => {
            const r = n.getBoundingClientRect();
            return r.width >= 43 && r.height >= 43;
          }),
        ),
        "Reflection actions meet touch target at " + width,
      );
      if (width === 390 || width === 1440) {
        await shot("reflection-" + (width === 390 ? "mobile" : "desktop"));
        await go("/help");
        await shot("help-" + (width === 390 ? "mobile" : "desktop"));
      }
    }
    await page.setViewportSize({ width: 320, height: 844 });
    await go("/scene");
    await toReflection(page);
    await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "Reflection supports enlarged root text without overflow",
    );
    await page.getByRole("button", { name: "Practice again", exact: true }).focus();
    check(
      await page
        .getByRole("button", { name: "Practice again", exact: true })
        .evaluate((n) => n === document.activeElement),
      "Repeat control remains keyboard focusable at enlarged text",
    );
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => document.querySelector(".app-shell").getAttribute("data-motion") === "off",
    );
    check(true, "Device reduced motion respected");
    check(
      cases.length === 47 && new Set(cases.map((c) => c.id)).size === 47,
      "All 47 contract cases have results",
    );
    check(authRequests === 0, "Guest suite made no authentication/email requests");
    check(errors.length === 0, "No uncaught page errors");
    const result = {
      base,
      blueprintSHA256: "407f1011d479bee731141f3cf0b76f797b075ac65e6840aead6797c94c4211da",
      browser: await browser.version(),
      checks: passed.length,
      passed,
      cases,
      authRequests,
      uncaughtPageErrors: errors,
      limitations: [
        "P15–P18 reviewed material unavailable: BLOCKED; synthetic IDs only test unavailable-unit safety.",
        "PASS cases are bounded surface/click checks, not complete blueprint acceptance.",
        "No live email, independently confirmed accounts, deployed RLS, cloud writes or physical Android/TalkBack.",
        "Manual operator and human five-minute usability/performance study NOT RUN.",
      ],
    };
    fs.writeFileSync(
      path.join(out, "blueprint-results.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        passed: passed.length,
        pageCases: cases.length,
        blocked: cases.filter((c) => c.result === "BLOCKED").length,
        artifacts: out,
      }),
    );
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
