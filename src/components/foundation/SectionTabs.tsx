import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAGE_TABS, tabId, type PageId } from "@/lib/foundation";
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
    <Tabs value={value} onValueChange={onChange} className="section-tabs">
      <TabsList aria-label={`${page} sections`} className="section-tab-list">
        {PAGE_TABS[page].map((label) => (
          <TabsTrigger key={label} value={tabId(label)}>
            {label}
          </TabsTrigger>
        ))}
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
