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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      competition_sources: {
        Row: {
          canonical_id: string
          confidence: number
          created_at: string
          id: string
          source: string
          source_id: string
          source_name: string | null
          updated_at: string
        }
        Insert: {
          canonical_id: string
          confidence?: number
          created_at?: string
          id?: string
          source: string
          source_id: string
          source_name?: string | null
          updated_at?: string
        }
        Update: {
          canonical_id?: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string
          source_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_sources_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          confederation: string | null
          country: string | null
          created_at: string
          gender: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          tier: number | null
          type: string
          updated_at: string
        }
        Insert: {
          confederation?: string | null
          country?: string | null
          created_at?: string
          gender?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          tier?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          confederation?: string | null
          country?: string | null
          created_at?: string
          gender?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          tier?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingestion_log: {
        Row: {
          created_at: string
          endpoint: string
          error: string | null
          id: string
          rows_upserted: number
          run_at: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          error?: string | null
          id?: string
          rows_upserted?: number
          run_at?: string
          source: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          error?: string | null
          id?: string
          rows_upserted?: number
          run_at?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lineups: {
        Row: {
          created_at: string
          id: string
          is_starter: boolean
          match_id: string
          player_id: string
          position: string | null
          shirt_number: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_starter?: boolean
          match_id: string
          player_id: string
          position?: string | null
          shirt_number?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_starter?: boolean
          match_id?: string
          player_id?: string
          position?: string | null
          shirt_number?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assist_player_id: string | null
          created_at: string
          detail: string | null
          id: string
          match_id: string
          minute: number | null
          player_id: string | null
          team_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          assist_player_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          match_id: string
          minute?: number | null
          player_id?: string | null
          team_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          assist_player_id?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          match_id?: string
          minute?: number | null
          player_id?: string | null
          team_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sources: {
        Row: {
          canonical_id: string
          confidence: number
          created_at: string
          id: string
          source: string
          source_id: string
          source_name: string | null
          updated_at: string
        }
        Insert: {
          canonical_id: string
          confidence?: number
          created_at?: string
          id?: string
          source: string
          source_id: string
          source_name?: string | null
          updated_at?: string
        }
        Update: {
          canonical_id?: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string
          source_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_sources_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          competition_id: string
          created_at: string
          home_score: number | null
          home_team_id: string
          id: string
          kickoff_utc: string
          matchday: number | null
          minute: number | null
          season_id: string
          stage: string | null
          status: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          competition_id: string
          created_at?: string
          home_score?: number | null
          home_team_id: string
          id?: string
          kickoff_utc: string
          matchday?: number | null
          minute?: number | null
          season_id: string
          stage?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          competition_id?: string
          created_at?: string
          home_score?: number | null
          home_team_id?: string
          id?: string
          kickoff_utc?: string
          matchday?: number | null
          minute?: number | null
          season_id?: string
          stage?: string | null
          status?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      player_sources: {
        Row: {
          canonical_id: string
          confidence: number
          created_at: string
          id: string
          source: string
          source_id: string
          source_name: string | null
          updated_at: string
        }
        Insert: {
          canonical_id: string
          confidence?: number
          created_at?: string
          id?: string
          source: string
          source_id: string
          source_name?: string | null
          updated_at?: string
        }
        Update: {
          canonical_id?: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string
          source_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_sources_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          name: string
          nationality: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          name: string
          nationality?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string
          nationality?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          competition_id: string
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          start_date: string | null
          updated_at: string
          year_label: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          start_date?: string | null
          updated_at?: string
          year_label: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          start_date?: string | null
          updated_at?: string
          year_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          created_at: string
          drawn: number
          form: string | null
          ga: number
          gd: number
          gf: number
          id: string
          lost: number
          played: number
          points: number
          position: number
          season_id: string
          team_id: string
          updated_at: string
          won: number
        }
        Insert: {
          created_at?: string
          drawn?: number
          form?: string | null
          ga?: number
          gd?: number
          gf?: number
          id?: string
          lost?: number
          played?: number
          points?: number
          position: number
          season_id: string
          team_id: string
          updated_at?: string
          won?: number
        }
        Update: {
          created_at?: string
          drawn?: number
          form?: string | null
          ga?: number
          gd?: number
          gf?: number
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number
          season_id?: string
          team_id?: string
          updated_at?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sources: {
        Row: {
          canonical_id: string
          confidence: number
          created_at: string
          id: string
          source: string
          source_id: string
          source_name: string | null
          updated_at: string
        }
        Insert: {
          canonical_id: string
          confidence?: number
          created_at?: string
          id?: string
          source: string
          source_id: string
          source_name?: string | null
          updated_at?: string
        }
        Update: {
          canonical_id?: string
          confidence?: number
          created_at?: string
          id?: string
          source?: string
          source_id?: string
          source_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sources_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country: string | null
          created_at: string
          crest_url: string | null
          id: string
          name: string
          short_name: string | null
          slug: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          crest_url?: string | null
          id?: string
          name: string
          short_name?: string | null
          slug: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          crest_url?: string | null
          id?: string
          name?: string
          short_name?: string | null
          slug?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
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
