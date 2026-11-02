import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/slams";
import director from "@/assets/premium/director-studio.webp";
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
    <div className={`welcome-world welcome-${variant}`}>
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
          <img
            className="welcome-director"
            src={director}
            alt="The Director in his leather chair, red pencil at his temple, offering his signature coffee mug."
            width={1536}
            height={1024}
            fetchPriority="high"
          />
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
