import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/slams";
import { LanguageSwitch, useLanguage } from "@/lib/i18n";
import director from "@/assets/premium/director-studio.webp";
export function WelcomeFrame({
  title,
  subtitle,
  children,
  variant = "standard",
  back,
  artwork,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  variant?: "landing" | "standard" | "setup";
  back?: "/welcome" | "/welcome/account" | "/welcome/setup";
  artwork?: { src: string; alt: string };
}) {
  const { t } = useLanguage();
  return (
    <div className={`welcome-world welcome-${variant}`}>
      <div className="welcome-curtain curtain-left" aria-hidden="true" />
      <div className="welcome-curtain curtain-right" aria-hidden="true" />
      <header className="welcome-brand">
        {back && (
          <Link className="welcome-back" to={back} aria-label={t("Back to welcome")}>
            <ArrowLeft aria-hidden="true" />
          </Link>
        )}
        <div className="welcome-language-control">
          <LanguageSwitch />
        </div>
        <span className="welcome-credit">mrahmostudios presents</span>
        <Wordmark />
        <span className="welcome-tagline">{t("The Actor’s Pocket Studio")}</span>
        <span className="welcome-motto">{t("TRAIN. REHEARSE. EXPERIMENT. PERFORM.")}</span>
      </header>
      <main id="page-content" tabIndex={-1}>
        <section className="welcome-scene" aria-label={t("The Director’s welcome")}>
          <img
            className="welcome-director"
            src={artwork?.src ?? director}
            alt={
              artwork?.alt ??
              "The Director in his leather chair, red pencil at his temple, offering his signature coffee mug."
            }
            width={1536}
            height={1024}
            fetchPriority="high"
          />
          {variant !== "landing" && (
            <div className="welcome-chalkboard">
              <h1>{t(title)}</h1>
              <p>{t(subtitle)}</p>
            </div>
          )}
          {variant === "landing" && <h1 className="sr-only">{t(title)}</h1>}
        </section>
        <div className="welcome-content">{children}</div>
      </main>
    </div>
  );
}
