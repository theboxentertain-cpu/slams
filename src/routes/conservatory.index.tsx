import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { ConservatoryPage } from "@/components/foundation/SchoolPages";
export const Route = createFileRoute("/conservatory/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "The Conservatory — SLAMS" },
      { name: "description", content: "Eight schools of acting technique." },
      { property: "og:title", content: "The Conservatory — SLAMS" },
      { property: "og:description", content: "Eight schools of acting technique." },
    ],
  }),
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) =>
    validateTab("conservatory", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <ConservatoryPage tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />;
}
