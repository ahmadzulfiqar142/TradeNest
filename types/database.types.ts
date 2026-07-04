export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          business_address: string | null;
          business_phone: string | null;
          business_email: string | null;
          business_whatsapp: string | null;
          currency: string | null;
          timezone: string | null;
          invoice_prefix: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_email?: string | null;
          business_whatsapp?: string | null;
          currency?: string | null;
          timezone?: string | null;
          invoice_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          business_address?: string | null;
          business_phone?: string | null;
          business_email?: string | null;
          business_whatsapp?: string | null;
          currency?: string | null;
          timezone?: string | null;
          invoice_prefix?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          workspace_id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          workspace_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          sku: string | null;
          barcode: string | null;
          image_url: string | null;
          purchase_price: number;
          selling_price: number;
          wholesale_price: number | null;
          unit: string | null;
          stock_quantity: number;
          min_stock_quantity: number | null;
          batch_number: string | null;
          expiry_date: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          sku?: string | null;
          barcode?: string | null;
          image_url?: string | null;
          purchase_price?: number;
          selling_price?: number;
          wholesale_price?: number | null;
          unit?: string | null;
          stock_quantity?: number;
          min_stock_quantity?: number | null;
          batch_number?: string | null;
          expiry_date?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          description?: string | null;
          sku?: string | null;
          barcode?: string | null;
          image_url?: string | null;
          purchase_price?: number;
          selling_price?: number;
          wholesale_price?: number | null;
          unit?: string | null;
          stock_quantity?: number;
          min_stock_quantity?: number | null;
          batch_number?: string | null;
          expiry_date?: string | null;
          is_active?: boolean | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_transactions: {
        Row: {
          id: string;
          workspace_id: string;
          product_id: string;
          transaction_type: "in" | "out" | "adjustment";
          quantity: number;
          previous_stock: number;
          new_stock: number;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          product_id: string;
          transaction_type: "in" | "out" | "adjustment";
          quantity: number;
          previous_stock: number;
          new_stock: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          transaction_type?: "in" | "out" | "adjustment";
          quantity?: number;
          previous_stock?: number;
          new_stock?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          id_number: string | null;
          credit_limit: number;
          opening_balance: number;
          current_balance: number;
          notes: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          id_number?: string | null;
          credit_limit?: number;
          opening_balance?: number;
          current_balance?: number;
          notes?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          id_number?: string | null;
          credit_limit?: number;
          opening_balance?: number;
          notes?: string | null;
          is_active?: boolean | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_stats: {
        Args: {
          p_workspace_id: string;
        };
        Returns: {
          today_sales: number;
          today_purchases: number;
          monthly_sales: number;
          monthly_purchases: number;
          monthly_expenses: number;
          pending_payments: number;
          low_stock_count: number;
          total_customers: number;
          total_products: number;
          inventory_value: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
