import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DirectorToggle } from "@/components/slams";
import { DirectorPortrait } from "./DirectorPortrait";
export function CoachPanel({
  open,
  onOpenChange,
  motion,
  onReturnFocus,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  motion: boolean;
  onReturnFocus: () => void;
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
        <DialogTitle>The Acting Coach</DialogTitle>
        <DialogDescription>
          Your reluctant accomplice. Set the level of company, then get back to the work.
        </DialogDescription>
        <DirectorPortrait expression="observant" />
        <DirectorToggle />
        <p>
          Comments stay silent during takes. Responses use scripted choices and confirmed records,
          never invented performance analysis.
        </p>
        <Link to="/director" onClick={() => onOpenChange(false)}>
          Meet the Director and explore controls
        </Link>
      </DialogContent>
    </Dialog>
  );
}
