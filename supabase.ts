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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action_type"]
          action_description: string | null
          action_details: Json | null
          action_display: string | null
          club_id: number | null
          created_at: string
          id: number
          member_id: number | null
          new_values: Json | null
          old_values: Json | null
          target_id: number | null
          target_name: string | null
          tournament_id: number | null
          user_id: number | null
          user_name: string | null
          user_role: string | null
          user_type: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action_type"]
          action_description?: string | null
          action_details?: Json | null
          action_display?: string | null
          club_id?: number | null
          created_at?: string
          id?: number
          member_id?: number | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: number | null
          target_name?: string | null
          tournament_id?: number | null
          user_id?: number | null
          user_name?: string | null
          user_role?: string | null
          user_type?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action_type"]
          action_description?: string | null
          action_details?: Json | null
          action_display?: string | null
          club_id?: number | null
          created_at?: string
          id?: number
          member_id?: number | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: number | null
          target_name?: string | null
          tournament_id?: number | null
          user_id?: number | null
          user_name?: string | null
          user_role?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      blind_structure: {
        Row: {
          allow_rebuy: boolean
          blind_levels: Json | null
          description: string | null
          id: number
          last_buyin_level: number | null
          max_buyin_entries: number | null
          name: string | null
          starting_chips: number
        }
        Insert: {
          allow_rebuy?: boolean
          blind_levels?: Json | null
          description?: string | null
          id?: number
          last_buyin_level?: number | null
          max_buyin_entries?: number | null
          name?: string | null
          starting_chips: number
        }
        Update: {
          allow_rebuy?: boolean
          blind_levels?: Json | null
          description?: string | null
          id?: number
          last_buyin_level?: number | null
          max_buyin_entries?: number | null
          name?: string | null
          starting_chips?: number
        }
        Relationships: []
      }
      club: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          email: string | null
          id: number
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["club_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          status: Database["public"]["Enums"]["club_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: number
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["club_status"]
          updated_at?: string
        }
        Relationships: []
      }
      club_member: {
        Row: {
          admin_fee_discount: boolean | null
          avatar_url: string | null
          balance: number | null
          club_id: number
          club_member_code: string | null
          created_at: string | null
          entry_fee_discount: boolean | null
          joined_date: string | null
          kyc_status:
            | Database["public"]["Enums"]["club_member_kyc_status"]
            | null
          member_id: number
          member_status:
            | Database["public"]["Enums"]["club_member_status"]
            | null
          membership_level:
            | Database["public"]["Enums"]["membership_level"]
            | null
          nickname: string | null
          notes: string | null
          other_reference_code: string | null
          staff_discount: boolean | null
          updated_at: string | null
        }
        Insert: {
          admin_fee_discount?: boolean | null
          avatar_url?: string | null
          balance?: number | null
          club_id: number
          club_member_code?: string | null
          created_at?: string | null
          entry_fee_discount?: boolean | null
          joined_date?: string | null
          kyc_status?:
            | Database["public"]["Enums"]["club_member_kyc_status"]
            | null
          member_id: number
          member_status?:
            | Database["public"]["Enums"]["club_member_status"]
            | null
          membership_level?:
            | Database["public"]["Enums"]["membership_level"]
            | null
          nickname?: string | null
          notes?: string | null
          other_reference_code?: string | null
          staff_discount?: boolean | null
          updated_at?: string | null
        }
        Update: {
          admin_fee_discount?: boolean | null
          avatar_url?: string | null
          balance?: number | null
          club_id?: number
          club_member_code?: string | null
          created_at?: string | null
          entry_fee_discount?: boolean | null
          joined_date?: string | null
          kyc_status?:
            | Database["public"]["Enums"]["club_member_kyc_status"]
            | null
          member_id?: number
          member_status?:
            | Database["public"]["Enums"]["club_member_status"]
            | null
          membership_level?:
            | Database["public"]["Enums"]["membership_level"]
            | null
          nickname?: string | null
          notes?: string | null
          other_reference_code?: string | null
          staff_discount?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_member_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      member: {
        Row: {
          account: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: number
          id_number: string
          id_url: string | null
          line_account: string | null
          mobile_phone: string | null
          nick_name: string | null
          notes: string | null
          password_hash: string | null
          updated_at: string
        }
        Insert: {
          account?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: number
          id_number: string
          id_url?: string | null
          line_account?: string | null
          mobile_phone?: string | null
          nick_name?: string | null
          notes?: string | null
          password_hash?: string | null
          updated_at?: string
        }
        Update: {
          account?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: number
          id_number?: string
          id_url?: string | null
          line_account?: string | null
          mobile_phone?: string | null
          nick_name?: string | null
          notes?: string | null
          password_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payout_model: {
        Row: {
          description: string | null
          id: number
          is_default: boolean
          name: string | null
          payout_rules: Json | null
          ranges: number | null
        }
        Insert: {
          description?: string | null
          id?: number
          is_default?: boolean
          name?: string | null
          payout_rules?: Json | null
          ranges?: number | null
        }
        Update: {
          description?: string | null
          id?: number
          is_default?: boolean
          name?: string | null
          payout_rules?: Json | null
          ranges?: number | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          avatar_url: string | null
          club_id: number
          created_at: string
          id: number
          last_login_at: string | null
          member_id: number
          notes: string | null
          password_hash: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          club_id: number
          created_at?: string
          id?: number
          last_login_at?: string | null
          member_id: number
          notes?: string | null
          password_hash: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          club_id?: number
          created_at?: string
          id?: number
          last_login_at?: string | null
          member_id?: number
          notes?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitation: {
        Row: {
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          token_hash: string
          used_at: string | null
        }
        Insert: {
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          token_hash: string
          used_at?: string | null
        }
        Update: {
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          token_hash?: string
          used_at?: string | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          club_id: number
          id: number
          max_seats: number
          name: string | null
          notes: string | null
          status: Database["public"]["Enums"]["table_status"]
          table_number: number
        }
        Insert: {
          club_id: number
          id?: number
          max_seats: number
          name?: string | null
          notes?: string | null
          status: Database["public"]["Enums"]["table_status"]
          table_number: number
        }
        Update: {
          club_id?: number
          id?: number
          max_seats?: number
          name?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tables_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament: {
        Row: {
          blind_structure_id: number
          buyin_amount: number
          clock_url: string | null
          club_id: number
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: number
          is_paused: boolean
          location: string | null
          max_players: number
          min_players: number
          name: string
          paused_at: string | null
          payout_model_id: number
          prize_pool: number | null
          prize_structure: Json | null
          registration_end_time: string | null
          registration_fee: number
          registration_start_time: string
          scheduled_start_time: string
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at: string
        }
        Insert: {
          blind_structure_id: number
          buyin_amount: number
          clock_url?: string | null
          club_id: number
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: number
          is_paused?: boolean
          location?: string | null
          max_players: number
          min_players: number
          name: string
          paused_at?: string | null
          payout_model_id: number
          prize_pool?: number | null
          prize_structure?: Json | null
          registration_end_time?: string | null
          registration_fee?: number
          registration_start_time: string
          scheduled_start_time: string
          started_at?: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Update: {
          blind_structure_id?: number
          buyin_amount?: number
          clock_url?: string | null
          club_id?: number
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: number
          is_paused?: boolean
          location?: string | null
          max_players?: number
          min_players?: number
          name?: string
          paused_at?: string | null
          payout_model_id?: number
          prize_pool?: number | null
          prize_structure?: Json | null
          registration_end_time?: string | null
          registration_fee?: number
          registration_start_time?: string
          scheduled_start_time?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_blind_structure_id_fkey"
            columns: ["blind_structure_id"]
            isOneToOne: false
            referencedRelation: "blind_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_payout_model_id_fkey"
            columns: ["payout_model_id"]
            isOneToOne: false
            referencedRelation: "payout_model"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_player: {
        Row: {
          cancelled_at: string | null
          club_id: number
          confirmed_at: string | null
          created_at: string | null
          eliminated_at: string | null
          entry_number: number
          final_rank: number | null
          id: number
          member_id: number
          notes: string | null
          placing_category:
            | Database["public"]["Enums"]["tournament_placing_category"]
            | null
          prize_amount: number | null
          queue_position: number | null
          requested_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["tournament_player_status"]
          tournament_id: number
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          club_id: number
          confirmed_at?: string | null
          created_at?: string | null
          eliminated_at?: string | null
          entry_number: number
          final_rank?: number | null
          id?: number
          member_id: number
          notes?: string | null
          placing_category?:
            | Database["public"]["Enums"]["tournament_placing_category"]
            | null
          prize_amount?: number | null
          queue_position?: number | null
          requested_at: string
          started_at?: string | null
          status: Database["public"]["Enums"]["tournament_player_status"]
          tournament_id: number
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          club_id?: number
          confirmed_at?: string | null
          created_at?: string | null
          eliminated_at?: string | null
          entry_number?: number
          final_rank?: number | null
          id?: number
          member_id?: number
          notes?: string | null
          placing_category?:
            | Database["public"]["Enums"]["tournament_placing_category"]
            | null
          prize_amount?: number | null
          queue_position?: number | null
          requested_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["tournament_player_status"]
          tournament_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_player_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_player_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_player_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_tables: {
        Row: {
          id: number
          is_active: boolean | null
          table_id: number | null
          tournament_id: number | null
        }
        Insert: {
          id?: number
          is_active?: boolean | null
          table_id?: number | null
          tournament_id?: number | null
        }
        Update: {
          id?: number
          is_active?: boolean | null
          table_id?: number | null
          tournament_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_tables_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_tables_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          club_id: number
          completed_at: string | null
          created_at: string
          description: string | null
          id: number
          member_id: number
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference: string | null
          processed_by: number | null
          status: Database["public"]["Enums"]["transaction_status"]
          tournament_id: number | null
          tournament_player_id: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          club_id: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: number
          member_id: number
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          processed_by?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tournament_id?: number | null
          tournament_player_id?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          club_id?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: number
          member_id?: number
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string | null
          processed_by?: number | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tournament_id?: number | null
          tournament_player_id?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
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
      audit_action_type:
        | "create"
        | "update"
        | "delete"
        | "view"
        | "export"
        | "login"
        | "logout"
        | "login_failed"
        | "password_reset"
        | "approve_member"
        | "activate_member"
        | "deactivate_member"
        | "approve_kyc"
        | "reject_kyc"
        | "start_tournament"
        | "pause_tournament"
        | "end_tournament"
        | "cancel_tournament"
        | "approve_registration"
        | "reject_registration"
        | "process_payment"
        | "update_balance"
      club_member_kyc_status: "verified" | "unverified"
      club_member_status: "pending_approval" | "activated" | "deactivated"
      club_status: "activated" | "deactivated"
      membership_level: "bronze" | "silver" | "gold" | "platinum" | "diamond"
      payment_method:
        | "balance"
        | "cash"
        | "bank_transfer"
        | "credit_card"
        | "crypto"
        | "other"
      staff_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "cashier"
        | "dealer"
        | "employee"
        | "viewer"
      table_status: "activated" | "deactivated"
      tournament_placing_category:
        | "champion"
        | "podium"
        | "final_table"
        | "paid"
        | "bubble"
        | "eliminated"
      tournament_player_status:
        | "pending_review"
        | "confirmed"
        | "active"
        | "eliminated"
        | "cancelled"
      tournament_status:
        | "scheduled"
        | "registration"
        | "in_progress"
        | "completed"
        | "cancelled"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type:
        | "deposit"
        | "withdraw"
        | "entry_fee"
        | "buyin"
        | "rebuy"
        | "addon"
        | "prize"
        | "refund"
        | "adjustment"
        | "bonus"
        | "fee"
        | "commission"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action_type: [
        "create",
        "update",
        "delete",
        "view",
        "export",
        "login",
        "logout",
        "login_failed",
        "password_reset",
        "approve_member",
        "activate_member",
        "deactivate_member",
        "approve_kyc",
        "reject_kyc",
        "start_tournament",
        "pause_tournament",
        "end_tournament",
        "cancel_tournament",
        "approve_registration",
        "reject_registration",
        "process_payment",
        "update_balance",
      ],
      club_member_kyc_status: ["verified", "unverified"],
      club_member_status: ["pending_approval", "activated", "deactivated"],
      club_status: ["activated", "deactivated"],
      membership_level: ["bronze", "silver", "gold", "platinum", "diamond"],
      payment_method: [
        "balance",
        "cash",
        "bank_transfer",
        "credit_card",
        "crypto",
        "other",
      ],
      staff_role: [
        "super_admin",
        "admin",
        "manager",
        "cashier",
        "dealer",
        "employee",
        "viewer",
      ],
      table_status: ["activated", "deactivated"],
      tournament_placing_category: [
        "champion",
        "podium",
        "final_table",
        "paid",
        "bubble",
        "eliminated",
      ],
      tournament_player_status: [
        "pending_review",
        "confirmed",
        "active",
        "eliminated",
        "cancelled",
      ],
      tournament_status: [
        "scheduled",
        "registration",
        "in_progress",
        "completed",
        "cancelled",
      ],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: [
        "deposit",
        "withdraw",
        "entry_fee",
        "buyin",
        "rebuy",
        "addon",
        "prize",
        "refund",
        "adjustment",
        "bonus",
        "fee",
        "commission",
      ],
    },
  },
} as const