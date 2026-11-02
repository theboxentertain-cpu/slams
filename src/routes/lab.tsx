import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Performance Lab — SLAMS" },
      {
        name: "description",
        content:
          "Recording and playback will arrive only after privacy and security are in place. Nothing is recorded today.",
      },
      { property: "og:title", content: "Performance Lab — SLAMS" },
      {
        property: "og:description",
        content:
          "Recording and playback will arrive only after privacy and security are in place. Nothing is recorded today.",
      },
    ],
  }),
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("lab", input),
  component: Screen,
});
function Screen() {
  return <SupportPage id="lab" />;
}
