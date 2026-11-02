import { createFileRoute } from "@tanstack/react-router";
import { WelcomeLanding } from "@/components/welcome/WelcomePages";
export const Route = createFileRoute("/welcome/")({
  head: () => ({ meta: [{ title: "SLAMS — Welcome to the studio" }] }),
  component: WelcomeLanding,
});
