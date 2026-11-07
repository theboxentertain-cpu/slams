/**
 * Actor at Work schema view derived from the reviewed 0004-0008 migrations
 * and generated types for isolated Supabase staging (2026-11-07).
 *
 * Lovable's generated production types currently include only 0000-0002.
 * Keep this bridge separate from auto-generated types until the production
 * rollout is approved and the generated types are regenerated.
 * Runtime is the SAME authenticated Supabase client: this does not switch DBs.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type ActorWorkTables = {
      actor_auditions: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          notes: Json
          project_id: string | null
          revision: number
          role_name: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: Json
          project_id?: string | null
          revision?: number
          role_name?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: Json
          project_id?: string | null
          revision?: number
          role_name?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actor_auditions_owner_project"
            columns: ["user_id", "project_id"]
            isOneToOne: false
            referencedRelation: "actor_projects"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      actor_project_revisions: {
        Row: {
          created_at: string
          notes: Json
          project_id: string
          revision: number
          role_name: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          notes: Json
          project_id: string
          revision: number
          role_name: string
          status: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          notes?: Json
          project_id?: string
          revision?: number
          role_name?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actor_project_revisions_parent"
            columns: ["user_id", "project_id"]
            isOneToOne: false
            referencedRelation: "actor_projects"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      actor_projects: {
        Row: {
          created_at: string
          id: string
          notes: Json
          revision: number
          role_name: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: Json
          revision?: number
          role_name?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: Json
          revision?: number
          role_name?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      actor_sides: {
        Row: {
          annotations: Json
          audition_id: string | null
          content: string
          created_at: string
          id: string
          project_id: string | null
          revision: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotations?: Json
          audition_id?: string | null
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          revision?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotations?: Json
          audition_id?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          revision?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actor_sides_audition_owner"
            columns: ["user_id", "audition_id"]
            isOneToOne: false
            referencedRelation: "actor_auditions"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "actor_sides_project_owner"
            columns: ["user_id", "project_id"]
            isOneToOne: false
            referencedRelation: "actor_projects"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
  };

export type ActorWorkDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & ActorWorkTables;
  };
};

export type ActorRow<Table extends keyof ActorWorkTables> = ActorWorkTables[Table]["Row"];

/** Type-only extension: never change the real Supabase URL or client configuration. */
export const actorSupabase = supabase as unknown as SupabaseClient<ActorWorkDatabase>;
