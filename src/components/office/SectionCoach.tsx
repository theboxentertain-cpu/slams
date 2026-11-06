import { T } from "@/lib/i18n";
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDirectorMode } from "@/lib/store";
import { DirectorPortrait } from "./DirectorPortrait";
import { SECTION_COACH, coachPresence, type CoachSection } from "./section-coach";

export function SectionCoach({
  section,
  performing = false,
  compact = false,
}: {
  section: CoachSection;
  performing?: boolean;
  compact?: boolean;
}) {
  const [mode] = useDirectorMode();
  const [open, setOpen] = useState(false);
  const presence = coachPresence(mode, performing);
  const coach = SECTION_COACH[section];
  if (!presence.visible) return null;
  return (
    <aside
      className="section-coach"
      data-section={section}
      data-speaking={presence.speaking}
      aria-label="Section coach"
    >
      <Button
        variant="ghost"
        className="section-coach-trigger"
        aria-label={open ? "Close the Director note" : "Hear from the Director"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <DirectorPortrait
          expression={
            open && mode === "on"
              ? coach.expression === "observant"
                ? "critical"
                : "observant"
              : coach.expression
          }
          className="section-coach-portrait"
        />
        {compact && (
          <span className="section-coach-label">
            <T>The Director</T>
          </span>
        )}
        <span className="section-coach-cue" aria-hidden="true">
          {open ? <X size={17} /> : <MessageCircle size={17} />}
        </span>
      </Button>
      {open && (
        <p className="section-coach-note" role="status">
          <strong>
            <T>The Director</T>
          </strong>
          {mode === "quiet" ? coach.short : coach.note}
        </p>
      )}
    </aside>
  );
}
