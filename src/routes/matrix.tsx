import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { SupportPage } from "@/components/foundation/SupportPage";
export const Route = createFileRoute("/matrix")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Technique Matrix — SLAMS" },
      {
        name: "description",
        content:
          "Compare how each school approaches Scene, Listening, Action, Movement and Stakes.",
      },
      { property: "og:title", content: "Technique Matrix — SLAMS" },
      {
        property: "og:description",
        content:
          "Compare how each school approaches Scene, Listening, Action, Movement and Stakes.",
      },
    ],
  }),
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("matrix", input),
  component: Screen,
});
function Screen() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SupportPage id="matrix" tab={tab} onTabChange={(tab) => void navigate({ search: { tab } })} />
  );
}
