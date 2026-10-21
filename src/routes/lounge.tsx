import { createFileRoute } from "@tanstack/react-router";
import { SystemStub } from "@/components/SystemStub";

export const Route = createFileRoute("/lounge")({
  head: () => ({ meta: [{ title: "Rehearsal Lounge — SLAMS" }, { name: "description", content: "A space to rehearse with scene partners. Partner matching is not built yet." }, { property: "og:title", content: "Rehearsal Lounge — SLAMS" }, { property: "og:description", content: "A space to rehearse with scene partners. Partner matching is not built yet." }] }),
  component: () => <SystemStub title="Rehearsal Lounge" purpose="A space to rehearse with scene partners. Partner matching is not built yet." action={{ to: "/scene", label: "Rehearse solo now" }} />,
});
