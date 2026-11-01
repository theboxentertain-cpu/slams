import { createFileRoute } from "@tanstack/react-router";
import { ActorSetupPage } from "@/components/welcome/WelcomePages";
export const Route = createFileRoute("/welcome/setup")({
  head: () => ({ meta: [{ title: "SLAMS — Welcome to the studio" }] }),
  component: ActorSetupPage,
});
