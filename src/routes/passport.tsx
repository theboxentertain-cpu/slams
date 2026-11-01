import { createFileRoute, Link, type SearchSchemaInput } from "@tanstack/react-router";
import { useState } from "react";
import { validateTab } from "@/lib/foundation";
import { SectionTabs, Unavailable } from "@/components/foundation/SectionTabs";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { usePassport } from "@/lib/store";

export const Route = createFileRoute("/passport")({
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("passport", input),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Actor's Passport — SLAMS" },
      { name: "description", content: "Your completed rehearsals and reflections." },
      { property: "og:title", content: "Actor's Passport — SLAMS" },
      { property: "og:description", content: "Your completed rehearsals and reflections." },
    ],
  }),
  component: Passport,
});

function Passport() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    error,
    entries,
    loaded,
    signedIn,
    sessionLoading,
    localCount,
    remove,
    clear,
    importLocalToCloud,
  } = usePassport();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    const res = await importLocalToCloud();
    setImporting(false);
    const summary = `Imported ${res.imported} ${res.imported === 1 ? "entry" : "entries"} to your account.`;
    setImportMsg(res.error ? `${summary} ${res.error}` : summary);
  }

  return (
    <Page title="Actor's Passport" eyebrow="Studio system">
      <SectionTabs
        page="passport"
        value={tab}
        onChange={(tab) => void navigate({ search: { tab } })}
      >
        {(current) =>
          current !== "journey" ? (
            <Unavailable>
              {current === "evidence"
                ? "Your saved text reflections are available in Journey. Recording and evidence attachments are not implemented."
                : current === "badges"
                  ? "No competence badges are awarded. Reviewed achievement criteria are not available."
                  : "Portfolio projects and assessment records are in development."}
            </Unavailable>
          ) : (
            <div>
              {!sessionLoading && !signedIn && (
                <p className="mb-4 rounded border border-warning p-3 text-sm">
                  Local-only: entries live in this browser. Clearing browser data deletes them.{" "}
                  <Link to="/auth" className="underline">
                    Sign in to save them to your account.
                  </Link>
                </p>
              )}
              {signedIn && (
                <p className="mb-4 rounded border border-border p-3 text-sm">
                  Entries are saved to your account. Cross-device behavior still requires live
                  verification.
                </p>
              )}
              {signedIn && localCount > 0 && (
                <div className="mb-4 rounded border border-amber p-3 text-sm">
                  <p>
                    This browser holds {localCount} local {localCount === 1 ? "entry" : "entries"}{" "}
                    not yet in your account.
                  </p>
                  <button
                    className={`${btnSecondary} mt-2`}
                    disabled={importing}
                    onClick={handleImport}
                  >
                    {importing ? "Importing…" : "Import browser entries to my account"}
                  </button>
                  {importMsg && (
                    <p role="status" className="mt-2">
                      {importMsg}
                    </p>
                  )}
                </div>
              )}
              {error && (
                <p role="alert" className="mb-3 text-destructive">
                  {error}
                </p>
              )}
              {importMsg && localCount === 0 && <p role="status">{importMsg}</p>}
              {!loaded ? (
                <p role="status">Loading…</p>
              ) : entries.length === 0 ? (
                <div className="panel p-4 text-center">
                  <p>No rehearsals saved yet.</p>
                  <Link to="/scene" className={`${btnPrimary} mt-3`}>
                    Start rehearsal
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="grid gap-3">
                    {entries.map((e) => (
                      <li key={e.id} className="panel p-4 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.date).toLocaleString()} · “Stay” demo
                        </p>
                        <p className="mt-1">
                          <b>Tactic:</b> {e.tactic}
                        </p>
                        <p>
                          <b>Intervention:</b> {e.intervention}
                        </p>
                        <p>
                          <b>Exercise:</b> {e.exerciseNote}
                        </p>
                        <p>
                          <b>Obstacle:</b> {e.obstacle}
                        </p>
                        <p>
                          <b>Retake:</b> {e.retakeLine}
                        </p>
                        <p className="mt-2 italic">“{e.reflection}”</p>
                        <button className={`${btnSecondary} mt-2`} onClick={() => remove(e.id)}>
                          Delete entry
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`${btnSecondary} mt-4`}
                    onClick={() => {
                      if (confirm("Delete all Passport entries?")) clear();
                    }}
                  >
                    Delete all Passport entries
                  </button>
                </>
              )}
            </div>
          )
        }
      </SectionTabs>
    </Page>
  );
}
