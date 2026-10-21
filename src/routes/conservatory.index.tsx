import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/slams";
import { SCHOOLS, totalTerms } from "@/data/schools";

export const Route = createFileRoute("/conservatory/")({
  head: () => ({ meta: [{ title: "The Conservatory — SLAMS" }, { name: "description", content: "Eight schools of acting technique." }, { property: "og:title", content: "The Conservatory — SLAMS" }, { property: "og:description", content: "Eight schools of acting technique." }] }),
  component: Conservatory,
});

function Conservatory() {
  return (
    <Page title="The Conservatory" eyebrow="Portal">
      <p className="mb-4 text-sm text-muted-foreground">Provisional curriculum map, independently designed for SLAMS and subject to academic review. Not official institutional curricula.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SCHOOLS.map((s) => (
          <li key={s.slug} data-school={s.slug}>
            <Link to="/conservatory/$school" params={{ school: s.slug }} className="panel block border-l-4 border-l-school p-4">
              <h2 className="text-xl font-bold text-school">{s.name}</h2>
              <p className="text-sm">{s.focus}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.years} years · {totalTerms(s)} terms · In development</p>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
