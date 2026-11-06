import { T } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, btnSecondary } from "@/components/slams";
export const Route = createFileRoute("/help")({ component: Help });
function Help() {
  return (
    <Page title="Your studio, explained" eyebrow="Help" backTo="/">
      <div className="foundation-stack">
        <h2><T>Learn. Work. Get unstuck.</T></h2>
        <nav aria-label="Choose your studio task" className="grid grid-cols-2 gap-2">
          <Link to="/conservatory" className={btnSecondary}><T>
            Train
          </T></Link>
          <Link to="/rehearsal" className={btnSecondary}><T>
            Rehearse
          </T></Link>
          <Link to="/work" className={btnSecondary}><T>
            Work
          </T></Link>
          <Link to="/stuck" className={btnSecondary}><T>
            Get Unstuck
          </T></Link>
        </nav>
        <p><T>
          The Conservatory holds eight provisional school structures. Only reviewed, published
          material can be completed. Actor at Work saves your audition preparation. The Stuck Desk
          offers existing draft interventions, pending faculty review.
        </T></p>
        <Link to="/scene"><T>Try the working, scripted Living Scene</T></Link>
        <p>
          The scene is text-only. It does not record, analyze or grade your performance. You can
          save your reflection to Passport.
        </p>
        <Link to="/passport"><T>Manage your saved rehearsals</T></Link>
        <p><T>
          Signed-out records stay in this browser. Account imports are explicit; failed or
          conflicting imports retain local records.
        </T></p>
        <Link to="/settings" search={{ tab: "accessibility" }}><T>
          Change Director, motion and office sound preferences
        </T></Link>
        <p><T>
          Partner sessions, recording, Arabic translation, detailed assessments and new professional
          tools remain in development. These pages identify their actual status.
        </T></p>
      </div>
    </Page>
  );
}
