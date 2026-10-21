import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { InDev, Page } from "@/components/slams";
import { getSchool, totalTerms } from "@/data/schools";

export const Route = createFileRoute("/conservatory/$school")({
  loader: ({ params }) => {
    const school = getSchool(params.school);
    if (!school) throw notFound();
    return { school };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.school.name} School — SLAMS` : "School — SLAMS";
    return { meta: [{ title: t }, { name: "description", content: loaderData?.school.focus ?? "SLAMS school" }, { property: "og:title", content: t }, { property: "og:description", content: loaderData?.school.focus ?? "SLAMS school" }] };
  },
  component: SchoolPage,
});

function SchoolPage() {
  const { school } = Route.useLoaderData();
  return (
    <Page title={school.name} eyebrow="Conservatory school" school={school.slug}>
      <p>{school.focus}</p>
      <p className="mt-1 text-sm text-muted-foreground">{school.years} years · {totalTerms(school)} terms (provisional)</p>
      {school.curriculum.map((y) => (
        <section key={y.number} className="mt-6">
          <h2 className="mb-2 text-xl font-bold text-school">Year {y.number}</h2>
          <ul className="grid gap-2">
            {y.terms.map((t) => (
              <li key={t.number} className="panel flex items-center justify-between p-3">
                <span>Term {t.number}</span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{t.courses.length} courses published</span>
                  <InDev />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-6 text-sm text-muted-foreground">
        Course → Workshop → Lesson → Exercise content has not been written or reviewed yet. Try the technique in action:
      </p>
      <Link to="/scene" className="mt-2 inline-block text-amber underline">Run the demonstration scene</Link>
    </Page>
  );
}
