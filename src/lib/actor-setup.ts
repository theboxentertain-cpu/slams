import { useEffect, useState } from "react";
import { z } from "zod";
import { useSession } from "./session";
export const EXPERIENCES = [
  "Beginner",
  "Some experience",
  "Working actor",
  "Professional / advanced",
] as const;
export const ACTOR_GOALS = [
  "Build a solid foundation",
  "Improve my technique",
  "Prepare for auditions",
  "Work on specific scenes",
  "Expand my range",
  "Ongoing professional training",
] as const;
export const actorSetupSchema = z
  .object({
    version: z.literal(1),
    experience: z.enum(EXPERIENCES).nullable(),
    goals: z.array(z.enum(ACTOR_GOALS)).max(6),
    language: z.literal("en"),
  })
  .strict();
export type ActorSetup = z.infer<typeof actorSetupSchema>;
export const EMPTY_SETUP: ActorSetup = { version: 1, experience: null, goals: [], language: "en" };
export const setupKey = (owner: string) => `slams.actor-setup.v1.${encodeURIComponent(owner)}`;
export function readActorSetup(owner: string): ActorSetup {
  const raw = localStorage.getItem(setupKey(owner));
  return raw ? actorSetupSchema.parse(JSON.parse(raw)) : { ...EMPTY_SETUP, goals: [] };
}
export function writeActorSetup(owner: string, data: ActorSetup) {
  localStorage.setItem(setupKey(owner), JSON.stringify(actorSetupSchema.parse(data)));
}
/** Optional self-reported preferences, local to this device and account namespace. */
export function useActorSetup() {
  const { user, loading } = useSession();
  const owner = loading ? null : (user?.id ?? "guest");
  const [snapshot, setSnapshot] = useState<{
    owner: string | null;
    data: ActorSetup;
    error: string | null;
  }>({ owner: null, data: EMPTY_SETUP, error: null });
  useEffect(() => {
    if (!owner || snapshot.owner === owner) return;
    try {
      setSnapshot({ owner, data: readActorSetup(owner), error: null });
    } catch {
      setSnapshot({
        owner,
        data: { ...EMPTY_SETUP, goals: [] },
        error: "Saved setup could not be read. Your training records have not been changed.",
      });
    }
  }, [owner, snapshot.owner]);
  const ready = owner !== null && snapshot.owner === owner;
  function update(change: (data: ActorSetup) => ActorSetup) {
    if (ready)
      setSnapshot((prior) =>
        prior.owner === owner ? { ...prior, data: change(prior.data) } : prior,
      );
  }
  function save() {
    if (!ready || !owner) return false;
    try {
      writeActorSetup(owner, snapshot.data);
      setSnapshot((prior) => ({ ...prior, error: null }));
      return true;
    } catch {
      setSnapshot((prior) => ({
        ...prior,
        error: "Setup could not be saved on this device. Retry or skip for now.",
      }));
      return false;
    }
  }
  return {
    data: ready ? snapshot.data : EMPTY_SETUP,
    ready,
    error: ready ? snapshot.error : null,
    update,
    save,
    signedIn: !!user && !loading,
  };
}
