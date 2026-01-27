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
      ad_campaign_leads: {
        Row: {
          campaign_id: string
          cost_cents: number | null
          created_at: string | null
          id: string
          lead_id: string
        }
        Insert: {
          campaign_id: string
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          campaign_id?: string
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaign_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaign_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          budget_cents: number | null
          campaign_type: string | null
          created_at: string | null
          ended_at: string | null
          external_campaign_id: string | null
          id: string
          name: string
          platform: string | null
          property_id: string | null
          started_at: string | null
          status: string | null
          targeting: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          budget_cents?: number | null
          campaign_type?: string | null
          created_at?: string | null
          ended_at?: string | null
          external_campaign_id?: string | null
          id?: string
          name: string
          platform?: string | null
          property_id?: string | null
          started_at?: string | null
          status?: string | null
          targeting?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          budget_cents?: number | null
          campaign_type?: string | null
          created_at?: string | null
          ended_at?: string | null
          external_campaign_id?: string | null
          id?: string
          name?: string
          platform?: string | null
          property_id?: string | null
          started_at?: string | null
          status?: string | null
          targeting?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_tenant_id_fkey"
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
      calendar_events: {
        Row: {
          all_day: boolean | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          property_id: string | null
          reminder_minutes: number | null
          start_at: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          property_id?: string | null
          reminder_minutes?: number | null
          start_at: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          property_id?: string | null
          reminder_minutes?: number | null
          start_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      church_tax_rates: {
        Row: {
          created_at: string
          id: string
          rate: number
          state_code: string
          state_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          rate: number
          state_code: string
          state_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          rate?: number
          state_code?: string
          state_name?: string
          updated_at?: string
        }
        Relationships: []
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
          public_id: string
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
          public_id: string
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
          public_id?: string
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
      context_property_assignment: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          context_id: string
          id: string
          property_id: string
          tenant_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          context_id: string
          id?: string
          property_id: string
          tenant_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          context_id?: string
          id?: string
          property_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_property_assignment_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_property_assignment_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "landlord_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_property_assignment_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_property_assignment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_links: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          link_status: string | null
          node_id: string | null
          object_id: string | null
          object_type: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          link_status?: string | null
          node_id?: string | null
          object_id?: string | null
          object_type?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          link_status?: string | null
          node_id?: string | null
          object_id?: string | null
          object_type?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
          public_id: string
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
          public_id: string
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
          public_id?: string
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
      finance_cases: {
        Row: {
          case_code: string | null
          created_at: string | null
          id: string
          included_property_ids: string[] | null
          notes: string | null
          primary_property_id: string | null
          public_id: string | null
          purpose: string | null
          responsible_user_id: string | null
          scope_type: string | null
          status: Database["public"]["Enums"]["finance_case_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          case_code?: string | null
          created_at?: string | null
          id?: string
          included_property_ids?: string[] | null
          notes?: string | null
          primary_property_id?: string | null
          public_id?: string | null
          purpose?: string | null
          responsible_user_id?: string | null
          scope_type?: string | null
          status?: Database["public"]["Enums"]["finance_case_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          case_code?: string | null
          created_at?: string | null
          id?: string
          included_property_ids?: string[] | null
          notes?: string | null
          primary_property_id?: string | null
          public_id?: string | null
          purpose?: string | null
          responsible_user_id?: string | null
          scope_type?: string | null
          status?: Database["public"]["Enums"]["finance_case_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_cases_tenant_id_fkey"
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
          public_id: string
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
          public_id: string
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
          public_id?: string
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
      integration_registry: {
        Row: {
          code: string
          config_schema: Json
          created_at: string
          created_by: string | null
          default_config: Json
          description: string | null
          documentation_url: string | null
          id: string
          name: string
          public_id: string
          status: Database["public"]["Enums"]["integration_status"]
          tenant_id: string | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
          version: string
        }
        Insert: {
          code: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          default_config?: Json
          description?: string | null
          documentation_url?: string | null
          id?: string
          name: string
          public_id: string
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id?: string | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          version?: string
        }
        Update: {
          code?: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          default_config?: Json
          description?: string | null
          documentation_url?: string | null
          id?: string
          name?: string
          public_id?: string
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_registry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_rates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          interest_rate: number
          ltv_percent: number
          term_years: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          interest_rate: number
          ltv_percent: number
          term_years: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          interest_rate?: number
          ltv_percent?: number
          term_years?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      investment_favorites: {
        Row: {
          created_at: string | null
          external_listing_id: string | null
          external_listing_url: string | null
          id: string
          investment_profile_id: string
          location: string | null
          notes: string | null
          price: number | null
          property_data: Json | null
          source: string | null
          status: string | null
          synced_at: string | null
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_listing_id?: string | null
          external_listing_url?: string | null
          id?: string
          investment_profile_id: string
          location?: string | null
          notes?: string | null
          price?: number | null
          property_data?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_listing_id?: string | null
          external_listing_url?: string | null
          id?: string
          investment_profile_id?: string
          location?: string | null
          notes?: string | null
          price?: number | null
          property_data?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "if_tenant_profile_fk"
            columns: ["tenant_id", "investment_profile_id"]
            isOneToOne: false
            referencedRelation: "investment_profiles"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "investment_favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      investment_searches: {
        Row: {
          created_at: string | null
          id: string
          investment_profile_id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          result_count: number | null
          search_criteria: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          investment_profile_id: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          result_count?: number | null
          search_criteria?: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          investment_profile_id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          result_count?: number | null
          search_criteria?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_searches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "is_tenant_profile_fk"
            columns: ["tenant_id", "investment_profile_id"]
            isOneToOne: false
            referencedRelation: "investment_profiles"
            referencedColumns: ["tenant_id", "id"]
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
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_public: boolean | null
          keywords: string[] | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          keywords?: string[] | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          keywords?: string[] | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      landlord_contexts: {
        Row: {
          city: string | null
          context_type: string
          country: string | null
          created_at: string
          house_number: string | null
          hrb_number: string | null
          id: string
          is_default: boolean | null
          legal_form: string | null
          name: string
          postal_code: string | null
          public_id: string
          street: string | null
          tax_regime: string | null
          tenant_id: string
          updated_at: string
          ust_id: string | null
        }
        Insert: {
          city?: string | null
          context_type?: string
          country?: string | null
          created_at?: string
          house_number?: string | null
          hrb_number?: string | null
          id?: string
          is_default?: boolean | null
          legal_form?: string | null
          name: string
          postal_code?: string | null
          public_id?: string
          street?: string | null
          tax_regime?: string | null
          tenant_id: string
          updated_at?: string
          ust_id?: string | null
        }
        Update: {
          city?: string | null
          context_type?: string
          country?: string | null
          created_at?: string
          house_number?: string | null
          hrb_number?: string | null
          id?: string
          is_default?: boolean | null
          legal_form?: string | null
          name?: string
          postal_code?: string | null
          public_id?: string
          street?: string | null
          tax_regime?: string | null
          tenant_id?: string
          updated_at?: string
          ust_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landlord_contexts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          deal_id: string | null
          description: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          performed_at: string | null
          performed_by: string | null
          tenant_id: string
        }
        Insert: {
          activity_type: string
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          tenant_id: string
        }
        Update: {
          activity_type?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "partner_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          lead_id: string
          offered_at: string | null
          partner_org_id: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          offered_at?: string | null
          partner_org_id: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          offered_at?: string | null
          partner_org_id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_partner_id: string | null
          budget_max: number | null
          budget_min: number | null
          contact_id: string | null
          created_at: string | null
          id: string
          interest_type: string | null
          notes: string | null
          property_interest_id: string | null
          public_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          source_campaign_id: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tenant_id: string | null
          updated_at: string | null
          zone1_pool: boolean | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_partner_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          interest_type?: string | null
          notes?: string | null
          property_interest_id?: string | null
          public_id?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          source_campaign_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          zone1_pool?: boolean | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_partner_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          interest_type?: string | null
          notes?: string | null
          property_interest_id?: string | null
          public_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_campaign_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
          zone1_pool?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
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
      letter_drafts: {
        Row: {
          body: string | null
          channel: string | null
          created_at: string | null
          created_by: string | null
          id: string
          prompt: string | null
          recipient_contact_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt?: string | null
          recipient_contact_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          channel?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          prompt?: string | null
          recipient_contact_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letter_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_drafts_recipient_contact_id_fkey"
            columns: ["recipient_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letter_drafts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          listing_id: string
          metadata: Json | null
          performed_by: string | null
          tenant_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          listing_id: string
          metadata?: Json | null
          performed_by?: string | null
          tenant_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string
          metadata?: Json | null
          performed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_act_tenant_listing_fk"
            columns: ["tenant_id", "listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "listing_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_inquiries: {
        Row: {
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          notes: string | null
          qualified_at: string | null
          qualified_by: string | null
          source: Database["public"]["Enums"]["inquiry_source"]
          status: Database["public"]["Enums"]["inquiry_status"]
          tenant_id: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          notes?: string | null
          qualified_at?: string | null
          qualified_by?: string | null
          source?: Database["public"]["Enums"]["inquiry_source"]
          status?: Database["public"]["Enums"]["inquiry_status"]
          tenant_id: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          notes?: string | null
          qualified_at?: string | null
          qualified_by?: string | null
          source?: Database["public"]["Enums"]["inquiry_source"]
          status?: Database["public"]["Enums"]["inquiry_status"]
          tenant_id?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_inq_tenant_listing_fk"
            columns: ["tenant_id", "listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "listing_inquiries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_qualified_by_fkey"
            columns: ["qualified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_partner_terms: {
        Row: {
          created_at: string
          finance_distribution_enabled: boolean
          global_release: boolean
          id: string
          listing_id: string
          partner_commission_rate: number
          partner_release_consent_id: string | null
          system_fee_consent_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          finance_distribution_enabled?: boolean
          global_release?: boolean
          id?: string
          listing_id: string
          partner_commission_rate: number
          partner_release_consent_id?: string | null
          system_fee_consent_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          finance_distribution_enabled?: boolean
          global_release?: boolean
          id?: string
          listing_id?: string
          partner_commission_rate?: number
          partner_release_consent_id?: string | null
          system_fee_consent_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_partner_terms_partner_release_consent_id_fkey"
            columns: ["partner_release_consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_partner_terms_system_fee_consent_id_fkey"
            columns: ["system_fee_consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_partner_terms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_terms_tenant_listing_fk"
            columns: ["tenant_id", "listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      listing_publications: {
        Row: {
          channel: Database["public"]["Enums"]["publication_channel"]
          created_at: string
          error_message: string | null
          external_id: string | null
          external_url: string | null
          id: string
          listing_id: string
          published_at: string | null
          removed_at: string | null
          status: Database["public"]["Enums"]["publication_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["publication_channel"]
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          listing_id: string
          published_at?: string | null
          removed_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["publication_channel"]
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          listing_id?: string
          published_at?: string | null
          removed_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_pub_tenant_listing_fk"
            columns: ["tenant_id", "listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "listing_publications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          asking_price: number | null
          commission_rate: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expose_document_id: string | null
          id: string
          min_price: number | null
          partner_visibility: string | null
          property_id: string
          public_id: string | null
          published_at: string | null
          reserved_at: string | null
          sales_mandate_consent_id: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          tenant_id: string
          title: string
          updated_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          asking_price?: number | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expose_document_id?: string | null
          id?: string
          min_price?: number | null
          partner_visibility?: string | null
          property_id: string
          public_id?: string | null
          published_at?: string | null
          reserved_at?: string | null
          sales_mandate_consent_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          asking_price?: number | null
          commission_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expose_document_id?: string | null
          id?: string
          min_price?: number | null
          partner_visibility?: string | null
          property_id?: string
          public_id?: string | null
          published_at?: string | null
          reserved_at?: string | null
          sales_mandate_consent_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_expose_document_id_fkey"
            columns: ["expose_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_sales_mandate_consent_id_fkey"
            columns: ["sales_mandate_consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_tenant_property_fk"
            columns: ["tenant_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      msv_bank_accounts: {
        Row: {
          account_name: string
          bank_name: string | null
          created_at: string
          finapi_account_id: string | null
          iban: string
          id: string
          is_default: boolean | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          bank_name?: string | null
          created_at?: string
          finapi_account_id?: string | null
          iban: string
          id?: string
          is_default?: boolean | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          bank_name?: string | null
          created_at?: string
          finapi_account_id?: string | null
          iban?: string
          id?: string
          is_default?: boolean | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msv_bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msv_communication_prefs: {
        Row: {
          auto_reminder_enabled: boolean | null
          auto_report_enabled: boolean | null
          created_at: string | null
          fallback_channel: string | null
          id: string
          preferred_channel: string
          reminder_day: number | null
          report_day: number | null
          require_confirmation: boolean | null
          scope_id: string
          scope_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_reminder_enabled?: boolean | null
          auto_report_enabled?: boolean | null
          created_at?: string | null
          fallback_channel?: string | null
          id?: string
          preferred_channel: string
          reminder_day?: number | null
          report_day?: number | null
          require_confirmation?: boolean | null
          scope_id: string
          scope_type: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_reminder_enabled?: boolean | null
          auto_report_enabled?: boolean | null
          created_at?: string | null
          fallback_channel?: string | null
          id?: string
          preferred_channel?: string
          reminder_day?: number | null
          report_day?: number | null
          require_confirmation?: boolean | null
          scope_id?: string
          scope_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msv_communication_prefs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msv_enrollments: {
        Row: {
          blocked_reason: string | null
          created_at: string | null
          credits_per_unit: number | null
          enrolled_at: string | null
          enrolled_by: string | null
          id: string
          property_id: string
          readiness_snapshot: Json | null
          scope_type: string | null
          settings: Json | null
          status: string | null
          tenant_id: string
          tier: string | null
          updated_at: string | null
        }
        Insert: {
          blocked_reason?: string | null
          created_at?: string | null
          credits_per_unit?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          property_id: string
          readiness_snapshot?: Json | null
          scope_type?: string | null
          settings?: Json | null
          status?: string | null
          tenant_id: string
          tier?: string | null
          updated_at?: string | null
        }
        Update: {
          blocked_reason?: string | null
          created_at?: string | null
          credits_per_unit?: number | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          id?: string
          property_id?: string
          readiness_snapshot?: Json | null
          scope_type?: string | null
          settings?: Json | null
          status?: string | null
          tenant_id?: string
          tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "me_tenant_property_fk"
            columns: ["tenant_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "msv_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msv_readiness_items: {
        Row: {
          created_at: string | null
          details: string | null
          enrollment_id: string
          id: string
          requested_at: string | null
          requirement_code: string
          resolved_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          enrollment_id: string
          id?: string
          requested_at?: string | null
          requirement_code: string
          resolved_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          enrollment_id?: string
          id?: string
          requested_at?: string | null
          requirement_code?: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "msv_readiness_items_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "msv_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "msv_readiness_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msv_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          locale: string | null
          placeholders: Json | null
          template_code: string
          tenant_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          placeholders?: Json | null
          template_code: string
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          placeholders?: Json | null
          template_code?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "msv_templates_tenant_id_fkey"
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
          public_id: string
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
          public_id: string
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
          public_id?: string
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
      partner_deals: {
        Row: {
          actual_close_date: string | null
          commission_rate: number | null
          contact_id: string | null
          created_at: string | null
          deal_value: number | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          property_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          actual_close_date?: string | null
          commission_rate?: number | null
          contact_id?: string | null
          created_at?: string | null
          deal_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          actual_close_date?: string | null
          commission_rate?: number | null
          contact_id?: string | null
          created_at?: string | null
          deal_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_deals_tenant_id_fkey"
            columns: ["tenant_id"]
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
      partner_verifications: {
        Row: {
          created_at: string | null
          documents: Json | null
          expires_at: string | null
          id: string
          notes: string | null
          partner_org_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status:
            | Database["public"]["Enums"]["partner_verification_status"]
            | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          documents?: Json | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          partner_org_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | Database["public"]["Enums"]["partner_verification_status"]
            | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          documents?: Json | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          partner_org_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | Database["public"]["Enums"]["partner_verification_status"]
            | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_verifications_partner_org_id_fkey"
            columns: ["partner_org_id"]
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
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string
          first_name: string | null
          house_number: string | null
          id: string
          is_business: boolean | null
          last_name: string | null
          person_mode: string | null
          phone_landline: string | null
          phone_mobile: string | null
          phone_whatsapp: string | null
          postal_code: string | null
          spouse_profile_id: string | null
          street: string | null
          tax_id: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          first_name?: string | null
          house_number?: string | null
          id: string
          is_business?: boolean | null
          last_name?: string | null
          person_mode?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          phone_whatsapp?: string | null
          postal_code?: string | null
          spouse_profile_id?: string | null
          street?: string | null
          tax_id?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string | null
          house_number?: string | null
          id?: string
          is_business?: boolean | null
          last_name?: string | null
          person_mode?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          phone_whatsapp?: string | null
          postal_code?: string | null
          spouse_profile_id?: string | null
          street?: string | null
          tax_id?: string | null
          tax_number?: string | null
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
          public_id: string
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
          utility_prepayment: number | null
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
          public_id: string
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
          utility_prepayment?: number | null
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
          public_id?: string
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
          utility_prepayment?: number | null
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
      property_valuations: {
        Row: {
          building_value: number | null
          completed_at: string | null
          consent_id: string | null
          created_at: string
          credits_used: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_id: string | null
          land_value: number | null
          market_value: number | null
          property_id: string
          provider: string
          public_id: string
          report_document_id: string | null
          result_data: Json | null
          status: string
          tenant_id: string
          valuation_date: string | null
        }
        Insert: {
          building_value?: number | null
          completed_at?: string | null
          consent_id?: string | null
          created_at?: string
          credits_used?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_id?: string | null
          land_value?: number | null
          market_value?: number | null
          property_id: string
          provider?: string
          public_id?: string
          report_document_id?: string | null
          result_data?: Json | null
          status?: string
          tenant_id: string
          valuation_date?: string | null
        }
        Update: {
          building_value?: number | null
          completed_at?: string | null
          consent_id?: string | null
          created_at?: string
          credits_used?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_id?: string | null
          land_value?: number | null
          market_value?: number | null
          property_id?: string
          provider?: string
          public_id?: string
          report_document_id?: string | null
          result_data?: Json | null
          status?: string
          tenant_id?: string
          valuation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_valuations_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_valuations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_valuations_report_document_id_fkey"
            columns: ["report_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_valuations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          expected_amount: number | null
          id: string
          lease_id: string
          matched_amount: number | null
          matched_source: string | null
          matched_transaction_id: string | null
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          expected_amount?: number | null
          id?: string
          lease_id: string
          matched_amount?: number | null
          matched_source?: string | null
          matched_transaction_id?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          expected_amount?: number | null
          id?: string
          lease_id?: string
          matched_amount?: number | null
          matched_source?: string | null
          matched_transaction_id?: string | null
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_tenant_lease_fk"
            columns: ["tenant_id", "lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      rent_reminders: {
        Row: {
          auto_sent: boolean | null
          channel: string | null
          confirmed_by: string | null
          content_text: string | null
          created_at: string | null
          document_id: string | null
          id: string
          lease_id: string
          payment_id: string | null
          reminder_type: string
          sent_at: string | null
          stage: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          auto_sent?: boolean | null
          channel?: string | null
          confirmed_by?: string | null
          content_text?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          lease_id: string
          payment_id?: string | null
          reminder_type: string
          sent_at?: string | null
          stage?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          auto_sent?: boolean | null
          channel?: string | null
          confirmed_by?: string | null
          content_text?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          lease_id?: string
          payment_id?: string | null
          reminder_type?: string
          sent_at?: string | null
          stage?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_reminders_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_reminders_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "rent_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rr_tenant_lease_fk"
            columns: ["tenant_id", "lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      rental_listings: {
        Row: {
          available_from: string | null
          cold_rent: number | null
          created_at: string | null
          created_by: string | null
          deposit_months: number | null
          description: string | null
          expose_document_id: string | null
          id: string
          minimum_term_months: number | null
          pets_allowed: boolean | null
          property_id: string
          public_id: string
          status: string
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
          utilities_estimate: number | null
          warm_rent: number | null
        }
        Insert: {
          available_from?: string | null
          cold_rent?: number | null
          created_at?: string | null
          created_by?: string | null
          deposit_months?: number | null
          description?: string | null
          expose_document_id?: string | null
          id?: string
          minimum_term_months?: number | null
          pets_allowed?: boolean | null
          property_id: string
          public_id?: string
          status?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
          utilities_estimate?: number | null
          warm_rent?: number | null
        }
        Update: {
          available_from?: string | null
          cold_rent?: number | null
          created_at?: string | null
          created_by?: string | null
          deposit_months?: number | null
          description?: string | null
          expose_document_id?: string | null
          id?: string
          minimum_term_months?: number | null
          pets_allowed?: boolean | null
          property_id?: string
          public_id?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
          utilities_estimate?: number | null
          warm_rent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_listings_expose_document_id_fkey"
            columns: ["expose_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_listings_tenant_property_fk"
            columns: ["tenant_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "rental_listings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_publications: {
        Row: {
          channel: string
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          external_id: string | null
          external_url: string | null
          id: string
          published_at: string | null
          rental_listing_id: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          published_at?: string | null
          rental_listing_id: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          published_at?: string | null
          rental_listing_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_publications_rental_listing_id_fkey"
            columns: ["rental_listing_id"]
            isOneToOne: false
            referencedRelation: "rental_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_publications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
      reservations: {
        Row: {
          buyer_confirmed_at: string | null
          buyer_contact_id: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string
          id: string
          inquiry_id: string | null
          listing_id: string
          notary_date: string | null
          notes: string | null
          owner_confirmed_at: string | null
          reserved_price: number | null
          status: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          buyer_confirmed_at?: string | null
          buyer_contact_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          listing_id: string
          notary_date?: string | null
          notes?: string | null
          owner_confirmed_at?: string | null
          reserved_price?: number | null
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          buyer_confirmed_at?: string | null
          buyer_contact_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          listing_id?: string
          notary_date?: string | null
          notes?: string | null
          owner_confirmed_at?: string | null
          reserved_price?: number | null
          status?: Database["public"]["Enums"]["reservation_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserv_tenant_listing_fk"
            columns: ["tenant_id", "listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "reservations_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "listing_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_transactions: {
        Row: {
          bnl_date: string | null
          buyer_contact_id: string | null
          commission_amount: number | null
          commission_approved_at: string | null
          commission_approved_by: string | null
          created_at: string
          final_price: number
          handover_date: string | null
          id: string
          listing_id: string
          notary_date: string | null
          notes: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["sale_transaction_status"]
          system_fee_amount: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bnl_date?: string | null
          buyer_contact_id?: string | null
          commission_amount?: number | null
          commission_approved_at?: string | null
          commission_approved_by?: string | null
          created_at?: string
          final_price: number
          handover_date?: string | null
          id?: string
          listing_id: string
          notary_date?: string | null
          notes?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["sale_transaction_status"]
          system_fee_amount?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bnl_date?: string | null
          buyer_contact_id?: string | null
          commission_amount?: number | null
          commission_approved_at?: string | null
          commission_approved_by?: string | null
          created_at?: string
          final_price?: number
          handover_date?: string | null
          id?: string
          listing_id?: string
          notary_date?: string | null
          notes?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["sale_transaction_status"]
          system_fee_amount?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_transactions_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_transactions_commission_approved_by_fkey"
            columns: ["commission_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trans_tenant_listing_fk"
            columns: ["tenant_id", "listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["tenant_id", "id"]
          },
        ]
      }
      scraper_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          investment_search_id: string | null
          provider_id: string
          result_count: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          investment_search_id?: string | null
          provider_id: string
          result_count?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          investment_search_id?: string | null
          provider_id?: string
          result_count?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraper_jobs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "scraper_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraper_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_providers: {
        Row: {
          code: string
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          provider_type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          provider_type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          provider_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scraper_results: {
        Row: {
          created_at: string | null
          data: Json
          external_id: string | null
          id: string
          job_id: string
          processed: boolean | null
          source_url: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json
          external_id?: string | null
          id?: string
          job_id: string
          processed?: boolean | null
          source_url?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          external_id?: string | null
          id?: string
          job_id?: string
          processed?: boolean | null
          source_url?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scraper_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraper_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraper_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
      service_case_offers: {
        Row: {
          contact_id: string | null
          created_at: string
          document_id: string | null
          id: string
          is_selected: boolean | null
          notes: string | null
          offer_amount: number | null
          offer_date: string | null
          service_case_id: string
          tenant_id: string
          valid_until: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          is_selected?: boolean | null
          notes?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          service_case_id: string
          tenant_id: string
          valid_until?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          is_selected?: boolean | null
          notes?: string | null
          offer_amount?: number | null
          offer_date?: string | null
          service_case_id?: string
          tenant_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_case_offers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_offers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_offers_service_case_id_fkey"
            columns: ["service_case_id"]
            isOneToOne: false
            referencedRelation: "service_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_offers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_case_outbound: {
        Row: {
          created_at: string
          email_template: string | null
          id: string
          recipient_contact_id: string | null
          recipient_email: string | null
          sent_at: string | null
          sent_by: string | null
          service_case_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email_template?: string | null
          id?: string
          recipient_contact_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          sent_by?: string | null
          service_case_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          email_template?: string | null
          id?: string
          recipient_contact_id?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          sent_by?: string | null
          service_case_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_case_outbound_recipient_contact_id_fkey"
            columns: ["recipient_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_outbound_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_outbound_service_case_id_fkey"
            columns: ["service_case_id"]
            isOneToOne: false
            referencedRelation: "service_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_outbound_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_cases: {
        Row: {
          awarded_amount: number | null
          awarded_to_contact_id: string | null
          budget_estimate: number | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          property_id: string
          public_id: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          awarded_amount?: number | null
          awarded_to_contact_id?: string | null
          budget_estimate?: number | null
          category: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          property_id: string
          public_id?: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          awarded_amount?: number | null
          awarded_to_contact_id?: string | null
          budget_estimate?: number | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          property_id?: string
          public_id?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_cases_awarded_to_contact_id_fkey"
            columns: ["awarded_to_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_nodes: {
        Row: {
          auto_created: boolean | null
          created_at: string | null
          id: string
          name: string
          node_type: string
          parent_id: string | null
          property_id: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          node_type?: string
          parent_id?: string | null
          property_id?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          node_type?: string
          parent_id?: string | null
          property_id?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_nodes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_nodes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_nodes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      tax_parameters: {
        Row: {
          category: string
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          unit: string
          updated_at: string
          valid_from: string
          valid_until: string | null
          value: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          unit?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          value: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          unit?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
          value?: number
        }
        Relationships: []
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
      test_data_registry: {
        Row: {
          batch_id: string
          batch_name: string | null
          entity_id: string
          entity_type: string
          id: string
          imported_at: string | null
          imported_by: string | null
        }
        Insert: {
          batch_id: string
          batch_name?: string | null
          entity_id: string
          entity_type: string
          id?: string
          imported_at?: string | null
          imported_by?: string | null
        }
        Update: {
          batch_id?: string
          batch_name?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          imported_at?: string | null
          imported_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_data_registry_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tile_catalog: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          external_api_refs: string[] | null
          icon_key: string
          id: string
          internal_apis: string[] | null
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
          external_api_refs?: string[] | null
          icon_key?: string
          id?: string
          internal_apis?: string[] | null
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
          external_api_refs?: string[] | null
          icon_key?: string
          id?: string
          internal_apis?: string[] | null
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
          public_id: string
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
          public_id: string
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
          public_id?: string
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
      valuation_credits: {
        Row: {
          created_at: string
          credits_purchased: number
          credits_used: number
          expires_at: string | null
          id: string
          invoice_id: string | null
          purchased_at: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          credits_purchased?: number
          credits_used?: number
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          purchased_at?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          credits_purchased?: number
          credits_used?: number
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          purchased_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_credits_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_public_knowledge: {
        Row: {
          category: string | null
          content: string | null
          id: string | null
          keywords: string[] | null
          source: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          id?: string | null
          keywords?: string[] | null
          source?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          id?: string | null
          keywords?: string[] | null
          source?: string | null
          title?: string | null
        }
        Relationships: []
      }
      v_public_listings: {
        Row: {
          asking_price: number | null
          channel: Database["public"]["Enums"]["publication_channel"] | null
          city: string | null
          description: string | null
          postal_code: string | null
          property_type: string | null
          public_id: string | null
          published_at: string | null
          title: string | null
          total_area_sqm: number | null
          year_built: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_test_batch: {
        Args: { p_batch_id: string }
        Returns: {
          deleted_count: number
          entity_type: string
        }[]
      }
      generate_public_id: { Args: { prefix: string }; Returns: string }
      get_user_memberships: {
        Args: { p_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["membership_role"]
          tenant_id: string
        }[]
      }
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
      deal_stage:
        | "lead"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "reservation"
        | "closing"
        | "won"
        | "lost"
      delegation_status: "active" | "revoked" | "expired"
      finance_case_status:
        | "draft"
        | "collecting"
        | "ready"
        | "blocked"
        | "exported"
        | "submitted"
        | "acknowledged"
        | "failed"
      finance_package_status:
        | "draft"
        | "incomplete"
        | "complete"
        | "ready_for_handoff"
      inbound_item_status: "pending" | "assigned" | "archived" | "rejected"
      inbound_source: "caya" | "email" | "upload" | "api"
      inquiry_source: "website" | "partner" | "direct" | "referral"
      inquiry_status:
        | "new"
        | "contacted"
        | "qualified"
        | "scheduled"
        | "won"
        | "lost"
      integration_status: "active" | "inactive" | "deprecated" | "pending_setup"
      integration_type: "integration" | "connector" | "edge_function" | "secret"
      invoice_status: "draft" | "pending" | "paid" | "overdue" | "cancelled"
      lead_source:
        | "zone1_pool"
        | "meta_self"
        | "meta_property"
        | "referral"
        | "manual"
        | "kaufy_website"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      listing_status:
        | "draft"
        | "internal_review"
        | "active"
        | "reserved"
        | "sold"
        | "withdrawn"
      membership_role:
        | "platform_admin"
        | "org_admin"
        | "internal_ops"
        | "sales_partner"
        | "renter_user"
      org_type: "internal" | "partner" | "sub_partner" | "client" | "renter"
      partner_verification_status:
        | "pending"
        | "documents_submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
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
      publication_channel:
        | "kaufy"
        | "scout24"
        | "kleinanzeigen"
        | "partner_network"
      publication_status: "pending" | "active" | "paused" | "expired" | "failed"
      reservation_status:
        | "pending_owner"
        | "pending_buyer"
        | "confirmed"
        | "cancelled"
        | "completed"
      sale_transaction_status:
        | "pending"
        | "notarized"
        | "bnl_received"
        | "completed"
        | "cancelled"
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
      deal_stage: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "reservation",
        "closing",
        "won",
        "lost",
      ],
      delegation_status: ["active", "revoked", "expired"],
      finance_case_status: [
        "draft",
        "collecting",
        "ready",
        "blocked",
        "exported",
        "submitted",
        "acknowledged",
        "failed",
      ],
      finance_package_status: [
        "draft",
        "incomplete",
        "complete",
        "ready_for_handoff",
      ],
      inbound_item_status: ["pending", "assigned", "archived", "rejected"],
      inbound_source: ["caya", "email", "upload", "api"],
      inquiry_source: ["website", "partner", "direct", "referral"],
      inquiry_status: [
        "new",
        "contacted",
        "qualified",
        "scheduled",
        "won",
        "lost",
      ],
      integration_status: ["active", "inactive", "deprecated", "pending_setup"],
      integration_type: ["integration", "connector", "edge_function", "secret"],
      invoice_status: ["draft", "pending", "paid", "overdue", "cancelled"],
      lead_source: [
        "zone1_pool",
        "meta_self",
        "meta_property",
        "referral",
        "manual",
        "kaufy_website",
      ],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      listing_status: [
        "draft",
        "internal_review",
        "active",
        "reserved",
        "sold",
        "withdrawn",
      ],
      membership_role: [
        "platform_admin",
        "org_admin",
        "internal_ops",
        "sales_partner",
        "renter_user",
      ],
      org_type: ["internal", "partner", "sub_partner", "client", "renter"],
      partner_verification_status: [
        "pending",
        "documents_submitted",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
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
      publication_channel: [
        "kaufy",
        "scout24",
        "kleinanzeigen",
        "partner_network",
      ],
      publication_status: ["pending", "active", "paused", "expired", "failed"],
      reservation_status: [
        "pending_owner",
        "pending_buyer",
        "confirmed",
        "cancelled",
        "completed",
      ],
      sale_transaction_status: [
        "pending",
        "notarized",
        "bnl_received",
        "completed",
        "cancelled",
      ],
      subscription_status: ["active", "cancelled", "past_due", "trialing"],
    },
  },
} as const
