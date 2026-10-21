import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, btnPrimary } from "@/components/slams";

export const Route = createFileRoute("/work")({
  head: () => ({ meta: [{ title: "Actor at Work — SLAMS" }, { name: "description", content: "Prepare an audition step by step." }, { property: "og:title", content: "Actor at Work — SLAMS" }, { property: "og:description", content: "Prepare an audition step by step." }] }),
  component: Work,
});

const KEY = "slams.audition.v1";
const FIELDS = [
  { id: "role", label: "Role & project" },
  { id: "circumstances", label: "Given circumstances (who, where, when)" },
  { id: "objective", label: "What do you want from the other person?" },
  { id: "obstacle", label: "What's in the way?" },
  { id: "action", label: "Playable action (to ___ them)" },
  { id: "moment", label: "Moment before you enter" },
] as const;

function Work() {
  const [data, setData] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { setData(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* ignore */ } }, []);
  return (
    <Page title="Actor at Work" eyebrow="Portal · Audition prep">
      <p className="mb-4 text-sm text-muted-foreground">Work through your sides before the room. Saved locally in this browser.</p>
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); localStorage.setItem(KEY, JSON.stringify(data)); setSaved(true); }}>
        {FIELDS.map((f) => (
          <label key={f.id} className="grid gap-1 text-sm">
            {f.label}
            <textarea rows={2} value={data[f.id] ?? ""} onChange={(e) => { setData({ ...data, [f.id]: e.target.value }); setSaved(false); }} className="rounded border border-input bg-background p-2" />
          </label>
        ))}
        <button className={btnPrimary}>Save audition prep</button>
        {saved && <p role="status" className="text-sm text-amber">Saved in this browser.</p>}
      </form>
    </Page>
  );
}
