import { createFileRoute } from "@tanstack/react-router";
import { SystemStub } from "@/components/SystemStub";

export const Route = createFileRoute("/lab")({
  head: () => ({ meta: [{ title: "Performance Lab — SLAMS" }, { name: "description", content: "Recording and playback will arrive only after privacy and security are in place. Nothing is recorded today." }, { property: "og:title", content: "Performance Lab — SLAMS" }, { property: "og:description", content: "Recording and playback will arrive only after privacy and security are in place. Nothing is recorded today." }] }),
  component: () => <SystemStub title="Performance Lab" purpose="Recording and playback will arrive only after privacy and security are in place. Nothing is recorded today." action={{ to: "/scene", label: "Run a text-only take" }} />,
});
