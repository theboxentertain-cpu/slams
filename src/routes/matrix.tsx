import { createFileRoute } from "@tanstack/react-router";
import { SystemStub } from "@/components/SystemStub";

export const Route = createFileRoute("/matrix")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Technique Matrix — SLAMS" }, { name: "description", content: "Compare how each school approaches Scene, Listening, Action, Movement and Stakes." }, { property: "og:title", content: "Technique Matrix — SLAMS" }, { property: "og:description", content: "Compare how each school approaches Scene, Listening, Action, Movement and Stakes." }] }),
  component: () => <SystemStub title="Technique Matrix" purpose="Compare how each school approaches Scene, Listening, Action, Movement and Stakes." action={{ to: "/conservatory", label: "Browse the eight schools" }} />,
});
