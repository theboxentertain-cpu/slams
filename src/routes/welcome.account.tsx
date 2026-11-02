import { createFileRoute } from "@tanstack/react-router";
import { WelcomeAccount } from "@/components/welcome/WelcomePages";
export const Route = createFileRoute("/welcome/account")({
  head: () => ({ meta: [{ title: "SLAMS — Welcome to the studio" }] }),
  component: WelcomeAccount,
});
