import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { validateTab } from "@/lib/foundation";
import { PerformanceLab } from "@/components/foundation/PerformanceLab";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Performance Lab — SLAMS" },
      {
        name: "description",
        content:
          "Consent-based, session-only camera or microphone takes, playback and self-observation. No AI analysis, automatic grades or cloud media storage.",
      },
      { property: "og:title", content: "Performance Lab — SLAMS" },
      {
        property: "og:description",
        content:
          "Local-only, user-initiated recording and before/after take comparison. Recorded media is not uploaded.",
      },
    ],
  }),
  validateSearch: (input: { tab?: unknown } & SearchSchemaInput) => validateTab("lab", input),
  component: PerformanceLab,
});
