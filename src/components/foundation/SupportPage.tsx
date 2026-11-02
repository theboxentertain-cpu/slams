import { Link } from "@tanstack/react-router";
import { Page, btnPrimary } from "@/components/slams";
import { SUPPORT_PAGES, PAGE_TABS, tabId, type SupportPageId } from "@/lib/foundation";
import { SectionTabs, Unavailable } from "./SectionTabs";
export function SupportPage({
  id,
  tab,
  onTabChange,
}: {
  id: SupportPageId;
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  const page = SUPPORT_PAGES[id];
  return (
    <Page
      title={page.title}
      eyebrow="Studio · Foundation"
      backTo={page.parent}
      world={page.parent === "/work" ? "work" : page.parent === "/stuck" ? "stuck" : "studio"}
    >
      <SectionTabs page={id} value={tab} onChange={onTabChange}>
        {(current) => (
          <Unavailable
            title={`${PAGE_TABS[id].find((label) => tabId(label) === current)} · In development`}
          >
            {page.message}
          </Unavailable>
        )}
      </SectionTabs>
      <Link to={page.action} className={btnPrimary}>
        {page.label}
      </Link>
    </Page>
  );
}
