import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/slams";
import room from "@/assets/office/office-reference.webp";
import director from "@/assets/welcome/director-reclining.webp";
import portrait from "@/assets/welcome/director-portrait.webp";
export function WelcomeFrame({
  title,
  subtitle,
  children,
  variant = "standard",
  back,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  variant?: "landing" | "standard" | "setup";
  back?: "/welcome" | "/welcome/account" | "/welcome/setup";
}) {
  return (
    <div className={`welcome-world welcome-${variant}`} style={{ backgroundImage: `url(${room})` }}>
      <div className="welcome-curtain curtain-left" aria-hidden="true" />
      <div className="welcome-curtain curtain-right" aria-hidden="true" />
      <header className="welcome-brand">
        {back && (
          <Link className="welcome-back" to={back} aria-label="Back to welcome">
            <ArrowLeft aria-hidden="true" />
          </Link>
        )}
        <span className="welcome-credit">mrahmostudios presents</span>
        <Wordmark />
        <span className="welcome-tagline">The Actor’s Pocket Studio</span>
        <span className="welcome-motto">TRAIN. REHEARSE. EXPERIMENT. PERFORM.</span>
      </header>
      <main id="page-content" tabIndex={-1}>
        <section className="welcome-scene" aria-label="The Director’s welcome">
          <picture>
            <source media="(max-width:699px)" srcSet={portrait} />
            <img
              className="welcome-director"
              src={director}
              alt="The Director reclining in his worn leather chair, red pencil in hand, with his signature coffee mug."
              width={1536}
              height={1024}
              fetchPriority="high"
            />
          </picture>
          {variant !== "landing" && (
            <div className="welcome-chalkboard">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          )}
          {variant === "landing" && <h1 className="sr-only">{title}</h1>}
        </section>
        <div className="welcome-content">{children}</div>
      </main>
    </div>
  );
}
