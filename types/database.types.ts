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
          stock_quantity: number;
          min_stock_quantity: number | null;
          batch_number: string | null;
          expiry_date: string | null;
          track_inventory: boolean | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
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
          stock_quantity?: number;
          min_stock_quantity?: number | null;
          batch_number?: string | null;
          expiry_date?: string | null;
          track_inventory?: boolean | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
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
          stock_quantity?: number;
          min_stock_quantity?: number | null;
          batch_number?: string | null;
          expiry_date?: string | null;
          track_inventory?: boolean | null;
          is_active?: boolean | null;
          updated_at?: string;
          updated_by?: string | null;
          deleted_at?: string | null;
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
          first_name: string;
          last_name: string;
          phone: string;
          address: string | null;
          city: string | null;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          phone?: string;
          address?: string | null;
          city?: string | null;
          notes?: string | null;
          status?: string;
          updated_at?: string;
          deleted_at?: string | null;
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
      sales: {
        Row: {
          id: string;
          workspace_id: string;
          invoice_number: string;
          customer_id: string | null;
          sale_type: string;
          subtotal: number;
          discount: number;
          tax: number;
          total: number;
          paid_amount: number;
          remaining_amount: number;
          payment_status: string;
          status: "pending" | "partially_paid" | "paid" | "cancelled";
          notes: string | null;
          sale_date: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          invoice_number: string;
          customer_id?: string | null;
          sale_type?: string;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total: number;
          paid_amount?: number;
          remaining_amount?: number;
          payment_status?: string;
          status?: "pending" | "partially_paid" | "paid" | "cancelled";
          notes?: string | null;
          sale_date?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          invoice_number?: string;
          customer_id?: string | null;
          sale_type?: string;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total?: number;
          paid_amount?: number;
          remaining_amount?: number;
          payment_status?: string;
          status?: "pending" | "partially_paid" | "paid" | "cancelled";
          notes?: string | null;
          sale_date?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      sale_items: {
        Row: {
          id: string;
          workspace_id: string;
          sale_id: string;
          product_id: string | null;
          product_name: string;
          item_type: "product" | "one_time";
          quantity: number;
          unit_price: number;
          discount: number;
          tax: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          sale_id: string;
          product_id?: string | null;
          product_name: string;
          item_type?: "product" | "one_time";
          quantity: number;
          unit_price: number;
          discount?: number;
          tax?: number;
          total: number;
          created_at?: string;
        };
        Update: {
          product_name?: string;
          item_type?: "product" | "one_time";
          quantity?: number;
          unit_price?: number;
          discount?: number;
          tax?: number;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          workspace_id: string;
          customer_id: string;
          sale_id: string | null;
          amount: number;
          payment_method: string;
          payment_date: string;
          reference_number: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          customer_id: string;
          sale_id?: string | null;
          amount: number;
          payment_method: string;
          payment_date?: string;
          reference_number?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          customer_id?: string;
          sale_id?: string | null;
          amount?: number;
          payment_method?: string;
          payment_date?: string;
          reference_number?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_ledger: {
        Row: {
          id: string;
          workspace_id: string;
          customer_id: string;
          transaction_type: string;
          reference_type: string | null;
          reference_id: string | null;
          debit: number;
          credit: number;
          balance: number;
          description: string;
          transaction_date: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          customer_id: string;
          transaction_type: string;
          reference_type?: string | null;
          reference_id?: string | null;
          debit?: number;
          credit?: number;
          balance: number;
          description: string;
          transaction_date?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          transaction_type?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          debit?: number;
          credit?: number;
          balance?: number;
          description?: string;
          transaction_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_ledger_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_ledger_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_sale_transaction: {
        Args: {
          p_workspace_id: string;
          p_user_id: string;
          p_invoice_number: string;
          p_customer_id: string | null;
          p_subtotal: number;
          p_discount: number;
          p_total: number;
          p_paid_amount: number;
          p_remaining: number;
          p_status: string;
          p_notes: string | null;
          p_sale_date: string;
          p_payment_method: string | null;
          p_items: Json;
        };
        Returns: string;
      };
      get_dashboard_stats: {
        Args: { p_workspace_id: string };
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
      update_customer_ledger: {
        Args: {
          p_customer_id: string;
          p_workspace_id: string;
          p_transaction_type: string;
          p_reference_type: string;
          p_reference_id: string;
          p_debit?: number;
          p_credit?: number;
          p_description?: string;
        };
        Returns: undefined;
      };
      get_expiry_alerts: {
        Args: {
          p_workspace_id: string;
          p_days_threshold: number;
        };
        Returns: {
          product_id: string;
          product_name: string;
          expiry_date: string;
          days_until_expiry: number;
          stock_quantity: number;
          category_name: string | null;
        }[];
      };
      get_low_stock_products: {
        Args: {
          p_workspace_id: string;
        };
        Returns: {
          product_id: string;
          product_name: string;
          stock_quantity: number;
          min_stock_quantity: number;
          selling_price: number;
          category_name: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
