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
      card_templates: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          page_count: number;
          pdf_url: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          page_count?: number;
          pdf_url: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          page_count?: number;
          pdf_url?: string;
          updated_at?: string;
        };
        Relationships: [];
      }
      members: {
        Row: {
          area_of_interest: Database["public"]["Enums"]["area_of_interest"]
          complete_address: string
          created_at: string
          degree_institute: string
          designation: string
          district: string
          education_level: Database["public"]["Enums"]["education_level"]
          email: string
          full_name: string
          id: string
          membership_id: string
          profile_photo_url: string | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          whatsapp_number: string
          provincial_seat: string | null
        }
        Insert: {
          area_of_interest: Database["public"]["Enums"]["area_of_interest"]
          complete_address: string
          created_at?: string
          degree_institute: string
          designation: string
          district: string
          education_level: Database["public"]["Enums"]["education_level"]
          email: string
          full_name: string
          id?: string
          membership_id: string
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          whatsapp_number: string
          provincial_seat?: string | null
        }
        Update: {
          area_of_interest?: Database["public"]["Enums"]["area_of_interest"]
          complete_address?: string
          created_at?: string
          degree_institute?: string
          designation?: string
          district?: string
          education_level?: Database["public"]["Enums"]["education_level"]
          email?: string
          full_name?: string
          id?: string
          membership_id?: string
          profile_photo_url?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          whatsapp_number?: string
          provincial_seat?: string | null
        }
        Relationships: []
      }
      template_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string
          font_color: string | null
          font_family: string | null
          font_size: number | null
          has_border: boolean | null
          height: number | null
          id: string
          image_shape: string | null
          page_number: number
          template_id: string
          text_alignment: string | null
          updated_at: string
          width: number | null
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type: string
          font_color?: string | null
          font_family?: string | null
          font_size?: number | null
          has_border?: boolean | null
          height?: number | null
          id?: string
          image_shape?: string | null
          page_number?: number
          template_id: string
          text_alignment?: string | null
          updated_at?: string
          width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string
          font_color?: string | null
          font_family?: string | null
          font_size?: number | null
          has_border?: boolean | null
          height?: number | null
          id?: string
          image_shape?: string | null
          page_number?: number
          template_id?: string
          text_alignment?: string | null
          updated_at?: string
          width?: number | null
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      area_of_interest:
        | "muslim_kids"
        | "media_department"
        | "madadgar_team"
        | "universities_department"
        | "msl_team"
        | "it_department"
      education_level:
        | "hafiz_quran"
        | "matric"
        | "inter"
        | "bs"
        | "masters"
        | "phd"
      member_status: "pending" | "approved" | "rejected" | "inactive"
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
      app_role: ["admin", "moderator", "user"],
      area_of_interest: [
        "muslim_kids",
        "media_department",
        "madadgar_team",
        "universities_department",
        "msl_team",
        "it_department",
      ],
      education_level: [
        "hafiz_quran",
        "matric",
        "inter",
        "bs",
        "masters",
        "phd",
      ],
      member_status: ["pending", "approved", "rejected", "inactive"],
    },
  },
} as const
