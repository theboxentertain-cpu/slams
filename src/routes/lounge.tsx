import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/lounge")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Rehearsal Lounge — SLAMS" },
      {
        name: "description",
        content: "A space to rehearse with scene partners. Partner matching is not built yet.",
      },
      { property: "og:title", content: "Rehearsal Lounge — SLAMS" },
      {
        property: "og:description",
        content: "A space to rehearse with scene partners. Partner matching is not built yet.",
      },
    ],
  }),
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("lounge", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="lounge" />;
}
