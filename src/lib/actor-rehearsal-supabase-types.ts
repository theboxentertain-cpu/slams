import type { SupabaseClient } from "@supabase/supabase-js";
import { actorSupabase, type ActorWorkDatabase } from "@/lib/actor-work-supabase-types";
import type { Json } from "@/integrations/supabase/types";

export type SceneRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  audition_id: string | null;
  side_id: string;
  title: string;
  objective: string;
  circumstances: string;
  revision: number;
  created_at: string;
  updated_at: string;
};
export type RehearsalRow = {
  id: string;
  user_id: string;
  scene_id: string;
  side_id: string;
  context: Json;
  phase: string;
  takes: Json;
  reflection: string;
  status: string;
  revision: number;
  created_at: string;
  updated_at: string;
};
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row> & { user_id: string };
  Update: Partial<Row>;
  Relationships: [];
};
type RehearsalDatabase = Omit<ActorWorkDatabase, "public"> & {
  public: Omit<ActorWorkDatabase["public"], "Tables"> & {
    Tables: ActorWorkDatabase["public"]["Tables"] & {
      actor_work_scenes: Table<SceneRow>;
      actor_work_rehearsals: Table<RehearsalRow>;
    };
  };
};
/** Same authenticated production client; schema typing adds no runtime connection. */
export const rehearsalSupabase = actorSupabase as unknown as SupabaseClient<RehearsalDatabase>;
