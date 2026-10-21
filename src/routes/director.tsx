import { createFileRoute } from "@tanstack/react-router";
import { SystemStub } from "@/components/SystemStub";

export const Route = createFileRoute("/director")({
  head: () => ({ meta: [{ title: "The Director — SLAMS" }, { name: "description", content: "Your studio guide. Set ON, QUIET or OFF from the home screen. The Director never speaks during a take. Final character art is pending the approved illustration." }, { property: "og:title", content: "The Director — SLAMS" }, { property: "og:description", content: "Your studio guide. Set ON, QUIET or OFF from the home screen. The Director never speaks during a take. Final character art is pending the approved illustration." }] }),
  component: () => <SystemStub title="The Director" purpose="Your studio guide. Set ON, QUIET or OFF from the home screen. The Director never speaks during a take. Final character art is pending the approved illustration." action={{ to: "/stuck", label: "Ask for a quick fix" }} />,
});
