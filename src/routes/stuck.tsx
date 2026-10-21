import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Page, btnSecondary } from "@/components/slams";

export const Route = createFileRoute("/stuck")({
  head: () => ({ meta: [{ title: "The Stuck Desk — SLAMS" }, { name: "description", content: "Quick technique interventions for common scene problems." }, { property: "og:title", content: "The Stuck Desk — SLAMS" }, { property: "og:description", content: "Quick technique interventions for common scene problems." }] }),
  component: Stuck,
});

const PROBLEMS = [
  { q: "I'm in my head / planning lines", school: "Meisner", fix: "Put attention fully on your partner. Name out loud one thing they just did, then answer that — not your script." },
  { q: "My scene feels flat / general", school: "Stanislavski", fix: "Replace any feeling word with a transitive verb you can do to your partner: to comfort, to corner, to tempt." },
  { q: "Nothing feels at stake", school: "Stella Adler", fix: "Imagine one specific, concrete circumstance from before the scene that makes losing tonight unbearable." },
  { q: "My body feels stiff", school: "Laban", fix: "Walk the space once with a light, sustained quality, then once with strong, sudden. Keep whichever wakes the scene." },
];

function Stuck() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Page title="The Stuck Desk" eyebrow="Portal">
      <p className="mb-4 text-sm text-muted-foreground">Pick what's wrong. Draft interventions — pending faculty review.</p>
      <ul className="grid gap-2">
        {PROBLEMS.map((p, i) => (
          <li key={p.q} className="panel p-3">
            <button className={`${btnSecondary} w-full justify-between`} aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {p.q}<span aria-hidden>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && (
              <div className="mt-3 text-sm">
                <p className="text-xs font-bold text-amber">{p.school}</p>
                <p>{p.fix}</p>
                <Link to="/scene" className="mt-2 inline-block text-amber underline">Practice it in a scene</Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Page>
  );
}
