import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Page, btnPrimary, btnSecondary } from "@/components/slams";
import { usePassport } from "@/lib/store";

export const Route = createFileRoute("/passport")({
  head: () => ({ meta: [{ title: "Actor's Passport — SLAMS" }, { name: "description", content: "Your completed rehearsals and reflections." }, { property: "og:title", content: "Actor's Passport — SLAMS" }, { property: "og:description", content: "Your completed rehearsals and reflections." }] }),
  component: Passport,
});

function Passport() {
  const { entries, loaded, remove, clear } = usePassport();
  return (
    <Page title="Actor's Passport" eyebrow="Studio system">
      <p className="mb-4 rounded border border-warning p-3 text-sm">Local-only: entries live in this browser. Clearing browser data deletes them. No account or cloud backup yet.</p>
      {!loaded ? (
        <p role="status">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="panel p-4 text-center">
          <p>No rehearsals saved yet.</p>
          <Link to="/scene" className={`${btnPrimary} mt-3`}>Start rehearsal</Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-3">
            {entries.map((e) => (
              <li key={e.id} className="panel p-4 text-sm">
                <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()} · “Stay” demo · stages completed: Perform, Intervene, Practice, Retake, Reflect</p>
                <p className="mt-1"><b>Tactic:</b> {e.tactic}</p>
                <p><b>Intervention:</b> {e.intervention}</p>
                <p><b>Exercise:</b> {e.exerciseNote}</p>
                <p><b>Obstacle:</b> {e.obstacle}</p>
                <p><b>Retake:</b> {e.retakeLine}</p>
                <p className="mt-2 italic">“{e.reflection}”</p>
                <button className={`${btnSecondary} mt-2`} onClick={() => remove(e.id)}>Delete entry</button>
              </li>
            ))}
          </ul>
          <button className={`${btnSecondary} mt-4`} onClick={() => { if (confirm("Delete all Passport entries?")) clear(); }}>Delete all my data</button>
        </>
      )}
    </Page>
  );
}
