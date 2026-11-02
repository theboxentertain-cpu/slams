import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/** A summary of saved records, never an inferred acting score or percentage. */
export function OfficeProgress({
  open,
  onOpenChange,
  onReturnFocus,
  rehearsals,
  milestones,
  signedIn,
  error,
  motion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReturnFocus: () => void;
  rehearsals: number | null;
  milestones: number | null;
  signedIn: boolean;
  error: boolean;
  motion: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="office-library office-progress-dialog"
        data-motion={motion ? "on" : "off"}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        <span className="office-kicker">YOUR WORK, ON RECORD</span>
        <DialogTitle>Your progress.</DialogTitle>
        <DialogDescription>
          {signedIn
            ? "Saved to your account. Counts reflect your stored records."
            : "Rehearsal records saved in this browser. Sign in for account milestones."}
        </DialogDescription>
        <dl className="office-progress-counts">
          <div>
            <dt>Rehearsals saved</dt>
            <dd>{rehearsals ?? "—"}</dd>
          </div>
          <div>
            <dt>Curriculum units completed</dt>
            <dd>{milestones ?? "—"}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert">Rehearsal records could not be loaded. Open Passport to retry.</p>
        )}
        {signedIn && milestones === null && <p>Account milestone data is currently unavailable.</p>}
        <p className="progress-explanation">
          Curriculum completion follows the existing reviewed-material gates. Rehearsal reflections
          belong to you; no acting score is calculated.
        </p>
        <div className="progress-actions">
          <Link to="/passport" onClick={() => onOpenChange(false)}>
            Open Passport
          </Link>
          <Link to="/conservatory" onClick={() => onOpenChange(false)}>
            Explore the Conservatory
          </Link>
          {!signedIn && (
            <Link to="/auth" onClick={() => onOpenChange(false)}>
              Sign in to your account
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
