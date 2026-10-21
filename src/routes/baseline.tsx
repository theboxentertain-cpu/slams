import { createFileRoute } from "@tanstack/react-router";
import { SystemStub } from "@/components/SystemStub";

export const Route = createFileRoute("/baseline")({
  head: () => ({ meta: [{ title: "Actor's Baseline — SLAMS" }, { name: "description", content: "A self-described starting point for your training. Self-assessment tools are being designed." }, { property: "og:title", content: "Actor's Baseline — SLAMS" }, { property: "og:description", content: "A self-described starting point for your training. Self-assessment tools are being designed." }] }),
  component: () => <SystemStub title="Actor's Baseline" purpose="A self-described starting point for your training. Self-assessment tools are being designed." action={{ to: "/scene", label: "Record a first rehearsal" }} />,
});
