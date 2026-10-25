import { createFileRoute, Link } from "@tanstack/react-router";
import studio from "@/assets/studio-bg.jpg";
import { AccountLink, DemoBanner, DirectorNote, DirectorToggle, SystemsNav, Wordmark, btnPrimary } from "@/components/slams";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SLAMS: The Actor's Pocket Studio — MRAHMO STUDIOS" },
      { name: "description", content: "Train, rehearse and get unstuck with eight acting schools in your pocket." },
      { property: "og:title", content: "SLAMS: The Actor's Pocket Studio" },
      { property: "og:description", content: "Scene · Listening · Action · Movement · Stakes." },
    ],
  }),
  component: Home,
});

const PORTALS = [
  { to: "/conservatory", title: "The Conservatory", text: "Eight schools of acting technique." },
  { to: "/work", title: "Actor at Work", text: "Prepare a real audition." },
  { to: "/stuck", title: "The Stuck Desk", text: "Fix a scene problem now." },
] as const;

function Home() {
  return (
    <div className="relative min-h-screen">
      <img src={studio} alt="" aria-hidden width={1024} height={1536} className="fixed inset-0 -z-20 h-full w-full object-cover" />
      <div className="studio-veil fixed inset-0 -z-10" />
      <DemoBanner />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center justify-end gap-2"><AccountLink /><DirectorToggle /></div>
        <header className="rise pt-10 pb-8 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-amber">MRAHMO STUDIOS PRESENTS</p>
          <h1 className="mt-2"><Wordmark /></h1>
          <p className="mt-2 font-display text-lg italic">The Actor's Pocket Studio</p>
        </header>
        <div className="text-center">
          <Link to="/scene" className={`${btnPrimary} w-full max-w-sm text-lg`}>START REHEARSAL</Link>
          <p className="mt-2 text-xs text-muted-foreground">Demonstration Living Scene · text only · no mic or camera</p>
        </div>
        <nav aria-label="Main portals" className="mt-10 grid gap-3 sm:grid-cols-3">
          {PORTALS.map((p) => (
            <Link key={p.to} to={p.to} className="panel block p-4 hover:border-crimson">
              <h2 className="text-lg font-bold">{p.title}</h2>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </Link>
          ))}
        </nav>
        <DirectorNote short="Start with the scene.">Welcome to the studio. Start a rehearsal — I'll stay quiet while you perform.</DirectorNote>
        <SystemsNav />
      </div>
    </div>
  );
}
