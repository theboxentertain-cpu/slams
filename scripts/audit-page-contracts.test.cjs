const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateMap, report } = require("./audit-page-contracts.cjs");
const map = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../docs/product/SLAMS-47-PAGE-MAP.json"), "utf8"),
);
const fixture = () => structuredClone(map);
test("covers all 47 contracts and every implemented route, with one five-item navigation owner", () =>
  assert.deepEqual(validateMap(map), []));
test("fails when a page ID is missing or duplicated", () => {
  const m = fixture();
  m.pages[1].id = "P01";
  assert.match(validateMap(m).join(" "), /exactly P01/);
});
test("fails when documentation invents an unregistered route", () => {
  const m = fixture();
  m.pages[0].owner.route = "/invented-scene";
  assert.match(validateMap(m).join(" "), /no registered file route/);
});
test("fails on orphaned runtime route coverage", () => {
  const m = fixture();
  m.pages[2].owner.routeAliases = [];
  assert.match(validateMap(m).join(" "), /Unowned runtime route \/reset-password/);
});
test("fails on unavailable source ownership", () => {
  const m = fixture();
  m.pages[0].owner.sourceFiles = ["src/missing.tsx"];
  assert.match(validateMap(m).join(" "), /missing evidence source/);
});
test("fails on unresolved click graph targets", () => {
  const m = fixture();
  m.pages[0].actualOutgoing[0].targetPageIds = ["P48"];
  assert.match(validateMap(m).join(" "), /target P48 does not exist/);
});
test("fails if a sixth global navigation destination is documented", () => {
  const m = fixture();
  m.primaryNavigation.push({ label: "Passport", route: "/passport" });
  assert.match(validateMap(m).join(" "), /five implemented destinations/);
});
test("never upgrades incomplete contract acceptance when surface coverage passes", () => {
  const m = fixture();
  m.pages.forEach((p) => (p.verification.result = "PASS"));
  assert.equal(report(m).contractCompliance, "FAIL");
  assert.equal(report(m).commercialReadiness, "BLOCKED");
});
