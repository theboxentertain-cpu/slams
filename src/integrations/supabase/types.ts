export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      audition_prep: {
        Row: {
          data: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          data?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          data?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      curriculum_assessments: {
        Row: {
          content: string;
          content_version: number;
          id: string;
          lesson_id: string;
          position: number;
          reviewed: boolean;
          slug: string;
          status: string;
          title: string;
        };
        Insert: {
          content?: string;
          content_version?: number;
          id?: string;
          lesson_id: string;
          position?: number;
          reviewed?: boolean;
          slug: string;
          status?: string;
          title: string;
        };
        Update: {
          content?: string;
          content_version?: number;
          id?: string;
          lesson_id?: string;
          position?: number;
          reviewed?: boolean;
          slug?: string;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_assessments_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_courses: {
        Row: {
          content: string;
          content_version: number;
          id: string;
          position: number;
          reviewed: boolean;
          slug: string;
          status: string;
          term_id: string;
          title: string;
        };
        Insert: {
          content?: string;
          content_version?: number;
          id?: string;
          position?: number;
          reviewed?: boolean;
          slug: string;
          status?: string;
          term_id: string;
          title: string;
        };
        Update: {
          content?: string;
          content_version?: number;
          id?: string;
          position?: number;
          reviewed?: boolean;
          slug?: string;
          status?: string;
          term_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_courses_term_id_fkey";
            columns: ["term_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_terms";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_exercises: {
        Row: {
          content: string;
          content_version: number;
          id: string;
          lesson_id: string;
          position: number;
          reviewed: boolean;
          slug: string;
          status: string;
          title: string;
        };
        Insert: {
          content?: string;
          content_version?: number;
          id?: string;
          lesson_id: string;
          position?: number;
          reviewed?: boolean;
          slug: string;
          status?: string;
          title: string;
        };
        Update: {
          content?: string;
          content_version?: number;
          id?: string;
          lesson_id?: string;
          position?: number;
          reviewed?: boolean;
          slug?: string;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_exercises_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_imports: {
        Row: {
          counts: Json;
          id: string;
          imported_at: string;
          pack_version: number;
          source: string;
        };
        Insert: {
          counts?: Json;
          id?: string;
          imported_at?: string;
          pack_version: number;
          source?: string;
        };
        Update: {
          counts?: Json;
          id?: string;
          imported_at?: string;
          pack_version?: number;
          source?: string;
        };
        Relationships: [];
      };
      curriculum_lessons: {
        Row: {
          content: string;
          content_version: number;
          id: string;
          position: number;
          reviewed: boolean;
          slug: string;
          status: string;
          title: string;
          workshop_id: string;
        };
        Insert: {
          content?: string;
          content_version?: number;
          id?: string;
          position?: number;
          reviewed?: boolean;
          slug: string;
          status?: string;
          title: string;
          workshop_id: string;
        };
        Update: {
          content?: string;
          content_version?: number;
          id?: string;
          position?: number;
          reviewed?: boolean;
          slug?: string;
          status?: string;
          title?: string;
          workshop_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_lessons_workshop_id_fkey";
            columns: ["workshop_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_workshops";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_terms: {
        Row: {
          id: string;
          number: number;
          status: string;
          year_id: string;
        };
        Insert: {
          id?: string;
          number: number;
          status?: string;
          year_id: string;
        };
        Update: {
          id?: string;
          number?: number;
          status?: string;
          year_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_terms_year_id_fkey";
            columns: ["year_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_years";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_workshops: {
        Row: {
          content: string;
          content_version: number;
          course_id: string;
          id: string;
          position: number;
          reviewed: boolean;
          slug: string;
          status: string;
          title: string;
        };
        Insert: {
          content?: string;
          content_version?: number;
          course_id: string;
          id?: string;
          position?: number;
          reviewed?: boolean;
          slug: string;
          status?: string;
          title: string;
        };
        Update: {
          content?: string;
          content_version?: number;
          course_id?: string;
          id?: string;
          position?: number;
          reviewed?: boolean;
          slug?: string;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_workshops_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "curriculum_courses";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_years: {
        Row: {
          id: string;
          number: number;
          school_id: string;
        };
        Insert: {
          id?: string;
          number: number;
          school_id: string;
        };
        Update: {
          id?: string;
          number?: number;
          school_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_years_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      passport_entries: {
        Row: {
          created_at: string;
          exercise_note: string;
          id: string;
          intervention: string;
          obstacle: string;
          reflection: string;
          retake_line: string;
          tactic: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_note?: string;
          id?: string;
          intervention: string;
          obstacle?: string;
          reflection: string;
          retake_line?: string;
          tactic: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          exercise_note?: string;
          id?: string;
          intervention?: string;
          obstacle?: string;
          reflection?: string;
          retake_line?: string;
          tactic?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          focus: string;
          id: string;
          name: string;
          position: number;
          slug: string;
          terms: number;
          years: number;
        };
        Insert: {
          focus?: string;
          id?: string;
          name: string;
          position?: number;
          slug: string;
          terms: number;
          years: number;
        };
        Update: {
          focus?: string;
          id?: string;
          name?: string;
          position?: number;
          slug?: string;
          terms?: number;
          years?: number;
        };
        Relationships: [];
      };
      unit_progress: {
        Row: {
          status: string;
          unit_id: string;
          unit_kind: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          status: string;
          unit_id: string;
          unit_kind: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          status?: string;
          unit_id?: string;
          unit_kind?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
