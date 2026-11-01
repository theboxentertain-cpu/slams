import { createFileRoute } from "@tanstack/react-router";
import { DirectorsOffice } from "@/components/office/DirectorsOffice";
import panorama from "@/assets/office/office-panorama.webp";
import director from "@/assets/office/director-atlas.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "preload", as: "image", href: panorama },
      { rel: "preload", as: "image", href: director },
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
  component: DirectorsOffice,
});
