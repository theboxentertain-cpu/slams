import { createFileRoute } from "@tanstack/react-router";
import { SystemStub } from "@/components/SystemStub";

export const Route = createFileRoute("/lounge")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Rehearsal Lounge — SLAMS" }, { name: "description", content: "A space to rehearse with scene partners. Partner matching is not built yet." }, { property: "og:title", content: "Rehearsal Lounge — SLAMS" }, { property: "og:description", content: "A space to rehearse with scene partners. Partner matching is not built yet." }] }),
  component: () => <SystemStub title="Rehearsal Lounge" purpose="A space to rehearse with scene partners. Partner matching is not built yet." action={{ to: "/scene", label: "Rehearse solo now" }} />,
});
