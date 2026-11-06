import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useMatches } from "@tanstack/react-router";
import {
  BookOpen,
  Clapperboard,
  Drama,
  House,
  ScrollText,
  CircleUserRound,
  ChevronDown,
} from "lucide-react";
import { PRIMARY_NAVIGATION, primarySection } from "@/lib/foundation";
import { useOfficePreferences } from "@/lib/office-preferences";
import { useSession } from "@/lib/session";
import { LanguageSwitch, useLanguage } from "@/lib/i18n";
import { enterStudio, useStudioEntry } from "@/lib/studio-entry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const icons = {
  office: House,
  schools: BookOpen,
  rehearse: Clapperboard,
  work: Drama,
  stuck: ScrollText,
};
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const nav = useRef<HTMLElement>(null);
  const location = useLocation();
  const active = primarySection(location.pathname);
  const serverEntered = useMatches({
    select: (matches) =>
      (
        matches.find((m) => m.routeId === "/")?.loaderData as
          { studioEntered?: boolean } | undefined
      )?.studioEntered ?? false,
  });
  const entered = useStudioEntry(serverEntered);
  const { user } = useSession();
  const cinematic =
    location.pathname.startsWith("/welcome") ||
    ((location.pathname === "/auth" || location.pathname === "/baseline") &&
      location.search["flow"] === "welcome") ||
    (location.pathname === "/" && !entered && !user);
  const { animate } = useOfficePreferences();
  useEffect(() => {
    if (!cinematic) enterStudio();
  }, [cinematic]);
  useEffect(() => {
    const node = nav.current;
    if (!node) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        "--primary-nav-height",
        `${Math.ceil(node.getBoundingClientRect().height)}px`,
      );
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    return () => {
      observer?.disconnect();
      document.documentElement.style.removeProperty("--primary-nav-height");
    };
  }, [cinematic]);
  return (
    <div
      className="app-shell"
      data-motion={animate ? "on" : "off"}
      data-welcome={cinematic ? "true" : "false"}
    >
      <a className="skip-link" href="#page-content">
        {t("Skip to content")}
      </a>
      {children}
      {!cinematic && (
        <nav ref={nav} className="primary-navigation" aria-label={t("Main studio navigation")}>
          {PRIMARY_NAVIGATION.map((item) => {
            const Icon = icons[item.icon];
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active === item.to ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function ProfileMenu({
  className = "",
  identity = false,
}: {
  className?: string;
  identity?: boolean;
}) {
  const { user, loading } = useSession();
  const { t } = useLanguage();
  const name =
    typeof user?.user_metadata?.["display_name"] === "string"
      ? user.user_metadata["display_name"].trim().slice(0, 60)
      : "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`profile-trigger ${className}`}
        aria-label={t("Open profile menu")}
      >
        <CircleUserRound size={28} aria-hidden="true" />
        {identity && (
          <>
            <span className="office-profile-identity">
              <strong>
                {loading
                  ? t("Checking account…")
                  : user
                    ? name || t("Your account")
                    : t("Guest actor")}
              </strong>
              <small>{t(user ? "Your studio" : "Browser-local studio")}</small>
            </span>
            <ChevronDown size={15} aria-hidden="true" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="profile-menu">
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {t(loading ? "Checking account…" : user ? "Your studio" : "Browser-local studio")}
        </p>
        <DropdownMenuItem asChild>
          <Link to="/passport">{t("Actor’s Passport")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/progress">{t("Progress")}</Link>
        </DropdownMenuItem>
        {(
          [
            ["Account", "account"],
            ["Privacy and recording", "privacy"],
            ["Language", "language"],
            ["Accessibility", "accessibility"],
          ] as const
        ).map(([label, tab]) => (
          <DropdownMenuItem key={tab} asChild>
            <Link to="/settings" search={{ tab }}>
              {t(label)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link to="/director">{t("Director controls")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/help">{t("Help")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/welcome">{t("Welcome & actor setup")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/auth">{t(user ? "Manage account / sign out" : "Sign in")}</Link>
        </DropdownMenuItem>
        <div className="px-3 py-2" role="group" aria-label={t("Language")}>
          <LanguageSwitch />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
