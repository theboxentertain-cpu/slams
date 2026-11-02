import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, btnSecondary } from "@/components/slams";
export const Route = createFileRoute("/help")({ component: Help });
function Help() {
  return (
    <Page title="Your studio, explained" eyebrow="Help" backTo="/">
      <div className="foundation-stack">
        <h2>Learn. Work. Get unstuck.</h2>
        <nav aria-label="Choose your studio task" className="grid grid-cols-2 gap-2">
          <Link to="/conservatory" className={btnSecondary}>
            Train
          </Link>
          <Link to="/rehearsal" className={btnSecondary}>
            Rehearse
          </Link>
          <Link to="/work" className={btnSecondary}>
            Work
          </Link>
          <Link to="/stuck" className={btnSecondary}>
            Get Unstuck
          </Link>
        </nav>
        <p>
          The Conservatory holds eight provisional school structures. Only reviewed, published
          material can be completed. Actor at Work saves your audition preparation. The Stuck Desk
          offers existing draft interventions, pending faculty review.
        </p>
        <Link to="/scene">Try the working, scripted Living Scene</Link>
        <p>
          The scene is text-only. It does not record, analyze or grade your performance. You can
          save your reflection to Passport.
        </p>
        <Link to="/passport">Manage your saved rehearsals</Link>
        <p>
          Signed-out records stay in this browser. Account imports are explicit; failed or
          conflicting imports retain local records.
        </p>
        <Link to="/settings" search={{ tab: "accessibility" }}>
          Change Director, motion and office sound preferences
        </Link>
        <p>
          Partner sessions, recording, Arabic translation, detailed assessments and new professional
          tools remain in development. These pages identify their actual status.
        </p>
      </div>
    </Page>
  );
}
