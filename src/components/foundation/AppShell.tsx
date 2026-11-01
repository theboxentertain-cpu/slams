import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Clapperboard, Drama, House, ScrollText, CircleUserRound } from "lucide-react";
import { PRIMARY_NAVIGATION, primarySection } from "@/lib/foundation";
import { useOfficePreferences } from "@/lib/office-preferences";
import { useSession } from "@/lib/session";
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
  const nav = useRef<HTMLElement>(null);
  const active = primarySection(useLocation({ select: (location) => location.pathname }));
  const { animate } = useOfficePreferences();
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
  }, []);
  return (
    <div className="app-shell" data-motion={animate ? "on" : "off"}>
      <a className="skip-link" href="#page-content">
        Skip to content
      </a>
      {children}
      <nav ref={nav} className="primary-navigation" aria-label="Main studio navigation">
        {PRIMARY_NAVIGATION.map((item) => {
          const Icon = icons[item.icon];
          return (
            <Link key={item.to} to={item.to} aria-current={active === item.to ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ProfileMenu({ className = "" }: { className?: string }) {
  const { user, loading } = useSession();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`profile-trigger ${className}`}
        aria-label="Open profile menu"
      >
        <CircleUserRound size={28} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="profile-menu">
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {loading ? "Checking account…" : user ? "Your studio" : "Browser-local studio"}
        </p>
        <DropdownMenuItem asChild>
          <Link to="/passport">Actor’s Passport</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/progress">Progress</Link>
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
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link to="/director">Director controls</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/help">Help</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/auth">{user ? "Manage account / sign out" : "Sign in"}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
