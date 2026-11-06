import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const progressInput = z
  .object({
    unit_kind: z.enum(["course", "workshop", "lesson", "exercise", "assessment"]),
    unit_id: z.string().uuid(),
    // Public client can record only that a lesson was opened/started.
    // Reviewed completion must use a separate server-authorized academic gate.
    status: z.literal("started"),
  })
  .strict();

export async function saveUnitProgress(input: unknown) {
  const row = progressInput.parse(input);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Sign in to save unit progress.");
  const { error } = await supabase
    .from("unit_progress")
    .upsert({ ...row, user_id: user.id, updated_at: new Date().toISOString() });
  if (error) throw error;
}
