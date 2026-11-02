import { createFileRoute } from "@tanstack/react-router";
import { DirectorsOffice } from "@/components/office/DirectorsOffice";
import { WelcomeLanding } from "@/components/welcome/WelcomePages";
import { getStudioEntry } from "@/lib/studio-entry.functions";
import { useStudioEntry } from "@/lib/studio-entry";
import { useSession } from "@/lib/session";
import panorama from "@/assets/premium/director-studio.webp";

export const Route = createFileRoute("/")({
  loader: async () => ({ studioEntered: await getStudioEntry() }),
  head: () => ({
    links: [{ rel: "preload", as: "image", href: panorama }],
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "SLAMS: The Actor's Pocket Studio — MRAHMO STUDIOS" },
      {
        name: "description",
        content: "Train, rehearse and get unstuck with eight acting schools in your pocket.",
      },
      { property: "og:title", content: "SLAMS: The Actor's Pocket Studio" },
      { property: "og:description", content: "Scene · Listening · Action · Movement · Stakes." },
    ],
  }),
  component: HomeEntry,
});

function HomeEntry() {
  const { studioEntered } = Route.useLoaderData();
  const entered = useStudioEntry(studioEntered);
  const { user } = useSession();
  return entered || user ? <DirectorsOffice /> : <WelcomeLanding />;
}
