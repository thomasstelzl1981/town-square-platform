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
      access_grants: {
        Row: {
          can_download: boolean
          can_view: boolean
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          revoked_at: string | null
          revoked_by: string | null
          scope_id: string
          scope_type: string
          status: string
          subject_id: string
          subject_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          can_download?: boolean
          can_view?: boolean
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scope_id: string
          scope_type: string
          status?: string
          subject_id: string
          subject_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          can_download?: boolean
          can_view?: boolean
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scope_id?: string
          scope_type?: string
          status?: string
          subject_id?: string
          subject_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_templates: {
        Row: {
          code: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          requires_consent: boolean
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
          version: number
        }
        Insert: {
          code: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          requires_consent?: boolean
          title: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          code?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          requires_consent?: boolean
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          actor_user_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          target_org_id: string | null
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          target_org_id?: string | null
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          target_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agreement_consent_id: string | null
          amount: number
          contact_id: string | null
          created_at: string
          id: string
          invoiced_at: string | null
          notes: string | null
          paid_at: string | null
          percentage: number | null
          pipeline_id: string
          status: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agreement_consent_id?: string | null
          amount: number
          contact_id?: string | null
          created_at?: string
          id?: string
          invoiced_at?: string | null
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          pipeline_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agreement_consent_id?: string | null
          amount?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          invoiced_at?: string | null
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          pipeline_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agreement_consent_id_fkey"
            columns: ["agreement_consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "partner_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_path: string
          id: string
          mime_type: string
          name: string
          size_bytes: number
          tenant_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          mime_type: string
          name: string
          size_bytes: number
          tenant_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string
          name?: string
          size_bytes?: number
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_documents: {
        Row: {
          created_at: string
          document_id: string
          document_type: string
          finance_package_id: string
          id: string
          is_required: boolean
          tenant_id: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          document_type: string
          finance_package_id: string
          id?: string
          is_required?: boolean
          tenant_id: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string
          finance_package_id?: string
          id?: string
          is_required?: boolean
          tenant_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_documents_finance_package_id_fkey"
            columns: ["finance_package_id"]
            isOneToOne: false
            referencedRelation: "finance_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_packages: {
        Row: {
          contact_id: string
          created_at: string
          data_room_id: string | null
          data_sharing_consent_id: string | null
          exported_at: string | null
          exported_by: string | null
          external_reference: string | null
          id: string
          notes: string | null
          property_id: string
          requested_amount: number | null
          status: Database["public"]["Enums"]["finance_package_status"]
          summary_document_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          data_room_id?: string | null
          data_sharing_consent_id?: string | null
          exported_at?: string | null
          exported_by?: string | null
          external_reference?: string | null
          id?: string
          notes?: string | null
          property_id: string
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["finance_package_status"]
          summary_document_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          data_room_id?: string | null
          data_sharing_consent_id?: string | null
          exported_at?: string | null
          exported_by?: string | null
          external_reference?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          requested_amount?: number | null
          status?: Database["public"]["Enums"]["finance_package_status"]
          summary_document_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_packages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packages_data_sharing_consent_id_fkey"
            columns: ["data_sharing_consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_items: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_contact_id: string | null
          assigned_property_id: string | null
          assigned_tenant_id: string | null
          created_at: string
          external_id: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json
          mime_type: string | null
          notes: string | null
          processed_at: string | null
          recipient_info: Json
          sender_info: Json
          source: Database["public"]["Enums"]["inbound_source"]
          status: Database["public"]["Enums"]["inbound_item_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_contact_id?: string | null
          assigned_property_id?: string | null
          assigned_tenant_id?: string | null
          created_at?: string
          external_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          processed_at?: string | null
          recipient_info?: Json
          sender_info?: Json
          source: Database["public"]["Enums"]["inbound_source"]
          status?: Database["public"]["Enums"]["inbound_item_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_contact_id?: string | null
          assigned_property_id?: string | null
          assigned_tenant_id?: string | null
          created_at?: string
          external_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          processed_at?: string | null
          recipient_info?: Json
          sender_info?: Json
          source?: Database["public"]["Enums"]["inbound_source"]
          status?: Database["public"]["Enums"]["inbound_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_items_assigned_contact_id_fkey"
            columns: ["assigned_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_items_assigned_property_id_fkey"
            columns: ["assigned_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_items_assigned_tenant_id_fkey"
            columns: ["assigned_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_routing_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          match_conditions: Json
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          match_conditions?: Json
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          match_conditions?: Json
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      investment_profiles: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          is_active: boolean
          max_investment: number | null
          max_yield: number | null
          min_investment: number | null
          min_yield: number | null
          notes: string | null
          preferred_cities: string[] | null
          preferred_property_types: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_investment?: number | null
          max_yield?: number | null
          min_investment?: number | null
          min_yield?: number | null
          notes?: string | null
          preferred_cities?: string[] | null
          preferred_property_types?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_investment?: number | null
          max_yield?: number | null
          min_investment?: number | null
          min_yield?: number | null
          notes?: string | null
          preferred_cities?: string[] | null
          preferred_property_types?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          line_items: Json
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          line_items?: Json
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          line_items?: Json
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          deposit_amount: number | null
          end_date: string | null
          id: string
          monthly_rent: number
          notice_date: string | null
          rent_increase: string | null
          renter_org_id: string | null
          start_date: string
          status: string
          tenant_contact_id: string
          tenant_id: string
          tenant_since: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          monthly_rent: number
          notice_date?: string | null
          rent_increase?: string | null
          renter_org_id?: string | null
          start_date: string
          status?: string
          tenant_contact_id: string
          tenant_id: string
          tenant_since?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          monthly_rent?: number
          notice_date?: string | null
          rent_increase?: string | null
          renter_org_id?: string | null
          start_date?: string
          status?: string
          tenant_contact_id?: string
          tenant_id?: string
          tenant_since?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_contact_fk"
            columns: ["tenant_id", "tenant_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leases_renter_org_id_fkey"
            columns: ["renter_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_fk"
            columns: ["tenant_id", "unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["membership_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_delegations: {
        Row: {
          created_at: string
          delegate_org_id: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          revoked_at: string | null
          revoked_by: string | null
          scopes: Json
          status: Database["public"]["Enums"]["delegation_status"]
          target_org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delegate_org_id: string
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: Json
          status?: Database["public"]["Enums"]["delegation_status"]
          target_org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delegate_org_id?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: Json
          status?: Database["public"]["Enums"]["delegation_status"]
          target_org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_delegations_delegate_org_id_fkey"
            columns: ["delegate_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_delegations_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          depth: number
          id: string
          materialized_path: string
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          parent_access_blocked: boolean
          parent_id: string | null
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          depth?: number
          id?: string
          materialized_path?: string
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          parent_access_blocked?: boolean
          parent_id?: string | null
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          depth?: number
          id?: string
          materialized_path?: string
          name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          parent_access_blocked?: boolean
          parent_id?: string | null
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_pipelines: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          deal_value: number | null
          expected_close_date: string | null
          id: string
          notes: string | null
          property_id: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          deal_value?: number | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          deal_value?: number | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_pipelines_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_pipelines_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_pipelines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          display_order: number
          features: Json
          id: string
          interval: Database["public"]["Enums"]["plan_interval"]
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          name: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_tenant_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_tenant_id_fkey"
            columns: ["active_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          annual_income: number | null
          bnl_date: string | null
          city: string
          code: string | null
          country: string
          created_at: string
          description: string | null
          energy_source: string | null
          heating_type: string | null
          id: string
          is_public_listing: boolean
          land_register_court: string | null
          land_register_sheet: string | null
          land_register_volume: string | null
          management_fee: number | null
          market_value: number | null
          notary_date: string | null
          parcel_number: string | null
          postal_code: string | null
          property_type: string
          public_listing_approved_at: string | null
          public_listing_approved_by: string | null
          purchase_price: number | null
          renovation_year: number | null
          status: string
          tenant_id: string
          total_area_sqm: number | null
          unit_ownership_nr: string | null
          updated_at: string
          usage_type: string
          year_built: number | null
        }
        Insert: {
          address: string
          annual_income?: number | null
          bnl_date?: string | null
          city: string
          code?: string | null
          country?: string
          created_at?: string
          description?: string | null
          energy_source?: string | null
          heating_type?: string | null
          id?: string
          is_public_listing?: boolean
          land_register_court?: string | null
          land_register_sheet?: string | null
          land_register_volume?: string | null
          management_fee?: number | null
          market_value?: number | null
          notary_date?: string | null
          parcel_number?: string | null
          postal_code?: string | null
          property_type?: string
          public_listing_approved_at?: string | null
          public_listing_approved_by?: string | null
          purchase_price?: number | null
          renovation_year?: number | null
          status?: string
          tenant_id: string
          total_area_sqm?: number | null
          unit_ownership_nr?: string | null
          updated_at?: string
          usage_type?: string
          year_built?: number | null
        }
        Update: {
          address?: string
          annual_income?: number | null
          bnl_date?: string | null
          city?: string
          code?: string | null
          country?: string
          created_at?: string
          description?: string | null
          energy_source?: string | null
          heating_type?: string | null
          id?: string
          is_public_listing?: boolean
          land_register_court?: string | null
          land_register_sheet?: string | null
          land_register_volume?: string | null
          management_fee?: number | null
          market_value?: number | null
          notary_date?: string | null
          parcel_number?: string | null
          postal_code?: string | null
          property_type?: string
          public_listing_approved_at?: string | null
          public_listing_approved_by?: string | null
          purchase_price?: number | null
          renovation_year?: number | null
          status?: string
          tenant_id?: string
          total_area_sqm?: number | null
          unit_ownership_nr?: string | null
          updated_at?: string
          usage_type?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_features: {
        Row: {
          activated_at: string
          activated_by: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          feature_code: string
          id: string
          property_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          feature_code: string
          id?: string
          property_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          feature_code?: string
          id?: string
          property_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_features_tenant_id_property_id_fkey"
            columns: ["tenant_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      property_financing: {
        Row: {
          annual_interest: number | null
          bank_name: string | null
          created_at: string
          current_balance: number | null
          fixed_until: string | null
          id: string
          interest_rate: number | null
          is_active: boolean
          loan_number: string | null
          monthly_rate: number | null
          original_amount: number | null
          property_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          annual_interest?: number | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number | null
          fixed_until?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean
          loan_number?: string | null
          monthly_rate?: number | null
          original_amount?: number | null
          property_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          annual_interest?: number | null
          bank_name?: string | null
          created_at?: string
          current_balance?: number | null
          fixed_until?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean
          loan_number?: string | null
          monthly_rate?: number | null
          original_amount?: number | null
          property_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_financing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_financing_tenant_id_property_id_fkey"
            columns: ["tenant_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      renter_invites: {
        Row: {
          accepted_at: string | null
          contact_id: string
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          lease_id: string
          revoked_at: string | null
          revoked_by: string | null
          status: string
          tenant_id: string
          token: string
          unit_id: string
        }
        Insert: {
          accepted_at?: string | null
          contact_id: string
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          lease_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          tenant_id: string
          token?: string
          unit_id: string
        }
        Update: {
          accepted_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          lease_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          tenant_id?: string
          token?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renter_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ri_contact_fk"
            columns: ["tenant_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "ri_lease_fk"
            columns: ["tenant_id", "lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "ri_unit_fk"
            columns: ["tenant_id", "unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      self_disclosures: {
        Row: {
          created_at: string
          disclosure_data: Json
          finance_package_id: string
          id: string
          submitted_at: string | null
          submitted_by: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disclosure_data?: Json
          finance_package_id: string
          id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disclosure_data?: Json
          finance_package_id?: string
          id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_disclosures_finance_package_id_fkey"
            columns: ["finance_package_id"]
            isOneToOne: false
            referencedRelation: "finance_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "self_disclosures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_tile_activation: {
        Row: {
          activated_at: string
          activated_by: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          id: string
          status: string
          tenant_id: string
          tile_code: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          activated_by?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          status?: string
          tenant_id: string
          tile_code: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          activated_by?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: string
          status?: string
          tenant_id?: string
          tile_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_tile_activation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_tile_activation_tile_code_fkey"
            columns: ["tile_code"]
            isOneToOne: false
            referencedRelation: "tile_catalog"
            referencedColumns: ["tile_code"]
          },
        ]
      }
      tile_catalog: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon_key: string
          id: string
          is_active: boolean
          main_tile_route: string
          main_tile_title: string
          sub_tiles: Json
          tile_code: string
          title: string
          updated_at: string
          zone: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_key?: string
          id?: string
          is_active?: boolean
          main_tile_route: string
          main_tile_title: string
          sub_tiles?: Json
          tile_code: string
          title: string
          updated_at?: string
          zone?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon_key?: string
          id?: string
          is_active?: boolean
          main_tile_route?: string
          main_tile_title?: string
          sub_tiles?: Json
          tile_code?: string
          title?: string
          updated_at?: string
          zone?: number
        }
        Relationships: []
      }
      units: {
        Row: {
          ancillary_costs: number | null
          area_sqm: number | null
          created_at: string
          current_monthly_rent: number | null
          floor: number | null
          id: string
          property_id: string
          rooms: number | null
          tenant_id: string
          unit_number: string
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          ancillary_costs?: number | null
          area_sqm?: number | null
          created_at?: string
          current_monthly_rent?: number | null
          floor?: number | null
          id?: string
          property_id: string
          rooms?: number | null
          tenant_id: string
          unit_number?: string
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          ancillary_costs?: number | null
          area_sqm?: number | null
          created_at?: string
          current_monthly_rent?: number | null
          floor?: number | null
          id?: string
          property_id?: string
          rooms?: number | null
          tenant_id?: string
          unit_number?: string
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_fk"
            columns: ["tenant_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consented_at: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          status: Database["public"]["Enums"]["consent_status"]
          template_id: string
          template_version: number
          tenant_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consented_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          status?: Database["public"]["Enums"]["consent_status"]
          template_id: string
          template_version: number
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consented_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          status?: Database["public"]["Enums"]["consent_status"]
          template_id?: string
          template_version?: number
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_parent_access_blocked: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      commission_status:
        | "pending"
        | "approved"
        | "invoiced"
        | "paid"
        | "cancelled"
      consent_status: "accepted" | "declined" | "withdrawn"
      delegation_status: "active" | "revoked" | "expired"
      finance_package_status:
        | "draft"
        | "incomplete"
        | "complete"
        | "ready_for_handoff"
      inbound_item_status: "pending" | "assigned" | "archived" | "rejected"
      inbound_source: "caya" | "email" | "upload" | "api"
      invoice_status: "draft" | "pending" | "paid" | "overdue" | "cancelled"
      membership_role:
        | "platform_admin"
        | "org_admin"
        | "internal_ops"
        | "sales_partner"
        | "renter_user"
      org_type: "internal" | "partner" | "sub_partner" | "client" | "renter"
      pipeline_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "reservation"
        | "closing"
        | "won"
        | "lost"
      plan_interval: "monthly" | "yearly"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
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
      commission_status: [
        "pending",
        "approved",
        "invoiced",
        "paid",
        "cancelled",
      ],
      consent_status: ["accepted", "declined", "withdrawn"],
      delegation_status: ["active", "revoked", "expired"],
      finance_package_status: [
        "draft",
        "incomplete",
        "complete",
        "ready_for_handoff",
      ],
      inbound_item_status: ["pending", "assigned", "archived", "rejected"],
      inbound_source: ["caya", "email", "upload", "api"],
      invoice_status: ["draft", "pending", "paid", "overdue", "cancelled"],
      membership_role: [
        "platform_admin",
        "org_admin",
        "internal_ops",
        "sales_partner",
        "renter_user",
      ],
      org_type: ["internal", "partner", "sub_partner", "client", "renter"],
      pipeline_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "reservation",
        "closing",
        "won",
        "lost",
      ],
      plan_interval: ["monthly", "yearly"],
      subscription_status: ["active", "cancelled", "past_due", "trialing"],
    },
  },
} as const
