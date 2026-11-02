import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/baseline")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Actor's Baseline — SLAMS" },
      {
        name: "description",
        content:
          "A self-described starting point for your training. Self-assessment tools are being designed.",
      },
      { property: "og:title", content: "Actor's Baseline — SLAMS" },
      {
        property: "og:description",
        content:
          "A self-described starting point for your training. Self-assessment tools are being designed.",
      },
    ],
  }),
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("baseline", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SupportPage
      id="baseline"
      tab={tab}
      onTabChange={(tab) => void navigate({ search: { tab } })}
    />
  );
}
