export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_key: string
          badge_name: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_key: string
          badge_name: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_key?: string
          badge_name?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          completed: boolean | null
          created_at: string
          exercise_id: string | null
          exercise_name: string
          id: string
          reps_completed: number | null
          sets_completed: number | null
          weight_used: number | null
          workout_log_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          reps_completed?: number | null
          sets_completed?: number | null
          weight_used?: number | null
          workout_log_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          reps_completed?: number | null
          sets_completed?: number | null
          weight_used?: number | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          exercise_type: string | null
          id: string
          muscle_group: string | null
          name: string
          order_index: number
          reps: number | null
          rest_seconds: number | null
          sets: number | null
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exercise_type?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exercise_type?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          order_index?: number
          reps?: number | null
          rest_seconds?: number | null
          sets?: number | null
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          fitness_goal: string | null
          fitness_level: string | null
          id: string
          level: number
          longest_streak: number
          onboarding_completed: boolean
          preferred_units: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          fitness_goal?: string | null
          fitness_level?: string | null
          id?: string
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          preferred_units?: string | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          fitness_goal?: string | null
          fitness_level?: string | null
          id?: string
          level?: number
          longest_streak?: number
          onboarding_completed?: boolean
          preferred_units?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      programs: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          duration_weeks: number
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_weeks?: number
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_weeks?: number
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          calories_estimate: number | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          notes: string | null
          program_id: string | null
          started_at: string
          total_volume: number | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          calories_estimate?: number | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          started_at?: string
          total_volume?: number | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          calories_estimate?: number | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          notes?: string | null
          program_id?: string | null
          started_at?: string
          total_volume?: number | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          day_number: number
          estimated_duration_min: number | null
          id: string
          program_id: string
          title: string
          week_number: number
        }
        Insert: {
          created_at?: string
          day_number: number
          estimated_duration_min?: number | null
          id?: string
          program_id: string
          title: string
          week_number?: number
        }
        Update: {
          created_at?: string
          day_number?: number
          estimated_duration_min?: number | null
          id?: string
          program_id?: string
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
