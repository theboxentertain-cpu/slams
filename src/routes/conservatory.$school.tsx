import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";
import { getSchool } from "@/data/schools";
export const Route = createFileRoute("/conservatory/$school")({
  beforeLoad: ({ params }) => {
    if (!getSchool(params.school)) throw notFound();
  },
  head: ({ params }) => {
    const school = getSchool(params.school);
    const title = `${school?.name ?? "School"} — SLAMS`;
    return {
      meta: [
        { title },
        { name: "description", content: school?.focus ?? "SLAMS Conservatory" },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Outlet,
});
