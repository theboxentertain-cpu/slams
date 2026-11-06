import { T } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DirectorToggle, Page, btnPrimary } from "@/components/slams";
import { DirectorPortrait } from "@/components/office/DirectorPortrait";
import { DIRECTOR_EXPRESSIONS, type DirectorExpression } from "@/components/office/office-data";

export const Route = createFileRoute("/director")({
  head: () => ({
    meta: [
      { title: "The Director — SLAMS" },
      {
        name: "description",
        content:
          "Your reluctant accomplice. Set your Director’s presence, then get back to the work.",
      },
      { property: "og:title", content: "The Director — SLAMS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Director,
});

function Director() {
  const [expression, setExpression] = useState<DirectorExpression>("master");
  return (
    <Page title="The Director" eyebrow="YOUR RELUCTANT ACCOMPLICE">
      <div className="director-profile">
        <DirectorPortrait expression={expression} />
        <div>
          <p className="director-profile-quote">
            <T>“I can’t do the work for you.</T>
            <br />
            <T>Terrible arrangement, I know.”</T>
          </p>
          <p>
            <T>
              Your studio guide. Dry observations, a little perspective, and the good sense to stay
              quiet during a take.
            </T>
          </p>
          <div className="director-settings-block">
            <h2>
              <T>How much Director?</T>
            </h2>
            <DirectorToggle />
            <p>
              <T>
                ON gives you the full note. QUIET keeps it brief. OFF leaves you in peace. Your
                preference stays in this browser.
              </T>
            </p>
          </div>
          <Link to="/scene" className={btnPrimary}>
            <T>Back to the work </T>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <details className="director-expression-gallery">
        <summary>
          <T>The many faces of a very long day</T>
        </summary>
        <p>
          <T>
            Character expressions, not an assessment of your acting. SLAMS uses scripted scene
            responses and your confirmed saved records; it does not listen to or grade your
            performance.
          </T>
        </p>
        <div>
          {DIRECTOR_EXPRESSIONS.filter((state) => state !== "master").map((state) => (
            <button
              key={state}
              type="button"
              aria-pressed={state === expression}
              onClick={() => setExpression(state)}
            >
              <DirectorPortrait expression={state} />
              <span>
                {
                  {
                    bored: "Chronically bored",
                    observant: "Suspiciously observant",
                    unimpressed: "Deeply unimpressed",
                    critical: "Surgically critical",
                    impressed: "Reluctantly impressed",
                    proud: "Quietly proud",
                    exhausted: "Completely exhausted",
                  }[state]
                }
              </span>
            </button>
          ))}
        </div>
      </details>
    </Page>
  );
}
