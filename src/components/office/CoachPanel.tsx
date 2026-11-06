import { T } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DirectorToggle } from "@/components/slams";
import { DirectorPortrait } from "./DirectorPortrait";
import type { DirectorExpression } from "./office-data";
export function CoachPanel({
  open,
  onOpenChange,
  motion,
  onReturnFocus,
  expression = "observant",
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  motion: boolean;
  onReturnFocus: () => void;
  expression?: DirectorExpression;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="coach-panel"
        data-motion={motion ? "on" : "off"}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          onReturnFocus();
        }}
      >
        <DialogTitle><T>The Acting Coach</T></DialogTitle>
        <DialogDescription><T>
          Your reluctant accomplice. Set the level of company, then get back to the work.
        </T></DialogDescription>
        <DirectorPortrait expression={expression} />
        <DirectorToggle />
        <p><T>
          Comments stay silent during takes. Responses use scripted choices and confirmed records,
          never invented performance analysis.
        </T></p>
        <Link to="/director" onClick={() => onOpenChange(false)}><T>
          Meet the Director and explore controls
        </T></Link>
      </DialogContent>
    </Dialog>
  );
}
