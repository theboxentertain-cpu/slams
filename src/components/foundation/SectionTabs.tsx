import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAGE_TABS, tabId, type PageId } from "@/lib/foundation";
import { BookOpen, FolderOpen, Users, Clapperboard, Footprints, Files, Award } from "lucide-react";
const WORLD_TAB_ICONS = {
  Auditions: BookOpen,
  Projects: FolderOpen,
  Characters: Users,
  "Self-Tapes": Clapperboard,
  Journey: Footprints,
  Evidence: Files,
  Portfolio: FolderOpen,
  Badges: Award,
};
export function SectionTabs({
  page,
  value,
  onChange,
  children,
  keepMounted = false,
}: {
  page: PageId;
  value: string;
  onChange: (tab: string) => void;
  children: (tab: string) => ReactNode;
  keepMounted?: boolean;
}) {
  return (
    <Tabs value={value} onValueChange={onChange} className="section-tabs" data-page={page}>
      <TabsList aria-label={`${page} sections`} className="section-tab-list">
        {PAGE_TABS[page].map((label) => {
          const Icon =
            page === "work" || page === "passport"
              ? WORLD_TAB_ICONS[label as keyof typeof WORLD_TAB_ICONS]
              : undefined;
          return (
            <TabsTrigger key={label} value={tabId(label)}>
              {Icon && <Icon aria-hidden="true" />}
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
      {PAGE_TABS[page].map((label) => (
        <TabsContent
          key={label}
          value={tabId(label)}
          hidden={value !== tabId(label)}
          {...(keepMounted ? { forceMount: true as const } : {})}
        >
          {children(tabId(label))}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function Unavailable({
  children,
  title = "In development",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="availability-note">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}
