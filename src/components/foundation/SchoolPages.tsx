import { Link, notFound } from "@tanstack/react-router";
import { Page, btnPrimary } from "@/components/slams";
import { ArrowUpRight, CalendarDays, BookOpen, Footprints, Clapperboard } from "lucide-react";
import { getSchool, totalTerms } from "@/data/schools";
import { BOOK_DESIGNS } from "@/components/office/office-data";
import { CoverDrawing } from "@/components/office/SchoolBooks";
import { SchoolPortrait } from "./SchoolPortrait";
import { CurriculumUnit } from "@/components/CurriculumUnit";
import { MeisnerAcademicPreview } from "./MeisnerAcademicPreview";
import {
  useCatalog,
  useTrainingProgress,
  schoolHasProgress,
  type TrainingUnit,
} from "@/lib/training";
import { SectionTabs, Unavailable } from "./SectionTabs";
import { TrainingSummary, UnitLink } from "./TrainingSummary";
type TabProps = { tab: string; onTabChange: (tab: string) => void };

function CatalogState({ catalog }: { catalog: ReturnType<typeof useCatalog> }) {
  return catalog.isError ? (
    <div className="availability-note" role="alert">
      <h2>Curriculum temporarily unavailable</h2>
      <p>
        The school structure remains available. Training material could not be loaded. Try again to
        check its availability.
      </p>
      <button className="preference-button" onClick={() => void catalog.refetch()}>
        Retry curriculum
      </button>
    </div>
  ) : catalog.isPending ? (
    <p role="status">Loading available curriculum…</p>
  ) : null;
}
export function ConservatoryPage({ tab, onTabChange }: TabProps) {
  const catalog = useCatalog();
  const progress = useTrainingProgress();
  const books = BOOK_DESIGNS.filter(
    (book) =>
      tab !== "in-progress" ||
      (!!progress.records &&
        catalog.isSuccess &&
        schoolHasProgress(book.slug, catalog.units, progress.records)),
  );
  return (
    <Page
      title="The Conservatory"
      eyebrow="THE EIGHT ACTING SCHOOLS"
      backTo="/"
      world="conservatory"
    >
      <p className="training-structure-note">
        Provisional SLAMS structure, subject to academic review. Not official institutional
        curricula.
      </p>
      <SectionTabs page="conservatory" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "completed" ? (
            <Unavailable title="School completion is not yet defined">
              Reviewed school-completion and assessment requirements are not available. Completed
              units alone do not certify a completed school.
            </Unavailable>
          ) : (
            <>
              {current === "in-progress" && (!progress.records || !catalog.isSuccess) && (
                <p role="status">
                  {progress.loading || catalog.isPending
                    ? "Checking recorded training…"
                    : progress.signedIn
                      ? "Training status is unavailable."
                      : "Sign in to view account training progress."}
                </p>
              )}
              {current === "in-progress" &&
                progress.records &&
                catalog.isSuccess &&
                books.length === 0 && <p>No school activity recorded yet.</p>}
              <ul className="school-selector school-gallery">
                {books.map((book) => (
                  <li key={book.slug} data-school={book.slug}>
                    <Link
                      to="/conservatory/$school"
                      params={{ school: book.slug }}
                      className="school-entrance"
                    >
                      <span className="school-card-art" aria-hidden="true">
                        <SchoolPortrait school={book.slug} />
                        <span className="school-card-seal">
                          <CoverDrawing motif={book.motif} />
                        </span>
                      </span>
                      <span className="school-card-copy">
                        <strong>{book.school.name}</strong>
                        <span className="school-card-focus">{book.school.focus}</span>
                        <span className="school-card-duration">
                          <CalendarDays size={16} aria-hidden="true" />
                          {book.school.years} {book.school.years === 1 ? "year" : "years"} ·{" "}
                          {totalTerms(book.school)} terms
                        </span>
                        <small>Provisional structure</small>
                      </span>
                      <ArrowUpRight className="school-card-arrow" size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )
        }
      </SectionTabs>
      <nav className="training-next-actions" aria-label="Continue your training">
        <Link to="/baseline">
          <Footprints aria-hidden="true" />
          <span>
            <strong>Your starting point</strong>
            <small>Optional Baseline introduction</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </Link>
        <Link to="/rehearsal">
          <Clapperboard aria-hidden="true" />
          <span>
            <strong>Try it in a scene</strong>
            <small>Explore · Perform · Reflect</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </Link>
        <Link to="/progress">
          <BookOpen aria-hidden="true" />
          <span>
            <strong>The work, on record</strong>
            <small>View actual saved progress</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </nav>
      <CatalogState catalog={catalog} />
    </Page>
  );
}
function TermLinks({ school }: { school: string }) {
  const s = getSchool(school)!;
  return (
    <div className="foundation-stack">
      {s.curriculum.map((year) => (
        <section key={year.number} className="panel p-4">
          <h2>
            <Link
              to="/conservatory/$school/years/$year"
              params={{ school, year: String(year.number) }}
            >
              Year {year.number}
            </Link>
          </h2>
          <ul className="context-links">
            {year.terms.map((term) => (
              <li key={term.number}>
                <Link
                  to="/conservatory/$school/years/$year/terms/$term"
                  params={{ school, year: String(year.number), term: String(term.number) }}
                >
                  Term {term.number}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
export function SchoolPage({ school, tab, onTabChange }: TabProps & { school: string }) {
  const s = getSchool(school);
  const catalog = useCatalog();
  if (!s) throw notFound();
  return (
    <Page title={s.name} eyebrow="Conservatory school" school={school} backTo="/conservatory">
      <p className="training-structure-note">
        {s.years} years · {totalTerms(s)} terms (provisional)
      </p>
      <SectionTabs page="school" value={tab} onChange={onTabChange}>
        {(current) =>
          current === "overview" ? (
            <section className="studio-sheet foundation-stack">
              <p>
                {school === "meisner"
                  ? "Explore the provisional school structure and the first-term SLAMS editorial preview. The preview is awaiting qualified teaching review and does not award academic credit."
                  : "This independently designed SLAMS school structure remains subject to academic review. Detailed principles, history, demonstrations and school-specific teaching material have not been supplied."}
              </p>
              {school === "meisner" && (
                <Link
                  to="/conservatory/$school/years/$year/terms/$term"
                  params={{ school, year: "1", term: "1" }}
                  className={btnPrimary}
                >
                  Open the first-term lesson preview
                </Link>
              )}
              <button className="preference-button" onClick={() => onTabChange("curriculum")}>
                Explore the curriculum structure
              </button>
              <Link to="/scene">Try the existing scripted demonstration</Link>
            </section>
          ) : current === "curriculum" ? (
            <TermLinks school={school} />
          ) : current === "progress" ? (
            <>
              <TrainingSummary school={school} />
              <Link to="/progress">Open detailed progress</Link>
            </>
          ) : (
            <UnitList
              units={catalog.units.filter(
                (u) =>
                  u.school === school &&
                  (current === "practice" ? u.kind === "exercise" : u.kind === "assessment"),
              )}
              unavailable={catalog.isError || catalog.isPending}
            />
          )
        }
      </SectionTabs>
      <CatalogState catalog={catalog} />
    </Page>
  );
}
function UnitList({ units, unavailable }: { units: TrainingUnit[]; unavailable: boolean }) {
  if (unavailable) return <p>Available material cannot be confirmed until the curriculum loads.</p>;
  if (!units.length)
    return (
      <Unavailable>
        Reviewed material is not available here yet. Meisner Year 1 Term 1 remains the first planned
        reviewed pilot; no teaching content has been invented.
      </Unavailable>
    );
  return (
    <ul className="foundation-stack">
      {units.map((unit) => (
        <li key={`${unit.kind}:${unit.id}`} className="panel p-3">
          <UnitLink unit={unit} />
          <p className="text-sm text-muted-foreground">
            {unit.kind} ·{" "}
            {unit.available
              ? "Reviewed and published"
              : "In development · reviewed material unavailable"}
          </p>
        </li>
      ))}
    </ul>
  );
}
export function YearPage({ school, year }: { school: string; year: string }) {
  const s = getSchool(school)!;
  const y = s.curriculum.find((item) => String(item.number) === year);
  if (!y) throw notFound();
  return (
    <Page
      title={`${s.name} · Year ${year}`}
      eyebrow="Curriculum structure"
      school={school}
      backTo="/conservatory"
    >
      <Link to="/conservatory/$school" params={{ school }} search={{ tab: "curriculum" }}>
        ← {s.name} curriculum
      </Link>
      <ul className="foundation-stack mt-4">
        {y.terms.map((term) => (
          <li key={term.number} className="panel p-4">
            <Link
              to="/conservatory/$school/years/$year/terms/$term"
              params={{ school, year, term: String(term.number) }}
            >
              Term {term.number}
            </Link>
            <p>Provisional structure · Reviewed requirements not yet supplied.</p>
          </li>
        ))}
      </ul>
    </Page>
  );
}
export function TermPage({ school, year, term }: { school: string; year: string; term: string }) {
  const s = getSchool(school)!;
  const catalog = useCatalog();
  return (
    <Page
      title={`${s.name} · Term ${term}`}
      eyebrow={`Year ${year}`}
      school={school}
      backTo="/conservatory"
    >
      <Link to="/conservatory/$school/years/$year" params={{ school, year }}>
        ← Year {year}
      </Link>
      <p className="section-intro">
        Term outcomes, prerequisites and advancement requirements remain provisional until reviewed
        material is supplied.
      </p>
      {school === "meisner" && year === "1" && term === "1" && <MeisnerAcademicPreview />}
      <CatalogState catalog={catalog} />
      <UnitList
        units={catalog.units.filter(
          (u) =>
            u.school === school &&
            String(u.year) === year &&
            String(u.term) === term &&
            u.kind === "course",
        )}
        unavailable={catalog.isError || catalog.isPending}
      />
    </Page>
  );
}
export function UnitPage({
  school,
  kind,
  unitId,
}: {
  school: string;
  kind: string;
  unitId: string;
}) {
  const catalog = useCatalog();
  const unit = catalog.units.find((u) => u.school === school && u.kind === kind && u.id === unitId);
  if (catalog.isSuccess && !unit) throw notFound();
  return (
    <Page
      title={unit?.title ?? "Curriculum unit"}
      eyebrow={getSchool(school)?.name ?? "Conservatory"}
      school={school}
      backTo="/conservatory"
    >
      <Link to="/conservatory/$school" params={{ school }} search={{ tab: "curriculum" }}>
        ← School curriculum
      </Link>
      <CatalogState catalog={catalog} />
      {unit && (
        <div className="foundation-stack">
          <nav className="context-links curriculum-context" aria-label="Curriculum parents">
            <Link
              to="/conservatory/$school/years/$year/terms/$term"
              params={{ school, year: String(unit.year), term: String(unit.term) }}
            >
              Year {unit.year} · Term {unit.term}
            </Link>
            {unit.ancestors.map((a) => (
              <Link
                key={a.id}
                to="/conservatory/$school/units/$kind/$unitId"
                params={{ school, kind: a.kind, unitId: a.id }}
              >
                {a.title}
              </Link>
            ))}
          </nav>
          {unit.available ? (
            <CurriculumUnit
              key={`${unit.kind}:${unit.id}`}
              unit={unit}
              kind={unit.kind}
              presentation="lesson"
            />
          ) : (
            <Unavailable>
              Reviewed published material is not available for this unit and its curriculum parents.
              Progress actions are unavailable.
            </Unavailable>
          )}
          {catalog.units.some((u) => u.school === school && u.ancestors.at(-1)?.id === unit.id) && (
            <section className="curriculum-related">
              <h2>Continue through the material</h2>
              <UnitList
                units={catalog.units.filter(
                  (u) => u.school === school && u.ancestors.at(-1)?.id === unit.id,
                )}
                unavailable={false}
              />
            </section>
          )}
        </div>
      )}
    </Page>
  );
}
