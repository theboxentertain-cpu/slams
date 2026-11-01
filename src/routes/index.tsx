import { createFileRoute } from "@tanstack/react-router";
import { DirectorsOffice } from "@/components/office/DirectorsOffice";
import { WelcomeLanding } from "@/components/welcome/WelcomePages";
import { getStudioEntry } from "@/lib/studio-entry.functions";
import { useStudioEntry } from "@/lib/studio-entry";
import { useSession } from "@/lib/session";
import welcomeDirector from "@/assets/welcome/director-reclining.webp";
import welcomePortrait from "@/assets/welcome/director-portrait.webp";
import panorama from "@/assets/office/office-reference.webp";
import director from "@/assets/office/director-reference.webp";

export const Route = createFileRoute("/")({
  loader: async () => ({ studioEntered: await getStudioEntry() }),
  head: ({ loaderData }) => ({
    links: [
      { rel: "preload", as: "image", href: panorama },
      ...(loaderData?.studioEntered
        ? [{ rel: "preload", as: "image", href: director }]
        : [
            { rel: "preload", as: "image", href: welcomePortrait, media: "(max-width:699px)" },
            { rel: "preload", as: "image", href: welcomeDirector, media: "(min-width:700px)" },
          ]),
    ],
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
