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
      arbiz_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_claimed: number
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_claimed?: number
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_claimed?: number
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      arbiz_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          id: string
          level: number
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id: string
          id?: string
          level?: number
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          id?: string
          level?: number
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          day_streak: number
          id: string
          reward_amount: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          day_streak?: number
          id?: string
          reward_amount?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          day_streak?: number
          id?: string
          reward_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      investment_plans: {
        Row: {
          created_at: string
          daily_profit_max: number
          daily_profit_min: number
          display_name: string
          id: string
          is_active: boolean
          max_amount: number
          min_amount: number
          name: Database["public"]["Enums"]["investment_plan"]
        }
        Insert: {
          created_at?: string
          daily_profit_max: number
          daily_profit_min: number
          display_name: string
          id?: string
          is_active?: boolean
          max_amount: number
          min_amount: number
          name: Database["public"]["Enums"]["investment_plan"]
        }
        Update: {
          created_at?: string
          daily_profit_max?: number
          daily_profit_min?: number
          display_name?: string
          id?: string
          is_active?: boolean
          max_amount?: number
          min_amount?: number
          name?: Database["public"]["Enums"]["investment_plan"]
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          auto_compound: boolean
          bonus_used: number
          created_at: string
          id: string
          plan_id: string
          status: string
          total_profit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_compound?: boolean
          bonus_used?: number
          created_at?: string
          id?: string
          plan_id: string
          status?: string
          total_profit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_compound?: boolean
          bonus_used?: number
          created_at?: string
          id?: string
          plan_id?: string
          status?: string
          total_profit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: string
          document_url: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          document_url: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          kyc_status: string
          phone: string | null
          rank: Database["public"]["Enums"]["user_rank"]
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          kyc_status?: string
          phone?: string | null
          rank?: Database["public"]["Enums"]["user_rank"]
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          kyc_status?: string
          phone?: string | null
          rank?: Database["public"]["Enums"]["user_rank"]
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_engine_logs: {
        Row: {
          created_at: string
          error_message: string | null
          executed_at: string
          id: string
          processed: number
          status: string
          total_investments: number
          total_profit_amount: number
          trigger_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          processed?: number
          status?: string
          total_investments?: number
          total_profit_amount?: number
          trigger_type?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          processed?: number
          status?: string
          total_investments?: number
          total_profit_amount?: number
          trigger_type?: string
        }
        Relationships: []
      }
      profits: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          market_volatility: number | null
          profit_date: string
          spread_volume: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          market_volatility?: number | null
          profit_date?: string
          spread_volume?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          market_volatility?: number | null
          profit_date?: string
          spread_volume?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profits_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      spin_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          label: string
          probability: number
          reward_type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          probability?: number
          reward_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          probability?: number
          reward_type?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          fee: number
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["transaction_status"]
          tx_hash: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tx_hash?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tx_hash?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_spins: {
        Row: {
          created_at: string
          id: string
          reward_amount: number
          reward_id: string | null
          reward_label: string | null
          spin_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward_amount?: number
          reward_id?: string | null
          reward_label?: string | null
          spin_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward_amount?: number
          reward_id?: string | null
          reward_label?: string | null
          spin_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spins_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "spin_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          bonus_balance: number
          created_at: string
          currency: string
          frozen_balance: number
          id: string
          reward_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          bonus_balance?: number
          created_at?: string
          currency?: string
          frozen_balance?: number
          id?: string
          reward_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          bonus_balance?: number
          created_at?: string
          currency?: string
          frozen_balance?: number
          id?: string
          reward_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atomic_reward_credit: {
        Args: { p_amount: number; p_currency: string; p_user_id: string }
        Returns: boolean
      }
      atomic_wallet_credit: {
        Args: { p_amount: number; p_currency: string; p_user_id: string }
        Returns: boolean
      }
      atomic_wallet_debit: {
        Args: { p_amount: number; p_currency: string; p_user_id: string }
        Returns: boolean
      }
      convert_reward_to_balance: {
        Args: { p_currency: string; p_user_id: string }
        Returns: boolean
      }
      get_downline_tree: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          full_name: string
          is_active: boolean
          level: number
          profile_id: string
          rank: Database["public"]["Enums"]["user_rank"]
          referral_code: string
          referred_by: string
        }[]
      }
      get_downline_with_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_bots: number
          created_at: string
          full_name: string
          is_active: boolean
          level: number
          profile_id: string
          rank: Database["public"]["Enums"]["user_rank"]
          referral_code: string
          referred_by: string
          total_deposit: number
        }[]
      }
      get_my_profile_id: { Args: { _user_id: string }; Returns: string }
      get_withdrawal_penalty_rate: {
        Args: { p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_bonus_for_investment: {
        Args: { p_amount: number; p_currency: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "manager" | "finance"
      investment_plan: "basic" | "advance" | "business" | "elite"
      transaction_status:
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
      transaction_type:
        | "deposit"
        | "withdraw"
        | "investment"
        | "profit"
        | "commission"
        | "transfer"
        | "fee"
        | "penalty"
      user_rank: "bronze" | "silver" | "gold" | "platinum" | "diamond"
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
    Enums: {
      app_role: ["admin", "moderator", "user", "manager", "finance"],
      investment_plan: ["basic", "advance", "business", "elite"],
      transaction_status: [
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      transaction_type: [
        "deposit",
        "withdraw",
        "investment",
        "profit",
        "commission",
        "transfer",
        "fee",
        "penalty",
      ],
      user_rank: ["bronze", "silver", "gold", "platinum", "diamond"],
    },
  },
} as const
