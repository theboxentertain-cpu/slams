/* Blueprint traceability checks. --structure-only checks coverage; default also fails on open contract gaps. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const mapPath = path.join(root, "docs/product/SLAMS-47-PAGE-MAP.json");
function routeName(value) {
  return value.replace(/(\$[A-Za-z][A-Za-z0-9]*)_(?=\/|$)/g, "$1").replace(/\/$/, "") || "/";
}
function filesIn(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? filesIn(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
function validateMap(map) {
  const errors = [],
    pages = map.pages || [],
    expected = Array.from({ length: 47 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`),
    ids = pages.map((p) => p.id);
  if (pages.length !== 47 || new Set(ids).size !== 47 || expected.some((id) => !ids.includes(id)))
    errors.push("Expected exactly P01–P47 with no duplicate or missing IDs.");
  const source = fs
    .readFileSync(path.join(root, "src/lib/foundation.ts"), "utf8")
    .split("] as const;")[0];
  const navigation = [...source.matchAll(/label: "([^"]+)", to: "([^"]+)"/g)].map((m) => ({
    label: m[1],
    route: m[2],
  }));
  if (
    JSON.stringify(navigation) !== JSON.stringify(map.primaryNavigation) ||
    navigation.length !== 5
  )
    errors.push("Primary navigation must match the five implemented destinations exactly.");
  const routeSources = filesIn(path.join(root, "src/routes")).filter((f) => f.endsWith(".tsx"));
  const routes = new Set(
    routeSources.flatMap((f) =>
      [...fs.readFileSync(f, "utf8").matchAll(/createFileRoute\("([^"]+)"\)/g)].map((m) =>
        routeName(m[1]),
      ),
    ),
  );
  const owned = new Set(
    pages
      .flatMap((p) => [p.owner?.route, ...(p.owner?.routeAliases || [])])
      .filter(Boolean)
      .map(routeName),
  );
  for (const p of pages) {
    if (!p.owner?.component || !p.owner?.sourceFiles?.length || !p.owner?.forms?.length)
      errors.push(`${p.id}: missing component/source/UI form owner.`);
    if (!routes.has(routeName(p.owner?.route || "missing")))
      errors.push(`${p.id}: owner route has no registered file route.`);
    for (const file of [...(p.owner?.sourceFiles || []), ...(p.verification?.unitEvidence || [])])
      if (!fs.existsSync(path.join(root, file)))
        errors.push(`${p.id}: missing evidence source ${file}.`);
    if (
      !p.entrances?.length ||
      !p.primaryCta ||
      !p.actualOutgoing?.length ||
      !p.contract?.requiredClicks?.length ||
      !p.contract?.acceptance
    )
      errors.push(`${p.id}: incomplete entrance/CTA/click contract.`);
    if (
      p.verification?.testId !== `BP-${p.id}` ||
      !["PASS", "FAIL", "BLOCKED", "NOT RUN"].includes(p.verification?.result)
    )
      errors.push(`${p.id}: missing or invalid verification binding.`);
    if (!["PASS", "FAIL", "BLOCKED"].includes(p.sourceAudit?.result))
      errors.push(`${p.id}: invalid source audit result.`);
    for (const edge of p.actualOutgoing || [])
      for (const target of edge.targetPageIds || [])
        if (!expected.includes(target))
          errors.push(`${p.id}: outgoing target ${target} does not exist.`);
    for (const file of p.owner?.sourceFiles || [])
      if (path.isAbsolute(file) || file.split("/").includes(".."))
        errors.push(`${p.id}: evidence path must stay in this repository.`);
  }
  for (const file of routeSources) {
    const code = fs.readFileSync(file, "utf8");
    for (const m of code.matchAll(/createFileRoute\("([^"]+)"\)/g)) {
      // Outlet-only files are explicit layouts, not additional page contracts.
      if (!owned.has(routeName(m[1])) && !code.includes("<Outlet"))
        errors.push(`Unowned runtime route ${m[1]} (${path.relative(root, file)}).`);
    }
  }
  const navOwners = filesIn(path.join(root, "src/components")).filter(
    (f) =>
      f.endsWith(".tsx") &&
      fs.readFileSync(f, "utf8").includes('aria-label="Main studio navigation"'),
  );
  if (navOwners.length !== 1) errors.push("Expected one implemented global navigation owner.");
  return errors;
}
function report(map) {
  const errors = validateMap(map),
    failures = map.pages.filter((p) => p.sourceAudit.result === "FAIL"),
    blocked = map.pages.filter((p) => p.sourceAudit.result === "BLOCKED");
  return {
    blueprintSHA256: map.blueprint.sha256,
    baselineCommit: map.baselineCommit,
    coverage: errors.length ? "FAIL" : "PASS",
    mappedPages: map.pages.length,
    structuralErrors: errors,
    contractCompliance:
      errors.length || failures.length ? "FAIL" : blocked.length ? "BLOCKED" : "PASS",
    unresolvedFailures: failures.map((p) => ({ id: p.id, findings: p.sourceAudit.findings })),
    blocked: blocked.map((p) => ({ id: p.id, findings: p.sourceAudit.findings })),
    browserSurfaceResults: Object.fromEntries(
      ["PASS", "FAIL", "BLOCKED", "NOT RUN"].map((s) => [
        s,
        map.pages.filter((p) => p.verification.result === s).length,
      ]),
    ),
    commercialReadiness: "BLOCKED",
  };
}
function document(map, result) {
  const escape = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [
    "# SLAMS — 47-page traceability",
    "",
    `Source: **${map.blueprint.filename} v${map.blueprint.version}**, SHA256 \`${map.blueprint.sha256}\`. Base: latest fetched main \`${map.baselineCommit.slice(0, 7)}\`; branch \`${map.branch}\`.`,
    "",
    "Page IDs are functional responsibilities. Shared routes, tabs, dialogs and scene stages are deliberate consolidation. No extra route is created for numbering. The machine-readable [map](SLAMS-47-PAGE-MAP.json) retains every supplied layout, required click and acceptance condition alongside actual owners and outgoing interactions.",
    "",
    `**Coverage ${result.coverage}: ${result.mappedPages}/47. Full contract compliance ${result.contractCompliance}. Commercial readiness BLOCKED.** A source-audit PASS is limited to supported/disclosed capabilities. Browser PASS proves the stated surface/click check, not complete target functionality, educational review or live cloud behavior. Unit evidence paths are related test sources, not a claim that every target requirement is tested.`,
    "",
    "| ID / page | Route / view / actual owner | Functionality / contract result | Primary action / reachable entrance | Browser case / result | Open requirement |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const p of map.pages)
    lines.push(
      `| ${p.id} — ${escape(p.title)} | \`${p.owner.route}\` · ${p.owner.forms.join("/")} · ${escape(p.owner.component)} | ${p.functionalStatus} / ${p.sourceAudit.result} | ${escape(p.primaryCta)}; from ${escape(p.entrances.join("; "))} | ${p.verification.testId} / ${p.verification.result} | ${escape(p.sourceAudit.findings.join(" ") || "No additional gap in bounded implemented/disclosed responsibility.")} |`,
    );
  lines.push("", "## Actual click graph and evidence", "");
  for (const p of map.pages)
    lines.push(
      `### ${p.id} — ${p.title}`,
      "",
      `Owner: ${p.owner.sourceFiles.map((f) => `\`${f}\``).join(", ")}.`,
      "",
      `Actual outgoing actions: ${p.actualOutgoing.map((e) => e.label).join("; ")}.`,
      "",
      `Blueprint acceptance: ${p.contract.acceptance}`,
      "",
      `Baseline contract result: **${p.sourceAudit.baselineResult}**; current result: **${p.sourceAudit.result}**. ${p.sourceAudit.fixedInThisPR || ""}`,
      "",
    );
  lines.push(
    "## Reproduce",
    "",
    "`node scripts/audit-page-contracts.cjs --structure-only` validates all 47 owners, registered routes, test bindings, click targets and the single five-item navigation owner. `node scripts/audit-page-contracts.cjs` also returns a failing exit status for the remaining contract mismatches. This intentional FAIL must not be treated as completion. `--write-doc` regenerates this document from the map. See [release verification](SLAMS-RELEASE-VERIFICATION.md) for actual commands, screenshots, browser scope and external blockers.",
    "",
  );
  return lines.map((line) => line.trimEnd()).join("\n");
}
if (require.main === module) {
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8")),
    result = report(map);
  if (process.argv.includes("--write-doc"))
    fs.writeFileSync(
      path.join(root, "docs/product/SLAMS-47-PAGE-TRACEABILITY.md"),
      document(map, result),
    );
  const output = process.argv.indexOf("--output");
  if (output >= 0)
    fs.writeFileSync(process.argv[output + 1], JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
  process.exitCode =
    result.coverage !== "PASS" ||
    (!process.argv.includes("--structure-only") && result.contractCompliance !== "PASS")
      ? 1
      : 0;
}
module.exports = { validateMap, report };
