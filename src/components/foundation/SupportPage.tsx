import { Link } from "@tanstack/react-router";
import { Page, btnPrimary } from "@/components/slams";
import { SUPPORT_PAGES, type SupportPageId } from "@/lib/foundation";
import { Unavailable } from "./SectionTabs";
/** Legacy URLs stay valid; unavailable capabilities do not need empty tab interfaces. */
export function SupportPage({ id }: { id: SupportPageId }) {
  const page = SUPPORT_PAGES[id];
  return (
    <Page
      title={page.title}
      eyebrow="Studio · Planned tool"
      backTo={page.parent}
      world={page.parent === "/work" ? "work" : page.parent === "/stuck" ? "stuck" : "studio"}
    >
      <Unavailable>{page.message}</Unavailable>
      <Link to={page.action} className={btnPrimary}>
        {page.label}
      </Link>
    </Page>
  );
}
