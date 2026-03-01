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
      acq_analysis_runs: {
        Row: {
          completed_at: string | null
          contact_staging_id: string | null
          created_at: string
          engine_version: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          mandate_id: string | null
          model_used: string | null
          offer_id: string | null
          output_data: Json | null
          run_type: Database["public"]["Enums"]["acq_analysis_type"]
          started_at: string | null
          status: Database["public"]["Enums"]["acq_analysis_status"]
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          contact_staging_id?: string | null
          created_at?: string
          engine_version?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          mandate_id?: string | null
          model_used?: string | null
          offer_id?: string | null
          output_data?: Json | null
          run_type: Database["public"]["Enums"]["acq_analysis_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["acq_analysis_status"]
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          contact_staging_id?: string | null
          created_at?: string
          engine_version?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          mandate_id?: string | null
          model_used?: string | null
          offer_id?: string | null
          output_data?: Json | null
          run_type?: Database["public"]["Enums"]["acq_analysis_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["acq_analysis_status"]
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acq_analysis_runs_contact_staging_id_fkey"
            columns: ["contact_staging_id"]
            isOneToOne: false
            referencedRelation: "contact_staging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_analysis_runs_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_analysis_runs_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "acq_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_email_templates: {
        Row: {
          body_html_template: string
          body_text_template: string | null
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject_template: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_html_template: string
          body_text_template?: string | null
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject_template: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_html_template?: string
          body_text_template?: string | null
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject_template?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      acq_inbound_messages: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          contact_id: string | null
          created_at: string
          from_email: string
          id: string
          in_reply_to_message_id: string | null
          mandate_id: string | null
          needs_routing: boolean | null
          received_at: string
          resend_inbound_id: string | null
          routed_at: string | null
          routed_by: string | null
          routing_confidence: number | null
          routing_method:
            | Database["public"]["Enums"]["acq_routing_method"]
            | null
          subject: string | null
          tenant_id: string
          to_email: string | null
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string
          from_email: string
          id?: string
          in_reply_to_message_id?: string | null
          mandate_id?: string | null
          needs_routing?: boolean | null
          received_at?: string
          resend_inbound_id?: string | null
          routed_at?: string | null
          routed_by?: string | null
          routing_confidence?: number | null
          routing_method?:
            | Database["public"]["Enums"]["acq_routing_method"]
            | null
          subject?: string | null
          tenant_id: string
          to_email?: string | null
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string
          from_email?: string
          id?: string
          in_reply_to_message_id?: string | null
          mandate_id?: string | null
          needs_routing?: boolean | null
          received_at?: string
          resend_inbound_id?: string | null
          routed_at?: string | null
          routed_by?: string | null
          routing_confidence?: number | null
          routing_method?:
            | Database["public"]["Enums"]["acq_routing_method"]
            | null
          subject?: string | null
          tenant_id?: string
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acq_inbound_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_inbound_messages_in_reply_to_message_id_fkey"
            columns: ["in_reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "acq_outbound_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_inbound_messages_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_inbound_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_mandate_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["acq_mandate_event_type"]
          id: string
          mandate_id: string
          payload: Json | null
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["acq_mandate_event_type"]
          id?: string
          mandate_id: string
          payload?: Json | null
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["acq_mandate_event_type"]
          id?: string
          mandate_id?: string
          payload?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acq_mandate_events_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_mandate_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_mandates: {
        Row: {
          asset_focus: string[] | null
          assigned_at: string | null
          assigned_manager_user_id: string | null
          client_display_name: string | null
          code: string
          created_at: string
          created_by_user_id: string
          exclusions: string | null
          id: string
          notes: string | null
          price_max: number | null
          price_min: number | null
          profile_keywords: string[] | null
          profile_text_email: string | null
          profile_text_long: string | null
          search_area: Json | null
          split_terms_confirmed_at: string | null
          split_terms_confirmed_by: string | null
          status: Database["public"]["Enums"]["acq_mandate_status"]
          tenant_id: string
          updated_at: string
          yield_target: number | null
        }
        Insert: {
          asset_focus?: string[] | null
          assigned_at?: string | null
          assigned_manager_user_id?: string | null
          client_display_name?: string | null
          code: string
          created_at?: string
          created_by_user_id: string
          exclusions?: string | null
          id?: string
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          profile_keywords?: string[] | null
          profile_text_email?: string | null
          profile_text_long?: string | null
          search_area?: Json | null
          split_terms_confirmed_at?: string | null
          split_terms_confirmed_by?: string | null
          status?: Database["public"]["Enums"]["acq_mandate_status"]
          tenant_id: string
          updated_at?: string
          yield_target?: number | null
        }
        Update: {
          asset_focus?: string[] | null
          assigned_at?: string | null
          assigned_manager_user_id?: string | null
          client_display_name?: string | null
          code?: string
          created_at?: string
          created_by_user_id?: string
          exclusions?: string | null
          id?: string
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          profile_keywords?: string[] | null
          profile_text_email?: string | null
          profile_text_long?: string | null
          search_area?: Json | null
          split_terms_confirmed_at?: string | null
          split_terms_confirmed_by?: string | null
          status?: Database["public"]["Enums"]["acq_mandate_status"]
          tenant_id?: string
          updated_at?: string
          yield_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acq_mandates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_offer_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          offer_id: string
          tenant_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          offer_id: string
          tenant_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          offer_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acq_offer_activities_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "acq_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_offer_activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_offer_documents: {
        Row: {
          created_at: string
          document_type: string
          extracted_text: string | null
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          offer_id: string
          storage_path: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          extracted_text?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          offer_id: string
          storage_path: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          extracted_text?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          offer_id?: string
          storage_path?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acq_offer_documents_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "acq_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_offer_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_offers: {
        Row: {
          address: string | null
          analysis_summary: Json | null
          area_sqm: number | null
          calc_aufteiler: Json | null
          calc_bestand: Json | null
          city: string | null
          created_at: string
          data_room_folder_id: string | null
          extracted_data: Json | null
          extraction_confidence: number | null
          geomap_data: Json | null
          id: string
          mandate_id: string | null
          noi_indicated: number | null
          notes: string | null
          postal_code: string | null
          price_asking: number | null
          price_counter: number | null
          provider_contact: string | null
          provider_name: string | null
          received_at: string | null
          source_contact_id: string | null
          source_inbound_id: string | null
          source_type: Database["public"]["Enums"]["acq_offer_source"]
          source_url: string | null
          status: Database["public"]["Enums"]["acq_offer_status"]
          tenant_id: string
          title: string | null
          units_count: number | null
          updated_at: string
          year_built: number | null
          yield_indicated: number | null
        }
        Insert: {
          address?: string | null
          analysis_summary?: Json | null
          area_sqm?: number | null
          calc_aufteiler?: Json | null
          calc_bestand?: Json | null
          city?: string | null
          created_at?: string
          data_room_folder_id?: string | null
          extracted_data?: Json | null
          extraction_confidence?: number | null
          geomap_data?: Json | null
          id?: string
          mandate_id?: string | null
          noi_indicated?: number | null
          notes?: string | null
          postal_code?: string | null
          price_asking?: number | null
          price_counter?: number | null
          provider_contact?: string | null
          provider_name?: string | null
          received_at?: string | null
          source_contact_id?: string | null
          source_inbound_id?: string | null
          source_type?: Database["public"]["Enums"]["acq_offer_source"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["acq_offer_status"]
          tenant_id: string
          title?: string | null
          units_count?: number | null
          updated_at?: string
          year_built?: number | null
          yield_indicated?: number | null
        }
        Update: {
          address?: string | null
          analysis_summary?: Json | null
          area_sqm?: number | null
          calc_aufteiler?: Json | null
          calc_bestand?: Json | null
          city?: string | null
          created_at?: string
          data_room_folder_id?: string | null
          extracted_data?: Json | null
          extraction_confidence?: number | null
          geomap_data?: Json | null
          id?: string
          mandate_id?: string | null
          noi_indicated?: number | null
          notes?: string | null
          postal_code?: string | null
          price_asking?: number | null
          price_counter?: number | null
          provider_contact?: string | null
          provider_name?: string | null
          received_at?: string | null
          source_contact_id?: string | null
          source_inbound_id?: string | null
          source_type?: Database["public"]["Enums"]["acq_offer_source"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["acq_offer_status"]
          tenant_id?: string
          title?: string | null
          units_count?: number | null
          updated_at?: string
          year_built?: number | null
          yield_indicated?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acq_offers_data_room_folder_id_fkey"
            columns: ["data_room_folder_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_offers_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_offers_source_contact_id_fkey"
            columns: ["source_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_offers_source_inbound_id_fkey"
            columns: ["source_inbound_id"]
            isOneToOne: false
            referencedRelation: "acq_inbound_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_offers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acq_outbound_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          bounced_at: string | null
          contact_id: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          mandate_id: string
          opened_at: string | null
          replied_at: string | null
          resend_message_id: string | null
          routing_token: string | null
          sent_at: string | null
          sent_via: string | null
          status: Database["public"]["Enums"]["acq_outbound_status"]
          subject: string
          template_code: string
          tenant_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          bounced_at?: string | null
          contact_id: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          mandate_id: string
          opened_at?: string | null
          replied_at?: string | null
          resend_message_id?: string | null
          routing_token?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["acq_outbound_status"]
          subject: string
          template_code: string
          tenant_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          bounced_at?: string | null
          contact_id?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          mandate_id?: string
          opened_at?: string | null
          replied_at?: string | null
          resend_message_id?: string | null
          routing_token?: string | null
          sent_at?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["acq_outbound_status"]
          subject?: string
          template_code?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acq_outbound_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_outbound_messages_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acq_outbound_messages_tenant_id_fkey"
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
      admin_contact_tags: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          tag: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          tag: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          current_step: number | null
          enrolled_at: string | null
          id: string
          last_sent_at: string | null
          next_send_at: string | null
          sequence_id: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          sequence_id?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          sequence_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_email_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "admin_email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_sequence_steps: {
        Row: {
          body_override: string | null
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          id: string
          send_condition: string | null
          sequence_id: string | null
          stats: Json | null
          step_order: number
          subject_override: string | null
          template_id: string | null
        }
        Insert: {
          body_override?: string | null
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          send_condition?: string | null
          sequence_id?: string | null
          stats?: Json | null
          step_order: number
          subject_override?: string | null
          template_id?: string | null
        }
        Update: {
          body_override?: string | null
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          send_condition?: string | null
          sequence_id?: string | null
          stats?: Json | null
          step_order?: number
          subject_override?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "admin_email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_email_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admin_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_sequences: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          stats: Json | null
          status: string | null
          target_categories: string[] | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          stats?: Json | null
          status?: string | null
          target_categories?: string[] | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          stats?: Json | null
          status?: string | null
          target_categories?: string[] | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_email_templates: {
        Row: {
          body_html: string | null
          body_text: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      admin_email_threads: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          last_activity_at: string | null
          message_count: number | null
          status: string | null
          subject: string | null
          unread_count: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          message_count?: number | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          message_count?: number | null
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_threads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_inbound_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          contact_id: string | null
          created_at: string
          from_email: string
          from_name: string | null
          id: string
          in_reply_to_id: string | null
          is_read: boolean
          received_at: string
          resend_inbound_id: string | null
          subject: string | null
          thread_id: string | null
          to_email: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          id?: string
          in_reply_to_id?: string | null
          is_read?: boolean
          received_at?: string
          resend_inbound_id?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          contact_id?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          id?: string
          in_reply_to_id?: string | null
          is_read?: boolean
          received_at?: string
          resend_inbound_id?: string | null
          subject?: string | null
          thread_id?: string | null
          to_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_inbound_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_inbound_emails_in_reply_to_id_fkey"
            columns: ["in_reply_to_id"]
            isOneToOne: false
            referencedRelation: "admin_outbound_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_inbound_emails_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "admin_email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_outbound_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          bounced_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          enrollment_id: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          replied_at: string | null
          resend_message_id: string | null
          routing_token: string | null
          sent_at: string | null
          sequence_step_id: string | null
          status: string
          subject: string
          thread_id: string | null
          to_email: string
          to_name: string | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          bounced_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          resend_message_id?: string | null
          routing_token?: string | null
          sent_at?: string | null
          sequence_step_id?: string | null
          status?: string
          subject: string
          thread_id?: string | null
          to_email: string
          to_name?: string | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          bounced_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          enrollment_id?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          resend_message_id?: string | null
          routing_token?: string | null
          sent_at?: string | null
          sequence_step_id?: string | null
          status?: string
          subject?: string
          thread_id?: string | null
          to_email?: string
          to_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_outbound_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_outbound_emails_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "admin_email_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_outbound_emails_sequence_step_id_fkey"
            columns: ["sequence_step_id"]
            isOneToOne: false
            referencedRelation: "admin_email_sequence_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_outbound_emails_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "admin_email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_research_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          job_type: string
          query_params: Json
          results: Json | null
          results_count: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          query_params: Json
          results?: Json | null
          results_count?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          query_params?: Json
          results?: Json | null
          results_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      admin_saved_segments: {
        Row: {
          contact_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          filter_config: Json
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          contact_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filter_config: Json
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          contact_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filter_config?: Json
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      analytics_budget_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_target: number
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_target?: number
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_target?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_budget_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_category_overrides: {
        Row: {
          category: string
          confirmed: boolean | null
          created_at: string
          id: string
          merchant_pattern: string
          tenant_id: string
        }
        Insert: {
          category: string
          confirmed?: boolean | null
          created_at?: string
          id?: string
          merchant_pattern: string
          tenant_id: string
        }
        Update: {
          category?: string
          confirmed?: boolean | null
          created_at?: string
          id?: string
          merchant_pattern?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_category_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_notes: {
        Row: {
          created_at: string
          id: string
          note: string
          tenant_id: string
          user_id: string | null
          widget_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          note: string
          tenant_id: string
          user_id?: string | null
          widget_key: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          tenant_id?: string
          user_id?: string | null
          widget_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_liabilities: {
        Row: {
          applicant_profile_id: string
          created_at: string | null
          creditor_name: string | null
          end_date: string | null
          id: string
          interest_rate_fixed_until: string | null
          liability_type: string
          monthly_rate: number | null
          original_amount: number | null
          remaining_balance: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          applicant_profile_id: string
          created_at?: string | null
          creditor_name?: string | null
          end_date?: string | null
          id?: string
          interest_rate_fixed_until?: string | null
          liability_type: string
          monthly_rate?: number | null
          original_amount?: number | null
          remaining_balance?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          applicant_profile_id?: string
          created_at?: string | null
          creditor_name?: string | null
          end_date?: string | null
          id?: string
          interest_rate_fixed_until?: string | null
          liability_type?: string
          monthly_rate?: number | null
          original_amount?: number | null
          remaining_balance?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_liabilities_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_liabilities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_profiles: {
        Row: {
          address_city: string | null
          address_postal_code: string | null
          address_since: string | null
          address_street: string | null
          adults_count: number | null
          alimony_income_monthly: number | null
          ancillary_costs: number | null
          bank_savings: number | null
          bic: string | null
          birth_country: string | null
          birth_date: string | null
          birth_name: string | null
          birth_place: string | null
          bonus_yearly: number | null
          building_society_value: number | null
          car_leasing_monthly: number | null
          child_benefit_monthly: number | null
          child_support_amount_monthly: number | null
          child_support_obligation: boolean | null
          children_ages: string | null
          children_birth_dates: string | null
          children_count: number | null
          church_tax: boolean | null
          company_address: string | null
          company_employees: number | null
          company_founded: string | null
          company_industry: string | null
          company_legal_form: string | null
          company_managing_director: boolean | null
          company_name: string | null
          company_ownership_percent: number | null
          company_register_number: string | null
          company_vat_id: string | null
          completion_score: number | null
          contract_type: string | null
          created_at: string
          current_rent_monthly: number | null
          data_correct_confirmed: boolean | null
          deleted_at: string | null
          email: string | null
          employed_since: string | null
          employer_in_germany: boolean | null
          employer_industry: string | null
          employer_location: string | null
          employer_name: string | null
          employment_type: string | null
          equity_amount: number | null
          equity_source: string | null
          finance_request_id: string | null
          first_name: string | null
          fixed_rate_period_years: number | null
          has_rental_properties: boolean
          has_side_job: boolean | null
          health_insurance_monthly: number | null
          iban: string | null
          id: string
          id_document_number: string | null
          id_document_type: string | null
          id_document_valid_until: string | null
          last_name: string | null
          last_synced_from_finapi_at: string | null
          life_insurance_value: number | null
          linked_primary_profile_id: string | null
          living_expenses_monthly: number | null
          loan_amount_requested: number | null
          marginal_tax_rate: number | null
          marital_status: string | null
          max_monthly_rate: number | null
          modernization_costs: number | null
          nationality: string | null
          net_income_monthly: number | null
          no_insolvency: boolean | null
          no_tax_arrears: boolean | null
          object_address: string | null
          object_type: string | null
          other_assets_description: string | null
          other_assets_value: number | null
          other_fixed_costs_monthly: number | null
          other_income_description: string | null
          other_regular_income_monthly: number | null
          party_role: string
          pension_private_monthly: number | null
          pension_state_monthly: number | null
          phone: string | null
          phone_mobile: string | null
          planned_rent_monthly: number | null
          position: string | null
          previous_address_city: string | null
          previous_address_postal_code: string | null
          previous_address_street: string | null
          probation_until: string | null
          profile_type: string
          property_separation: boolean | null
          public_id: string | null
          purchase_price: number | null
          purpose: string | null
          rental_income_monthly: number | null
          rental_status: string | null
          repayment_rate_percent: number | null
          retirement_date: string | null
          salary_currency: string | null
          salary_payments_per_year: number | null
          salutation: string | null
          schufa_consent: boolean | null
          securities_value: number | null
          self_employed_income_monthly: number | null
          side_job_income_monthly: number | null
          side_job_since: string | null
          side_job_type: string | null
          tax_assessment_type: string | null
          tax_id: string | null
          taxable_income_yearly: number | null
          tenant_id: string
          updated_at: string
          vehicles_count: number | null
        }
        Insert: {
          address_city?: string | null
          address_postal_code?: string | null
          address_since?: string | null
          address_street?: string | null
          adults_count?: number | null
          alimony_income_monthly?: number | null
          ancillary_costs?: number | null
          bank_savings?: number | null
          bic?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_name?: string | null
          birth_place?: string | null
          bonus_yearly?: number | null
          building_society_value?: number | null
          car_leasing_monthly?: number | null
          child_benefit_monthly?: number | null
          child_support_amount_monthly?: number | null
          child_support_obligation?: boolean | null
          children_ages?: string | null
          children_birth_dates?: string | null
          children_count?: number | null
          church_tax?: boolean | null
          company_address?: string | null
          company_employees?: number | null
          company_founded?: string | null
          company_industry?: string | null
          company_legal_form?: string | null
          company_managing_director?: boolean | null
          company_name?: string | null
          company_ownership_percent?: number | null
          company_register_number?: string | null
          company_vat_id?: string | null
          completion_score?: number | null
          contract_type?: string | null
          created_at?: string
          current_rent_monthly?: number | null
          data_correct_confirmed?: boolean | null
          deleted_at?: string | null
          email?: string | null
          employed_since?: string | null
          employer_in_germany?: boolean | null
          employer_industry?: string | null
          employer_location?: string | null
          employer_name?: string | null
          employment_type?: string | null
          equity_amount?: number | null
          equity_source?: string | null
          finance_request_id?: string | null
          first_name?: string | null
          fixed_rate_period_years?: number | null
          has_rental_properties?: boolean
          has_side_job?: boolean | null
          health_insurance_monthly?: number | null
          iban?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          id_document_valid_until?: string | null
          last_name?: string | null
          last_synced_from_finapi_at?: string | null
          life_insurance_value?: number | null
          linked_primary_profile_id?: string | null
          living_expenses_monthly?: number | null
          loan_amount_requested?: number | null
          marginal_tax_rate?: number | null
          marital_status?: string | null
          max_monthly_rate?: number | null
          modernization_costs?: number | null
          nationality?: string | null
          net_income_monthly?: number | null
          no_insolvency?: boolean | null
          no_tax_arrears?: boolean | null
          object_address?: string | null
          object_type?: string | null
          other_assets_description?: string | null
          other_assets_value?: number | null
          other_fixed_costs_monthly?: number | null
          other_income_description?: string | null
          other_regular_income_monthly?: number | null
          party_role?: string
          pension_private_monthly?: number | null
          pension_state_monthly?: number | null
          phone?: string | null
          phone_mobile?: string | null
          planned_rent_monthly?: number | null
          position?: string | null
          previous_address_city?: string | null
          previous_address_postal_code?: string | null
          previous_address_street?: string | null
          probation_until?: string | null
          profile_type?: string
          property_separation?: boolean | null
          public_id?: string | null
          purchase_price?: number | null
          purpose?: string | null
          rental_income_monthly?: number | null
          rental_status?: string | null
          repayment_rate_percent?: number | null
          retirement_date?: string | null
          salary_currency?: string | null
          salary_payments_per_year?: number | null
          salutation?: string | null
          schufa_consent?: boolean | null
          securities_value?: number | null
          self_employed_income_monthly?: number | null
          side_job_income_monthly?: number | null
          side_job_since?: string | null
          side_job_type?: string | null
          tax_assessment_type?: string | null
          tax_id?: string | null
          taxable_income_yearly?: number | null
          tenant_id: string
          updated_at?: string
          vehicles_count?: number | null
        }
        Update: {
          address_city?: string | null
          address_postal_code?: string | null
          address_since?: string | null
          address_street?: string | null
          adults_count?: number | null
          alimony_income_monthly?: number | null
          ancillary_costs?: number | null
          bank_savings?: number | null
          bic?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_name?: string | null
          birth_place?: string | null
          bonus_yearly?: number | null
          building_society_value?: number | null
          car_leasing_monthly?: number | null
          child_benefit_monthly?: number | null
          child_support_amount_monthly?: number | null
          child_support_obligation?: boolean | null
          children_ages?: string | null
          children_birth_dates?: string | null
          children_count?: number | null
          church_tax?: boolean | null
          company_address?: string | null
          company_employees?: number | null
          company_founded?: string | null
          company_industry?: string | null
          company_legal_form?: string | null
          company_managing_director?: boolean | null
          company_name?: string | null
          company_ownership_percent?: number | null
          company_register_number?: string | null
          company_vat_id?: string | null
          completion_score?: number | null
          contract_type?: string | null
          created_at?: string
          current_rent_monthly?: number | null
          data_correct_confirmed?: boolean | null
          deleted_at?: string | null
          email?: string | null
          employed_since?: string | null
          employer_in_germany?: boolean | null
          employer_industry?: string | null
          employer_location?: string | null
          employer_name?: string | null
          employment_type?: string | null
          equity_amount?: number | null
          equity_source?: string | null
          finance_request_id?: string | null
          first_name?: string | null
          fixed_rate_period_years?: number | null
          has_rental_properties?: boolean
          has_side_job?: boolean | null
          health_insurance_monthly?: number | null
          iban?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          id_document_valid_until?: string | null
          last_name?: string | null
          last_synced_from_finapi_at?: string | null
          life_insurance_value?: number | null
          linked_primary_profile_id?: string | null
          living_expenses_monthly?: number | null
          loan_amount_requested?: number | null
          marginal_tax_rate?: number | null
          marital_status?: string | null
          max_monthly_rate?: number | null
          modernization_costs?: number | null
          nationality?: string | null
          net_income_monthly?: number | null
          no_insolvency?: boolean | null
          no_tax_arrears?: boolean | null
          object_address?: string | null
          object_type?: string | null
          other_assets_description?: string | null
          other_assets_value?: number | null
          other_fixed_costs_monthly?: number | null
          other_income_description?: string | null
          other_regular_income_monthly?: number | null
          party_role?: string
          pension_private_monthly?: number | null
          pension_state_monthly?: number | null
          phone?: string | null
          phone_mobile?: string | null
          planned_rent_monthly?: number | null
          position?: string | null
          previous_address_city?: string | null
          previous_address_postal_code?: string | null
          previous_address_street?: string | null
          probation_until?: string | null
          profile_type?: string
          property_separation?: boolean | null
          public_id?: string | null
          purchase_price?: number | null
          purpose?: string | null
          rental_income_monthly?: number | null
          rental_status?: string | null
          repayment_rate_percent?: number | null
          retirement_date?: string | null
          salary_currency?: string | null
          salary_payments_per_year?: number | null
          salutation?: string | null
          schufa_consent?: boolean | null
          securities_value?: number | null
          self_employed_income_monthly?: number | null
          side_job_income_monthly?: number | null
          side_job_since?: string | null
          side_job_type?: string | null
          tax_assessment_type?: string | null
          tax_id?: string | null
          taxable_income_yearly?: number | null
          tenant_id?: string
          updated_at?: string
          vehicles_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_profiles_finance_request_id_fkey"
            columns: ["finance_request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_profiles_linked_primary_profile_id_fkey"
            columns: ["linked_primary_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applicant_property_assets: {
        Row: {
          address: string | null
          applicant_profile_id: string
          commercial_area_sqm: number | null
          construction_year: number | null
          created_at: string
          estimated_value: number | null
          id: string
          living_area_sqm: number | null
          loan1_balance: number | null
          loan1_interest_rate: number | null
          loan1_lender: string | null
          loan1_rate_monthly: number | null
          loan2_balance: number | null
          loan2_interest_rate: number | null
          loan2_lender: string | null
          loan2_rate_monthly: number | null
          net_rent_monthly: number | null
          property_index: number
          property_type: string | null
          purchase_price: number | null
          rented_area_sqm: number | null
          tenant_id: string
          units_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          applicant_profile_id: string
          commercial_area_sqm?: number | null
          construction_year?: number | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          living_area_sqm?: number | null
          loan1_balance?: number | null
          loan1_interest_rate?: number | null
          loan1_lender?: string | null
          loan1_rate_monthly?: number | null
          loan2_balance?: number | null
          loan2_interest_rate?: number | null
          loan2_lender?: string | null
          loan2_rate_monthly?: number | null
          net_rent_monthly?: number | null
          property_index?: number
          property_type?: string | null
          purchase_price?: number | null
          rented_area_sqm?: number | null
          tenant_id: string
          units_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          applicant_profile_id?: string
          commercial_area_sqm?: number | null
          construction_year?: number | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          living_area_sqm?: number | null
          loan1_balance?: number | null
          loan1_interest_rate?: number | null
          loan1_lender?: string | null
          loan1_rate_monthly?: number | null
          loan2_balance?: number | null
          loan2_interest_rate?: number | null
          loan2_lender?: string | null
          loan2_rate_monthly?: number | null
          net_rent_monthly?: number | null
          property_index?: number
          property_type?: string | null
          purchase_price?: number | null
          rented_area_sqm?: number | null
          tenant_id?: string
          units_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applicant_property_assets_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicant_property_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_action_overrides: {
        Row: {
          action_code: string
          created_at: string | null
          disabled_until: string | null
          id: string
          org_id: string | null
          restricted_reason: string | null
          scope_type: string
          status_override: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          action_code: string
          created_at?: string | null
          disabled_until?: string | null
          id?: string
          org_id?: string | null
          restricted_reason?: string | null
          scope_type?: string
          status_override: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          action_code?: string
          created_at?: string | null
          disabled_until?: string | null
          id?: string
          org_id?: string | null
          restricted_reason?: string | null
          scope_type?: string
          status_override?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_action_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armstrong_action_overrides_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_action_runs: {
        Row: {
          action_code: string
          correlation_id: string | null
          cost_cents: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_context: Json | null
          org_id: string | null
          output_result: Json | null
          payload_hash: string | null
          payload_size_bytes: number | null
          pii_present: boolean | null
          retention_days: number | null
          session_id: string | null
          status: string
          tokens_used: number | null
          user_id: string | null
          zone: string
        }
        Insert: {
          action_code: string
          correlation_id?: string | null
          cost_cents?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_context?: Json | null
          org_id?: string | null
          output_result?: Json | null
          payload_hash?: string | null
          payload_size_bytes?: number | null
          pii_present?: boolean | null
          retention_days?: number | null
          session_id?: string | null
          status: string
          tokens_used?: number | null
          user_id?: string | null
          zone: string
        }
        Update: {
          action_code?: string
          correlation_id?: string | null
          cost_cents?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_context?: Json | null
          org_id?: string | null
          output_result?: Json | null
          payload_hash?: string | null
          payload_size_bytes?: number | null
          pii_present?: boolean | null
          retention_days?: number | null
          session_id?: string | null
          status?: string
          tokens_used?: number | null
          user_id?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_action_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armstrong_action_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_billing_events: {
        Row: {
          action_code: string
          action_run_id: string | null
          cost_cents: number | null
          cost_model: string
          created_at: string | null
          credits_charged: number | null
          id: string
          org_id: string
        }
        Insert: {
          action_code: string
          action_run_id?: string | null
          cost_cents?: number | null
          cost_model: string
          created_at?: string | null
          credits_charged?: number | null
          id?: string
          org_id: string
        }
        Update: {
          action_code?: string
          action_run_id?: string | null
          cost_cents?: number | null
          cost_model?: string
          created_at?: string | null
          credits_charged?: number | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_billing_events_action_run_id_fkey"
            columns: ["action_run_id"]
            isOneToOne: false
            referencedRelation: "armstrong_action_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armstrong_billing_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_chat_sessions: {
        Row: {
          created_at: string
          entity_context: Json | null
          expires_at: string
          id: string
          last_active_at: string
          messages: Json
          module: string | null
          session_id: string
          tenant_id: string | null
          user_id: string | null
          website: string | null
          zone: string
        }
        Insert: {
          created_at?: string
          entity_context?: Json | null
          expires_at?: string
          id?: string
          last_active_at?: string
          messages?: Json
          module?: string | null
          session_id: string
          tenant_id?: string | null
          user_id?: string | null
          website?: string | null
          zone?: string
        }
        Update: {
          created_at?: string
          entity_context?: Json | null
          expires_at?: string
          id?: string
          last_active_at?: string
          messages?: Json
          module?: string | null
          session_id?: string
          tenant_id?: string | null
          user_id?: string | null
          website?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_chat_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_command_events: {
        Row: {
          action_code: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          output_ref: Json | null
          source: string
          source_message_id: string | null
          status: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action_code: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          output_ref?: Json | null
          source?: string
          source_message_id?: string | null
          status?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action_code?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          output_ref?: Json | null
          source?: string
          source_message_id?: string | null
          status?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_command_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_inbound_tasks: {
        Row: {
          action_code: string | null
          attachments_meta: Json | null
          body_html: string | null
          body_text: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          from_email: string
          id: string
          instruction: string | null
          processed_at: string | null
          result: Json | null
          status: string
          subject: string | null
          tenant_id: string
          to_email: string
          user_id: string
        }
        Insert: {
          action_code?: string | null
          attachments_meta?: Json | null
          body_html?: string | null
          body_text?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          from_email: string
          id?: string
          instruction?: string | null
          processed_at?: string | null
          result?: Json | null
          status?: string
          subject?: string | null
          tenant_id: string
          to_email: string
          user_id: string
        }
        Update: {
          action_code?: string | null
          attachments_meta?: Json | null
          body_html?: string | null
          body_text?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          from_email?: string
          id?: string
          instruction?: string | null
          processed_at?: string | null
          result?: Json | null
          status?: string
          subject?: string | null
          tenant_id?: string
          to_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_inbound_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_knowledge_items: {
        Row: {
          category: string
          confidence: string | null
          content: string
          content_type: string
          created_at: string | null
          created_by: string | null
          id: string
          item_code: string
          org_id: string | null
          published_at: string | null
          reviewed_by: string | null
          scope: string
          sources: Json | null
          status: string
          subcategory: string | null
          summary_de: string | null
          title_de: string
          updated_at: string | null
          valid_until: string | null
          version: string | null
        }
        Insert: {
          category: string
          confidence?: string | null
          content: string
          content_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_code: string
          org_id?: string | null
          published_at?: string | null
          reviewed_by?: string | null
          scope?: string
          sources?: Json | null
          status?: string
          subcategory?: string | null
          summary_de?: string | null
          title_de: string
          updated_at?: string | null
          valid_until?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          confidence?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_code?: string
          org_id?: string | null
          published_at?: string | null
          reviewed_by?: string | null
          scope?: string
          sources?: Json | null
          status?: string
          subcategory?: string | null
          summary_de?: string | null
          title_de?: string
          updated_at?: string | null
          valid_until?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_knowledge_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armstrong_knowledge_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armstrong_knowledge_items_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      armstrong_policies: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          policy_code: string
          status: string
          title_de: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          policy_code: string
          status?: string
          title_de: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          policy_code?: string
          status?: string
          title_de?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_policies_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "armstrong_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      audit_jobs: {
        Row: {
          audit_report_id: string | null
          created_at: string | null
          finished_at: string | null
          id: string
          job_type: string
          logs: Json | null
          repo_ref: string | null
          started_at: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          audit_report_id?: string | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          logs?: Json | null
          repo_ref?: string | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Update: {
          audit_report_id?: string | null
          created_at?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          logs?: Json | null
          repo_ref?: string | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_jobs_audit_report_id_fkey"
            columns: ["audit_report_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_jobs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_prompt_templates: {
        Row: {
          content_txt: string
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content_txt: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content_txt?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          artifacts: Json | null
          content_html: string | null
          content_md: string
          counts: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean | null
          module_coverage: Json | null
          pr_url: string | null
          repo_ref: string | null
          scope: Json | null
          status: string
          tags: string[] | null
          title: string
        }
        Insert: {
          artifacts?: Json | null
          content_html?: string | null
          content_md: string
          counts?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          module_coverage?: Json | null
          pr_url?: string | null
          repo_ref?: string | null
          scope?: Json | null
          status?: string
          tags?: string[] | null
          title: string
        }
        Update: {
          artifacts?: Json | null
          content_html?: string | null
          content_md?: string
          counts?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          module_coverage?: Json | null
          pr_url?: string | null
          repo_ref?: string | null
          scope?: Json | null
          status?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      bank_account_meta: {
        Row: {
          account_id: string
          category: Database["public"]["Enums"]["bank_account_category"] | null
          created_at: string
          custom_name: string | null
          id: string
          org_unit: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          category?: Database["public"]["Enums"]["bank_account_category"] | null
          created_at?: string
          custom_name?: string | null
          id?: string
          org_unit?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          category?: Database["public"]["Enums"]["bank_account_category"] | null
          created_at?: string
          custom_name?: string | null
          id?: string
          org_unit?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_account_meta_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "msv_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_ref: string
          amount_eur: number
          booking_date: string
          counterparty: string | null
          created_at: string | null
          id: string
          match_category: string | null
          match_confidence: number | null
          match_rule_code: string | null
          match_status: string | null
          matched_entity: Json | null
          purpose_text: string | null
          tenant_id: string
          value_date: string | null
        }
        Insert: {
          account_ref: string
          amount_eur: number
          booking_date: string
          counterparty?: string | null
          created_at?: string | null
          id?: string
          match_category?: string | null
          match_confidence?: number | null
          match_rule_code?: string | null
          match_status?: string | null
          matched_entity?: Json | null
          purpose_text?: string | null
          tenant_id: string
          value_date?: string | null
        }
        Update: {
          account_ref?: string
          amount_eur?: number
          booking_date?: string
          counterparty?: string | null
          created_at?: string | null
          id?: string
          match_category?: string | null
          match_confidence?: number | null
          match_rule_code?: string | null
          match_status?: string | null
          matched_entity?: Json | null
          purpose_text?: string | null
          tenant_id?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_usage: {
        Row: {
          created_at: string | null
          document_count: number | null
          extraction_cost_cents: number | null
          extraction_pages_fast: number | null
          extraction_pages_hires: number | null
          id: string
          lovable_ai_calls: number | null
          lovable_ai_tokens: number | null
          pages_from_caya: number | null
          pages_from_dropbox: number | null
          pages_from_gdrive: number | null
          pages_from_onedrive: number | null
          pages_from_resend: number | null
          period_end: string
          period_start: string
          storage_bytes_used: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_count?: number | null
          extraction_cost_cents?: number | null
          extraction_pages_fast?: number | null
          extraction_pages_hires?: number | null
          id?: string
          lovable_ai_calls?: number | null
          lovable_ai_tokens?: number | null
          pages_from_caya?: number | null
          pages_from_dropbox?: number | null
          pages_from_gdrive?: number | null
          pages_from_onedrive?: number | null
          pages_from_resend?: number | null
          period_end: string
          period_start: string
          storage_bytes_used?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_count?: number | null
          extraction_cost_cents?: number | null
          extraction_pages_fast?: number | null
          extraction_pages_hires?: number | null
          id?: string
          lovable_ai_calls?: number | null
          lovable_ai_tokens?: number | null
          pages_from_caya?: number | null
          pages_from_dropbox?: number | null
          pages_from_gdrive?: number | null
          pages_from_onedrive?: number | null
          pages_from_resend?: number | null
          period_end?: string
          period_start?: string
          storage_bytes_used?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_articles: {
        Row: {
          author: string | null
          brand: string
          category: string | null
          content: string
          created_at: string
          description: string
          generated_by: string | null
          id: string
          is_published: boolean
          og_image: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          brand: string
          category?: string | null
          content: string
          created_at?: string
          description: string
          generated_by?: string | null
          id?: string
          is_published?: boolean
          og_image?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          brand?: string
          category?: string | null
          content?: string
          created_at?: string
          description?: string
          generated_by?: string | null
          id?: string
          is_published?: boolean
          og_image?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_at: string | null
          google_event_id: string | null
          ical_uid: string | null
          id: string
          location: string | null
          microsoft_event_id: string | null
          property_id: string | null
          reminder_minutes: number | null
          start_at: string
          synced_at: string | null
          synced_from: string | null
          tenant_id: string
          title: string
          updated_at: string | null
          video_call_id: string | null
        }
        Insert: {
          all_day?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          google_event_id?: string | null
          ical_uid?: string | null
          id?: string
          location?: string | null
          microsoft_event_id?: string | null
          property_id?: string | null
          reminder_minutes?: number | null
          start_at: string
          synced_at?: string | null
          synced_from?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
          video_call_id?: string | null
        }
        Update: {
          all_day?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          google_event_id?: string | null
          ical_uid?: string | null
          id?: string
          location?: string | null
          microsoft_event_id?: string | null
          property_id?: string | null
          reminder_minutes?: number | null
          start_at?: string
          synced_at?: string | null
          synced_from?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          video_call_id?: string | null
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
          {
            foreignKeyName: "calendar_events_video_call_id_fkey"
            columns: ["video_call_id"]
            isOneToOne: false
            referencedRelation: "video_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          auth_pass: string | null
          auth_user: string | null
          connection_type: string | null
          created_at: string
          external_domain: string | null
          external_port: number | null
          id: string
          internal_port: number | null
          is_active: boolean
          local_ip: string | null
          model: string | null
          name: string
          refresh_interval_sec: number
          snapshot_url: string
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          auth_pass?: string | null
          auth_user?: string | null
          connection_type?: string | null
          created_at?: string
          external_domain?: string | null
          external_port?: number | null
          id?: string
          internal_port?: number | null
          is_active?: boolean
          local_ip?: string | null
          model?: string | null
          name?: string
          refresh_interval_sec?: number
          snapshot_url: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Update: {
          auth_pass?: string | null
          auth_user?: string | null
          connection_type?: string | null
          created_at?: string
          external_domain?: string | null
          external_port?: number | null
          id?: string
          internal_port?: number | null
          is_active?: boolean
          local_ip?: string | null
          model?: string | null
          name?: string
          refresh_interval_sec?: number
          snapshot_url?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      car_service_requests: {
        Row: {
          appointment_at: string | null
          confirmed_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          distance_km: number | null
          id: string
          next_available_at: string | null
          partner: string | null
          problem_note: string | null
          quoted_price_max: number | null
          quoted_price_min: number | null
          radius_km: number | null
          rejection_reason: string | null
          selected_workshop_id: string | null
          selected_workshop_name: string | null
          service_type: string
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
          vehicle_id: string
          zip: string | null
        }
        Insert: {
          appointment_at?: string | null
          confirmed_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          distance_km?: number | null
          id?: string
          next_available_at?: string | null
          partner?: string | null
          problem_note?: string | null
          quoted_price_max?: number | null
          quoted_price_min?: number | null
          radius_km?: number | null
          rejection_reason?: string | null
          selected_workshop_id?: string | null
          selected_workshop_name?: string | null
          service_type: string
          status?: string
          tenant_id: string
          updated_at?: string | null
          user_id?: string
          vehicle_id: string
          zip?: string | null
        }
        Update: {
          appointment_at?: string | null
          confirmed_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          distance_km?: number | null
          id?: string
          next_available_at?: string | null
          partner?: string | null
          problem_note?: string | null
          quoted_price_max?: number | null
          quoted_price_min?: number | null
          radius_km?: number | null
          rejection_reason?: string | null
          selected_workshop_id?: string | null
          selected_workshop_name?: string | null
          service_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_service_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_claims: {
        Row: {
          created_at: string
          currency: string
          damage_date: string
          damage_type: Database["public"]["Enums"]["car_damage_type"]
          description: string | null
          estimated_cost_cents: number | null
          fault_assessment:
            | Database["public"]["Enums"]["car_fault_assessment"]
            | null
          final_cost_cents: number | null
          id: string
          insurance_id: string | null
          insurer_reference: string | null
          location_description: string | null
          notes: string | null
          payout_cents: number | null
          payout_date: string | null
          police_reference: string | null
          public_id: string
          reported_at: string | null
          status: Database["public"]["Enums"]["car_claim_status"]
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          damage_date: string
          damage_type?: Database["public"]["Enums"]["car_damage_type"]
          description?: string | null
          estimated_cost_cents?: number | null
          fault_assessment?:
            | Database["public"]["Enums"]["car_fault_assessment"]
            | null
          final_cost_cents?: number | null
          id?: string
          insurance_id?: string | null
          insurer_reference?: string | null
          location_description?: string | null
          notes?: string | null
          payout_cents?: number | null
          payout_date?: string | null
          police_reference?: string | null
          public_id?: string
          reported_at?: string | null
          status?: Database["public"]["Enums"]["car_claim_status"]
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          damage_date?: string
          damage_type?: Database["public"]["Enums"]["car_damage_type"]
          description?: string | null
          estimated_cost_cents?: number | null
          fault_assessment?:
            | Database["public"]["Enums"]["car_fault_assessment"]
            | null
          final_cost_cents?: number | null
          id?: string
          insurance_id?: string | null
          insurer_reference?: string | null
          location_description?: string | null
          notes?: string | null
          payout_cents?: number | null
          payout_date?: string | null
          police_reference?: string | null
          public_id?: string
          reported_at?: string | null
          status?: Database["public"]["Enums"]["car_claim_status"]
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_claims_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "cars_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_claims_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_device_external_refs: {
        Row: {
          created_at: string
          device_id: string
          external_device_id: string
          id: string
          source_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          external_device_id: string
          id?: string
          source_type?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          external_device_id?: string
          id?: string
          source_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_device_external_refs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "cars_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_device_external_refs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_device_status: {
        Row: {
          device_id: string
          is_online: boolean
          last_attributes: Json | null
          last_course: number | null
          last_lat: number | null
          last_lon: number | null
          last_position_at: string | null
          last_signal_at: string | null
          last_speed: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          device_id: string
          is_online?: boolean
          last_attributes?: Json | null
          last_course?: number | null
          last_lat?: number | null
          last_lon?: number | null
          last_position_at?: string | null
          last_signal_at?: string | null
          last_speed?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          device_id?: string
          is_online?: boolean
          last_attributes?: Json | null
          last_course?: number | null
          last_lat?: number | null
          last_lon?: number | null
          last_position_at?: string | null
          last_signal_at?: string | null
          last_speed?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_device_status_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: true
            referencedRelation: "cars_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_device_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_devices: {
        Row: {
          category: string
          created_at: string
          id: string
          imei: string | null
          integration_level: string
          is_online: boolean
          last_signal_at: string | null
          manufacturer: string | null
          protocol_type: string
          source_type: string
          tenant_id: string
          updated_at: string
          upload_interval_sec: number
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          imei?: string | null
          integration_level?: string
          is_online?: boolean
          last_signal_at?: string | null
          manufacturer?: string | null
          protocol_type?: string
          source_type?: string
          tenant_id: string
          updated_at?: string
          upload_interval_sec?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          imei?: string | null
          integration_level?: string
          is_online?: boolean
          last_signal_at?: string | null
          manufacturer?: string | null
          protocol_type?: string
          source_type?: string
          tenant_id?: string
          updated_at?: string
          upload_interval_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_financing: {
        Row: {
          contract_number: string | null
          created_at: string
          currency: string
          down_payment_cents: number | null
          end_date: string | null
          finance_type: Database["public"]["Enums"]["car_finance_type"]
          id: string
          interest_rate_percent: number | null
          monthly_rate_cents: number | null
          notes: string | null
          provider_name: string | null
          remaining_debt_cents: number | null
          residual_value_cents: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["car_finance_status"]
          tenant_id: string
          total_km_limit: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          contract_number?: string | null
          created_at?: string
          currency?: string
          down_payment_cents?: number | null
          end_date?: string | null
          finance_type?: Database["public"]["Enums"]["car_finance_type"]
          id?: string
          interest_rate_percent?: number | null
          monthly_rate_cents?: number | null
          notes?: string | null
          provider_name?: string | null
          remaining_debt_cents?: number | null
          residual_value_cents?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["car_finance_status"]
          tenant_id: string
          total_km_limit?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          contract_number?: string | null
          created_at?: string
          currency?: string
          down_payment_cents?: number | null
          end_date?: string | null
          finance_type?: Database["public"]["Enums"]["car_finance_type"]
          id?: string
          interest_rate_percent?: number | null
          monthly_rate_cents?: number | null
          notes?: string | null
          provider_name?: string | null
          remaining_debt_cents?: number | null
          residual_value_cents?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["car_finance_status"]
          tenant_id?: string
          total_km_limit?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_financing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_financing_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_insurances: {
        Row: {
          annual_premium_cents: number
          cancellation_deadline: string | null
          coverage_type: Database["public"]["Enums"]["car_coverage_type"]
          created_at: string
          currency: string
          deductible_full_cents: number | null
          deductible_partial_cents: number | null
          extras: Json | null
          id: string
          insurer_name: string
          notes: string | null
          payment_frequency: Database["public"]["Enums"]["car_payment_frequency"]
          policy_number: string
          renewal_date: string | null
          sf_full_casco: number | null
          sf_liability: number
          status: Database["public"]["Enums"]["car_insurance_status"]
          tenant_id: string
          term_end: string | null
          term_start: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          annual_premium_cents: number
          cancellation_deadline?: string | null
          coverage_type?: Database["public"]["Enums"]["car_coverage_type"]
          created_at?: string
          currency?: string
          deductible_full_cents?: number | null
          deductible_partial_cents?: number | null
          extras?: Json | null
          id?: string
          insurer_name: string
          notes?: string | null
          payment_frequency?: Database["public"]["Enums"]["car_payment_frequency"]
          policy_number: string
          renewal_date?: string | null
          sf_full_casco?: number | null
          sf_liability?: number
          status?: Database["public"]["Enums"]["car_insurance_status"]
          tenant_id: string
          term_end?: string | null
          term_start: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          annual_premium_cents?: number
          cancellation_deadline?: string | null
          coverage_type?: Database["public"]["Enums"]["car_coverage_type"]
          created_at?: string
          currency?: string
          deductible_full_cents?: number | null
          deductible_partial_cents?: number | null
          extras?: Json | null
          id?: string
          insurer_name?: string
          notes?: string | null
          payment_frequency?: Database["public"]["Enums"]["car_payment_frequency"]
          policy_number?: string
          renewal_date?: string | null
          sf_full_casco?: number | null
          sf_liability?: number
          status?: Database["public"]["Enums"]["car_insurance_status"]
          tenant_id?: string
          term_end?: string | null
          term_start?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_insurances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_insurances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_logbook_locks: {
        Row: {
          id: string
          integrity_hash: string | null
          locked_at: string
          locked_by: string
          logbook_id: string
          month: string
          tenant_id: string
        }
        Insert: {
          id?: string
          integrity_hash?: string | null
          locked_at?: string
          locked_by: string
          logbook_id: string
          month: string
          tenant_id: string
        }
        Update: {
          id?: string
          integrity_hash?: string | null
          locked_at?: string
          locked_by?: string
          logbook_id?: string
          month?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_logbook_locks_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "cars_logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_logbook_locks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_logbooks: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          policy_config: Json | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          policy_config?: Json | null
          start_date?: string
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          policy_config?: Json | null
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_logbooks_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "cars_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_logbooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_logbooks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_offers: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          down_payment_cents: number | null
          id: string
          image_url: string | null
          is_featured: boolean
          km_per_year: number | null
          link_url: string
          offer_type: Database["public"]["Enums"]["car_offer_type"]
          payload: Json | null
          price_daily_cents: number | null
          price_monthly_cents: number | null
          provider: Database["public"]["Enums"]["car_offer_provider"]
          sort_order: number | null
          tenant_id: string
          term_months: number | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          vehicle_make: string | null
          vehicle_model: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          down_payment_cents?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          km_per_year?: number | null
          link_url: string
          offer_type?: Database["public"]["Enums"]["car_offer_type"]
          payload?: Json | null
          price_daily_cents?: number | null
          price_monthly_cents?: number | null
          provider: Database["public"]["Enums"]["car_offer_provider"]
          sort_order?: number | null
          tenant_id: string
          term_months?: number | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          down_payment_cents?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          km_per_year?: number | null
          link_url?: string
          offer_type?: Database["public"]["Enums"]["car_offer_type"]
          payload?: Json | null
          price_daily_cents?: number | null
          price_monthly_cents?: number | null
          provider?: Database["public"]["Enums"]["car_offer_provider"]
          sort_order?: number | null
          tenant_id?: string
          term_months?: number | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_offers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_positions_raw: {
        Row: {
          accuracy: number | null
          altitude: number | null
          attributes: Json | null
          course: number | null
          device_id: string
          id: string
          lat: number
          lon: number
          received_at: string
          recorded_at: string
          source_position_id: string | null
          source_type: string
          speed: number | null
          tenant_id: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          attributes?: Json | null
          course?: number | null
          device_id: string
          id?: string
          lat: number
          lon: number
          received_at?: string
          recorded_at: string
          source_position_id?: string | null
          source_type?: string
          speed?: number | null
          tenant_id: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          attributes?: Json | null
          course?: number | null
          device_id?: string
          id?: string
          lat?: number
          lon?: number
          received_at?: string
          recorded_at?: string
          source_position_id?: string | null
          source_type?: string
          speed?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_positions_raw_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "cars_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_positions_raw_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_trip_audit: {
        Row: {
          changed_at: string
          changed_by: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          reason: string | null
          tenant_id: string
          trip_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          tenant_id: string
          trip_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
          tenant_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_trip_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_trip_audit_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "cars_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_trip_detection_runs: {
        Row: {
          created_at: string
          device_id: string | null
          error: string | null
          from_ts: string
          id: string
          logbook_id: string | null
          positions_ingested: number
          status: string
          tenant_id: string
          to_ts: string
          trips_created: number
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          error?: string | null
          from_ts: string
          id?: string
          logbook_id?: string | null
          positions_ingested?: number
          status?: string
          tenant_id: string
          to_ts: string
          trips_created?: number
        }
        Update: {
          created_at?: string
          device_id?: string | null
          error?: string | null
          from_ts?: string
          id?: string
          logbook_id?: string | null
          positions_ingested?: number
          status?: string
          tenant_id?: string
          to_ts?: string
          trips_created?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_trip_detection_runs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "cars_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_trip_detection_runs_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "cars_logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_trip_detection_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_trips: {
        Row: {
          business_partner: string | null
          classification: Database["public"]["Enums"]["car_trip_classification"]
          connection_id: string | null
          created_at: string
          customer_name: string | null
          device_id: string | null
          distance_km: number
          distance_source: string
          end_address: string | null
          end_at: string | null
          end_lat: number | null
          end_lon: number | null
          external_trip_id: string | null
          id: string
          is_locked: boolean
          lock_version: number
          logbook_id: string | null
          purpose: string | null
          source: Database["public"]["Enums"]["car_trip_source"]
          source_payload: Json | null
          start_address: string | null
          start_at: string
          start_lat: number | null
          start_lon: number | null
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          business_partner?: string | null
          classification?: Database["public"]["Enums"]["car_trip_classification"]
          connection_id?: string | null
          created_at?: string
          customer_name?: string | null
          device_id?: string | null
          distance_km?: number
          distance_source?: string
          end_address?: string | null
          end_at?: string | null
          end_lat?: number | null
          end_lon?: number | null
          external_trip_id?: string | null
          id?: string
          is_locked?: boolean
          lock_version?: number
          logbook_id?: string | null
          purpose?: string | null
          source?: Database["public"]["Enums"]["car_trip_source"]
          source_payload?: Json | null
          start_address?: string | null
          start_at: string
          start_lat?: number | null
          start_lon?: number | null
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          business_partner?: string | null
          classification?: Database["public"]["Enums"]["car_trip_classification"]
          connection_id?: string | null
          created_at?: string
          customer_name?: string | null
          device_id?: string | null
          distance_km?: number
          distance_source?: string
          end_address?: string | null
          end_at?: string | null
          end_lat?: number | null
          end_lon?: number | null
          external_trip_id?: string | null
          id?: string
          is_locked?: boolean
          lock_version?: number
          logbook_id?: string | null
          purpose?: string | null
          source?: Database["public"]["Enums"]["car_trip_source"]
          source_payload?: Json | null
          start_address?: string | null
          start_at?: string
          start_lat?: number | null
          start_lon?: number | null
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cars_trips_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "cars_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_trips_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "cars_logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_trips_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "cars_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_vehicles: {
        Row: {
          annual_mileage_km: number | null
          au_valid_until: string | null
          body_type: string | null
          co2_g_km: number | null
          color: string | null
          created_at: string
          created_by: string | null
          current_mileage_km: number | null
          dms_folder_id: string | null
          doors: number | null
          engine_ccm: number | null
          estimated_value_eur: number | null
          first_registration_date: string | null
          fuel_type: Database["public"]["Enums"]["car_fuel_type"] | null
          holder_address: string | null
          holder_name: string | null
          hsn: string | null
          hu_valid_until: string | null
          id: string
          license_plate: string
          make: string | null
          max_weight_kg: number | null
          mileage_updated_at: string | null
          model: string | null
          notes: string | null
          power_kw: number | null
          primary_driver_birthdate: string | null
          primary_driver_name: string | null
          public_id: string
          seats: number | null
          status: Database["public"]["Enums"]["car_vehicle_status"]
          tenant_id: string
          tsn: string | null
          updated_at: string
          variant: string | null
          vehicle_type: string
          vin: string | null
          weight_kg: number | null
        }
        Insert: {
          annual_mileage_km?: number | null
          au_valid_until?: string | null
          body_type?: string | null
          co2_g_km?: number | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          current_mileage_km?: number | null
          dms_folder_id?: string | null
          doors?: number | null
          engine_ccm?: number | null
          estimated_value_eur?: number | null
          first_registration_date?: string | null
          fuel_type?: Database["public"]["Enums"]["car_fuel_type"] | null
          holder_address?: string | null
          holder_name?: string | null
          hsn?: string | null
          hu_valid_until?: string | null
          id?: string
          license_plate: string
          make?: string | null
          max_weight_kg?: number | null
          mileage_updated_at?: string | null
          model?: string | null
          notes?: string | null
          power_kw?: number | null
          primary_driver_birthdate?: string | null
          primary_driver_name?: string | null
          public_id?: string
          seats?: number | null
          status?: Database["public"]["Enums"]["car_vehicle_status"]
          tenant_id: string
          tsn?: string | null
          updated_at?: string
          variant?: string | null
          vehicle_type?: string
          vin?: string | null
          weight_kg?: number | null
        }
        Update: {
          annual_mileage_km?: number | null
          au_valid_until?: string | null
          body_type?: string | null
          co2_g_km?: number | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          current_mileage_km?: number | null
          dms_folder_id?: string | null
          doors?: number | null
          engine_ccm?: number | null
          estimated_value_eur?: number | null
          first_registration_date?: string | null
          fuel_type?: Database["public"]["Enums"]["car_fuel_type"] | null
          holder_address?: string | null
          holder_name?: string | null
          hsn?: string | null
          hu_valid_until?: string | null
          id?: string
          license_plate?: string
          make?: string | null
          max_weight_kg?: number | null
          mileage_updated_at?: string | null
          model?: string | null
          notes?: string | null
          power_kw?: number | null
          primary_driver_birthdate?: string | null
          primary_driver_name?: string | null
          public_id?: string
          seats?: number | null
          status?: Database["public"]["Enums"]["car_vehicle_status"]
          tenant_id?: string
          tsn?: string | null
          updated_at?: string
          variant?: string | null
          vehicle_type?: string
          vin?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_events: {
        Row: {
          actor_type: string | null
          actor_user_id: string | null
          case_id: string
          created_at: string
          event_source: string
          event_type: string
          id: string
          new_status: string | null
          payload: Json | null
          previous_status: string | null
          task_id: string | null
          task_name: string | null
          tenant_id: string
        }
        Insert: {
          actor_type?: string | null
          actor_user_id?: string | null
          case_id: string
          created_at?: string
          event_source?: string
          event_type: string
          id?: string
          new_status?: string | null
          payload?: Json | null
          previous_status?: string | null
          task_id?: string | null
          task_name?: string | null
          tenant_id: string
        }
        Update: {
          actor_type?: string | null
          actor_user_id?: string | null
          case_id?: string
          created_at?: string
          event_source?: string
          event_type?: string
          id?: string
          new_status?: string | null
          payload?: Json | null
          previous_status?: string | null
          task_id?: string | null
          task_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          case_code: string | null
          case_type: string
          completed_at: string | null
          correlation_key: string | null
          created_at: string
          created_by: string | null
          current_step: string | null
          due_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          priority: number | null
          process_definition_key: string | null
          process_instance_id: string | null
          public_id: string | null
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_code?: string | null
          case_type: string
          completed_at?: string | null
          correlation_key?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          process_definition_key?: string | null
          process_instance_id?: string | null
          public_id?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_code?: string | null
          case_type?: string
          completed_at?: string | null
          correlation_key?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: string | null
          due_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          process_definition_key?: string | null
          process_instance_id?: string | null
          public_id?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_tenant_id_fkey"
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
      cloud_sync_connectors: {
        Row: {
          access_token: string | null
          account_email: string | null
          account_name: string | null
          auto_extract: boolean | null
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          last_sync_files_count: number | null
          provider: string
          refresh_token: string | null
          remote_folder_id: string | null
          remote_folder_name: string | null
          status: string
          sync_interval_minutes: number | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_email?: string | null
          account_name?: string | null
          auto_extract?: boolean | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_files_count?: number | null
          provider: string
          refresh_token?: string | null
          remote_folder_id?: string | null
          remote_folder_name?: string | null
          status?: string
          sync_interval_minutes?: number | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_email?: string | null
          account_name?: string | null
          auto_extract?: boolean | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_files_count?: number | null
          provider?: string
          refresh_token?: string | null
          remote_folder_id?: string | null
          remote_folder_name?: string | null
          status?: string
          sync_interval_minutes?: number | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_sync_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_sync_log: {
        Row: {
          completed_at: string | null
          connector_id: string
          credits_used: number | null
          error_message: string | null
          files_extracted: number | null
          files_synced: number | null
          id: string
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          connector_id: string
          credits_used?: number | null
          error_message?: string | null
          files_extracted?: number | null
          files_synced?: number | null
          id?: string
          started_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          connector_id?: string
          credits_used?: number | null
          error_message?: string | null
          files_extracted?: number | null
          files_synced?: number | null
          id?: string
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_sync_log_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "cloud_sync_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
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
          commission_type: string | null
          contact_id: string | null
          contract_document_id: string | null
          created_at: string
          gross_commission: number | null
          id: string
          invoiced_at: string | null
          liable_role: string | null
          liable_user_id: string | null
          notes: string | null
          paid_at: string | null
          percentage: number | null
          pipeline_id: string | null
          platform_fee: number | null
          platform_share_pct: number | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agreement_consent_id?: string | null
          amount: number
          commission_type?: string | null
          contact_id?: string | null
          contract_document_id?: string | null
          created_at?: string
          gross_commission?: number | null
          id?: string
          invoiced_at?: string | null
          liable_role?: string | null
          liable_user_id?: string | null
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          pipeline_id?: string | null
          platform_fee?: number | null
          platform_share_pct?: number | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agreement_consent_id?: string | null
          amount?: number
          commission_type?: string | null
          contact_id?: string | null
          contract_document_id?: string | null
          created_at?: string
          gross_commission?: number | null
          id?: string
          invoiced_at?: string | null
          liable_role?: string | null
          liable_user_id?: string | null
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          pipeline_id?: string | null
          platform_fee?: number | null
          platform_share_pct?: number | null
          reference_id?: string | null
          reference_type?: string | null
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
            foreignKeyName: "commissions_contract_document_id_fkey"
            columns: ["contract_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_liable_user_id_fkey"
            columns: ["liable_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      commpro_phone_assistants: {
        Row: {
          armstrong_inbound_email: string | null
          behavior_prompt: string
          binding_status: string
          brand_key: string | null
          created_at: string
          display_name: string
          documentation: Json
          elevenlabs_agent_id: string | null
          elevenlabs_phone_number_id: string | null
          first_message: string
          forwarding_number_e164: string | null
          id: string
          is_enabled: boolean
          rules: Json
          tier: string
          twilio_number_sid: string | null
          twilio_phone_number_e164: string | null
          updated_at: string
          user_id: string | null
          voice_preset_key: string
          voice_provider: string | null
          voice_settings: Json
        }
        Insert: {
          armstrong_inbound_email?: string | null
          behavior_prompt?: string
          binding_status?: string
          brand_key?: string | null
          created_at?: string
          display_name?: string
          documentation?: Json
          elevenlabs_agent_id?: string | null
          elevenlabs_phone_number_id?: string | null
          first_message?: string
          forwarding_number_e164?: string | null
          id?: string
          is_enabled?: boolean
          rules?: Json
          tier?: string
          twilio_number_sid?: string | null
          twilio_phone_number_e164?: string | null
          updated_at?: string
          user_id?: string | null
          voice_preset_key?: string
          voice_provider?: string | null
          voice_settings?: Json
        }
        Update: {
          armstrong_inbound_email?: string | null
          behavior_prompt?: string
          binding_status?: string
          brand_key?: string | null
          created_at?: string
          display_name?: string
          documentation?: Json
          elevenlabs_agent_id?: string | null
          elevenlabs_phone_number_id?: string | null
          first_message?: string
          forwarding_number_e164?: string | null
          id?: string
          is_enabled?: boolean
          rules?: Json
          tier?: string
          twilio_number_sid?: string | null
          twilio_phone_number_e164?: string | null
          updated_at?: string
          user_id?: string | null
          voice_preset_key?: string
          voice_provider?: string | null
          voice_settings?: Json
        }
        Relationships: []
      }
      commpro_phone_call_sessions: {
        Row: {
          action_items: Json
          admin_notified_at: string | null
          armstrong_notified_at: string | null
          assistant_id: string
          billed_credits: number | null
          conversation_turns: Json | null
          created_at: string
          direction: string
          duration_sec: number | null
          ended_at: string | null
          from_number_e164: string
          id: string
          match: Json
          recording_url: string | null
          started_at: string
          status: string
          summary_text: string | null
          to_number_e164: string | null
          transcript_text: string | null
          twilio_call_sid: string | null
          twilio_price: number | null
          twilio_price_unit: string | null
          user_id: string | null
        }
        Insert: {
          action_items?: Json
          admin_notified_at?: string | null
          armstrong_notified_at?: string | null
          assistant_id: string
          billed_credits?: number | null
          conversation_turns?: Json | null
          created_at?: string
          direction?: string
          duration_sec?: number | null
          ended_at?: string | null
          from_number_e164: string
          id?: string
          match?: Json
          recording_url?: string | null
          started_at?: string
          status?: string
          summary_text?: string | null
          to_number_e164?: string | null
          transcript_text?: string | null
          twilio_call_sid?: string | null
          twilio_price?: number | null
          twilio_price_unit?: string | null
          user_id?: string | null
        }
        Update: {
          action_items?: Json
          admin_notified_at?: string | null
          armstrong_notified_at?: string | null
          assistant_id?: string
          billed_credits?: number | null
          conversation_turns?: Json | null
          created_at?: string
          direction?: string
          duration_sec?: number | null
          ended_at?: string | null
          from_number_e164?: string
          id?: string
          match?: Json
          recording_url?: string | null
          started_at?: string
          status?: string
          summary_text?: string | null
          to_number_e164?: string | null
          transcript_text?: string | null
          twilio_call_sid?: string | null
          twilio_price?: number | null
          twilio_price_unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commpro_phone_call_sessions_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "commpro_phone_assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_bundle_items: {
        Row: {
          bundle_id: string
          document_id: string
          id: string
          required: boolean
          required_version: number | null
          sort_order: number
        }
        Insert: {
          bundle_id: string
          document_id: string
          id?: string
          required?: boolean
          required_version?: number | null
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          document_id?: string
          id?: string
          required?: boolean
          required_version?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "compliance_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_bundle_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_bundles: {
        Row: {
          bundle_key: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bundle_key: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bundle_key?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_company_profile: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          commercial_register: Json | null
          company_name: string
          country: string | null
          email: string | null
          id: string
          last_updated_at: string
          last_updated_by: string | null
          legal_form: string | null
          legal_notes: string | null
          managing_directors: Json | null
          phone: string | null
          postal_code: string | null
          slug: string | null
          supervisory_authority: string | null
          vat_id: string | null
          website_url: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          commercial_register?: Json | null
          company_name?: string
          country?: string | null
          email?: string | null
          id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          legal_form?: string | null
          legal_notes?: string | null
          managing_directors?: Json | null
          phone?: string | null
          postal_code?: string | null
          slug?: string | null
          supervisory_authority?: string | null
          vat_id?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          commercial_register?: Json | null
          company_name?: string
          country?: string | null
          email?: string | null
          id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          legal_form?: string | null
          legal_notes?: string | null
          managing_directors?: Json | null
          phone?: string | null
          postal_code?: string | null
          slug?: string | null
          supervisory_authority?: string | null
          vat_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      compliance_document_versions: {
        Row: {
          activated_at: string | null
          change_note: string | null
          content_md: string
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          status: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          change_note?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          status?: string
          version: number
        }
        Update: {
          activated_at?: string | null
          change_note?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          brand: string | null
          created_at: string
          current_version: number
          description: string | null
          doc_key: string
          doc_type: string
          id: string
          locale: string | null
          scope: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          current_version?: number
          description?: string | null
          doc_key: string
          doc_type: string
          id?: string
          locale?: string | null
          scope?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          current_version?: number
          description?: string | null
          doc_key?: string
          doc_type?: string
          id?: string
          locale?: string | null
          scope?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consent_templates: {
        Row: {
          body_de: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          required_for_module: string | null
          title_de: string
          version: number
        }
        Insert: {
          body_de: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          required_for_module?: string | null
          title_de: string
          version?: number
        }
        Update: {
          body_de?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          required_for_module?: string | null
          title_de?: string
          version?: number
        }
        Relationships: []
      }
      consumer_loan_cases: {
        Row: {
          consent_credit_check: boolean
          consent_data_correct: boolean
          created_at: string
          employment_status: string
          id: string
          provider: string
          provider_case_ref: string | null
          requested_amount: number | null
          requested_term_months: number | null
          selected_offer_data: Json | null
          selected_offer_id: string | null
          source_profile_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_credit_check?: boolean
          consent_data_correct?: boolean
          created_at?: string
          employment_status?: string
          id?: string
          provider?: string
          provider_case_ref?: string | null
          requested_amount?: number | null
          requested_term_months?: number | null
          selected_offer_data?: Json | null
          selected_offer_id?: string | null
          source_profile_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_credit_check?: boolean
          consent_data_correct?: boolean
          created_at?: string
          employment_status?: string
          id?: string
          provider?: string
          provider_case_ref?: string | null
          requested_amount?: number | null
          requested_term_months?: number | null
          selected_offer_data?: Json | null
          selected_offer_id?: string | null
          source_profile_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_loan_cases_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_loan_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_loan_documents: {
        Row: {
          case_id: string
          created_at: string
          dms_document_id: string | null
          document_type: string
          id: string
          status: string
        }
        Insert: {
          case_id: string
          created_at?: string
          dms_document_id?: string | null
          document_type: string
          id?: string
          status?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          dms_document_id?: string | null
          document_type?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumer_loan_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "consumer_loan_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_candidates: {
        Row: {
          company: string | null
          confidence: number | null
          created_at: string | null
          domain: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          imported_contact_id: string | null
          last_name: string | null
          location: string | null
          phone: string | null
          role: string | null
          session_id: string
          source_json: Json | null
          status: string
          tenant_id: string
        }
        Insert: {
          company?: string | null
          confidence?: number | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          imported_contact_id?: string | null
          last_name?: string | null
          location?: string | null
          phone?: string | null
          role?: string | null
          session_id: string
          source_json?: Json | null
          status?: string
          tenant_id: string
        }
        Update: {
          company?: string | null
          confidence?: number | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          imported_contact_id?: string | null
          last_name?: string | null
          location?: string | null
          phone?: string | null
          role?: string | null
          session_id?: string
          source_json?: Json | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_candidates_imported_contact_id_fkey"
            columns: ["imported_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_candidates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_candidates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_conversations: {
        Row: {
          body_md: string | null
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          linked_session_id: string | null
          subject: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          body_md?: string | null
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          linked_session_id?: string | null
          subject?: string | null
          tenant_id: string
          type?: string
        }
        Update: {
          body_md?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          linked_session_id?: string | null
          subject?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_conversations_linked_session_id_fkey"
            columns: ["linked_session_id"]
            isOneToOne: false
            referencedRelation: "meeting_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_staging: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string | null
          company_name: string | null
          created_at: string
          dedupe_key: string | null
          desk: string | null
          email: string | null
          enrichment_data: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          mandate_id: string | null
          merged_contact_id: string | null
          phone: string | null
          quality_score: number | null
          role_guess: string | null
          salutation: string | null
          service_area: string | null
          source: string
          source_id: string | null
          source_url: string | null
          status: string
          tenant_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          dedupe_key?: string | null
          desk?: string | null
          email?: string | null
          enrichment_data?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mandate_id?: string | null
          merged_contact_id?: string | null
          phone?: string | null
          quality_score?: number | null
          role_guess?: string | null
          salutation?: string | null
          service_area?: string | null
          source: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          dedupe_key?: string | null
          desk?: string | null
          email?: string | null
          enrichment_data?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mandate_id?: string | null
          merged_contact_id?: string | null
          phone?: string | null
          quality_score?: number | null
          role_guess?: string | null
          salutation?: string | null
          service_area?: string | null
          source?: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_staging_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_staging_merged_contact_id_fkey"
            columns: ["merged_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_staging_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_strategy_ledger: {
        Row: {
          category_code: string
          contact_id: string
          created_at: string | null
          data_gaps: string[] | null
          id: string
          last_step_at: string | null
          quality_score: number | null
          steps_completed: Json | null
          steps_pending: Json | null
          strategy_code: string
          tenant_id: string
          total_cost_eur: number | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          contact_id: string
          created_at?: string | null
          data_gaps?: string[] | null
          id?: string
          last_step_at?: string | null
          quality_score?: number | null
          steps_completed?: Json | null
          steps_pending?: Json | null
          strategy_code: string
          tenant_id: string
          total_cost_eur?: number | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          contact_id?: string
          created_at?: string | null
          data_gaps?: string[] | null
          id?: string
          last_step_at?: string | null
          quality_score?: number | null
          steps_completed?: Json | null
          steps_pending?: Json | null
          strategy_code?: string
          tenant_id?: string
          total_cost_eur?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_strategy_ledger_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_strategy_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          category: string | null
          city: string | null
          company: string | null
          confidence_score: number | null
          created_at: string
          deleted_at: string | null
          do_not_contact: boolean | null
          email: string | null
          first_name: string
          google_contact_id: string | null
          id: string
          last_contacted_at: string | null
          last_name: string
          legal_basis: string | null
          microsoft_contact_id: string | null
          notes: string | null
          permission_status: string | null
          phone: string | null
          phone_mobile: string | null
          postal_code: string | null
          public_id: string
          quality_status: string | null
          salutation: string | null
          scope: string | null
          street: string | null
          synced_at: string | null
          synced_from: string | null
          tenant_id: string
          unsubscribe_token: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          company?: string | null
          confidence_score?: number | null
          created_at?: string
          deleted_at?: string | null
          do_not_contact?: boolean | null
          email?: string | null
          first_name: string
          google_contact_id?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name: string
          legal_basis?: string | null
          microsoft_contact_id?: string | null
          notes?: string | null
          permission_status?: string | null
          phone?: string | null
          phone_mobile?: string | null
          postal_code?: string | null
          public_id: string
          quality_status?: string | null
          salutation?: string | null
          scope?: string | null
          street?: string | null
          synced_at?: string | null
          synced_from?: string | null
          tenant_id: string
          unsubscribe_token?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          company?: string | null
          confidence_score?: number | null
          created_at?: string
          deleted_at?: string | null
          do_not_contact?: boolean | null
          email?: string | null
          first_name?: string
          google_contact_id?: string | null
          id?: string
          last_contacted_at?: string | null
          last_name?: string
          legal_basis?: string | null
          microsoft_contact_id?: string | null
          notes?: string | null
          permission_status?: string | null
          phone?: string | null
          phone_mobile?: string | null
          postal_code?: string | null
          public_id?: string
          quality_status?: string | null
          salutation?: string | null
          scope?: string | null
          street?: string | null
          synced_at?: string | null
          synced_from?: string | null
          tenant_id?: string
          unsubscribe_token?: string | null
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
      content_topics: {
        Row: {
          brand: string
          category: string
          created_at: string
          id: string
          published_article_id: string | null
          status: string
          title_prompt: string
          updated_at: string
        }
        Insert: {
          brand: string
          category?: string
          created_at?: string
          id?: string
          published_article_id?: string | null
          status?: string
          title_prompt: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          published_article_id?: string | null
          status?: string
          title_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topics_published_article_id_fkey"
            columns: ["published_article_id"]
            isOneToOne: false
            referencedRelation: "brand_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      context_members: {
        Row: {
          birth_date: string | null
          birth_name: string | null
          church_tax: boolean | null
          city: string | null
          context_id: string
          country: string | null
          created_at: string
          email: string | null
          first_name: string
          gross_income_yearly: number | null
          house_number: string | null
          id: string
          last_name: string
          ownership_share: number | null
          phone: string | null
          postal_code: string | null
          profession: string | null
          street: string | null
          tax_class: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          birth_name?: string | null
          church_tax?: boolean | null
          city?: string | null
          context_id: string
          country?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          gross_income_yearly?: number | null
          house_number?: string | null
          id?: string
          last_name: string
          ownership_share?: number | null
          phone?: string | null
          postal_code?: string | null
          profession?: string | null
          street?: string | null
          tax_class?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          birth_name?: string | null
          church_tax?: boolean | null
          city?: string | null
          context_id?: string
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          gross_income_yearly?: number | null
          house_number?: string | null
          id?: string
          last_name?: string
          ownership_share?: number | null
          phone?: string | null
          postal_code?: string | null
          profession?: string | null
          street?: string | null
          tax_class?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_members_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "landlord_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "context_members_tenant_id_fkey"
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
      contract_candidates: {
        Row: {
          accepted_entity_id: string | null
          amount_max: number | null
          amount_min: number | null
          category_suggestion: string | null
          confidence: number | null
          created_at: string
          frequency: string | null
          id: string
          merchant: string | null
          reasoning: string | null
          scan_run_id: string
          status: Database["public"]["Enums"]["candidate_status"] | null
          tenant_id: string
        }
        Insert: {
          accepted_entity_id?: string | null
          amount_max?: number | null
          amount_min?: number | null
          category_suggestion?: string | null
          confidence?: number | null
          created_at?: string
          frequency?: string | null
          id?: string
          merchant?: string | null
          reasoning?: string | null
          scan_run_id: string
          status?: Database["public"]["Enums"]["candidate_status"] | null
          tenant_id: string
        }
        Update: {
          accepted_entity_id?: string | null
          amount_max?: number | null
          amount_min?: number | null
          category_suggestion?: string | null
          confidence?: number | null
          created_at?: string
          frequency?: string | null
          id?: string
          merchant?: string | null
          reasoning?: string | null
          scan_run_id?: string
          status?: Database["public"]["Enums"]["candidate_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_candidates_scan_run_id_fkey"
            columns: ["scan_run_id"]
            isOneToOne: false
            referencedRelation: "scan_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      credibility_flags: {
        Row: {
          applicant_profile_id: string
          created_at: string
          declared_value: string | null
          detected_value: string | null
          field_name: string | null
          flag_type: string
          id: string
          resolution_note: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_document_id: string | null
          tenant_id: string
        }
        Insert: {
          applicant_profile_id: string
          created_at?: string
          declared_value?: string | null
          detected_value?: string | null
          field_name?: string | null
          flag_type: string
          id?: string
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_document_id?: string | null
          tenant_id: string
        }
        Update: {
          applicant_profile_id?: string
          created_at?: string
          declared_value?: string | null
          detected_value?: string | null
          field_name?: string | null
          flag_type?: string
          id?: string
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_document_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credibility_flags_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "applicant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credibility_flags_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credibility_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          kind: string
          ref_id: string | null
          ref_type: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          kind: string
          ref_id?: string | null
          ref_type?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          kind?: string
          ref_id?: string | null
          ref_type?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_projects: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          id: string
          investment_profile_id: string | null
          notes: string | null
          property_interests: string[] | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          investment_profile_id?: string | null
          notes?: string | null
          property_interests?: string[] | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          investment_profile_id?: string | null
          notes?: string | null
          property_interests?: string[] | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_projects_investment_profile_id_fkey"
            columns: ["investment_profile_id"]
            isOneToOne: false
            referencedRelation: "investment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_event_ledger: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          direction: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_hash: string | null
          payload: Json
          source: string
          tenant_id: string
          user_agent_hash: string | null
          zone: string
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          direction: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_hash?: string | null
          payload?: Json
          source: string
          tenant_id: string
          user_agent_hash?: string | null
          zone: string
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          direction?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_hash?: string | null
          payload?: Json
          source?: string
          tenant_id?: string
          user_agent_hash?: string | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_event_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          erasure_summary: string | null
          executed_at: string | null
          id: string
          identity_method: string | null
          identity_notes: string | null
          identity_status: string
          internal_notes: string | null
          legal_hold_reason: string | null
          notes: string | null
          request_channel: string
          request_received_at: string | null
          requester_email: string
          requester_name: string | null
          response_channel: string | null
          response_sent_at: string | null
          response_status: string
          response_type: string | null
          retention_notes: string | null
          scope_mode: string
          scope_notes: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          erasure_summary?: string | null
          executed_at?: string | null
          id?: string
          identity_method?: string | null
          identity_notes?: string | null
          identity_status?: string
          internal_notes?: string | null
          legal_hold_reason?: string | null
          notes?: string | null
          request_channel?: string
          request_received_at?: string | null
          requester_email: string
          requester_name?: string | null
          response_channel?: string | null
          response_sent_at?: string | null
          response_status?: string
          response_type?: string | null
          retention_notes?: string | null
          scope_mode?: string
          scope_notes?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          erasure_summary?: string | null
          executed_at?: string | null
          id?: string
          identity_method?: string | null
          identity_notes?: string | null
          identity_status?: string
          internal_notes?: string | null
          legal_hold_reason?: string | null
          notes?: string | null
          request_channel?: string
          request_received_at?: string | null
          requester_email?: string
          requester_name?: string | null
          response_channel?: string | null
          response_sent_at?: string | null
          response_status?: string
          response_type?: string | null
          retention_notes?: string | null
          scope_mode?: string
          scope_notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_calculations: {
        Row: {
          ancillary_cost_percent: number | null
          annualized_return: number | null
          break_even_units: number | null
          calculated_at: string | null
          calculation_name: string | null
          created_at: string
          financing_ltv_percent: number | null
          financing_rate_percent: number | null
          gross_profit: number | null
          holding_period_months: number | null
          id: string
          is_active: boolean | null
          net_profit: number | null
          profit_margin_percent: number | null
          profit_per_unit: number | null
          project_id: string
          purchase_price: number | null
          renovation_per_sqm: number | null
          renovation_total: number | null
          sales_commission_percent: number | null
          total_investment: number | null
          total_sale_proceeds: number | null
          updated_at: string
        }
        Insert: {
          ancillary_cost_percent?: number | null
          annualized_return?: number | null
          break_even_units?: number | null
          calculated_at?: string | null
          calculation_name?: string | null
          created_at?: string
          financing_ltv_percent?: number | null
          financing_rate_percent?: number | null
          gross_profit?: number | null
          holding_period_months?: number | null
          id?: string
          is_active?: boolean | null
          net_profit?: number | null
          profit_margin_percent?: number | null
          profit_per_unit?: number | null
          project_id: string
          purchase_price?: number | null
          renovation_per_sqm?: number | null
          renovation_total?: number | null
          sales_commission_percent?: number | null
          total_investment?: number | null
          total_sale_proceeds?: number | null
          updated_at?: string
        }
        Update: {
          ancillary_cost_percent?: number | null
          annualized_return?: number | null
          break_even_units?: number | null
          calculated_at?: string | null
          calculation_name?: string | null
          created_at?: string
          financing_ltv_percent?: number | null
          financing_rate_percent?: number | null
          gross_profit?: number | null
          holding_period_months?: number | null
          id?: string
          is_active?: boolean | null
          net_profit?: number | null
          profit_margin_percent?: number | null
          profit_per_unit?: number | null
          project_id?: string
          purchase_price?: number | null
          renovation_per_sqm?: number | null
          renovation_total?: number | null
          sales_commission_percent?: number | null
          total_investment?: number | null
          total_sale_proceeds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_calculations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_documents: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          doc_type: string
          document_id: string | null
          id: string
          notes: string | null
          project_id: string
          storage_node_id: string | null
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          doc_type?: string
          document_id?: string | null
          id?: string
          notes?: string | null
          project_id: string
          storage_node_id?: string | null
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          doc_type?: string
          document_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          storage_node_id?: string | null
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_documents_storage_node_id_fkey"
            columns: ["storage_node_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "dev_project_units"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_reservations: {
        Row: {
          buyer_contact_id: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          commission_amount: number | null
          completion_date: string | null
          confirmation_date: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          notary_date: string | null
          notes: string | null
          partner_org_id: string | null
          partner_user_id: string | null
          project_id: string
          reservation_date: string | null
          reserved_price: number | null
          status: string
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          buyer_contact_id?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          commission_amount?: number | null
          completion_date?: string | null
          confirmation_date?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          notary_date?: string | null
          notes?: string | null
          partner_org_id?: string | null
          partner_user_id?: string | null
          project_id: string
          reservation_date?: string | null
          reserved_price?: number | null
          status?: string
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          buyer_contact_id?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          commission_amount?: number | null
          completion_date?: string | null
          confirmation_date?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          notary_date?: string | null
          notes?: string | null
          partner_org_id?: string | null
          partner_user_id?: string | null
          project_id?: string
          reservation_date?: string | null
          reserved_price?: number | null
          status?: string
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_reservations_buyer_contact_id_fkey"
            columns: ["buyer_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_reservations_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_reservations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_reservations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "dev_project_units"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_project_units: {
        Row: {
          area_sqm: number | null
          balcony: boolean | null
          commission_amount: number | null
          created_at: string
          current_rent: number | null
          floor: number | null
          garden: boolean | null
          grundbuchblatt: string | null
          hausgeld: number | null
          id: string
          list_price: number | null
          min_price: number | null
          notes: string | null
          parking: boolean | null
          parking_type: string | null
          price_per_sqm: number | null
          project_id: string
          property_id: string | null
          public_id: string | null
          rent_net: number | null
          rent_nk: number | null
          rooms_count: number | null
          status: string
          te_number: string | null
          tenant_id: string
          tenant_name: string | null
          unit_id: string | null
          unit_number: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          balcony?: boolean | null
          commission_amount?: number | null
          created_at?: string
          current_rent?: number | null
          floor?: number | null
          garden?: boolean | null
          grundbuchblatt?: string | null
          hausgeld?: number | null
          id?: string
          list_price?: number | null
          min_price?: number | null
          notes?: string | null
          parking?: boolean | null
          parking_type?: string | null
          price_per_sqm?: number | null
          project_id: string
          property_id?: string | null
          public_id?: string | null
          rent_net?: number | null
          rent_nk?: number | null
          rooms_count?: number | null
          status?: string
          te_number?: string | null
          tenant_id: string
          tenant_name?: string | null
          unit_id?: string | null
          unit_number: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          balcony?: boolean | null
          commission_amount?: number | null
          created_at?: string
          current_rent?: number | null
          floor?: number | null
          garden?: boolean | null
          grundbuchblatt?: string | null
          hausgeld?: number | null
          id?: string
          list_price?: number | null
          min_price?: number | null
          notes?: string | null
          parking?: boolean | null
          parking_type?: string | null
          price_per_sqm?: number | null
          project_id?: string
          property_id?: string | null
          public_id?: string | null
          rent_net?: number | null
          rent_nk?: number | null
          rooms_count?: number | null
          status?: string
          te_number?: string | null
          tenant_id?: string
          tenant_name?: string | null
          unit_id?: string | null
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_project_units_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_project_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_projects: {
        Row: {
          address: string | null
          afa_model: string | null
          afa_rate_percent: number | null
          ancillary_cost_percent: number | null
          avg_unit_price: number | null
          city: string | null
          commission_rate_percent: number | null
          condition_text: string | null
          construction_year: number | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          developer_context_id: string
          energy_cert_type: string | null
          energy_cert_value: number | null
          energy_class: string | null
          energy_source: string | null
          features: Json | null
          federal_state: string | null
          floors_count: number | null
          full_description: string | null
          grest_rate_percent: number | null
          heating_type: string | null
          holding_period_months: number | null
          id: string
          income_type: string | null
          intake_data: Json | null
          invest_engine_analyzed: boolean | null
          investment_type: string | null
          kaufy_featured: boolean | null
          kaufy_listed: boolean | null
          land_share_percent: number | null
          landingpage_enabled: boolean | null
          landingpage_slug: string | null
          location_description: string | null
          management_company: string | null
          management_cost_per_unit: number | null
          name: string
          needs_review: boolean | null
          notary_rate_percent: number | null
          parking_price: number | null
          parking_type: string | null
          postal_code: string | null
          project_code: string
          project_images: Json | null
          project_start_date: string | null
          project_type: string | null
          public_id: string | null
          purchase_price: number | null
          renovation_budget: number | null
          renovation_year: number | null
          seller_name: string | null
          state: string | null
          status: string
          target_end_date: string | null
          tenant_id: string
          total_area_sqm: number | null
          total_sale_target: number | null
          total_units_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          afa_model?: string | null
          afa_rate_percent?: number | null
          ancillary_cost_percent?: number | null
          avg_unit_price?: number | null
          city?: string | null
          commission_rate_percent?: number | null
          condition_text?: string | null
          construction_year?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          developer_context_id: string
          energy_cert_type?: string | null
          energy_cert_value?: number | null
          energy_class?: string | null
          energy_source?: string | null
          features?: Json | null
          federal_state?: string | null
          floors_count?: number | null
          full_description?: string | null
          grest_rate_percent?: number | null
          heating_type?: string | null
          holding_period_months?: number | null
          id?: string
          income_type?: string | null
          intake_data?: Json | null
          invest_engine_analyzed?: boolean | null
          investment_type?: string | null
          kaufy_featured?: boolean | null
          kaufy_listed?: boolean | null
          land_share_percent?: number | null
          landingpage_enabled?: boolean | null
          landingpage_slug?: string | null
          location_description?: string | null
          management_company?: string | null
          management_cost_per_unit?: number | null
          name: string
          needs_review?: boolean | null
          notary_rate_percent?: number | null
          parking_price?: number | null
          parking_type?: string | null
          postal_code?: string | null
          project_code: string
          project_images?: Json | null
          project_start_date?: string | null
          project_type?: string | null
          public_id?: string | null
          purchase_price?: number | null
          renovation_budget?: number | null
          renovation_year?: number | null
          seller_name?: string | null
          state?: string | null
          status?: string
          target_end_date?: string | null
          tenant_id: string
          total_area_sqm?: number | null
          total_sale_target?: number | null
          total_units_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          afa_model?: string | null
          afa_rate_percent?: number | null
          ancillary_cost_percent?: number | null
          avg_unit_price?: number | null
          city?: string | null
          commission_rate_percent?: number | null
          condition_text?: string | null
          construction_year?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          developer_context_id?: string
          energy_cert_type?: string | null
          energy_cert_value?: number | null
          energy_class?: string | null
          energy_source?: string | null
          features?: Json | null
          federal_state?: string | null
          floors_count?: number | null
          full_description?: string | null
          grest_rate_percent?: number | null
          heating_type?: string | null
          holding_period_months?: number | null
          id?: string
          income_type?: string | null
          intake_data?: Json | null
          invest_engine_analyzed?: boolean | null
          investment_type?: string | null
          kaufy_featured?: boolean | null
          kaufy_listed?: boolean | null
          land_share_percent?: number | null
          landingpage_enabled?: boolean | null
          landingpage_slug?: string | null
          location_description?: string | null
          management_company?: string | null
          management_cost_per_unit?: number | null
          name?: string
          needs_review?: boolean | null
          notary_rate_percent?: number | null
          parking_price?: number | null
          parking_type?: string | null
          postal_code?: string | null
          project_code?: string
          project_images?: Json | null
          project_start_date?: string | null
          project_type?: string | null
          public_id?: string | null
          purchase_price?: number | null
          renovation_budget?: number | null
          renovation_year?: number | null
          seller_name?: string | null
          state?: string | null
          status?: string
          target_end_date?: string | null
          tenant_id?: string
          total_area_sqm?: number | null
          total_sale_target?: number | null
          total_units_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_projects_developer_context_id_fkey"
            columns: ["developer_context_id"]
            isOneToOne: false
            referencedRelation: "developer_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_contexts: {
        Row: {
          city: string | null
          context_type: string
          created_at: string
          house_number: string | null
          hrb_number: string | null
          id: string
          is_default: boolean | null
          legal_form: string | null
          managing_director: string | null
          name: string
          postal_code: string | null
          street: string | null
          tax_rate_percent: number | null
          tenant_id: string
          updated_at: string
          ust_id: string | null
        }
        Insert: {
          city?: string | null
          context_type?: string
          created_at?: string
          house_number?: string | null
          hrb_number?: string | null
          id?: string
          is_default?: boolean | null
          legal_form?: string | null
          managing_director?: string | null
          name: string
          postal_code?: string | null
          street?: string | null
          tax_rate_percent?: number | null
          tenant_id: string
          updated_at?: string
          ust_id?: string | null
        }
        Update: {
          city?: string | null
          context_type?: string
          created_at?: string
          house_number?: string | null
          hrb_number?: string | null
          id?: string
          is_default?: boolean | null
          legal_form?: string | null
          managing_director?: string | null
          name?: string
          postal_code?: string | null
          street?: string | null
          tax_rate_percent?: number | null
          tenant_id?: string
          updated_at?: string
          ust_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_contexts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_region_queue: {
        Row: {
          approved_contacts: number
          cooldown_until: string | null
          created_at: string
          id: string
          last_category_index: number
          last_scanned_at: string | null
          population: number
          postal_code_prefix: string
          priority_score: number
          region_name: string
          tenant_id: string
          total_contacts: number
          updated_at: string
        }
        Insert: {
          approved_contacts?: number
          cooldown_until?: string | null
          created_at?: string
          id?: string
          last_category_index?: number
          last_scanned_at?: string | null
          population?: number
          postal_code_prefix: string
          priority_score?: number
          region_name: string
          tenant_id: string
          total_contacts?: number
          updated_at?: string
        }
        Update: {
          approved_contacts?: number
          cooldown_until?: string | null
          created_at?: string
          id?: string
          last_category_index?: number
          last_scanned_at?: string | null
          population?: number
          postal_code_prefix?: string
          priority_score?: number
          region_name?: string
          tenant_id?: string
          total_contacts?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_region_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_run_log: {
        Row: {
          approved_count: number
          category_code: string
          cost_eur: number
          created_at: string
          credits_used: number
          duplicates_skipped: number
          error_message: string | null
          id: string
          provider_calls_json: Json | null
          raw_found: number
          region_name: string
          run_date: string
          tenant_id: string
        }
        Insert: {
          approved_count?: number
          category_code: string
          cost_eur?: number
          created_at?: string
          credits_used?: number
          duplicates_skipped?: number
          error_message?: string | null
          id?: string
          provider_calls_json?: Json | null
          raw_found?: number
          region_name: string
          run_date?: string
          tenant_id: string
        }
        Update: {
          approved_count?: number
          category_code?: string
          cost_eur?: number
          created_at?: string
          credits_used?: number
          duplicates_skipped?: number
          error_message?: string | null
          id?: string
          provider_calls_json?: Json | null
          raw_found?: number
          region_name?: string
          run_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_run_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_type_catalog: {
        Row: {
          anchors: Json | null
          created_at: string | null
          doc_type: string
          extractable_dp_keys: string[] | null
          posting_suggestion_rules: Json | null
          required_meta: string[] | null
          scope_default: string
        }
        Insert: {
          anchors?: Json | null
          created_at?: string | null
          doc_type: string
          extractable_dp_keys?: string[] | null
          posting_suggestion_rules?: Json | null
          required_meta?: string[] | null
          scope_default: string
        }
        Update: {
          anchors?: Json | null
          created_at?: string | null
          doc_type?: string
          extractable_dp_keys?: string[] | null
          posting_suggestion_rules?: Json | null
          required_meta?: string[] | null
          scope_default?: string
        }
        Relationships: []
      }
      document_checklist_items: {
        Row: {
          category: string
          checklist_type: string
          created_at: string | null
          doc_type: string
          for_employment_type: string | null
          id: string
          is_required: boolean | null
          label: string
          sort_index: number | null
          tenant_id: string | null
        }
        Insert: {
          category: string
          checklist_type: string
          created_at?: string | null
          doc_type: string
          for_employment_type?: string | null
          id?: string
          is_required?: boolean | null
          label: string
          sort_index?: number | null
          tenant_id?: string | null
        }
        Update: {
          category?: string
          checklist_type?: string
          created_at?: string | null
          doc_type?: string
          for_employment_type?: string | null
          id?: string
          is_required?: boolean | null
          label?: string
          sort_index?: number | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_checklist_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          char_end: number | null
          char_start: number | null
          chunk_index: number
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          page_number: number | null
          tenant_id: string
          text: string
        }
        Insert: {
          char_end?: number | null
          char_start?: number | null
          chunk_index?: number
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          tenant_id: string
          text: string
        }
        Update: {
          char_end?: number | null
          char_start?: number | null
          chunk_index?: number
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          tenant_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_tenant_id_fkey"
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
          display_order: number | null
          document_id: string
          expose_visibility: string | null
          id: string
          is_title_image: boolean | null
          link_status: string | null
          node_id: string | null
          object_id: string | null
          object_type: string | null
          slot_key: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          document_id: string
          expose_visibility?: string | null
          id?: string
          is_title_image?: boolean | null
          link_status?: string | null
          node_id?: string | null
          object_id?: string | null
          object_type?: string | null
          slot_key?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          document_id?: string
          expose_visibility?: string | null
          id?: string
          is_title_image?: boolean | null
          link_status?: string | null
          node_id?: string | null
          object_id?: string | null
          object_type?: string | null
          slot_key?: string | null
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
      document_reminders: {
        Row: {
          created_at: string | null
          finance_request_id: string | null
          id: string
          last_sent_at: string | null
          next_reminder_at: string | null
          reminder_type: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          finance_request_id?: string | null
          id?: string
          last_sent_at?: string | null
          next_reminder_at?: string | null
          reminder_type?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          finance_request_id?: string | null
          id?: string
          last_sent_at?: string | null
          next_reminder_at?: string | null
          reminder_type?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reminders_finance_request_id_fkey"
            columns: ["finance_request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_structured_data: {
        Row: {
          confidence: number | null
          contact_id: string | null
          created_at: string
          doc_category: string
          document_id: string
          extracted_fields: Json
          extractor_version: string | null
          id: string
          needs_review: boolean | null
          property_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          contact_id?: string | null
          created_at?: string
          doc_category: string
          document_id: string
          extracted_fields?: Json
          extractor_version?: string | null
          id?: string
          needs_review?: boolean | null
          property_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          contact_id?: string | null
          created_at?: string
          doc_category?: string
          document_id?: string
          extracted_fields?: Json
          extractor_version?: string | null
          id?: string
          needs_review?: boolean | null
          property_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_structured_data_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structured_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structured_data_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structured_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structured_data_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_summary: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          detected_type: string | null
          doc_type: string | null
          extracted_json_path: string | null
          extraction_status: string | null
          file_path: string
          id: string
          match_confidence: number | null
          mime_type: string
          name: string
          original_node_id: string | null
          public_id: string
          review_state: string | null
          scope: string | null
          sidecar_json: Json | null
          size_bytes: number
          source: string | null
          tenant_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          detected_type?: string | null
          doc_type?: string | null
          extracted_json_path?: string | null
          extraction_status?: string | null
          file_path: string
          id?: string
          match_confidence?: number | null
          mime_type: string
          name: string
          original_node_id?: string | null
          public_id: string
          review_state?: string | null
          scope?: string | null
          sidecar_json?: Json | null
          size_bytes: number
          source?: string | null
          tenant_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          detected_type?: string | null
          doc_type?: string | null
          extracted_json_path?: string | null
          extraction_status?: string | null
          file_path?: string
          id?: string
          match_confidence?: number | null
          mime_type?: string
          name?: string
          original_node_id?: string | null
          public_id?: string
          review_state?: string | null
          scope?: string | null
          sidecar_json?: Json | null
          size_bytes?: number
          source?: string | null
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
      dossier_research_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          perplexity_model: string | null
          result_json: Json | null
          result_storage_path: string | null
          search_query: string
          started_at: string | null
          status: string
          tenant_id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          perplexity_model?: string | null
          result_json?: Json | null
          result_storage_path?: string | null
          search_query: string
          started_at?: string | null
          status?: string
          tenant_id: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          perplexity_model?: string | null
          result_json?: Json | null
          result_storage_path?: string | null
          search_query?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_research_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dp_catalog: {
        Row: {
          aliases: string[] | null
          calc_role: Json | null
          created_at: string | null
          datatype: string
          default_source_priority: string[] | null
          dp_key: string
          entity: string
          evidence_doc_types: string[] | null
          label_de: string
          privacy: string | null
          required_level: string | null
          validation: Json | null
        }
        Insert: {
          aliases?: string[] | null
          calc_role?: Json | null
          created_at?: string | null
          datatype: string
          default_source_priority?: string[] | null
          dp_key: string
          entity: string
          evidence_doc_types?: string[] | null
          label_de: string
          privacy?: string | null
          required_level?: string | null
          validation?: Json | null
        }
        Update: {
          aliases?: string[] | null
          calc_role?: Json | null
          created_at?: string | null
          datatype?: string
          default_source_priority?: string[] | null
          dp_key?: string
          entity?: string
          evidence_doc_types?: string[] | null
          label_de?: string
          privacy?: string | null
          required_level?: string | null
          validation?: Json | null
        }
        Relationships: []
      }
      dsar_requests: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          identity_method: string | null
          identity_notes: string | null
          identity_status: string
          internal_notes: string | null
          notes: string | null
          request_channel: string
          request_received_at: string | null
          request_type: string
          requester_email: string
          requester_name: string | null
          response_channel: string | null
          response_sent_at: string | null
          response_status: string
          scope_mode: string
          scope_notes: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          identity_method?: string | null
          identity_notes?: string | null
          identity_status?: string
          internal_notes?: string | null
          notes?: string | null
          request_channel?: string
          request_received_at?: string | null
          request_type?: string
          requester_email: string
          requester_name?: string | null
          response_channel?: string | null
          response_sent_at?: string | null
          response_status?: string
          scope_mode?: string
          scope_notes?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          identity_method?: string | null
          identity_notes?: string | null
          identity_status?: string
          internal_notes?: string | null
          notes?: string | null
          request_channel?: string
          request_received_at?: string | null
          request_type?: string
          requester_email?: string
          requester_name?: string | null
          response_channel?: string | null
          response_sent_at?: string | null
          response_status?: string
          scope_mode?: string
          scope_notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dsar_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_jobs: {
        Row: {
          batch_size: number
          completed_at: string | null
          created_at: string
          credits_reserved: number
          credits_used: number
          error_log: Json | null
          failed_files: number
          folder_id: string | null
          id: string
          processed_files: number
          skipped_files: number
          started_at: string | null
          status: string
          tenant_id: string
          total_files: number
          updated_at: string
        }
        Insert: {
          batch_size?: number
          completed_at?: string | null
          created_at?: string
          credits_reserved?: number
          credits_used?: number
          error_log?: Json | null
          failed_files?: number
          folder_id?: string | null
          id?: string
          processed_files?: number
          skipped_files?: number
          started_at?: string | null
          status?: string
          tenant_id: string
          total_files?: number
          updated_at?: string
        }
        Update: {
          batch_size?: number
          completed_at?: string | null
          created_at?: string
          credits_reserved?: number
          credits_used?: number
          error_log?: Json | null
          failed_files?: number
          folder_id?: string | null
          id?: string
          processed_files?: number
          skipped_files?: number
          started_at?: string | null
          status?: string
          tenant_id?: string
          total_files?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          actual_cost: number | null
          actual_cost_cents: number | null
          actual_pages: number | null
          chunks_count: number | null
          consent_given_at: string | null
          consent_given_by: string | null
          consent_mode: string | null
          created_at: string
          document_id: string
          engine: string
          error_message: string | null
          estimated_cost: number | null
          estimated_cost_cents: number | null
          estimated_pages: number | null
          finished_at: string | null
          id: string
          result_json: Json | null
          source: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_cost_cents?: number | null
          actual_pages?: number | null
          chunks_count?: number | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          consent_mode?: string | null
          created_at?: string
          document_id: string
          engine: string
          error_message?: string | null
          estimated_cost?: number | null
          estimated_cost_cents?: number | null
          estimated_pages?: number | null
          finished_at?: string | null
          id?: string
          result_json?: Json | null
          source: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_cost_cents?: number | null
          actual_pages?: number | null
          chunks_count?: number | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          consent_mode?: string | null
          created_at?: string
          document_id?: string
          engine?: string
          error_message?: string | null
          estimated_cost?: number | null
          estimated_cost_cents?: number | null
          estimated_pages?: number | null
          finished_at?: string | null
          id?: string
          result_json?: Json | null
          source?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extractions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_bank_contacts: {
        Row: {
          bank_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          max_loan_amount: number | null
          min_loan_amount: number | null
          notes: string | null
          portal_url: string | null
          preferred_loan_types: string[] | null
          preferred_regions: string[] | null
          public_id: string | null
          updated_at: string
        }
        Insert: {
          bank_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          max_loan_amount?: number | null
          min_loan_amount?: number | null
          notes?: string | null
          portal_url?: string | null
          preferred_loan_types?: string[] | null
          preferred_regions?: string[] | null
          public_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          max_loan_amount?: number | null
          min_loan_amount?: number | null
          notes?: string | null
          portal_url?: string | null
          preferred_loan_types?: string[] | null
          preferred_regions?: string[] | null
          public_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      finance_mandates: {
        Row: {
          accepted_at: string | null
          assigned_manager_id: string | null
          created_at: string
          delegated_at: string | null
          delegated_by: string | null
          finance_request_id: string
          id: string
          notes: string | null
          priority: number | null
          public_id: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_manager_id?: string | null
          created_at?: string
          delegated_at?: string | null
          delegated_by?: string | null
          finance_request_id: string
          id?: string
          notes?: string | null
          priority?: number | null
          public_id?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_manager_id?: string | null
          created_at?: string
          delegated_at?: string | null
          delegated_by?: string | null
          finance_request_id?: string
          id?: string
          notes?: string | null
          priority?: number | null
          public_id?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_mandates_finance_request_id_fkey"
            columns: ["finance_request_id"]
            isOneToOne: true
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_mandates_tenant_id_fkey"
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
      finance_requests: {
        Row: {
          applicant_snapshot: Json | null
          archived_at: string | null
          broker_fee: number | null
          contact_email: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_object_data: Json | null
          equity_amount: number | null
          fixed_rate_period_years: number | null
          id: string
          listing_id: string | null
          loan_amount_requested: number | null
          max_monthly_rate: number | null
          modernization_costs: number | null
          notary_costs: number | null
          object_address: string | null
          object_construction_year: number | null
          object_equipment_level: string | null
          object_land_area_sqm: number | null
          object_living_area_sqm: number | null
          object_location_quality: string | null
          object_source: string | null
          object_type: string | null
          property_id: string | null
          public_id: string | null
          purchase_price: number | null
          purpose: string | null
          repayment_rate_percent: number | null
          source: string
          status: string
          storage_folder_id: string | null
          submitted_at: string | null
          tenant_id: string
          transfer_tax: number | null
          updated_at: string
        }
        Insert: {
          applicant_snapshot?: Json | null
          archived_at?: string | null
          broker_fee?: number | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_object_data?: Json | null
          equity_amount?: number | null
          fixed_rate_period_years?: number | null
          id?: string
          listing_id?: string | null
          loan_amount_requested?: number | null
          max_monthly_rate?: number | null
          modernization_costs?: number | null
          notary_costs?: number | null
          object_address?: string | null
          object_construction_year?: number | null
          object_equipment_level?: string | null
          object_land_area_sqm?: number | null
          object_living_area_sqm?: number | null
          object_location_quality?: string | null
          object_source?: string | null
          object_type?: string | null
          property_id?: string | null
          public_id?: string | null
          purchase_price?: number | null
          purpose?: string | null
          repayment_rate_percent?: number | null
          source?: string
          status?: string
          storage_folder_id?: string | null
          submitted_at?: string | null
          tenant_id: string
          transfer_tax?: number | null
          updated_at?: string
        }
        Update: {
          applicant_snapshot?: Json | null
          archived_at?: string | null
          broker_fee?: number | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_object_data?: Json | null
          equity_amount?: number | null
          fixed_rate_period_years?: number | null
          id?: string
          listing_id?: string | null
          loan_amount_requested?: number | null
          max_monthly_rate?: number | null
          modernization_costs?: number | null
          notary_costs?: number | null
          object_address?: string | null
          object_construction_year?: number | null
          object_equipment_level?: string | null
          object_land_area_sqm?: number | null
          object_living_area_sqm?: number | null
          object_location_quality?: string | null
          object_source?: string | null
          object_type?: string | null
          property_id?: string | null
          public_id?: string | null
          purchase_price?: number | null
          purpose?: string | null
          repayment_rate_percent?: number | null
          source?: string
          status?: string
          storage_folder_id?: string | null
          submitted_at?: string | null
          tenant_id?: string
          transfer_tax?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_storage_folder_id_fkey"
            columns: ["storage_folder_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_submission_logs: {
        Row: {
          bank_contact_id: string | null
          channel: string
          conditions_offered: Json | null
          created_at: string
          created_by: string | null
          email_body: string | null
          email_subject: string | null
          external_software_name: string | null
          finance_request_id: string
          id: string
          is_selected: boolean
          response_received_at: string | null
          status: string
          submitted_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_contact_id?: string | null
          channel?: string
          conditions_offered?: Json | null
          created_at?: string
          created_by?: string | null
          email_body?: string | null
          email_subject?: string | null
          external_software_name?: string | null
          finance_request_id: string
          id?: string
          is_selected?: boolean
          response_received_at?: string | null
          status?: string
          submitted_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_contact_id?: string | null
          channel?: string
          conditions_offered?: Json | null
          created_at?: string
          created_by?: string | null
          email_body?: string | null
          email_subject?: string | null
          external_software_name?: string | null
          finance_request_id?: string
          id?: string
          is_selected?: boolean
          response_received_at?: string | null
          status?: string
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_submission_logs_bank_contact_id_fkey"
            columns: ["bank_contact_id"]
            isOneToOne: false
            referencedRelation: "finance_bank_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_submission_logs_finance_request_id_fkey"
            columns: ["finance_request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_submission_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finapi_connections: {
        Row: {
          auto_match: boolean | null
          bank_bic: string | null
          bank_name: string | null
          created_at: string
          error_message: string | null
          finapi_connection_id: string | null
          finapi_user_id: string | null
          finapi_user_password: string | null
          iban_masked: string | null
          id: string
          last_sync_at: string | null
          last_sync_transactions: number | null
          status: string
          sync_from_date: string | null
          tenant_id: string
          updated_at: string
          web_form_id: string | null
        }
        Insert: {
          auto_match?: boolean | null
          bank_bic?: string | null
          bank_name?: string | null
          created_at?: string
          error_message?: string | null
          finapi_connection_id?: string | null
          finapi_user_id?: string | null
          finapi_user_password?: string | null
          iban_masked?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_transactions?: number | null
          status?: string
          sync_from_date?: string | null
          tenant_id: string
          updated_at?: string
          web_form_id?: string | null
        }
        Update: {
          auto_match?: boolean | null
          bank_bic?: string | null
          bank_name?: string | null
          created_at?: string
          error_message?: string | null
          finapi_connection_id?: string | null
          finapi_user_id?: string | null
          finapi_user_password?: string | null
          iban_masked?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_transactions?: number | null
          status?: string
          sync_from_date?: string | null
          tenant_id?: string
          updated_at?: string
          web_form_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finapi_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finapi_depot_accounts: {
        Row: {
          account_name: string | null
          bank_name: string | null
          connection_id: string | null
          created_at: string
          depot_number: string | null
          finapi_account_id: string | null
          id: string
          person_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          bank_name?: string | null
          connection_id?: string | null
          created_at?: string
          depot_number?: string | null
          finapi_account_id?: string | null
          id?: string
          person_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          bank_name?: string | null
          connection_id?: string | null
          created_at?: string
          depot_number?: string | null
          finapi_account_id?: string | null
          id?: string
          person_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finapi_depot_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "finapi_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finapi_depot_accounts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "household_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finapi_depot_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finapi_depot_positions: {
        Row: {
          currency: string
          current_quote: number | null
          current_value: number | null
          depot_account_id: string
          entry_quote: number | null
          finapi_security_id: string | null
          id: string
          isin: string | null
          last_updated: string | null
          name: string | null
          profit_or_loss: number | null
          purchase_value: number | null
          quantity: number | null
          quantity_nominal: number | null
          tenant_id: string
          wkn: string | null
        }
        Insert: {
          currency?: string
          current_quote?: number | null
          current_value?: number | null
          depot_account_id: string
          entry_quote?: number | null
          finapi_security_id?: string | null
          id?: string
          isin?: string | null
          last_updated?: string | null
          name?: string | null
          profit_or_loss?: number | null
          purchase_value?: number | null
          quantity?: number | null
          quantity_nominal?: number | null
          tenant_id: string
          wkn?: string | null
        }
        Update: {
          currency?: string
          current_quote?: number | null
          current_value?: number | null
          depot_account_id?: string
          entry_quote?: number | null
          finapi_security_id?: string | null
          id?: string
          isin?: string | null
          last_updated?: string | null
          name?: string | null
          profit_or_loss?: number | null
          purchase_value?: number | null
          quantity?: number | null
          quantity_nominal?: number | null
          tenant_id?: string
          wkn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finapi_depot_positions_depot_account_id_fkey"
            columns: ["depot_account_id"]
            isOneToOne: false
            referencedRelation: "finapi_depot_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finapi_depot_positions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finapi_transactions: {
        Row: {
          amount: number
          bank_booking_key: string | null
          booking_date: string
          connection_id: string
          counterpart_iban: string | null
          counterpart_name: string | null
          created_at: string
          currency: string | null
          finapi_transaction_id: string | null
          id: string
          match_category: string | null
          match_confidence: number | null
          match_rule_code: string | null
          match_status: string | null
          matched_at: string | null
          matched_by: string | null
          matched_contract_id: string | null
          matched_contract_type: string | null
          purpose: string | null
          tenant_id: string
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_booking_key?: string | null
          booking_date: string
          connection_id: string
          counterpart_iban?: string | null
          counterpart_name?: string | null
          created_at?: string
          currency?: string | null
          finapi_transaction_id?: string | null
          id?: string
          match_category?: string | null
          match_confidence?: number | null
          match_rule_code?: string | null
          match_status?: string | null
          matched_at?: string | null
          matched_by?: string | null
          matched_contract_id?: string | null
          matched_contract_type?: string | null
          purpose?: string | null
          tenant_id: string
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_booking_key?: string | null
          booking_date?: string
          connection_id?: string
          counterpart_iban?: string | null
          counterpart_name?: string | null
          created_at?: string
          currency?: string | null
          finapi_transaction_id?: string | null
          id?: string
          match_category?: string | null
          match_confidence?: number | null
          match_rule_code?: string | null
          match_status?: string | null
          matched_at?: string | null
          matched_by?: string | null
          matched_contract_id?: string | null
          matched_contract_type?: string | null
          purpose?: string | null
          tenant_id?: string
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finapi_transactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "finapi_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finapi_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fortbildung_curated_items: {
        Row: {
          affiliate_link: string
          author_or_channel: string | null
          created_at: string
          description: string | null
          duration_text: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price_text: string | null
          provider: string
          rating_text: string | null
          sort_order: number
          tab: string
          title: string
          topic: string
        }
        Insert: {
          affiliate_link: string
          author_or_channel?: string | null
          created_at?: string
          description?: string | null
          duration_text?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_text?: string | null
          provider: string
          rating_text?: string | null
          sort_order?: number
          tab: string
          title: string
          topic: string
        }
        Update: {
          affiliate_link?: string
          author_or_channel?: string | null
          created_at?: string
          description?: string | null
          duration_text?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_text?: string | null
          provider?: string
          rating_text?: string | null
          sort_order?: number
          tab?: string
          title?: string
          topic?: string
        }
        Relationships: []
      }
      fortbildung_search_logs: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number | null
          tab: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          tab: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          tab?: string
        }
        Relationships: []
      }
      future_room_cases: {
        Row: {
          bank_response: string | null
          created_at: string
          finance_mandate_id: string
          first_action_at: string | null
          id: string
          manager_tenant_id: string
          notes: string | null
          status: string
          submission_channel: string | null
          submission_status: string | null
          submitted_to_bank_at: string | null
          target_bank_id: string | null
          updated_at: string
        }
        Insert: {
          bank_response?: string | null
          created_at?: string
          finance_mandate_id: string
          first_action_at?: string | null
          id?: string
          manager_tenant_id: string
          notes?: string | null
          status?: string
          submission_channel?: string | null
          submission_status?: string | null
          submitted_to_bank_at?: string | null
          target_bank_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_response?: string | null
          created_at?: string
          finance_mandate_id?: string
          first_action_at?: string | null
          id?: string
          manager_tenant_id?: string
          notes?: string | null
          status?: string
          submission_channel?: string | null
          submission_status?: string | null
          submitted_to_bank_at?: string | null
          target_bank_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "future_room_cases_finance_mandate_id_fkey"
            columns: ["finance_mandate_id"]
            isOneToOne: true
            referencedRelation: "finance_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "future_room_cases_manager_tenant_id_fkey"
            columns: ["manager_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_contracts: {
        Row: {
          accepted_terms_at: string | null
          cancelled_at: string | null
          content_responsibility_confirmed: boolean
          created_at: string
          credits_charged: number
          currency: string
          id: string
          plan: string
          price_cents: number
          status: string
          tenant_id: string
          updated_at: string
          website_id: string
        }
        Insert: {
          accepted_terms_at?: string | null
          cancelled_at?: string | null
          content_responsibility_confirmed?: boolean
          created_at?: string
          credits_charged?: number
          currency?: string
          id?: string
          plan?: string
          price_cents?: number
          status?: string
          tenant_id: string
          updated_at?: string
          website_id: string
        }
        Update: {
          accepted_terms_at?: string | null
          cancelled_at?: string | null
          content_responsibility_confirmed?: boolean
          created_at?: string
          credits_charged?: number
          currency?: string
          id?: string
          plan?: string
          price_cents?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hosting_contracts_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      household_persons: {
        Row: {
          avatar_url: string | null
          besoldungsgruppe: string | null
          birth_date: string | null
          business_income_monthly: number | null
          child_allowances: number | null
          city: string | null
          created_at: string
          dienstherr: string | null
          email: string | null
          employer_name: string | null
          employment_status: string | null
          erfahrungsstufe: number | null
          first_name: string
          gross_income_monthly: number | null
          house_number: string | null
          id: string
          is_primary: boolean
          last_name: string
          marital_status: string | null
          net_income_monthly: number | null
          net_income_range: string | null
          other_income_monthly: number | null
          phone: string | null
          phone_landline: string | null
          planned_retirement_date: string | null
          pv_income_monthly: number | null
          role: string
          ruhegehaltfaehige_dienstjahre: number | null
          ruhegehaltfaehiges_grundgehalt: number | null
          salutation: string | null
          sort_order: number
          street: string | null
          tax_class: string | null
          tenant_id: string
          updated_at: string
          user_id: string
          verbeamtung_date: string | null
          zip: string | null
        }
        Insert: {
          avatar_url?: string | null
          besoldungsgruppe?: string | null
          birth_date?: string | null
          business_income_monthly?: number | null
          child_allowances?: number | null
          city?: string | null
          created_at?: string
          dienstherr?: string | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          erfahrungsstufe?: number | null
          first_name?: string
          gross_income_monthly?: number | null
          house_number?: string | null
          id?: string
          is_primary?: boolean
          last_name?: string
          marital_status?: string | null
          net_income_monthly?: number | null
          net_income_range?: string | null
          other_income_monthly?: number | null
          phone?: string | null
          phone_landline?: string | null
          planned_retirement_date?: string | null
          pv_income_monthly?: number | null
          role?: string
          ruhegehaltfaehige_dienstjahre?: number | null
          ruhegehaltfaehiges_grundgehalt?: number | null
          salutation?: string | null
          sort_order?: number
          street?: string | null
          tax_class?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
          verbeamtung_date?: string | null
          zip?: string | null
        }
        Update: {
          avatar_url?: string | null
          besoldungsgruppe?: string | null
          birth_date?: string | null
          business_income_monthly?: number | null
          child_allowances?: number | null
          city?: string | null
          created_at?: string
          dienstherr?: string | null
          email?: string | null
          employer_name?: string | null
          employment_status?: string | null
          erfahrungsstufe?: number | null
          first_name?: string
          gross_income_monthly?: number | null
          house_number?: string | null
          id?: string
          is_primary?: boolean
          last_name?: string
          marital_status?: string | null
          net_income_monthly?: number | null
          net_income_range?: string | null
          other_income_monthly?: number | null
          phone?: string | null
          phone_landline?: string | null
          planned_retirement_date?: string | null
          pv_income_monthly?: number | null
          role?: string
          ruhegehaltfaehige_dienstjahre?: number | null
          ruhegehaltfaehiges_grundgehalt?: number | null
          salutation?: string | null
          sort_order?: number
          street?: string | null
          tax_class?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          verbeamtung_date?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_persons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_attachments: {
        Row: {
          created_at: string
          document_id: string | null
          filename: string
          id: string
          inbound_email_id: string
          is_pdf: boolean
          mime_type: string
          size_bytes: number | null
          storage_path: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          filename: string
          id?: string
          inbound_email_id: string
          is_pdf?: boolean
          mime_type?: string
          size_bytes?: number | null
          storage_path?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          filename?: string
          id?: string
          inbound_email_id?: string
          is_pdf?: boolean
          mime_type?: string
          size_bytes?: number | null
          storage_path?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_attachments_inbound_email_id_fkey"
            columns: ["inbound_email_id"]
            isOneToOne: false
            referencedRelation: "inbound_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_emails: {
        Row: {
          attachment_count: number
          created_at: string
          error_message: string | null
          from_email: string
          id: string
          mailbox_id: string
          pdf_count: number
          provider: string
          provider_email_id: string
          received_at: string
          status: string
          subject: string | null
          tenant_id: string
          to_email: string
        }
        Insert: {
          attachment_count?: number
          created_at?: string
          error_message?: string | null
          from_email: string
          id?: string
          mailbox_id: string
          pdf_count?: number
          provider?: string
          provider_email_id: string
          received_at?: string
          status?: string
          subject?: string | null
          tenant_id: string
          to_email: string
        }
        Update: {
          attachment_count?: number
          created_at?: string
          error_message?: string | null
          from_email?: string
          id?: string
          mailbox_id?: string
          pdf_count?: number
          provider?: string
          provider_email_id?: string
          received_at?: string
          status?: string
          subject?: string | null
          tenant_id?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "inbound_mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_emails_tenant_id_fkey"
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
          mandate_id: string | null
          metadata: Json
          mime_type: string | null
          notes: string | null
          processed_at: string | null
          recipient_info: Json
          routed_to_zone2_at: string | null
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
          mandate_id?: string | null
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          processed_at?: string | null
          recipient_info?: Json
          routed_to_zone2_at?: string | null
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
          mandate_id?: string | null
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          processed_at?: string | null
          recipient_info?: Json
          routed_to_zone2_at?: string | null
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
          {
            foreignKeyName: "inbound_items_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "postservice_mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_mailboxes: {
        Row: {
          address_domain: string
          address_local_part: string
          created_at: string
          id: string
          is_active: boolean
          provider: string
          tenant_id: string
        }
        Insert: {
          address_domain?: string
          address_local_part: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          tenant_id: string
        }
        Update: {
          address_domain?: string
          address_local_part?: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_mailboxes_tenant_id_fkey"
            columns: ["tenant_id"]
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
          mandate_id: string | null
          match_conditions: Json
          name: string
          priority: number
          target_module: string | null
          target_tenant_id: string | null
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
          mandate_id?: string | null
          match_conditions?: Json
          name: string
          priority?: number
          target_module?: string | null
          target_tenant_id?: string | null
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
          mandate_id?: string | null
          match_conditions?: Json
          name?: string
          priority?: number
          target_module?: string | null
          target_tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_routing_rules_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "postservice_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_routing_rules_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_sort_containers: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_enabled: boolean
          name: string
          property_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          property_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          property_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_sort_containers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_sort_containers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_sort_rules: {
        Row: {
          container_id: string
          created_at: string
          field: string
          id: string
          keywords_json: Json
          operator: string
          tenant_id: string
        }
        Insert: {
          container_id: string
          created_at?: string
          field: string
          id?: string
          keywords_json?: Json
          operator?: string
          tenant_id: string
        }
        Update: {
          container_id?: string
          created_at?: string
          field?: string
          id?: string
          keywords_json?: Json
          operator?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_sort_rules_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "inbox_sort_containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_sort_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_contract_links: {
        Row: {
          contract_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_contract_links_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "insurance_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_contracts: {
        Row: {
          cancellation_deadline: string | null
          category: Database["public"]["Enums"]["insurance_category"]
          created_at: string
          details: Json | null
          end_date: string | null
          id: string
          insurer: string | null
          notes: string | null
          payment_interval:
            | Database["public"]["Enums"]["payment_interval"]
            | null
          policy_no: string | null
          policyholder: string | null
          premium: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["insurance_status"] | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_deadline?: string | null
          category: Database["public"]["Enums"]["insurance_category"]
          created_at?: string
          details?: Json | null
          end_date?: string | null
          id?: string
          insurer?: string | null
          notes?: string | null
          payment_interval?:
            | Database["public"]["Enums"]["payment_interval"]
            | null
          policy_no?: string | null
          policyholder?: string | null
          premium?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["insurance_status"] | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_deadline?: string | null
          category?: Database["public"]["Enums"]["insurance_category"]
          created_at?: string
          details?: Json | null
          end_date?: string | null
          id?: string
          insurer?: string | null
          notes?: string | null
          payment_interval?:
            | Database["public"]["Enums"]["payment_interval"]
            | null
          policy_no?: string | null
          policyholder?: string | null
          premium?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["insurance_status"] | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_registry: {
        Row: {
          auth_type: string | null
          base_url: string | null
          caching_policy_min: number | null
          code: string
          config_schema: Json
          cost_hint: string | null
          cost_model: string | null
          created_at: string
          created_by: string | null
          data_scope: string | null
          default_config: Json
          description: string | null
          documentation_url: string | null
          guardrails: string | null
          id: string
          last_reviewed_at: string | null
          name: string
          owner: string | null
          public_id: string
          rate_limit_notes: string | null
          risks: string | null
          status: Database["public"]["Enums"]["integration_status"]
          tenant_id: string | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
          version: string
          widget_code: string | null
        }
        Insert: {
          auth_type?: string | null
          base_url?: string | null
          caching_policy_min?: number | null
          code: string
          config_schema?: Json
          cost_hint?: string | null
          cost_model?: string | null
          created_at?: string
          created_by?: string | null
          data_scope?: string | null
          default_config?: Json
          description?: string | null
          documentation_url?: string | null
          guardrails?: string | null
          id?: string
          last_reviewed_at?: string | null
          name: string
          owner?: string | null
          public_id: string
          rate_limit_notes?: string | null
          risks?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id?: string | null
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          version?: string
          widget_code?: string | null
        }
        Update: {
          auth_type?: string | null
          base_url?: string | null
          caching_policy_min?: number | null
          code?: string
          config_schema?: Json
          cost_hint?: string | null
          cost_model?: string | null
          created_at?: string
          created_by?: string | null
          data_scope?: string | null
          default_config?: Json
          description?: string | null
          documentation_url?: string | null
          guardrails?: string | null
          id?: string
          last_reviewed_at?: string | null
          name?: string
          owner?: string | null
          public_id?: string
          rate_limit_notes?: string | null
          risks?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
          version?: string
          widget_code?: string | null
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
          calculated_burden: number | null
          created_at: string | null
          external_listing_id: string | null
          external_listing_url: string | null
          id: string
          investment_profile_id: string
          listing_id: string | null
          location: string | null
          notes: string | null
          price: number | null
          property_data: Json | null
          search_params: Json | null
          source: string | null
          status: string | null
          synced_at: string | null
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          calculated_burden?: number | null
          created_at?: string | null
          external_listing_id?: string | null
          external_listing_url?: string | null
          id?: string
          investment_profile_id: string
          listing_id?: string | null
          location?: string | null
          notes?: string | null
          price?: number | null
          property_data?: Json | null
          search_params?: Json | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          calculated_burden?: number | null
          created_at?: string | null
          external_listing_id?: string | null
          external_listing_url?: string | null
          id?: string
          investment_profile_id?: string
          listing_id?: string | null
          location?: string | null
          notes?: string | null
          price?: number | null
          property_data?: Json | null
          search_params?: Json | null
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
            foreignKeyName: "investment_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
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
      invoice_extractions: {
        Row: {
          ai_raw_response: Json | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          currency: string | null
          document_id: string | null
          due_date: string | null
          extractor_version: string | null
          iban: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          match_confidence: number | null
          match_method: string | null
          match_status: string
          matched_at: string | null
          matched_by: string | null
          nk_cost_category: string | null
          property_id: string | null
          purpose: string | null
          tenant_id: string
          total_gross: number | null
          total_net: number | null
          unit_id: string | null
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
          vendor_address: string | null
          vendor_name: string | null
        }
        Insert: {
          ai_raw_response?: Json | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          currency?: string | null
          document_id?: string | null
          due_date?: string | null
          extractor_version?: string | null
          iban?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          match_confidence?: number | null
          match_method?: string | null
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          nk_cost_category?: string | null
          property_id?: string | null
          purpose?: string | null
          tenant_id: string
          total_gross?: number | null
          total_net?: number | null
          unit_id?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          vendor_address?: string | null
          vendor_name?: string | null
        }
        Update: {
          ai_raw_response?: Json | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          currency?: string | null
          document_id?: string | null
          due_date?: string | null
          extractor_version?: string | null
          iban?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          match_confidence?: number | null
          match_method?: string | null
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          nk_cost_category?: string | null
          property_id?: string | null
          purpose?: string | null
          tenant_id?: string
          total_gross?: number | null
          total_net?: number | null
          unit_id?: string | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
          vendor_address?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_extractions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_extractions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_extractions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      ki_browser_artifacts: {
        Row: {
          artifact_type: string
          content_hash: string | null
          created_at: string
          id: string
          meta_json: Json | null
          session_id: string
          step_id: string | null
          storage_ref: string | null
        }
        Insert: {
          artifact_type: string
          content_hash?: string | null
          created_at?: string
          id?: string
          meta_json?: Json | null
          session_id: string
          step_id?: string | null
          storage_ref?: string | null
        }
        Update: {
          artifact_type?: string
          content_hash?: string | null
          created_at?: string
          id?: string
          meta_json?: Json | null
          session_id?: string
          step_id?: string | null
          storage_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ki_browser_artifacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ki_browser_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ki_browser_artifacts_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "ki_browser_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      ki_browser_domain_rules: {
        Row: {
          created_at: string
          id: string
          pattern: string
          policy_id: string
          reason: string | null
          rule_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          pattern: string
          policy_id: string
          reason?: string | null
          rule_type: string
        }
        Update: {
          created_at?: string
          id?: string
          pattern?: string
          policy_id?: string
          reason?: string | null
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ki_browser_domain_rules_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "ki_browser_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      ki_browser_policies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          json_rules: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          json_rules?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          json_rules?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ki_browser_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          max_steps: number
          policy_profile_id: string | null
          purpose: string | null
          status: string
          step_count: number
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          max_steps?: number
          policy_profile_id?: string | null
          purpose?: string | null
          status?: string
          step_count?: number
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          max_steps?: number
          policy_profile_id?: string | null
          purpose?: string | null
          status?: string
          step_count?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ki_browser_sessions_policy_profile_id_fkey"
            columns: ["policy_profile_id"]
            isOneToOne: false
            referencedRelation: "ki_browser_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ki_browser_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ki_browser_steps: {
        Row: {
          approved_by: string | null
          blocked_reason: string | null
          created_at: string
          duration_ms: number | null
          id: string
          kind: string
          payload_json: Json | null
          proposed_by: string | null
          rationale: string | null
          result_json: Json | null
          risk_level: string
          session_id: string
          status: string
          step_number: number
          url_after: string | null
          url_before: string | null
        }
        Insert: {
          approved_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          kind: string
          payload_json?: Json | null
          proposed_by?: string | null
          rationale?: string | null
          result_json?: Json | null
          risk_level?: string
          session_id: string
          status?: string
          step_number: number
          url_after?: string | null
          url_before?: string | null
        }
        Update: {
          approved_by?: string | null
          blocked_reason?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          kind?: string
          payload_json?: Json | null
          proposed_by?: string | null
          rationale?: string | null
          result_json?: Json | null
          risk_level?: string
          session_id?: string
          status?: string
          step_number?: number
          url_after?: string | null
          url_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ki_browser_steps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ki_browser_sessions"
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
      kv_contracts: {
        Row: {
          chief_physician: boolean | null
          contract_start: string | null
          contribution_rate: string | null
          created_at: string
          daily_sickness_benefit: number | null
          deductible: number | null
          deductible_reduction_from_67: boolean | null
          dental_prosthetics_percent: number | null
          employer_contribution: number | null
          family_insured_children: number | null
          gross_income: number | null
          id: string
          ihl_alternative_medicine: boolean | null
          ihl_hearing_aid_budget: number | null
          ihl_inpatient_percent: number | null
          ihl_outpatient_percent: number | null
          ihl_psychotherapy_sessions: number | null
          ihl_rehabilitation: string | null
          ihl_vision_aid_budget: number | null
          income_threshold: number | null
          insurance_number: string | null
          insured_until_age: number | null
          insured_via_person_name: string | null
          kv_type: string
          monthly_premium: number | null
          notes: string | null
          person_id: string
          person_name: string
          premium_adjustments: Json | null
          provider: string
          sick_pay_from_day: number | null
          single_room: boolean | null
          tariff_name: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          chief_physician?: boolean | null
          contract_start?: string | null
          contribution_rate?: string | null
          created_at?: string
          daily_sickness_benefit?: number | null
          deductible?: number | null
          deductible_reduction_from_67?: boolean | null
          dental_prosthetics_percent?: number | null
          employer_contribution?: number | null
          family_insured_children?: number | null
          gross_income?: number | null
          id?: string
          ihl_alternative_medicine?: boolean | null
          ihl_hearing_aid_budget?: number | null
          ihl_inpatient_percent?: number | null
          ihl_outpatient_percent?: number | null
          ihl_psychotherapy_sessions?: number | null
          ihl_rehabilitation?: string | null
          ihl_vision_aid_budget?: number | null
          income_threshold?: number | null
          insurance_number?: string | null
          insured_until_age?: number | null
          insured_via_person_name?: string | null
          kv_type: string
          monthly_premium?: number | null
          notes?: string | null
          person_id: string
          person_name: string
          premium_adjustments?: Json | null
          provider: string
          sick_pay_from_day?: number | null
          single_room?: boolean | null
          tariff_name?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          chief_physician?: boolean | null
          contract_start?: string | null
          contribution_rate?: string | null
          created_at?: string
          daily_sickness_benefit?: number | null
          deductible?: number | null
          deductible_reduction_from_67?: boolean | null
          dental_prosthetics_percent?: number | null
          employer_contribution?: number | null
          family_insured_children?: number | null
          gross_income?: number | null
          id?: string
          ihl_alternative_medicine?: boolean | null
          ihl_hearing_aid_budget?: number | null
          ihl_inpatient_percent?: number | null
          ihl_outpatient_percent?: number | null
          ihl_psychotherapy_sessions?: number | null
          ihl_rehabilitation?: string | null
          ihl_vision_aid_budget?: number | null
          income_threshold?: number | null
          insurance_number?: string | null
          insured_until_age?: number | null
          insured_via_person_name?: string | null
          kv_type?: string
          monthly_premium?: number | null
          notes?: string | null
          person_id?: string
          person_name?: string
          premium_adjustments?: Json | null
          provider?: string
          sick_pay_from_day?: number | null
          single_room?: boolean | null
          tariff_name?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kv_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          about_text: string | null
          advisor_ids: string[] | null
          booked_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          developer_website_url: string | null
          domain_status: string | null
          footer_address: string | null
          footer_company_name: string | null
          hero_headline: string | null
          hero_subheadline: string | null
          highlights_json: Json | null
          id: string
          imprint_text: string | null
          location_description: string | null
          locked_at: string | null
          organization_id: string
          preview_expires_at: string | null
          privacy_text: string | null
          project_id: string
          published_at: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          about_text?: string | null
          advisor_ids?: string[] | null
          booked_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          developer_website_url?: string | null
          domain_status?: string | null
          footer_address?: string | null
          footer_company_name?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          highlights_json?: Json | null
          id?: string
          imprint_text?: string | null
          location_description?: string | null
          locked_at?: string | null
          organization_id: string
          preview_expires_at?: string | null
          privacy_text?: string | null
          project_id: string
          published_at?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          about_text?: string | null
          advisor_ids?: string[] | null
          booked_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          developer_website_url?: string | null
          domain_status?: string | null
          footer_address?: string | null
          footer_company_name?: string | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          highlights_json?: Json | null
          id?: string
          imprint_text?: string | null
          location_description?: string | null
          locked_at?: string | null
          organization_id?: string
          preview_expires_at?: string | null
          privacy_text?: string | null
          project_id?: string
          published_at?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_contexts: {
        Row: {
          child_allowance: boolean | null
          children_count: number | null
          church_tax: boolean | null
          church_tax_rate: number | null
          city: string | null
          context_type: string
          country: string | null
          created_at: string
          house_number: string | null
          hrb_number: string | null
          id: string
          is_default: boolean | null
          legal_form: string | null
          managing_director: string | null
          marginal_tax_rate: number | null
          md_first_name: string | null
          md_last_name: string | null
          md_salutation: string | null
          name: string
          notes: string | null
          postal_code: string | null
          public_id: string
          registry_court: string | null
          solidarity_surcharge: boolean | null
          street: string | null
          tax_assessment_type: string | null
          tax_number: string | null
          tax_rate_percent: number | null
          tax_regime: string | null
          taxable_income_yearly: number | null
          tenant_id: string
          updated_at: string
          ust_id: string | null
        }
        Insert: {
          child_allowance?: boolean | null
          children_count?: number | null
          church_tax?: boolean | null
          church_tax_rate?: number | null
          city?: string | null
          context_type?: string
          country?: string | null
          created_at?: string
          house_number?: string | null
          hrb_number?: string | null
          id?: string
          is_default?: boolean | null
          legal_form?: string | null
          managing_director?: string | null
          marginal_tax_rate?: number | null
          md_first_name?: string | null
          md_last_name?: string | null
          md_salutation?: string | null
          name: string
          notes?: string | null
          postal_code?: string | null
          public_id?: string
          registry_court?: string | null
          solidarity_surcharge?: boolean | null
          street?: string | null
          tax_assessment_type?: string | null
          tax_number?: string | null
          tax_rate_percent?: number | null
          tax_regime?: string | null
          taxable_income_yearly?: number | null
          tenant_id: string
          updated_at?: string
          ust_id?: string | null
        }
        Update: {
          child_allowance?: boolean | null
          children_count?: number | null
          church_tax?: boolean | null
          church_tax_rate?: number | null
          city?: string | null
          context_type?: string
          country?: string | null
          created_at?: string
          house_number?: string | null
          hrb_number?: string | null
          id?: string
          is_default?: boolean | null
          legal_form?: string | null
          managing_director?: string | null
          marginal_tax_rate?: number | null
          md_first_name?: string | null
          md_last_name?: string | null
          md_salutation?: string | null
          name?: string
          notes?: string | null
          postal_code?: string | null
          public_id?: string
          registry_court?: string | null
          solidarity_surcharge?: boolean | null
          street?: string | null
          tax_assessment_type?: string | null
          tax_number?: string | null
          tax_rate_percent?: number | null
          tax_regime?: string | null
          taxable_income_yearly?: number | null
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "lead_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
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
          deleted_at: string | null
          id: string
          interest_type: string | null
          notes: string | null
          property_interest_id: string | null
          public_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          source_campaign_id: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tenant_id: string
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
          deleted_at?: string | null
          id?: string
          interest_type?: string | null
          notes?: string | null
          property_interest_id?: string | null
          public_id?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          source_campaign_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tenant_id: string
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
          deleted_at?: string | null
          id?: string
          interest_type?: string | null
          notes?: string | null
          property_interest_id?: string | null
          public_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_campaign_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tenant_id?: string
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
          auto_match_enabled: boolean | null
          created_at: string
          deposit_amount: number | null
          deposit_amount_eur: number | null
          deposit_status: string | null
          end_date: string | null
          heating_advance_eur: number | null
          id: string
          index_base_month: string | null
          last_rent_adjustment_date: string | null
          last_rent_increase_at: string | null
          lease_type: string | null
          linked_bank_account_id: string | null
          monthly_rent: number
          next_rent_adjustment_earliest_date: string | null
          nk_advance_eur: number | null
          notice_date: string | null
          number_of_occupants: number
          payment_due_day: number | null
          public_id: string | null
          rent_cold_eur: number | null
          rent_increase: string | null
          rent_increase_cycle_months: number | null
          rent_model: string | null
          renter_org_id: string | null
          staffel_schedule: Json | null
          start_date: string
          status: string
          tenant_contact_id: string
          tenant_id: string
          tenant_since: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          auto_match_enabled?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          deposit_amount_eur?: number | null
          deposit_status?: string | null
          end_date?: string | null
          heating_advance_eur?: number | null
          id?: string
          index_base_month?: string | null
          last_rent_adjustment_date?: string | null
          last_rent_increase_at?: string | null
          lease_type?: string | null
          linked_bank_account_id?: string | null
          monthly_rent: number
          next_rent_adjustment_earliest_date?: string | null
          nk_advance_eur?: number | null
          notice_date?: string | null
          number_of_occupants?: number
          payment_due_day?: number | null
          public_id?: string | null
          rent_cold_eur?: number | null
          rent_increase?: string | null
          rent_increase_cycle_months?: number | null
          rent_model?: string | null
          renter_org_id?: string | null
          staffel_schedule?: Json | null
          start_date: string
          status?: string
          tenant_contact_id: string
          tenant_id: string
          tenant_since?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          auto_match_enabled?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          deposit_amount_eur?: number | null
          deposit_status?: string | null
          end_date?: string | null
          heating_advance_eur?: number | null
          id?: string
          index_base_month?: string | null
          last_rent_adjustment_date?: string | null
          last_rent_increase_at?: string | null
          lease_type?: string | null
          linked_bank_account_id?: string | null
          monthly_rent?: number
          next_rent_adjustment_earliest_date?: string | null
          nk_advance_eur?: number | null
          notice_date?: string | null
          number_of_occupants?: number
          payment_due_day?: number | null
          public_id?: string | null
          rent_cold_eur?: number | null
          rent_increase?: string | null
          rent_increase_cycle_months?: number | null
          rent_model?: string | null
          renter_org_id?: string | null
          staffel_schedule?: Json | null
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
            foreignKeyName: "leases_linked_bank_account_id_fkey"
            columns: ["linked_bank_account_id"]
            isOneToOne: false
            referencedRelation: "msv_bank_accounts"
            referencedColumns: ["id"]
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
      legal_documents: {
        Row: {
          completed_at: string | null
          created_at: string | null
          document_type: string
          form_data: Json | null
          id: string
          is_completed: boolean | null
          notes: string | null
          person_id: string | null
          storage_node_id: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          document_type: string
          form_data?: Json | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          person_id?: string | null
          storage_node_id?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          document_type?: string
          form_data?: Json | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          person_id?: string | null
          storage_node_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "household_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_storage_node_id_fkey"
            columns: ["storage_node_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
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
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
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
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
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
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
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
      listing_views: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          referrer: string | null
          source: string | null
          tenant_id: string
          viewed_at: string
          viewer_ip_hash: string | null
          viewer_session: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          referrer?: string | null
          source?: string | null
          tenant_id: string
          viewed_at?: string
          viewer_ip_hash?: string | null
          viewer_session?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          referrer?: string | null
          source?: string | null
          tenant_id?: string
          viewed_at?: string
          viewer_ip_hash?: string | null
          viewer_session?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_tenant_id_fkey"
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
          is_blocked: boolean | null
          min_price: number | null
          partner_visibility: string | null
          property_id: string
          public_id: string | null
          published_at: string | null
          reserved_at: string | null
          sale_price_fixed: number | null
          sale_price_fixed_at: string | null
          sale_price_fixed_by: string | null
          sales_mandate_consent_id: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          tenant_id: string
          title: string
          unit_id: string | null
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
          is_blocked?: boolean | null
          min_price?: number | null
          partner_visibility?: string | null
          property_id: string
          public_id?: string | null
          published_at?: string | null
          reserved_at?: string | null
          sale_price_fixed?: number | null
          sale_price_fixed_at?: string | null
          sale_price_fixed_by?: string | null
          sales_mandate_consent_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          tenant_id: string
          title: string
          unit_id?: string | null
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
          is_blocked?: boolean | null
          min_price?: number | null
          partner_visibility?: string | null
          property_id?: string
          public_id?: string | null
          published_at?: string | null
          reserved_at?: string | null
          sale_price_fixed?: number | null
          sale_price_fixed_at?: string | null
          sale_price_fixed_by?: string | null
          sales_mandate_consent_id?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          tenant_id?: string
          title?: string
          unit_id?: string | null
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
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          allocated_unit_shares: Json | null
          annuity_monthly_eur: number | null
          bank_name: string
          collateral_refs: Json | null
          contact_person: Json | null
          created_at: string | null
          fixed_interest_end_date: string | null
          id: string
          interest_rate_percent: number | null
          loan_number: string
          maturity_date: string | null
          original_amount: number | null
          outstanding_balance_asof: string | null
          outstanding_balance_eur: number | null
          payment_account_ref: string | null
          property_id: string | null
          public_id: string | null
          repayment_rate_percent: number | null
          scope: string
          special_repayment_right_eur_per_year: number | null
          start_date: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          allocated_unit_shares?: Json | null
          annuity_monthly_eur?: number | null
          bank_name: string
          collateral_refs?: Json | null
          contact_person?: Json | null
          created_at?: string | null
          fixed_interest_end_date?: string | null
          id?: string
          interest_rate_percent?: number | null
          loan_number: string
          maturity_date?: string | null
          original_amount?: number | null
          outstanding_balance_asof?: string | null
          outstanding_balance_eur?: number | null
          payment_account_ref?: string | null
          property_id?: string | null
          public_id?: string | null
          repayment_rate_percent?: number | null
          scope?: string
          special_repayment_right_eur_per_year?: number | null
          start_date?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allocated_unit_shares?: Json | null
          annuity_monthly_eur?: number | null
          bank_name?: string
          collateral_refs?: Json | null
          contact_person?: Json | null
          created_at?: string | null
          fixed_interest_end_date?: string | null
          id?: string
          interest_rate_percent?: number | null
          loan_number?: string
          maturity_date?: string | null
          original_amount?: number | null
          outstanding_balance_asof?: string | null
          outstanding_balance_eur?: number | null
          payment_account_ref?: string | null
          property_id?: string | null
          public_id?: string | null
          repayment_rate_percent?: number | null
          scope?: string
          special_repayment_right_eur_per_year?: number | null
          start_date?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          credentials_vault_key: string | null
          display_name: string | null
          email_address: string
          id: string
          imap_host: string | null
          imap_port: number | null
          last_calendar_sync_at: string | null
          last_contacts_sync_at: string | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          smtp_host: string | null
          smtp_port: number | null
          sync_calendar: boolean
          sync_contacts: boolean
          sync_error: string | null
          sync_mail: boolean
          sync_status: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          credentials_vault_key?: string | null
          display_name?: string | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          last_calendar_sync_at?: string | null
          last_contacts_sync_at?: string | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_calendar?: boolean
          sync_contacts?: boolean
          sync_error?: string | null
          sync_mail?: boolean
          sync_status?: string | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          credentials_vault_key?: string | null
          display_name?: string | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          last_calendar_sync_at?: string | null
          last_contacts_sync_at?: string | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          sync_calendar?: boolean
          sync_contacts?: boolean
          sync_error?: string | null
          sync_mail?: boolean
          sync_status?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_campaign_attachments: {
        Row: {
          campaign_id: string
          created_at: string
          filename: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          filename: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_campaign_attachments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mail_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_campaign_recipients: {
        Row: {
          campaign_id: string
          city: string | null
          company: string | null
          contact_id: string | null
          created_at: string
          delivery_status: string
          email: string
          error: string | null
          first_name: string | null
          id: string
          last_name: string | null
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          city?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string
          delivery_status?: string
          email: string
          error?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          city?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string
          delivery_status?: string
          email?: string
          error?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mail_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_campaigns: {
        Row: {
          body_template: string
          created_at: string
          failed_count: number
          id: string
          include_signature: boolean
          name: string
          org_id: string
          recipients_count: number
          sent_at: string | null
          sent_count: number
          status: string
          subject_template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body_template?: string
          created_at?: string
          failed_count?: number
          id?: string
          include_signature?: boolean
          name?: string
          org_id: string
          recipients_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject_template?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body_template?: string
          created_at?: string
          failed_count?: number
          id?: string
          include_signature?: boolean
          name?: string
          org_id?: string
          recipients_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject_template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_messages: {
        Row: {
          account_id: string
          body_html: string | null
          body_text: string | null
          cc_addresses: Json | null
          created_at: string | null
          folder: string
          from_address: string
          from_name: string | null
          has_attachments: boolean | null
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          message_id: string
          received_at: string
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: Json | null
        }
        Insert: {
          account_id: string
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string | null
          folder?: string
          from_address: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          message_id: string
          received_at: string
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: Json | null
        }
        Update: {
          account_id?: string
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string | null
          folder?: string
          from_address?: string
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          message_id?: string
          received_at?: string
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_applications: {
        Row: {
          applicant_email: string | null
          applicant_name: string | null
          applicant_phone: string | null
          created_at: string
          id: string
          qualification_data: Json | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["membership_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          source_brand: string | null
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          created_at?: string
          id?: string
          qualification_data?: Json | null
          rejection_reason?: string | null
          requested_role: Database["public"]["Enums"]["membership_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_brand?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          created_at?: string
          id?: string
          qualification_data?: Json | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["membership_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_brand?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_expenses: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string
          monthly_amount: number
          notes: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label?: string
          monthly_amount?: number
          notes?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string
          monthly_amount?: number
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_outputs: {
        Row: {
          action_items_json: Json | null
          created_at: string
          decisions_json: Json | null
          id: string
          open_questions_json: Json | null
          session_id: string
          summary_md: string | null
        }
        Insert: {
          action_items_json?: Json | null
          created_at?: string
          decisions_json?: Json | null
          id?: string
          open_questions_json?: Json | null
          session_id: string
          summary_md?: string | null
        }
        Update: {
          action_items_json?: Json | null
          created_at?: string
          decisions_json?: Json | null
          id?: string
          open_questions_json?: Json | null
          session_id?: string
          summary_md?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_outputs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "meeting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_sessions: {
        Row: {
          consent_confirmed: boolean
          created_at: string
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          stt_engine_used: string | null
          tenant_id: string
          title: string
          total_duration_sec: number | null
          user_id: string
        }
        Insert: {
          consent_confirmed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stt_engine_used?: string | null
          tenant_id: string
          title?: string
          total_duration_sec?: number | null
          user_id: string
        }
        Update: {
          consent_confirmed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stt_engine_used?: string | null
          tenant_id?: string
          title?: string
          total_duration_sec?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcript_chunks: {
        Row: {
          created_at: string
          engine_source: string
          id: string
          seq: number
          session_id: string
          text: string
        }
        Insert: {
          created_at?: string
          engine_source?: string
          id?: string
          seq?: number
          session_id: string
          text?: string
        }
        Update: {
          created_at?: string
          engine_source?: string
          id?: string
          seq?: number
          session_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcript_chunks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "meeting_sessions"
            referencedColumns: ["id"]
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
      meters: {
        Row: {
          created_at: string | null
          id: string
          meter_type: string
          property_id: string | null
          readings: Json | null
          scope: string
          serial_no: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meter_type: string
          property_id?: string | null
          readings?: Json | null
          scope?: string
          serial_no?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meter_type?: string
          property_id?: string | null
          readings?: Json | null
          scope?: string
          serial_no?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      miety_contracts: {
        Row: {
          cancellation_date: string | null
          category: string
          contract_number: string | null
          created_at: string
          end_date: string | null
          home_id: string
          id: string
          monthly_cost: number | null
          notes: string | null
          provider_name: string | null
          start_date: string | null
          tenant_id: string
        }
        Insert: {
          cancellation_date?: string | null
          category?: string
          contract_number?: string | null
          created_at?: string
          end_date?: string | null
          home_id: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          provider_name?: string | null
          start_date?: string | null
          tenant_id: string
        }
        Update: {
          cancellation_date?: string | null
          category?: string
          contract_number?: string | null
          created_at?: string
          end_date?: string | null
          home_id?: string
          id?: string
          monthly_cost?: number | null
          notes?: string | null
          provider_name?: string | null
          start_date?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miety_contracts_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "miety_homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miety_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      miety_eufy_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          tenant_id: string
          token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          tenant_id: string
          token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          tenant_id?: string
          token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miety_eufy_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      miety_homes: {
        Row: {
          address: string | null
          address_house_no: string | null
          area_sqm: number | null
          bathrooms_count: number | null
          city: string | null
          construction_year: number | null
          created_at: string
          floor_count: number | null
          has_basement: boolean
          has_garage: boolean
          has_garden: boolean
          heating_type: string | null
          id: string
          last_renovation_year: number | null
          market_value: number | null
          move_in_date: string | null
          name: string
          notes: string | null
          ownership_type: string
          plot_area_sqm: number | null
          property_type: string
          rooms_count: number | null
          tenant_id: string
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          address_house_no?: string | null
          area_sqm?: number | null
          bathrooms_count?: number | null
          city?: string | null
          construction_year?: number | null
          created_at?: string
          floor_count?: number | null
          has_basement?: boolean
          has_garage?: boolean
          has_garden?: boolean
          heating_type?: string | null
          id?: string
          last_renovation_year?: number | null
          market_value?: number | null
          move_in_date?: string | null
          name?: string
          notes?: string | null
          ownership_type?: string
          plot_area_sqm?: number | null
          property_type?: string
          rooms_count?: number | null
          tenant_id: string
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          address_house_no?: string | null
          area_sqm?: number | null
          bathrooms_count?: number | null
          city?: string | null
          construction_year?: number | null
          created_at?: string
          floor_count?: number | null
          has_basement?: boolean
          has_garage?: boolean
          has_garden?: boolean
          heating_type?: string | null
          id?: string
          last_renovation_year?: number | null
          market_value?: number | null
          move_in_date?: string | null
          name?: string
          notes?: string | null
          ownership_type?: string
          plot_area_sqm?: number | null
          property_type?: string
          rooms_count?: number | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "miety_homes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      miety_loans: {
        Row: {
          bank_name: string | null
          created_at: string
          end_date: string | null
          home_id: string
          id: string
          interest_rate: number | null
          loan_amount: number | null
          loan_type: string | null
          monthly_rate: number | null
          notes: string | null
          remaining_balance: number | null
          start_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_name?: string | null
          created_at?: string
          end_date?: string | null
          home_id: string
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_type?: string | null
          monthly_rate?: number | null
          notes?: string | null
          remaining_balance?: number | null
          start_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          created_at?: string
          end_date?: string | null
          home_id?: string
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_type?: string | null
          monthly_rate?: number | null
          notes?: string | null
          remaining_balance?: number | null
          start_date?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "miety_loans_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "miety_homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miety_loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      miety_meter_readings: {
        Row: {
          created_at: string
          home_id: string
          id: string
          meter_type: string
          notes: string | null
          reading_date: string
          reading_value: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          meter_type?: string
          notes?: string | null
          reading_date?: string
          reading_value: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          meter_type?: string
          notes?: string | null
          reading_date?: string
          reading_value?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miety_meter_readings_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "miety_homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miety_meter_readings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      miety_tenancies: {
        Row: {
          additional_costs: number | null
          base_rent: number | null
          cancellation_period: string | null
          created_at: string
          deposit_amount: number | null
          home_id: string
          id: string
          landlord_contact: string | null
          landlord_name: string | null
          lease_end: string | null
          lease_start: string | null
          notes: string | null
          tenant_id: string
          total_rent: number | null
          updated_at: string
        }
        Insert: {
          additional_costs?: number | null
          base_rent?: number | null
          cancellation_period?: string | null
          created_at?: string
          deposit_amount?: number | null
          home_id: string
          id?: string
          landlord_contact?: string | null
          landlord_name?: string | null
          lease_end?: string | null
          lease_start?: string | null
          notes?: string | null
          tenant_id: string
          total_rent?: number | null
          updated_at?: string
        }
        Update: {
          additional_costs?: number | null
          base_rent?: number | null
          cancellation_period?: string | null
          created_at?: string
          deposit_amount?: number | null
          home_id?: string
          id?: string
          landlord_contact?: string | null
          landlord_name?: string | null
          lease_end?: string | null
          lease_start?: string | null
          notes?: string | null
          tenant_id?: string
          total_rent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "miety_tenancies_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "miety_homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miety_tenancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msv_action_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lease_id: string | null
          property_id: string | null
          tenant_id: string
          text: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lease_id?: string | null
          property_id?: string | null
          tenant_id: string
          text: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lease_id?: string | null
          property_id?: string | null
          tenant_id?: string
          text?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msv_action_notes_tenant_id_fkey"
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
          bic: string | null
          created_at: string
          finapi_account_id: string | null
          iban: string
          id: string
          is_default: boolean | null
          owner_id: string | null
          owner_type: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          bank_name?: string | null
          bic?: string | null
          created_at?: string
          finapi_account_id?: string | null
          iban: string
          id?: string
          is_default?: boolean | null
          owner_id?: string | null
          owner_type?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          bank_name?: string | null
          bic?: string | null
          created_at?: string
          finapi_account_id?: string | null
          iban?: string
          id?: string
          is_default?: boolean | null
          owner_id?: string | null
          owner_type?: string | null
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
      msv_book_values: {
        Row: {
          afa_begin_date: string | null
          afa_rate_percent: number | null
          ak_ancillary: number | null
          ak_building: number | null
          ak_ground: number | null
          book_value_confirmed_at: string | null
          book_value_confirmed_by: string | null
          book_value_date: string | null
          book_value_estimate: number | null
          book_value_status: string
          created_at: string
          cumulative_afa: number | null
          id: string
          interest_rate: number | null
          loan_id: string | null
          outstanding_balance: number | null
          property_id: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          afa_begin_date?: string | null
          afa_rate_percent?: number | null
          ak_ancillary?: number | null
          ak_building?: number | null
          ak_ground?: number | null
          book_value_confirmed_at?: string | null
          book_value_confirmed_by?: string | null
          book_value_date?: string | null
          book_value_estimate?: number | null
          book_value_status?: string
          created_at?: string
          cumulative_afa?: number | null
          id?: string
          interest_rate?: number | null
          loan_id?: string | null
          outstanding_balance?: number | null
          property_id: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          afa_begin_date?: string | null
          afa_rate_percent?: number | null
          ak_ancillary?: number | null
          ak_building?: number | null
          ak_ground?: number | null
          book_value_confirmed_at?: string | null
          book_value_confirmed_by?: string | null
          book_value_date?: string | null
          book_value_estimate?: number | null
          book_value_status?: string
          created_at?: string
          cumulative_afa?: number | null
          id?: string
          interest_rate?: number | null
          loan_id?: string | null
          outstanding_balance?: number | null
          property_id?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msv_book_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msv_bwa_entries: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount: number
          bwa_category: string
          created_at: string
          id: string
          note: string | null
          period_month: number
          period_year: number
          property_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bwa_category: string
          created_at?: string
          id?: string
          note?: string | null
          period_month: number
          period_year: number
          property_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount?: number
          bwa_category?: string
          created_at?: string
          id?: string
          note?: string | null
          period_month?: number
          period_year?: number
          property_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msv_bwa_entries_tenant_id_fkey"
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
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
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
      msv_rent_payments: {
        Row: {
          created_at: string
          dunning_channel: string | null
          dunning_last_sent_at: string | null
          dunning_next_due_at: string | null
          dunning_notes: string | null
          dunning_stage: number
          expected_amount: number | null
          id: string
          lease_id: string | null
          note: string | null
          period_month: number
          period_year: number
          property_id: string
          received_amount: number | null
          received_date: string | null
          source: string
          status: string
          tenant_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dunning_channel?: string | null
          dunning_last_sent_at?: string | null
          dunning_next_due_at?: string | null
          dunning_notes?: string | null
          dunning_stage?: number
          expected_amount?: number | null
          id?: string
          lease_id?: string | null
          note?: string | null
          period_month: number
          period_year: number
          property_id: string
          received_amount?: number | null
          received_date?: string | null
          source?: string
          status?: string
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dunning_channel?: string | null
          dunning_last_sent_at?: string | null
          dunning_next_due_at?: string | null
          dunning_notes?: string | null
          dunning_stage?: number
          expected_amount?: number | null
          id?: string
          lease_id?: string | null
          note?: string | null
          period_month?: number
          period_year?: number
          property_id?: string
          received_amount?: number | null
          received_date?: string | null
          source?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msv_rent_payments_tenant_id_fkey"
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
      nk_beleg_extractions: {
        Row: {
          balance_amount: number | null
          billing_period_end: string | null
          billing_period_start: string | null
          confidence: number
          consumption_unit: string | null
          consumption_value: number | null
          cost_category: string | null
          created_at: string
          document_id: string
          extracted_at: string
          extractor_version: string | null
          id: string
          meter_number: string | null
          meter_reading_end: number | null
          meter_reading_start: number | null
          needs_review: boolean
          prepayment_amount: number | null
          property_id: string | null
          provider_name: string | null
          provider_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          tenant_id: string
          total_amount: number | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          balance_amount?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          confidence?: number
          consumption_unit?: string | null
          consumption_value?: number | null
          cost_category?: string | null
          created_at?: string
          document_id: string
          extracted_at?: string
          extractor_version?: string | null
          id?: string
          meter_number?: string | null
          meter_reading_end?: number | null
          meter_reading_start?: number | null
          needs_review?: boolean
          prepayment_amount?: number | null
          property_id?: string | null
          provider_name?: string | null
          provider_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tenant_id: string
          total_amount?: number | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          balance_amount?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          confidence?: number
          consumption_unit?: string | null
          consumption_value?: number | null
          cost_category?: string | null
          created_at?: string
          document_id?: string
          extracted_at?: string
          extractor_version?: string | null
          id?: string
          meter_number?: string | null
          meter_reading_end?: number | null
          meter_reading_start?: number | null
          needs_review?: boolean
          prepayment_amount?: number | null
          property_id?: string | null
          provider_name?: string | null
          provider_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tenant_id?: string
          total_amount?: number | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nk_beleg_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_beleg_extractions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_beleg_extractions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_beleg_extractions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      nk_cost_items: {
        Row: {
          amount_total_house: number | null
          amount_unit: number | null
          category_code: string
          created_at: string
          id: string
          is_apportionable: boolean
          key_basis_total: number | null
          key_basis_unit: number | null
          key_type: string | null
          label_display: string | null
          label_raw: string | null
          mapping_confidence: number | null
          mapping_source: string | null
          nk_period_id: string
          reason_code: string | null
          sort_order: number | null
          source_document_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_total_house?: number | null
          amount_unit?: number | null
          category_code: string
          created_at?: string
          id?: string
          is_apportionable?: boolean
          key_basis_total?: number | null
          key_basis_unit?: number | null
          key_type?: string | null
          label_display?: string | null
          label_raw?: string | null
          mapping_confidence?: number | null
          mapping_source?: string | null
          nk_period_id: string
          reason_code?: string | null
          sort_order?: number | null
          source_document_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_total_house?: number | null
          amount_unit?: number | null
          category_code?: string
          created_at?: string
          id?: string
          is_apportionable?: boolean
          key_basis_total?: number | null
          key_basis_unit?: number | null
          key_type?: string | null
          label_display?: string | null
          label_raw?: string | null
          mapping_confidence?: number | null
          mapping_source?: string | null
          nk_period_id?: string
          reason_code?: string | null
          sort_order?: number | null
          source_document_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nk_cost_items_nk_period_id_fkey"
            columns: ["nk_period_id"]
            isOneToOne: false
            referencedRelation: "nk_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_cost_items_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_cost_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nk_periods: {
        Row: {
          allocatable_eur: number | null
          allocation_key_default: string | null
          created_at: string | null
          id: string
          non_allocatable_eur: number | null
          payments_locked: boolean
          period_end: string
          period_start: string
          property_id: string
          settlement_balance_eur: number | null
          settlement_date: string | null
          status: string | null
          tenant_id: string
          top_cost_blocks: Json | null
          updated_at: string | null
        }
        Insert: {
          allocatable_eur?: number | null
          allocation_key_default?: string | null
          created_at?: string | null
          id?: string
          non_allocatable_eur?: number | null
          payments_locked?: boolean
          period_end: string
          period_start: string
          property_id: string
          settlement_balance_eur?: number | null
          settlement_date?: string | null
          status?: string | null
          tenant_id: string
          top_cost_blocks?: Json | null
          updated_at?: string | null
        }
        Update: {
          allocatable_eur?: number | null
          allocation_key_default?: string | null
          created_at?: string | null
          id?: string
          non_allocatable_eur?: number | null
          payments_locked?: boolean
          period_end?: string
          period_start?: string
          property_id?: string
          settlement_balance_eur?: number | null
          settlement_date?: string | null
          status?: string | null
          tenant_id?: string
          top_cost_blocks?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nk_periods_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nk_tenant_settlements: {
        Row: {
          balance: number | null
          calculated_at: string | null
          calculation_json: Json | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          exported_pdf_path: string | null
          id: string
          lease_days_in_period: number | null
          lease_id: string
          nk_period_id: string | null
          period_end: string
          period_start: string
          property_id: string
          renter_contact_id: string | null
          status: string
          tenant_id: string
          total_apportionable: number | null
          total_days_in_period: number | null
          total_heating: number | null
          total_prepaid_heating: number | null
          total_prepaid_nk: number | null
          unit_id: string
          updated_at: string
          validation_warnings: Json | null
        }
        Insert: {
          balance?: number | null
          calculated_at?: string | null
          calculation_json?: Json | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          exported_pdf_path?: string | null
          id?: string
          lease_days_in_period?: number | null
          lease_id: string
          nk_period_id?: string | null
          period_end: string
          period_start: string
          property_id: string
          renter_contact_id?: string | null
          status?: string
          tenant_id: string
          total_apportionable?: number | null
          total_days_in_period?: number | null
          total_heating?: number | null
          total_prepaid_heating?: number | null
          total_prepaid_nk?: number | null
          unit_id: string
          updated_at?: string
          validation_warnings?: Json | null
        }
        Update: {
          balance?: number | null
          calculated_at?: string | null
          calculation_json?: Json | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          exported_pdf_path?: string | null
          id?: string
          lease_days_in_period?: number | null
          lease_id?: string
          nk_period_id?: string | null
          period_end?: string
          period_start?: string
          property_id?: string
          renter_contact_id?: string | null
          status?: string
          tenant_id?: string
          total_apportionable?: number | null
          total_days_in_period?: number | null
          total_heating?: number | null
          total_prepaid_heating?: number | null
          total_prepaid_nk?: number | null
          unit_id?: string
          updated_at?: string
          validation_warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "nk_tenant_settlements_nk_period_id_fkey"
            columns: ["nk_period_id"]
            isOneToOne: false
            referencedRelation: "nk_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_tenant_settlements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_tenant_settlements_renter_contact_id_fkey"
            columns: ["renter_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_tenant_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nk_tenant_settlements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
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
      org_links: {
        Row: {
          created_at: string
          created_by: string | null
          from_org_id: string
          id: string
          link_type: string
          metadata: Json | null
          status: string
          to_org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_org_id: string
          id?: string
          link_type: string
          metadata?: Json | null
          status?: string
          to_org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_org_id?: string
          id?: string
          link_type?: string
          metadata?: Json | null
          status?: string
          to_org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_links_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_links_to_org_id_fkey"
            columns: ["to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_policies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          org_id: string
          policy_key: string
          policy_type: string
          policy_value: Json
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          policy_key: string
          policy_type: string
          policy_value?: Json
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          policy_key?: string
          policy_type?: string
          policy_value?: Json
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_extraction_enabled: boolean
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
          storage_plan_id: string | null
          storage_quota_bytes: number | null
          tenant_mode: Database["public"]["Enums"]["tenant_mode"] | null
          updated_at: string
        }
        Insert: {
          ai_extraction_enabled?: boolean
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
          storage_plan_id?: string | null
          storage_quota_bytes?: number | null
          tenant_mode?: Database["public"]["Enums"]["tenant_mode"] | null
          updated_at?: string
        }
        Update: {
          ai_extraction_enabled?: boolean
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
          storage_plan_id?: string | null
          storage_quota_bytes?: number | null
          tenant_mode?: Database["public"]["Enums"]["tenant_mode"] | null
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
          {
            foreignKeyName: "organizations_storage_plan_id_fkey"
            columns: ["storage_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          brand: string
          country_code: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          brand: string
          country_code?: string | null
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          brand?: string
          country_code?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      partner_deals: {
        Row: {
          actual_close_date: string | null
          commission_rate: number | null
          contact_id: string | null
          created_at: string | null
          deal_value: number | null
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      partner_listing_selections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          listing_id: string
          partner_user_id: string
          selected_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          listing_id: string
          partner_user_id: string
          selected_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          listing_id?: string
          partner_user_id?: string
          selected_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_listing_selections_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_listing_selections_partner_user_id_fkey"
            columns: ["partner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_listing_selections_tenant_id_fkey"
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
      pension_records: {
        Row: {
          created_at: string
          current_pension: number | null
          disability_pension: number | null
          id: string
          info_date: string | null
          pension_type: string | null
          person_id: string
          projected_pension: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_pension?: number | null
          disability_pension?: number | null
          id?: string
          info_date?: string | null
          pension_type?: string | null
          person_id: string
          projected_pension?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_pension?: number | null
          disability_pension?: number | null
          id?: string
          info_date?: string | null
          pension_type?: string | null
          person_id?: string
          projected_pension?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_records_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "household_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pension_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_bookings: {
        Row: {
          booking_area: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_notes: string | null
          client_user_id: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          pet_id: string
          price_cents: number | null
          provider_id: string
          provider_notes: string | null
          scheduled_date: string
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          service_id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["pet_booking_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          booking_area?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_notes?: string | null
          client_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          pet_id: string
          price_cents?: number | null
          provider_id: string
          provider_notes?: string | null
          scheduled_date: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_id: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["pet_booking_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          booking_area?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_notes?: string | null
          client_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          pet_id?: string
          price_cents?: number | null
          provider_id?: string
          provider_notes?: string | null
          scheduled_date?: string
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["pet_booking_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_bookings_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pet_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "pet_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_caring_events: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["pet_caring_event_type"]
          id: string
          is_completed: boolean
          pet_id: string
          recurring_interval_days: number | null
          reminder_enabled: boolean
          reminder_minutes_before: number | null
          scheduled_at: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["pet_caring_event_type"]
          id?: string
          is_completed?: boolean
          pet_id: string
          recurring_interval_days?: number | null
          reminder_enabled?: boolean
          reminder_minutes_before?: number | null
          scheduled_at: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["pet_caring_event_type"]
          id?: string
          is_completed?: boolean
          pet_id?: string
          recurring_interval_days?: number | null
          reminder_enabled?: boolean
          reminder_minutes_before?: number | null
          scheduled_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_caring_events_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_caring_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          origin_zone: string
          phone: string | null
          postal_code: string | null
          provider_id: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
          z1_customer_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          origin_zone?: string
          phone?: string | null
          postal_code?: string | null
          provider_id?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          z1_customer_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          origin_zone?: string
          phone?: string | null
          postal_code?: string | null
          provider_id?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          z1_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_customers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_customers_z1_customer_id_fkey"
            columns: ["z1_customer_id"]
            isOneToOne: false
            referencedRelation: "pet_z1_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          total_cents?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "pet_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "pet_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_invoices: {
        Row: {
          amount_cents: number
          booking_id: string | null
          created_at: string
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          net_cents: number
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          pdf_url: string | null
          provider_id: string | null
          status: string
          tax_cents: number
          tax_rate: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          net_cents?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          provider_id?: string | null
          status?: string
          tax_cents?: number
          tax_rate?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          net_cents?: number
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pdf_url?: string | null
          provider_id?: string | null
          status?: string
          tax_cents?: number
          tax_rate?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "pet_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_medical_records: {
        Row: {
          cost_amount: number | null
          created_at: string
          description: string | null
          diagnosis: string | null
          follow_up_date: string | null
          id: string
          medication: string | null
          notes: string | null
          pet_id: string
          record_date: string
          record_type: string
          tenant_id: string
          title: string
          treatment: string | null
          updated_at: string
          vet_name: string | null
        }
        Insert: {
          cost_amount?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          follow_up_date?: string | null
          id?: string
          medication?: string | null
          notes?: string | null
          pet_id: string
          record_date?: string
          record_type?: string
          tenant_id: string
          title: string
          treatment?: string | null
          updated_at?: string
          vet_name?: string | null
        }
        Update: {
          cost_amount?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          follow_up_date?: string | null
          id?: string
          medication?: string | null
          notes?: string | null
          pet_id?: string
          record_date?: string
          record_type?: string
          tenant_id?: string
          title?: string
          treatment?: string | null
          updated_at?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_medical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_provider_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          max_bookings: number
          provider_id: string
          start_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          max_bookings?: number
          provider_id: string
          start_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          max_bookings?: number
          provider_id?: string
          start_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_provider_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_provider_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          provider_id: string
          reason: string | null
          tenant_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          id?: string
          provider_id: string
          reason?: string | null
          tenant_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          id?: string
          provider_id?: string
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_provider_blocked_dates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_provider_blocked_dates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_providers: {
        Row: {
          address: string | null
          bio: string | null
          company_name: string
          cover_image_url: string | null
          created_at: string
          email: string | null
          facility_type: string
          gallery_images: string[] | null
          id: string
          is_published: boolean | null
          max_daily_capacity: number
          operating_hours: Json | null
          phone: string | null
          provider_type: Database["public"]["Enums"]["pet_provider_type"]
          rating_avg: number | null
          service_area_postal_codes: string[] | null
          status: Database["public"]["Enums"]["pet_provider_status"]
          tenant_id: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          company_name: string
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          facility_type?: string
          gallery_images?: string[] | null
          id?: string
          is_published?: boolean | null
          max_daily_capacity?: number
          operating_hours?: Json | null
          phone?: string | null
          provider_type?: Database["public"]["Enums"]["pet_provider_type"]
          rating_avg?: number | null
          service_area_postal_codes?: string[] | null
          status?: Database["public"]["Enums"]["pet_provider_status"]
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          company_name?: string
          cover_image_url?: string | null
          created_at?: string
          email?: string | null
          facility_type?: string
          gallery_images?: string[] | null
          id?: string
          is_published?: boolean | null
          max_daily_capacity?: number
          operating_hours?: Json | null
          phone?: string | null
          provider_type?: Database["public"]["Enums"]["pet_provider_type"]
          rating_avg?: number | null
          service_area_postal_codes?: string[] | null
          status?: Database["public"]["Enums"]["pet_provider_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_room_assignments: {
        Row: {
          booking_id: string
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          id: string
          notes: string | null
          pet_id: string
          room_id: string
          tenant_id: string
        }
        Insert: {
          booking_id: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pet_id: string
          room_id: string
          tenant_id: string
        }
        Update: {
          booking_id?: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pet_id?: string
          room_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_room_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "pet_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_room_assignments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pet_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_room_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_rooms: {
        Row: {
          area: string
          capacity: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          provider_id: string
          room_type: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          area?: string
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider_id: string
          room_type?: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          area?: string
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider_id?: string
          room_type?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_rooms_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_services: {
        Row: {
          category: Database["public"]["Enums"]["pet_service_category"]
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          price_cents: number | null
          price_type: Database["public"]["Enums"]["pet_price_type"]
          provider_id: string
          species_allowed: string[] | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["pet_service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          price_cents?: number | null
          price_type?: Database["public"]["Enums"]["pet_price_type"]
          provider_id: string
          species_allowed?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["pet_service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          price_cents?: number | null
          price_type?: Database["public"]["Enums"]["pet_price_type"]
          provider_id?: string
          species_allowed?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_shop_products: {
        Row: {
          badge: string | null
          category: string
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_cents: number | null
          price_label: string | null
          sort_order: number | null
          sub_category: string | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_cents?: number | null
          price_label?: string | null
          sort_order?: number | null
          sub_category?: string | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_cents?: number | null
          price_label?: string | null
          sort_order?: number | null
          sub_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pet_staff: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          provider_id: string
          role: string | null
          services: string[] | null
          sort_order: number
          tenant_id: string
          updated_at: string
          work_hours: Json | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          provider_id: string
          role?: string | null
          services?: string[] | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
          work_hours?: Json | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          provider_id?: string
          role?: string | null
          services?: string[] | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
          work_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_staff_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_vaccinations: {
        Row: {
          administered_at: string
          batch_number: string | null
          created_at: string
          document_node_id: string | null
          id: string
          next_due_at: string | null
          notes: string | null
          pet_id: string
          tenant_id: string
          updated_at: string
          vaccination_type: string
          vaccine_name: string | null
          vet_name: string | null
        }
        Insert: {
          administered_at: string
          batch_number?: string | null
          created_at?: string
          document_node_id?: string | null
          id?: string
          next_due_at?: string | null
          notes?: string | null
          pet_id: string
          tenant_id: string
          updated_at?: string
          vaccination_type: string
          vaccine_name?: string | null
          vet_name?: string | null
        }
        Update: {
          administered_at?: string
          batch_number?: string | null
          created_at?: string
          document_node_id?: string | null
          id?: string
          next_due_at?: string | null
          notes?: string | null
          pet_id?: string
          tenant_id?: string
          updated_at?: string
          vaccination_type?: string
          vaccine_name?: string | null
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_vaccinations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_z1_booking_requests: {
        Row: {
          client_notes: string | null
          created_at: string
          fee_cents: number | null
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          pet_name: string | null
          pet_z1_id: string | null
          preferred_date: string | null
          preferred_time: string | null
          provider_confirmed_at: string | null
          provider_id: string
          service_title: string
          status: string
          tenant_id: string
          updated_at: string
          z1_customer_id: string
          z2_booking_id: string | null
        }
        Insert: {
          client_notes?: string | null
          created_at?: string
          fee_cents?: number | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          pet_name?: string | null
          pet_z1_id?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          provider_confirmed_at?: string | null
          provider_id: string
          service_title: string
          status?: string
          tenant_id: string
          updated_at?: string
          z1_customer_id: string
          z2_booking_id?: string | null
        }
        Update: {
          client_notes?: string | null
          created_at?: string
          fee_cents?: number | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          pet_name?: string | null
          pet_z1_id?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          provider_confirmed_at?: string | null
          provider_id?: string
          service_title?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          z1_customer_id?: string
          z2_booking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_z1_booking_requests_pet_z1_id_fkey"
            columns: ["pet_z1_id"]
            isOneToOne: false
            referencedRelation: "pet_z1_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z1_booking_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z1_booking_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z1_booking_requests_z1_customer_id_fkey"
            columns: ["z1_customer_id"]
            isOneToOne: false
            referencedRelation: "pet_z1_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z1_booking_requests_z2_booking_id_fkey"
            columns: ["z2_booking_id"]
            isOneToOne: false
            referencedRelation: "pet_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_z1_customers: {
        Row: {
          address: string | null
          assigned_at: string | null
          assigned_provider_id: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_id: string | null
          notes: string | null
          password_hash: string | null
          phone: string | null
          postal_code: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_at?: string | null
          assigned_provider_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_id?: string | null
          notes?: string | null
          password_hash?: string | null
          phone?: string | null
          postal_code?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_at?: string | null
          assigned_provider_id?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_id?: string | null
          notes?: string | null
          password_hash?: string | null
          phone?: string | null
          postal_code?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_z1_customers_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "pet_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z1_customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_z1_pets: {
        Row: {
          allergies: string[] | null
          birth_date: string | null
          breed: string | null
          chip_number: string | null
          created_at: string
          gender: Database["public"]["Enums"]["pet_gender"] | null
          id: string
          name: string
          neutered: boolean
          notes: string | null
          photo_url: string | null
          species: Database["public"]["Enums"]["pet_species"]
          tenant_id: string
          updated_at: string
          vet_name: string | null
          weight_kg: number | null
          z1_customer_id: string
        }
        Insert: {
          allergies?: string[] | null
          birth_date?: string | null
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["pet_gender"] | null
          id?: string
          name: string
          neutered?: boolean
          notes?: string | null
          photo_url?: string | null
          species?: Database["public"]["Enums"]["pet_species"]
          tenant_id: string
          updated_at?: string
          vet_name?: string | null
          weight_kg?: number | null
          z1_customer_id: string
        }
        Update: {
          allergies?: string[] | null
          birth_date?: string | null
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["pet_gender"] | null
          id?: string
          name?: string
          neutered?: boolean
          notes?: string | null
          photo_url?: string | null
          species?: Database["public"]["Enums"]["pet_species"]
          tenant_id?: string
          updated_at?: string
          vet_name?: string | null
          weight_kg?: number | null
          z1_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_z1_pets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z1_pets_z1_customer_id_fkey"
            columns: ["z1_customer_id"]
            isOneToOne: false
            referencedRelation: "pet_z1_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_z3_sessions: {
        Row: {
          created_at: string | null
          customer_id: string
          expires_at: string
          id: string
          session_token: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          expires_at?: string
          id?: string
          session_token: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          expires_at?: string
          id?: string
          session_token?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_z3_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pet_z1_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_z3_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          allergies: string[] | null
          birth_date: string | null
          breed: string | null
          chip_number: string | null
          created_at: string
          customer_id: string | null
          gender: Database["public"]["Enums"]["pet_gender"] | null
          id: string
          insurance_policy_no: string | null
          insurance_provider: string | null
          name: string
          neutered: boolean | null
          notes: string | null
          owner_user_id: string | null
          photo_url: string | null
          species: Database["public"]["Enums"]["pet_species"]
          tenant_id: string
          updated_at: string
          vet_name: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string[] | null
          birth_date?: string | null
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          customer_id?: string | null
          gender?: Database["public"]["Enums"]["pet_gender"] | null
          id?: string
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          name: string
          neutered?: boolean | null
          notes?: string | null
          owner_user_id?: string | null
          photo_url?: string | null
          species?: Database["public"]["Enums"]["pet_species"]
          tenant_id: string
          updated_at?: string
          vet_name?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string[] | null
          birth_date?: string | null
          breed?: string | null
          chip_number?: string | null
          created_at?: string
          customer_id?: string | null
          gender?: Database["public"]["Enums"]["pet_gender"] | null
          id?: string
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          name?: string
          neutered?: boolean | null
          notes?: string | null
          owner_user_id?: string | null
          photo_url?: string | null
          species?: Database["public"]["Enums"]["pet_species"]
          tenant_id?: string
          updated_at?: string
          vet_name?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pet_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_tenant_id_fkey"
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
      posting_categories: {
        Row: {
          accounting_category: string
          bwa_group: string | null
          description_de: string | null
          direction: string
          tax_category_vv: string | null
        }
        Insert: {
          accounting_category: string
          bwa_group?: string | null
          description_de?: string | null
          direction: string
          tax_category_vv?: string | null
        }
        Update: {
          accounting_category?: string
          bwa_group?: string | null
          description_de?: string | null
          direction?: string
          tax_category_vv?: string | null
        }
        Relationships: []
      }
      postings: {
        Row: {
          accounting_category: string
          amount_eur: number
          bwa_group: string | null
          confidence: number | null
          created_at: string | null
          direction: string
          id: string
          posting_date: string
          property_id: string
          source_refs: Json
          status: string | null
          tax_category: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          accounting_category: string
          amount_eur: number
          bwa_group?: string | null
          confidence?: number | null
          created_at?: string | null
          direction: string
          id?: string
          posting_date: string
          property_id: string
          source_refs?: Json
          status?: string | null
          tax_category?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accounting_category?: string
          amount_eur?: number
          bwa_group?: string | null
          confidence?: number | null
          created_at?: string | null
          direction?: string
          id?: string
          posting_date?: string
          property_id?: string
          source_refs?: Json
          status?: string | null
          tax_category?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      postservice_mandates: {
        Row: {
          contract_terms: Json
          created_at: string
          id: string
          notes: string | null
          payload_json: Json
          requested_by_user_id: string
          status: string
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          contract_terms?: Json
          created_at?: string
          id?: string
          notes?: string | null
          payload_json?: Json
          requested_by_user_id: string
          status?: string
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          contract_terms?: Json
          created_at?: string
          id?: string
          notes?: string | null
          payload_json?: Json
          requested_by_user_id?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "postservice_mandates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      private_loans: {
        Row: {
          bank_name: string | null
          created_at: string
          end_date: string | null
          id: string
          interest_rate: number | null
          loan_amount: number | null
          loan_purpose: string
          monthly_rate: number | null
          notes: string | null
          remaining_balance: number | null
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_purpose: string
          monthly_rate?: number | null
          notes?: string | null
          remaining_balance?: number | null
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          loan_amount?: number | null
          loan_purpose?: string
          monthly_rate?: number | null
          notes?: string | null
          remaining_balance?: number | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_tenant_id: string | null
          armstrong_email: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string
          email_signature: string | null
          first_name: string | null
          house_number: string | null
          id: string
          insurance_policy_no: string | null
          insurance_provider: string | null
          is_business: boolean | null
          last_name: string | null
          letterhead_bank_name: string | null
          letterhead_bic: string | null
          letterhead_company_line: string | null
          letterhead_extra_line: string | null
          letterhead_iban: string | null
          letterhead_logo_url: string | null
          letterhead_website: string | null
          person_mode: string | null
          phone: string | null
          phone_landline: string | null
          phone_mobile: string | null
          phone_whatsapp: string | null
          postal_code: string | null
          reg_34i_authority: string | null
          reg_34i_ihk: string | null
          reg_34i_number: string | null
          reg_vermittler_id: string | null
          sot_email: string | null
          spouse_profile_id: string | null
          street: string | null
          tax_id: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          active_tenant_id?: string | null
          armstrong_email?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email: string
          email_signature?: string | null
          first_name?: string | null
          house_number?: string | null
          id: string
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          is_business?: boolean | null
          last_name?: string | null
          letterhead_bank_name?: string | null
          letterhead_bic?: string | null
          letterhead_company_line?: string | null
          letterhead_extra_line?: string | null
          letterhead_iban?: string | null
          letterhead_logo_url?: string | null
          letterhead_website?: string | null
          person_mode?: string | null
          phone?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          phone_whatsapp?: string | null
          postal_code?: string | null
          reg_34i_authority?: string | null
          reg_34i_ihk?: string | null
          reg_34i_number?: string | null
          reg_vermittler_id?: string | null
          sot_email?: string | null
          spouse_profile_id?: string | null
          street?: string | null
          tax_id?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          active_tenant_id?: string | null
          armstrong_email?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          email_signature?: string | null
          first_name?: string | null
          house_number?: string | null
          id?: string
          insurance_policy_no?: string | null
          insurance_provider?: string | null
          is_business?: boolean | null
          last_name?: string | null
          letterhead_bank_name?: string | null
          letterhead_bic?: string | null
          letterhead_company_line?: string | null
          letterhead_extra_line?: string | null
          letterhead_iban?: string | null
          letterhead_logo_url?: string | null
          letterhead_website?: string | null
          person_mode?: string | null
          phone?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          phone_whatsapp?: string | null
          postal_code?: string | null
          reg_34i_authority?: string | null
          reg_34i_ihk?: string | null
          reg_34i_number?: string | null
          reg_vermittler_id?: string | null
          sot_email?: string | null
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
          acquisition_costs: number | null
          address: string
          address_house_no: string | null
          allocation_key: string | null
          annual_income: number | null
          bnl_date: string | null
          category: string | null
          city: string
          code: string | null
          country: string
          created_at: string
          description: string | null
          energy_source: string | null
          heating_type: string | null
          id: string
          insurance_policy_no: string | null
          is_demo: boolean
          is_public_listing: boolean
          land_register_court: string | null
          land_register_refs: Json | null
          land_register_sheet: string | null
          land_register_volume: string | null
          landlord_context_id: string | null
          latitude: number | null
          location_label: string | null
          location_notes: string | null
          longitude: number | null
          management_fee: number | null
          manager_contact: Json | null
          market_value: number | null
          mea_total: number | null
          multi_unit_enabled: boolean | null
          notary_date: string | null
          owner_context_id: string | null
          ownership_share_percent: number | null
          parcel_number: string | null
          postal_code: string | null
          property_type: string
          public_id: string
          public_listing_approved_at: string | null
          public_listing_approved_by: string | null
          purchase_price: number | null
          renovation_year: number | null
          rental_managed: boolean | null
          reporting_regime: string | null
          sale_enabled: boolean | null
          status: string
          tax_reference_number: string | null
          te_number: string | null
          tenant_id: string
          total_area_sqm: number | null
          total_occupants: number | null
          unit_ownership_nr: string | null
          updated_at: string
          usage_type: string
          utility_prepayment: number | null
          weg_flag: boolean | null
          year_built: number | null
        }
        Insert: {
          acquisition_costs?: number | null
          address: string
          address_house_no?: string | null
          allocation_key?: string | null
          annual_income?: number | null
          bnl_date?: string | null
          category?: string | null
          city: string
          code?: string | null
          country?: string
          created_at?: string
          description?: string | null
          energy_source?: string | null
          heating_type?: string | null
          id?: string
          insurance_policy_no?: string | null
          is_demo?: boolean
          is_public_listing?: boolean
          land_register_court?: string | null
          land_register_refs?: Json | null
          land_register_sheet?: string | null
          land_register_volume?: string | null
          landlord_context_id?: string | null
          latitude?: number | null
          location_label?: string | null
          location_notes?: string | null
          longitude?: number | null
          management_fee?: number | null
          manager_contact?: Json | null
          market_value?: number | null
          mea_total?: number | null
          multi_unit_enabled?: boolean | null
          notary_date?: string | null
          owner_context_id?: string | null
          ownership_share_percent?: number | null
          parcel_number?: string | null
          postal_code?: string | null
          property_type?: string
          public_id: string
          public_listing_approved_at?: string | null
          public_listing_approved_by?: string | null
          purchase_price?: number | null
          renovation_year?: number | null
          rental_managed?: boolean | null
          reporting_regime?: string | null
          sale_enabled?: boolean | null
          status?: string
          tax_reference_number?: string | null
          te_number?: string | null
          tenant_id: string
          total_area_sqm?: number | null
          total_occupants?: number | null
          unit_ownership_nr?: string | null
          updated_at?: string
          usage_type?: string
          utility_prepayment?: number | null
          weg_flag?: boolean | null
          year_built?: number | null
        }
        Update: {
          acquisition_costs?: number | null
          address?: string
          address_house_no?: string | null
          allocation_key?: string | null
          annual_income?: number | null
          bnl_date?: string | null
          category?: string | null
          city?: string
          code?: string | null
          country?: string
          created_at?: string
          description?: string | null
          energy_source?: string | null
          heating_type?: string | null
          id?: string
          insurance_policy_no?: string | null
          is_demo?: boolean
          is_public_listing?: boolean
          land_register_court?: string | null
          land_register_refs?: Json | null
          land_register_sheet?: string | null
          land_register_volume?: string | null
          landlord_context_id?: string | null
          latitude?: number | null
          location_label?: string | null
          location_notes?: string | null
          longitude?: number | null
          management_fee?: number | null
          manager_contact?: Json | null
          market_value?: number | null
          mea_total?: number | null
          multi_unit_enabled?: boolean | null
          notary_date?: string | null
          owner_context_id?: string | null
          ownership_share_percent?: number | null
          parcel_number?: string | null
          postal_code?: string | null
          property_type?: string
          public_id?: string
          public_listing_approved_at?: string | null
          public_listing_approved_by?: string | null
          purchase_price?: number | null
          renovation_year?: number | null
          rental_managed?: boolean | null
          reporting_regime?: string | null
          sale_enabled?: boolean | null
          status?: string
          tax_reference_number?: string | null
          te_number?: string | null
          tenant_id?: string
          total_area_sqm?: number | null
          total_occupants?: number | null
          unit_ownership_nr?: string | null
          updated_at?: string
          usage_type?: string
          utility_prepayment?: number | null
          weg_flag?: boolean | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_landlord_context_id_fkey"
            columns: ["landlord_context_id"]
            isOneToOne: false
            referencedRelation: "landlord_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_context_id_fkey"
            columns: ["owner_context_id"]
            isOneToOne: false
            referencedRelation: "landlord_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_accounting: {
        Row: {
          account_mappings: Json | null
          afa_method: string | null
          afa_model: string | null
          afa_rate_percent: number | null
          afa_start_date: string | null
          ak_ancillary: number | null
          ak_building: number | null
          ak_ground: number | null
          book_value_date: string | null
          book_value_eur: number | null
          building_share_percent: number | null
          coa_version: string | null
          created_at: string | null
          cumulative_afa: number | null
          denkmal_afa_annual: number | null
          id: string
          land_share_percent: number | null
          modernization_costs_eur: number | null
          modernization_year: number | null
          property_id: string
          remaining_useful_life_years: number | null
          sonder_afa_annual: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_mappings?: Json | null
          afa_method?: string | null
          afa_model?: string | null
          afa_rate_percent?: number | null
          afa_start_date?: string | null
          ak_ancillary?: number | null
          ak_building?: number | null
          ak_ground?: number | null
          book_value_date?: string | null
          book_value_eur?: number | null
          building_share_percent?: number | null
          coa_version?: string | null
          created_at?: string | null
          cumulative_afa?: number | null
          denkmal_afa_annual?: number | null
          id?: string
          land_share_percent?: number | null
          modernization_costs_eur?: number | null
          modernization_year?: number | null
          property_id: string
          remaining_useful_life_years?: number | null
          sonder_afa_annual?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_mappings?: Json | null
          afa_method?: string | null
          afa_model?: string | null
          afa_rate_percent?: number | null
          afa_start_date?: string | null
          ak_ancillary?: number | null
          ak_building?: number | null
          ak_ground?: number | null
          book_value_date?: string | null
          book_value_eur?: number | null
          building_share_percent?: number | null
          coa_version?: string | null
          created_at?: string | null
          cumulative_afa?: number | null
          denkmal_afa_annual?: number | null
          id?: string
          land_share_percent?: number | null
          modernization_costs_eur?: number | null
          modernization_year?: number | null
          property_id?: string
          remaining_useful_life_years?: number | null
          sonder_afa_annual?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_accounting_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_accounting_tenant_id_fkey"
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
          config: Json | null
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
          config?: Json | null
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
          config?: Json | null
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
      public_project_submissions: {
        Row: {
          address: string | null
          agreement_accepted_at: string | null
          agreement_version: string | null
          city: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          converted_at: string | null
          converted_by: string | null
          converted_project_id: string | null
          converted_tenant_id: string | null
          created_at: string
          expose_storage_path: string | null
          extracted_data: Json | null
          id: string
          image_paths: Json | null
          lead_id: string | null
          postal_code: string | null
          pricelist_storage_path: string | null
          project_name: string | null
          project_type: string | null
          source_ip: string | null
          status: string
          units_count: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          address?: string | null
          agreement_accepted_at?: string | null
          agreement_version?: string | null
          city?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          converted_at?: string | null
          converted_by?: string | null
          converted_project_id?: string | null
          converted_tenant_id?: string | null
          created_at?: string
          expose_storage_path?: string | null
          extracted_data?: Json | null
          id?: string
          image_paths?: Json | null
          lead_id?: string | null
          postal_code?: string | null
          pricelist_storage_path?: string | null
          project_name?: string | null
          project_type?: string | null
          source_ip?: string | null
          status?: string
          units_count?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          address?: string | null
          agreement_accepted_at?: string | null
          agreement_version?: string | null
          city?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          converted_at?: string | null
          converted_by?: string | null
          converted_project_id?: string | null
          converted_tenant_id?: string | null
          created_at?: string
          expose_storage_path?: string | null
          extracted_data?: Json | null
          id?: string
          image_paths?: Json | null
          lead_id?: string | null
          postal_code?: string | null
          pricelist_storage_path?: string | null
          project_name?: string | null
          project_type?: string | null
          source_ip?: string | null
          status?: string
          units_count?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_project_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_connectors: {
        Row: {
          config_json: Json | null
          created_at: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          provider: string
          pv_plant_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          config_json?: Json | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider: string
          pv_plant_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          config_json?: Json | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string
          pv_plant_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pv_connectors_pv_plant_id_fkey"
            columns: ["pv_plant_id"]
            isOneToOne: false
            referencedRelation: "pv_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_measurements: {
        Row: {
          current_power_w: number | null
          energy_month_kwh: number | null
          energy_today_kwh: number | null
          id: string
          pv_plant_id: string
          source: string
          tenant_id: string
          ts: string
        }
        Insert: {
          current_power_w?: number | null
          energy_month_kwh?: number | null
          energy_today_kwh?: number | null
          id?: string
          pv_plant_id: string
          source?: string
          tenant_id: string
          ts?: string
        }
        Update: {
          current_power_w?: number | null
          energy_month_kwh?: number | null
          energy_today_kwh?: number | null
          id?: string
          pv_plant_id?: string
          source?: string
          tenant_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "pv_measurements_pv_plant_id_fkey"
            columns: ["pv_plant_id"]
            isOneToOne: false
            referencedRelation: "pv_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_measurements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pv_plants: {
        Row: {
          active_connector: string | null
          annual_revenue: number | null
          annual_yield_kwh: number | null
          battery_kwh: number | null
          city: string | null
          commissioning_date: string | null
          consumption_meter_no: string | null
          consumption_meter_operator: string | null
          consumption_start_reading: number | null
          created_at: string
          customer_reference: string | null
          data_quality: string | null
          dms_root_node_id: string | null
          energy_supplier: string | null
          feed_in_meter_no: string | null
          feed_in_meter_operator: string | null
          feed_in_start_reading: number | null
          feed_in_tariff_cents: number | null
          grid_operator: string | null
          has_battery: boolean | null
          house_number: string | null
          id: string
          kwp: number | null
          last_sync_at: string | null
          loan_amount: number | null
          loan_bank: string | null
          loan_interest_rate: number | null
          loan_monthly_rate: number | null
          loan_remaining_balance: number | null
          location_notes: string | null
          mastr_account_present: boolean | null
          mastr_plant_id: string | null
          mastr_status: string | null
          mastr_unit_id: string | null
          name: string
          owner_org_id: string | null
          owner_user_id: string | null
          postal_code: string | null
          provider: string
          public_id: string | null
          status: string
          street: string | null
          tenant_id: string
          updated_at: string
          wr_manufacturer: string | null
          wr_model: string | null
        }
        Insert: {
          active_connector?: string | null
          annual_revenue?: number | null
          annual_yield_kwh?: number | null
          battery_kwh?: number | null
          city?: string | null
          commissioning_date?: string | null
          consumption_meter_no?: string | null
          consumption_meter_operator?: string | null
          consumption_start_reading?: number | null
          created_at?: string
          customer_reference?: string | null
          data_quality?: string | null
          dms_root_node_id?: string | null
          energy_supplier?: string | null
          feed_in_meter_no?: string | null
          feed_in_meter_operator?: string | null
          feed_in_start_reading?: number | null
          feed_in_tariff_cents?: number | null
          grid_operator?: string | null
          has_battery?: boolean | null
          house_number?: string | null
          id?: string
          kwp?: number | null
          last_sync_at?: string | null
          loan_amount?: number | null
          loan_bank?: string | null
          loan_interest_rate?: number | null
          loan_monthly_rate?: number | null
          loan_remaining_balance?: number | null
          location_notes?: string | null
          mastr_account_present?: boolean | null
          mastr_plant_id?: string | null
          mastr_status?: string | null
          mastr_unit_id?: string | null
          name: string
          owner_org_id?: string | null
          owner_user_id?: string | null
          postal_code?: string | null
          provider?: string
          public_id?: string | null
          status?: string
          street?: string | null
          tenant_id: string
          updated_at?: string
          wr_manufacturer?: string | null
          wr_model?: string | null
        }
        Update: {
          active_connector?: string | null
          annual_revenue?: number | null
          annual_yield_kwh?: number | null
          battery_kwh?: number | null
          city?: string | null
          commissioning_date?: string | null
          consumption_meter_no?: string | null
          consumption_meter_operator?: string | null
          consumption_start_reading?: number | null
          created_at?: string
          customer_reference?: string | null
          data_quality?: string | null
          dms_root_node_id?: string | null
          energy_supplier?: string | null
          feed_in_meter_no?: string | null
          feed_in_meter_operator?: string | null
          feed_in_start_reading?: number | null
          feed_in_tariff_cents?: number | null
          grid_operator?: string | null
          has_battery?: boolean | null
          house_number?: string | null
          id?: string
          kwp?: number | null
          last_sync_at?: string | null
          loan_amount?: number | null
          loan_bank?: string | null
          loan_interest_rate?: number | null
          loan_monthly_rate?: number | null
          loan_remaining_balance?: number | null
          location_notes?: string | null
          mastr_account_present?: boolean | null
          mastr_plant_id?: string | null
          mastr_status?: string | null
          mastr_unit_id?: string | null
          name?: string
          owner_org_id?: string | null
          owner_user_id?: string | null
          postal_code?: string | null
          provider?: string
          public_id?: string | null
          status?: string
          street?: string | null
          tenant_id?: string
          updated_at?: string
          wr_manufacturer?: string | null
          wr_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pv_plants_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_plants_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pv_plants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_counters: {
        Row: {
          counter_key: string
          created_at: string
          function_name: string
          id: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          counter_key: string
          created_at?: string
          function_name: string
          id?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          counter_key?: string
          created_at?: string
          function_name?: string
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_counters_tenant_id_fkey"
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
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
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
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
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
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      research_billing_log: {
        Row: {
          cost: number
          created_at: string
          id: string
          order_id: string
          provider: string
          tenant_id: string
          units: number
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          order_id: string
          provider: string
          tenant_id: string
          units?: number
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          order_id?: string
          provider?: string
          tenant_id?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "research_billing_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "research_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_billing_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_order_results: {
        Row: {
          company_name: string | null
          confidence_score: number
          created_at: string
          domain: string | null
          email: string | null
          entity_type: string
          first_name: string | null
          full_name: string | null
          id: string
          imported_contact_id: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          order_id: string
          phone: string | null
          raw_json: Json | null
          role: string | null
          seniority: string | null
          source_provider: string
          source_refs_json: Json
          status: string
          tenant_id: string
        }
        Insert: {
          company_name?: string | null
          confidence_score?: number
          created_at?: string
          domain?: string | null
          email?: string | null
          entity_type?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          imported_contact_id?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          order_id: string
          phone?: string | null
          raw_json?: Json | null
          role?: string | null
          seniority?: string | null
          source_provider?: string
          source_refs_json?: Json
          status?: string
          tenant_id: string
        }
        Update: {
          company_name?: string | null
          confidence_score?: number
          created_at?: string
          domain?: string | null
          email?: string | null
          entity_type?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          imported_contact_id?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          order_id?: string
          phone?: string | null
          raw_json?: Json | null
          role?: string | null
          seniority?: string | null
          source_provider?: string
          source_refs_json?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_order_results_imported_contact_id_fkey"
            columns: ["imported_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_order_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "research_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_order_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_orders: {
        Row: {
          ai_summary_md: string | null
          consent_confirmed: boolean
          cost_cap: number
          cost_estimate: number
          cost_spent: number
          created_at: string
          created_by: string
          icp_json: Json
          id: string
          intent_text: string
          max_results: number
          output_type: string
          provider_plan_json: Json
          results_count: number
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_summary_md?: string | null
          consent_confirmed?: boolean
          cost_cap?: number
          cost_estimate?: number
          cost_spent?: number
          created_at?: string
          created_by: string
          icp_json?: Json
          id?: string
          intent_text?: string
          max_results?: number
          output_type?: string
          provider_plan_json?: Json
          results_count?: number
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary_md?: string | null
          consent_confirmed?: boolean
          cost_cap?: number
          cost_estimate?: number
          cost_spent?: number
          created_at?: string
          created_by?: string
          icp_json?: Json
          id?: string
          intent_text?: string
          max_results?: number
          output_type?: string
          provider_plan_json?: Json
          results_count?: number
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_results: {
        Row: {
          created_at: string | null
          entities_json: Json | null
          id: string
          session_id: string
          sources_json: Json | null
          summary_md: string | null
          tenant_id: string
          title: string | null
        }
        Insert: {
          created_at?: string | null
          entities_json?: Json | null
          id?: string
          session_id: string
          sources_json?: Json | null
          summary_md?: string | null
          tenant_id: string
          title?: string | null
        }
        Update: {
          created_at?: string | null
          entities_json?: Json | null
          id?: string
          session_id?: string
          sources_json?: Json | null
          summary_md?: string | null
          tenant_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_sessions: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          mode: string
          query_json: Json | null
          query_text: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          mode: string
          query_json?: Json | null
          query_text: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          mode?: string
          query_json?: Json | null
          query_text?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
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
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_desk_requests: {
        Row: {
          commission_agreement: Json | null
          created_at: string
          id: string
          project_id: string
          requested_at: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          commission_agreement?: Json | null
          created_at?: string
          id?: string
          project_id: string
          requested_at?: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commission_agreement?: Json | null
          created_at?: string
          id?: string
          project_id?: string
          requested_at?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_desk_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_desk_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_runs: {
        Row: {
          account_ids: string[] | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          results_summary: Json | null
          started_at: string
          status: Database["public"]["Enums"]["scan_status"] | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          account_ids?: string[] | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results_summary?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["scan_status"] | null
          tenant_id: string
          user_id: string
        }
        Update: {
          account_ids?: string[] | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results_summary?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["scan_status"] | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
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
          deleted_at: string | null
          disclosure_data: Json
          finance_package_id: string
          id: string
          public_id: string | null
          submitted_at: string | null
          submitted_by: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          disclosure_data?: Json
          finance_package_id: string
          id?: string
          public_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          disclosure_data?: Json
          finance_package_id?: string
          id?: string
          public_id?: string | null
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
      service_case_inbound: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_text: string | null
          created_at: string
          id: string
          match_confidence: string | null
          match_method: string | null
          matched_tender_id: string | null
          offer_amount_cents: number | null
          offer_notes: string | null
          offer_valid_until: string | null
          processed_at: string | null
          processed_by: string | null
          raw_payload: Json | null
          received_at: string
          sender_company: string | null
          sender_email: string
          sender_name: string | null
          sender_phone: string | null
          service_case_id: string | null
          status: string
          subject: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          match_confidence?: string | null
          match_method?: string | null
          matched_tender_id?: string | null
          offer_amount_cents?: number | null
          offer_notes?: string | null
          offer_valid_until?: string | null
          processed_at?: string | null
          processed_by?: string | null
          raw_payload?: Json | null
          received_at?: string
          sender_company?: string | null
          sender_email: string
          sender_name?: string | null
          sender_phone?: string | null
          service_case_id?: string | null
          status?: string
          subject?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          match_confidence?: string | null
          match_method?: string | null
          matched_tender_id?: string | null
          offer_amount_cents?: number | null
          offer_notes?: string | null
          offer_valid_until?: string | null
          processed_at?: string | null
          processed_by?: string | null
          raw_payload?: Json | null
          received_at?: string
          sender_company?: string | null
          sender_email?: string
          sender_name?: string | null
          sender_phone?: string | null
          service_case_id?: string | null
          status?: string
          subject?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_case_inbound_service_case_id_fkey"
            columns: ["service_case_id"]
            isOneToOne: false
            referencedRelation: "service_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_inbound_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_case_offers: {
        Row: {
          conditions: string | null
          contact_id: string | null
          created_at: string
          document_id: string | null
          execution_duration_days: number | null
          execution_end: string | null
          execution_start: string | null
          extracted_at: string | null
          file_name: string | null
          file_path: string | null
          id: string
          inbound_email_id: string | null
          is_selected: boolean | null
          notes: string | null
          offer_amount: number | null
          offer_amount_gross: number | null
          offer_amount_net: number | null
          offer_date: string | null
          positions: Json | null
          provider_contact_person: string | null
          provider_email: string | null
          provider_mobile: string | null
          provider_name: string | null
          provider_phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_case_id: string
          source: string | null
          status: string | null
          tenant_id: string
          total_gross: number | null
          total_net: number | null
          valid_until: string | null
        }
        Insert: {
          conditions?: string | null
          contact_id?: string | null
          created_at?: string
          document_id?: string | null
          execution_duration_days?: number | null
          execution_end?: string | null
          execution_start?: string | null
          extracted_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          inbound_email_id?: string | null
          is_selected?: boolean | null
          notes?: string | null
          offer_amount?: number | null
          offer_amount_gross?: number | null
          offer_amount_net?: number | null
          offer_date?: string | null
          positions?: Json | null
          provider_contact_person?: string | null
          provider_email?: string | null
          provider_mobile?: string | null
          provider_name?: string | null
          provider_phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_case_id: string
          source?: string | null
          status?: string | null
          tenant_id: string
          total_gross?: number | null
          total_net?: number | null
          valid_until?: string | null
        }
        Update: {
          conditions?: string | null
          contact_id?: string | null
          created_at?: string
          document_id?: string | null
          execution_duration_days?: number | null
          execution_end?: string | null
          execution_start?: string | null
          extracted_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          inbound_email_id?: string | null
          is_selected?: boolean | null
          notes?: string | null
          offer_amount?: number | null
          offer_amount_gross?: number | null
          offer_amount_net?: number | null
          offer_date?: string | null
          positions?: Json | null
          provider_contact_person?: string | null
          provider_email?: string | null
          provider_mobile?: string | null
          provider_name?: string | null
          provider_phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_case_id?: string
          source?: string | null
          status?: string | null
          tenant_id?: string
          total_gross?: number | null
          total_net?: number | null
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
            foreignKeyName: "service_case_offers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          attachments: Json | null
          body_html: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          dms_share_link: string | null
          email_template: string | null
          id: string
          is_award_mail: boolean | null
          recipient_contact_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          resend_message_id: string | null
          routing_token: string | null
          sent_at: string | null
          sent_by: string | null
          service_case_id: string
          status: string | null
          subject: string | null
          tenant_id: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          dms_share_link?: string | null
          email_template?: string | null
          id?: string
          is_award_mail?: boolean | null
          recipient_contact_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          resend_message_id?: string | null
          routing_token?: string | null
          sent_at?: string | null
          sent_by?: string | null
          service_case_id: string
          status?: string | null
          subject?: string | null
          tenant_id: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          dms_share_link?: string | null
          email_template?: string | null
          id?: string
          is_award_mail?: boolean | null
          recipient_contact_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          resend_message_id?: string | null
          routing_token?: string | null
          sent_at?: string | null
          sent_by?: string | null
          service_case_id?: string
          status?: string | null
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_case_outbound_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      service_case_providers: {
        Row: {
          award_notes: string | null
          awarded_at: string | null
          created_at: string
          email_sent_at: string | null
          email_status: string | null
          email_subject: string | null
          id: string
          is_awarded: boolean | null
          offer_amount_cents: number | null
          offer_notes: string | null
          offer_valid_until: string | null
          place_id: string | null
          provider_address: string | null
          provider_email: string | null
          provider_name: string
          provider_phone: string | null
          provider_website: string | null
          response_inbound_id: string | null
          response_received: boolean | null
          service_case_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          award_notes?: string | null
          awarded_at?: string | null
          created_at?: string
          email_sent_at?: string | null
          email_status?: string | null
          email_subject?: string | null
          id?: string
          is_awarded?: boolean | null
          offer_amount_cents?: number | null
          offer_notes?: string | null
          offer_valid_until?: string | null
          place_id?: string | null
          provider_address?: string | null
          provider_email?: string | null
          provider_name: string
          provider_phone?: string | null
          provider_website?: string | null
          response_inbound_id?: string | null
          response_received?: boolean | null
          service_case_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          award_notes?: string | null
          awarded_at?: string | null
          created_at?: string
          email_sent_at?: string | null
          email_status?: string | null
          email_subject?: string | null
          id?: string
          is_awarded?: boolean | null
          offer_amount_cents?: number | null
          offer_notes?: string | null
          offer_valid_until?: string | null
          place_id?: string | null
          provider_address?: string | null
          provider_email?: string | null
          provider_name?: string
          provider_phone?: string | null
          provider_website?: string | null
          response_inbound_id?: string | null
          response_received?: boolean | null
          service_case_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_case_providers_response_inbound_id_fkey"
            columns: ["response_inbound_id"]
            isOneToOne: false
            referencedRelation: "service_case_inbound"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_providers_service_case_id_fkey"
            columns: ["service_case_id"]
            isOneToOne: false
            referencedRelation: "service_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_case_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_cases: {
        Row: {
          ai_analysis_data: Json | null
          award_confirmed_at: string | null
          award_sent_at: string | null
          awarded_amount: number | null
          awarded_to_contact_id: string | null
          budget_estimate: number | null
          category: string
          completed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cost_estimate_generated_at: string | null
          cost_estimate_max: number | null
          cost_estimate_mid: number | null
          cost_estimate_min: number | null
          created_at: string
          created_by: string | null
          deadline_execution_end: string | null
          deadline_execution_start: string | null
          deadline_offers: string | null
          description: string | null
          dms_folder_id: string | null
          external_lv_document_id: string | null
          id: string
          property_id: string
          public_id: string
          room_analysis: Json | null
          scope_attachments: Json | null
          scope_description: string | null
          scope_line_items: Json | null
          scope_source: string | null
          scope_status: string | null
          status: string
          tenant_id: string
          tender_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          ai_analysis_data?: Json | null
          award_confirmed_at?: string | null
          award_sent_at?: string | null
          awarded_amount?: number | null
          awarded_to_contact_id?: string | null
          budget_estimate?: number | null
          category: string
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cost_estimate_generated_at?: string | null
          cost_estimate_max?: number | null
          cost_estimate_mid?: number | null
          cost_estimate_min?: number | null
          created_at?: string
          created_by?: string | null
          deadline_execution_end?: string | null
          deadline_execution_start?: string | null
          deadline_offers?: string | null
          description?: string | null
          dms_folder_id?: string | null
          external_lv_document_id?: string | null
          id?: string
          property_id: string
          public_id?: string
          room_analysis?: Json | null
          scope_attachments?: Json | null
          scope_description?: string | null
          scope_line_items?: Json | null
          scope_source?: string | null
          scope_status?: string | null
          status?: string
          tenant_id: string
          tender_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_analysis_data?: Json | null
          award_confirmed_at?: string | null
          award_sent_at?: string | null
          awarded_amount?: number | null
          awarded_to_contact_id?: string | null
          budget_estimate?: number | null
          category?: string
          completed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cost_estimate_generated_at?: string | null
          cost_estimate_max?: number | null
          cost_estimate_mid?: number | null
          cost_estimate_min?: number | null
          created_at?: string
          created_by?: string | null
          deadline_execution_end?: string | null
          deadline_execution_start?: string | null
          deadline_offers?: string | null
          description?: string | null
          dms_folder_id?: string | null
          external_lv_document_id?: string | null
          id?: string
          property_id?: string
          public_id?: string
          room_analysis?: Json | null
          scope_attachments?: Json | null
          scope_description?: string | null
          scope_line_items?: Json | null
          scope_source?: string | null
          scope_status?: string | null
          status?: string
          tenant_id?: string
          tender_id?: string | null
          title?: string
          unit_id?: string | null
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
            foreignKeyName: "service_cases_dms_folder_id_fkey"
            columns: ["dms_folder_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cases_external_lv_document_id_fkey"
            columns: ["external_lv_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
          {
            foreignKeyName: "service_cases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      service_shop_config: {
        Row: {
          affiliate_network: string | null
          api_credentials: Json | null
          config: Json | null
          created_at: string | null
          display_name: string | null
          id: string
          is_connected: boolean | null
          metadata_schema: Json | null
          shop_key: string
          updated_at: string | null
        }
        Insert: {
          affiliate_network?: string | null
          api_credentials?: Json | null
          config?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_connected?: boolean | null
          metadata_schema?: Json | null
          shop_key: string
          updated_at?: string | null
        }
        Update: {
          affiliate_network?: string | null
          api_credentials?: Json | null
          config?: Json | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_connected?: boolean | null
          metadata_schema?: Json | null
          shop_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_shop_products: {
        Row: {
          affiliate_network: string | null
          affiliate_tag: string | null
          badge: string | null
          category: string | null
          created_at: string | null
          description: string | null
          external_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          price_cents: number | null
          price_label: string | null
          shop_key: string
          sort_order: number | null
          sub_category: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_network?: string | null
          affiliate_tag?: string | null
          badge?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price_cents?: number | null
          price_label?: string | null
          shop_key: string
          sort_order?: number | null
          sub_category?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_network?: string | null
          affiliate_tag?: string | null
          badge?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price_cents?: number | null
          price_label?: string | null
          shop_key?: string
          sort_order?: number | null
          sub_category?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      soat_search_orders: {
        Row: {
          counters_json: Json | null
          created_at: string
          created_by: string | null
          desk: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          intent: string | null
          last_heartbeat_at: string | null
          phase: string | null
          progress_percent: number | null
          provider_plan_json: Json | null
          started_at: string | null
          status: string
          target_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          counters_json?: Json | null
          created_at?: string
          created_by?: string | null
          desk?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          intent?: string | null
          last_heartbeat_at?: string | null
          phase?: string | null
          progress_percent?: number | null
          provider_plan_json?: Json | null
          started_at?: string | null
          status?: string
          target_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          counters_json?: Json | null
          created_at?: string
          created_by?: string | null
          desk?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          intent?: string | null
          last_heartbeat_at?: string | null
          phase?: string | null
          progress_percent?: number | null
          provider_plan_json?: Json | null
          started_at?: string | null
          status?: string
          target_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      soat_search_results: {
        Row: {
          address_line: string | null
          category: string | null
          city: string | null
          company_name: string | null
          confidence_score: number | null
          contact_person_name: string | null
          contact_person_role: string | null
          country: string | null
          created_at: string
          dedupe_hash: string | null
          email: string | null
          entity_type: string | null
          first_name: string | null
          id: string
          last_name: string | null
          order_id: string
          phone: string | null
          postal_code: string | null
          salutation: string | null
          source_refs_json: Json | null
          suppression_reason: string | null
          validation_state: string | null
          website_url: string | null
        }
        Insert: {
          address_line?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          confidence_score?: number | null
          contact_person_name?: string | null
          contact_person_role?: string | null
          country?: string | null
          created_at?: string
          dedupe_hash?: string | null
          email?: string | null
          entity_type?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          order_id: string
          phone?: string | null
          postal_code?: string | null
          salutation?: string | null
          source_refs_json?: Json | null
          suppression_reason?: string | null
          validation_state?: string | null
          website_url?: string | null
        }
        Update: {
          address_line?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          confidence_score?: number | null
          contact_person_name?: string | null
          contact_person_role?: string | null
          country?: string | null
          created_at?: string
          dedupe_hash?: string | null
          email?: string | null
          entity_type?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          order_id?: string
          phone?: string | null
          postal_code?: string | null
          salutation?: string | null
          source_refs_json?: Json | null
          suppression_reason?: string | null
          validation_state?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soat_search_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "soat_search_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      social_assets: {
        Row: {
          asset_type: string
          created_at: string
          document_id: string
          id: string
          owner_user_id: string
          sort_order: number
          tags: string[] | null
          tenant_id: string
        }
        Insert: {
          asset_type?: string
          created_at?: string
          document_id: string
          id?: string
          owner_user_id: string
          sort_order?: number
          tags?: string[] | null
          tenant_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          document_id?: string
          id?: string
          owner_user_id?: string
          sort_order?: number
          tags?: string[] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_brand_assets: {
        Row: {
          active: boolean
          brand_context: string
          created_at: string
          display_name: string
          id: string
          meta_ad_account_id: string | null
          meta_ig_actor_id: string | null
          meta_page_id: string | null
        }
        Insert: {
          active?: boolean
          brand_context: string
          created_at?: string
          display_name: string
          id?: string
          meta_ad_account_id?: string | null
          meta_ig_actor_id?: string | null
          meta_page_id?: string | null
        }
        Update: {
          active?: boolean
          brand_context?: string
          created_at?: string
          display_name?: string
          id?: string
          meta_ad_account_id?: string | null
          meta_ig_actor_id?: string | null
          meta_page_id?: string | null
        }
        Relationships: []
      }
      social_budget_caps: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          manager_user_id: string
          monthly_cap_cents: number
          spend_month_to_date_cents: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          manager_user_id: string
          monthly_cap_cents?: number
          spend_month_to_date_cents?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          manager_user_id?: string
          monthly_cap_cents?: number
          spend_month_to_date_cents?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_budget_caps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_campaigns: {
        Row: {
          budget_cents: number | null
          campaign_type: string
          created_at: string
          creative_ids: string[] | null
          end_date: string | null
          id: string
          name: string
          owner_role: string
          platform_targets: Json | null
          spend_cents: number | null
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          budget_cents?: number | null
          campaign_type?: string
          created_at?: string
          creative_ids?: string[] | null
          end_date?: string | null
          id?: string
          name: string
          owner_role?: string
          platform_targets?: Json | null
          spend_cents?: number | null
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          budget_cents?: number | null
          campaign_type?: string
          created_at?: string
          creative_ids?: string[] | null
          end_date?: string | null
          id?: string
          name?: string
          owner_role?: string
          platform_targets?: Json | null
          spend_cents?: number | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_creatives: {
        Row: {
          assets_document_ids: string[] | null
          campaign_id: string | null
          caption_text: string | null
          created_at: string
          cta_variant: string | null
          id: string
          mandate_id: string | null
          rendered_document_ids: string[] | null
          slideshow_outline: Json | null
          slot_key: string | null
          status: string
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assets_document_ids?: string[] | null
          campaign_id?: string | null
          caption_text?: string | null
          created_at?: string
          cta_variant?: string | null
          id?: string
          mandate_id?: string | null
          rendered_document_ids?: string[] | null
          slideshow_outline?: Json | null
          slot_key?: string | null
          status?: string
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assets_document_ids?: string[] | null
          campaign_id?: string | null
          caption_text?: string | null
          created_at?: string
          cta_variant?: string | null
          id?: string
          mandate_id?: string | null
          rendered_document_ids?: string[] | null
          slideshow_outline?: Json | null
          slot_key?: string | null
          status?: string
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_creatives_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "social_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_creatives_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "social_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_creatives_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_drafts: {
        Row: {
          assets_used: string[] | null
          carousel: Json | null
          content_facebook: string | null
          content_instagram: string | null
          content_linkedin: string | null
          created_at: string
          draft_title: string | null
          generation_metadata: Json | null
          id: string
          inbound_item_id: string | null
          inspiration_source_ids: string[] | null
          origin: string
          owner_user_id: string
          planned_at: string | null
          platform_targets: string[] | null
          posted_at: string | null
          status: string
          storyboard: Json | null
          tenant_id: string
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          assets_used?: string[] | null
          carousel?: Json | null
          content_facebook?: string | null
          content_instagram?: string | null
          content_linkedin?: string | null
          created_at?: string
          draft_title?: string | null
          generation_metadata?: Json | null
          id?: string
          inbound_item_id?: string | null
          inspiration_source_ids?: string[] | null
          origin?: string
          owner_user_id: string
          planned_at?: string | null
          platform_targets?: string[] | null
          posted_at?: string | null
          status?: string
          storyboard?: Json | null
          tenant_id: string
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          assets_used?: string[] | null
          carousel?: Json | null
          content_facebook?: string | null
          content_instagram?: string | null
          content_linkedin?: string | null
          created_at?: string
          draft_title?: string | null
          generation_metadata?: Json | null
          id?: string
          inbound_item_id?: string | null
          inspiration_source_ids?: string[] | null
          origin?: string
          owner_user_id?: string
          planned_at?: string | null
          platform_targets?: string[] | null
          posted_at?: string | null
          status?: string
          storyboard?: Json | null
          tenant_id?: string
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_drafts_inbound_item_id_fkey"
            columns: ["inbound_item_id"]
            isOneToOne: false
            referencedRelation: "social_inbound_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_drafts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_drafts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "social_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      social_inbound_items: {
        Row: {
          created_at: string
          desired_effect: string | null
          id: string
          media_document_ids: string[] | null
          moment_voice_text: string | null
          one_liner: string | null
          owner_user_id: string
          personal_level: number | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desired_effect?: string | null
          id?: string
          media_document_ids?: string[] | null
          moment_voice_text?: string | null
          one_liner?: string | null
          owner_user_id: string
          personal_level?: number | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desired_effect?: string | null
          id?: string
          media_document_ids?: string[] | null
          moment_voice_text?: string | null
          one_liner?: string | null
          owner_user_id?: string
          personal_level?: number | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_inbound_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_inspiration_samples: {
        Row: {
          content_text: string | null
          created_at: string
          document_id: string | null
          extracted_patterns: Json | null
          id: string
          sample_type: string
          source_id: string
          tenant_id: string
        }
        Insert: {
          content_text?: string | null
          created_at?: string
          document_id?: string | null
          extracted_patterns?: Json | null
          id?: string
          sample_type?: string
          source_id: string
          tenant_id: string
        }
        Update: {
          content_text?: string | null
          created_at?: string
          document_id?: string | null
          extracted_patterns?: Json | null
          id?: string
          sample_type?: string
          source_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_inspiration_samples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "social_inspiration_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_inspiration_samples_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_inspiration_sources: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          notes: string | null
          owner_user_id: string
          platform: string
          profile_url: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_user_id: string
          platform?: string
          profile_url?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_user_id?: string
          platform?: string
          profile_url?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_inspiration_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_lead_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string
          payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "social_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      social_leads: {
        Row: {
          autoresponder_status: string
          brand_context: string | null
          campaign_id: string | null
          consent_flags: Json | null
          created_at: string
          id: string
          lead_data: Json | null
          lead_status: string
          mandate_id: string | null
          meta_payload_raw: Json | null
          notes: string | null
          partner_user_id: string | null
          platform: string | null
          routed_to_zone2: boolean
          source: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          autoresponder_status?: string
          brand_context?: string | null
          campaign_id?: string | null
          consent_flags?: Json | null
          created_at?: string
          id?: string
          lead_data?: Json | null
          lead_status?: string
          mandate_id?: string | null
          meta_payload_raw?: Json | null
          notes?: string | null
          partner_user_id?: string | null
          platform?: string | null
          routed_to_zone2?: boolean
          source?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          autoresponder_status?: string
          brand_context?: string | null
          campaign_id?: string | null
          consent_flags?: Json | null
          created_at?: string
          id?: string
          lead_data?: Json | null
          lead_status?: string
          mandate_id?: string | null
          meta_payload_raw?: Json | null
          notes?: string | null
          partner_user_id?: string | null
          platform?: string | null
          routed_to_zone2?: boolean
          source?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_leads_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "social_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_mandates: {
        Row: {
          audience_preset: Json | null
          brand_context: string
          budget_total_cents: number | null
          created_at: string
          end_date: string | null
          id: string
          partner_display_name: string | null
          partner_user_id: string
          payment_ref: Json | null
          payment_status: string
          personalization: Json | null
          project_id: string | null
          publishing_meta: Json | null
          regions: Json | null
          start_date: string | null
          status: string
          template_slots: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audience_preset?: Json | null
          brand_context?: string
          budget_total_cents?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          partner_display_name?: string | null
          partner_user_id: string
          payment_ref?: Json | null
          payment_status?: string
          personalization?: Json | null
          project_id?: string | null
          publishing_meta?: Json | null
          regions?: Json | null
          start_date?: string | null
          status?: string
          template_slots?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audience_preset?: Json | null
          brand_context?: string
          budget_total_cents?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          partner_display_name?: string | null
          partner_user_id?: string
          payment_ref?: Json | null
          payment_status?: string
          personalization?: Json | null
          project_id?: string | null
          publishing_meta?: Json | null
          regions?: Json | null
          start_date?: string | null
          status?: string
          template_slots?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_mandates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_mandates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_meta_mapping: {
        Row: {
          created_at: string
          id: string
          last_sync_at: string | null
          mandate_id: string
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          meta_creative_id: string | null
          meta_form_id: string | null
          meta_page_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          mandate_id: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          meta_creative_id?: string | null
          meta_form_id?: string | null
          meta_page_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          mandate_id?: string
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          meta_creative_id?: string | null
          meta_form_id?: string | null
          meta_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_meta_mapping_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "social_mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      social_metrics: {
        Row: {
          clicks: number | null
          collected_at: string
          comments: number | null
          created_at: string
          draft_id: string
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          saves: number | null
          tenant_id: string
        }
        Insert: {
          clicks?: number | null
          collected_at?: string
          comments?: number | null
          created_at?: string
          draft_id: string
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          saves?: number | null
          tenant_id: string
        }
        Update: {
          clicks?: number | null
          collected_at?: string
          comments?: number | null
          created_at?: string
          draft_id?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          saves?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "social_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_personality_profiles: {
        Row: {
          answers_raw: Json | null
          audit_version: number
          created_at: string
          id: string
          owner_user_id: string
          personality_vector: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          answers_raw?: Json | null
          audit_version?: number
          created_at?: string
          id?: string
          owner_user_id: string
          personality_vector?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          answers_raw?: Json | null
          audit_version?: number
          created_at?: string
          id?: string
          owner_user_id?: string
          personality_vector?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_personality_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_templates: {
        Row: {
          active: boolean
          approved: boolean | null
          approved_at: string | null
          approved_by: string | null
          brand_context: string
          campaign_defaults: Json | null
          ci_rules: Json | null
          code: string
          created_at: string
          description: string | null
          editable_fields_schema: Json | null
          format_type: string
          id: string
          image_url: string | null
          image_urls: Json | null
          name: string
          preview_document_id: string | null
          target_audience: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          brand_context?: string
          campaign_defaults?: Json | null
          ci_rules?: Json | null
          code: string
          created_at?: string
          description?: string | null
          editable_fields_schema?: Json | null
          format_type?: string
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          name: string
          preview_document_id?: string | null
          target_audience?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          brand_context?: string
          campaign_defaults?: Json | null
          ci_rules?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          editable_fields_schema?: Json | null
          format_type?: string
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          name?: string
          preview_document_id?: string | null
          target_audience?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_topics: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          owner_user_id: string
          priority: number
          tenant_id: string
          topic_briefing: Json | null
          topic_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_user_id: string
          priority?: number
          tenant_id: string
          topic_briefing?: Json | null
          topic_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_user_id?: string
          priority?: number
          tenant_id?: string
          topic_briefing?: Json | null
          topic_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_topics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_video_jobs: {
        Row: {
          created_at: string
          draft_id: string
          id: string
          input_payload: Json | null
          job_type: string
          provider: string
          result_document_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_id: string
          id?: string
          input_payload?: Json | null
          job_type?: string
          provider?: string
          result_document_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_id?: string
          id?: string
          input_payload?: Json | null
          job_type?: string
          provider?: string
          result_document_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_video_jobs_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "social_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_video_jobs_tenant_id_fkey"
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
          dev_project_id: string | null
          dev_project_unit_id: string | null
          doc_type_hint: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          mime_type: string | null
          module_code: string | null
          name: string
          node_type: string
          parent_id: string | null
          property_id: string | null
          pv_plant_id: string | null
          scope_hint: string | null
          sort_index: number | null
          storage_path: string | null
          template_id: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string | null
          dev_project_id?: string | null
          dev_project_unit_id?: string | null
          doc_type_hint?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          mime_type?: string | null
          module_code?: string | null
          name: string
          node_type?: string
          parent_id?: string | null
          property_id?: string | null
          pv_plant_id?: string | null
          scope_hint?: string | null
          sort_index?: number | null
          storage_path?: string | null
          template_id?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string | null
          dev_project_id?: string | null
          dev_project_unit_id?: string | null
          doc_type_hint?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          mime_type?: string | null
          module_code?: string | null
          name?: string
          node_type?: string
          parent_id?: string | null
          property_id?: string | null
          pv_plant_id?: string | null
          scope_hint?: string | null
          sort_index?: number | null
          storage_path?: string | null
          template_id?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_nodes_dev_project_id_fkey"
            columns: ["dev_project_id"]
            isOneToOne: false
            referencedRelation: "dev_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_nodes_dev_project_unit_id_fkey"
            columns: ["dev_project_unit_id"]
            isOneToOne: false
            referencedRelation: "dev_project_units"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "storage_nodes_pv_plant_id_fkey"
            columns: ["pv_plant_id"]
            isOneToOne: false
            referencedRelation: "pv_plants"
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
      task_widgets: {
        Row: {
          action_code: string | null
          completed_at: string | null
          cost_model: string
          created_at: string
          description: string | null
          id: string
          parameters: Json | null
          risk_level: string
          source: string
          source_ref: string | null
          status: string
          tenant_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_code?: string | null
          completed_at?: string | null
          cost_model?: string
          created_at?: string
          description?: string | null
          id?: string
          parameters?: Json | null
          risk_level?: string
          source?: string
          source_ref?: string | null
          status?: string
          tenant_id: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_code?: string | null
          completed_at?: string | null
          cost_model?: string
          created_at?: string
          description?: string | null
          id?: string
          parameters?: Json | null
          risk_level?: string
          source?: string
          source_ref?: string | null
          status?: string
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
      tenant_credit_balance: {
        Row: {
          balance_credits: number
          created_at: string
          id: string
          last_topup_at: string | null
          lifetime_consumed: number
          lifetime_purchased: number
          reserved_credits: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          balance_credits?: number
          created_at?: string
          id?: string
          last_topup_at?: string | null
          lifetime_consumed?: number
          lifetime_purchased?: number
          reserved_credits?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          balance_credits?: number
          created_at?: string
          id?: string
          last_topup_at?: string | null
          lifetime_consumed?: number
          lifetime_purchased?: number
          reserved_credits?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_credit_balance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_extraction_settings: {
        Row: {
          auto_enrich_contacts_email: boolean | null
          auto_enrich_contacts_post: boolean | null
          auto_extract_caya: boolean | null
          auto_extract_connectors: boolean | null
          auto_extract_resend: boolean | null
          created_at: string | null
          default_engine: string | null
          monthly_limit_cents: number | null
          notify_at_percent: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_enrich_contacts_email?: boolean | null
          auto_enrich_contacts_post?: boolean | null
          auto_extract_caya?: boolean | null
          auto_extract_connectors?: boolean | null
          auto_extract_resend?: boolean | null
          created_at?: string | null
          default_engine?: string | null
          monthly_limit_cents?: number | null
          notify_at_percent?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_enrich_contacts_email?: boolean | null
          auto_enrich_contacts_post?: boolean | null
          auto_extract_caya?: boolean | null
          auto_extract_connectors?: boolean | null
          auto_extract_resend?: boolean | null
          created_at?: string | null
          default_engine?: string | null
          monthly_limit_cents?: number | null
          notify_at_percent?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_extraction_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          activated_at: string | null
          created_at: string
          credits_per_month: number
          id: string
          is_active: boolean
          next_billing: string | null
          price_cents: number
          service_code: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          credits_per_month?: number
          id?: string
          is_active?: boolean
          next_billing?: string | null
          price_cents?: number
          service_code: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          credits_per_month?: number
          id?: string
          is_active?: boolean
          next_billing?: string | null
          price_cents?: number
          service_code?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
      tenant_websites: {
        Row: {
          branding_json: Json
          created_at: string
          created_by: string
          goal: string
          id: string
          industry: string | null
          name: string
          published_at: string | null
          seo_json: Json
          slug: string
          status: string
          target_audience: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branding_json?: Json
          created_at?: string
          created_by: string
          goal?: string
          id?: string
          industry?: string | null
          name: string
          published_at?: string | null
          seo_json?: Json
          slug: string
          status?: string
          target_audience?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branding_json?: Json
          created_at?: string
          created_by?: string
          goal?: string
          id?: string
          industry?: string | null
          name?: string
          published_at?: string | null
          seo_json?: Json
          slug?: string
          status?: string
          target_audience?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_websites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_websites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          tenant_id: string
        }
        Insert: {
          batch_id: string
          batch_name?: string | null
          entity_id: string
          entity_type: string
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          tenant_id: string
        }
        Update: {
          batch_id?: string
          batch_name?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_data_registry_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_data_registry_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tile_api_external: {
        Row: {
          auth_method: string | null
          created_at: string
          endpoint: string | null
          id: string
          lifecycle_status: string
          mapping_notes: string | null
          provider: string
          purpose: string | null
          tile_code: string
          updated_at: string
        }
        Insert: {
          auth_method?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          lifecycle_status?: string
          mapping_notes?: string | null
          provider: string
          purpose?: string | null
          tile_code: string
          updated_at?: string
        }
        Update: {
          auth_method?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          lifecycle_status?: string
          mapping_notes?: string | null
          provider?: string
          purpose?: string | null
          tile_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tile_api_external_tile_code_fkey"
            columns: ["tile_code"]
            isOneToOne: false
            referencedRelation: "tile_catalog"
            referencedColumns: ["tile_code"]
          },
        ]
      }
      tile_api_internal: {
        Row: {
          auth_roles: string[] | null
          created_at: string
          endpoint: string
          id: string
          lifecycle_status: string
          method: string
          purpose: string | null
          req_schema_ref: string | null
          resp_schema_ref: string | null
          tile_code: string
          updated_at: string
        }
        Insert: {
          auth_roles?: string[] | null
          created_at?: string
          endpoint: string
          id?: string
          lifecycle_status?: string
          method?: string
          purpose?: string | null
          req_schema_ref?: string | null
          resp_schema_ref?: string | null
          tile_code: string
          updated_at?: string
        }
        Update: {
          auth_roles?: string[] | null
          created_at?: string
          endpoint?: string
          id?: string
          lifecycle_status?: string
          method?: string
          purpose?: string | null
          req_schema_ref?: string | null
          resp_schema_ref?: string | null
          tile_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tile_api_internal_tile_code_fkey"
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
          external_api_refs: string[] | null
          flowchart_mermaid: string | null
          freeze_enabled: boolean
          freeze_reason: string | null
          frozen_at: string | null
          frozen_by: string | null
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
          flowchart_mermaid?: string | null
          freeze_enabled?: boolean
          freeze_reason?: string | null
          frozen_at?: string | null
          frozen_by?: string | null
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
          flowchart_mermaid?: string | null
          freeze_enabled?: boolean
          freeze_reason?: string | null
          frozen_at?: string | null
          frozen_by?: string | null
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
      tile_changelog: {
        Row: {
          change_note: string
          changed_at: string
          changed_by: string | null
          id: string
          tile_code: string
        }
        Insert: {
          change_note: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          tile_code: string
        }
        Update: {
          change_note?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          tile_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tile_changelog_tile_code_fkey"
            columns: ["tile_code"]
            isOneToOne: false
            referencedRelation: "tile_catalog"
            referencedColumns: ["tile_code"]
          },
        ]
      }
      units: {
        Row: {
          ancillary_costs: number | null
          area_sqm: number | null
          area_usable_sqm: number | null
          balcony_flag: boolean | null
          bathrooms_count: number | null
          code: string | null
          condition_grade: string | null
          created_at: string
          current_monthly_rent: number | null
          dossier_asof_date: string | null
          dossier_data_quality: string | null
          energy_certificate_type: string | null
          energy_certificate_valid_until: string | null
          energy_certificate_value: number | null
          expose_headline: string | null
          expose_subline: string | null
          features_tags: Json | null
          floor: number | null
          garden_flag: boolean | null
          hausgeld_monthly: number | null
          heating_supply: string | null
          id: string
          last_renovation_year: number | null
          mea_share: number | null
          parking_count: number | null
          position: string | null
          property_id: string
          public_id: string
          rooms: number | null
          tenant_id: string
          unit_number: string
          updated_at: string
          usage_type: string | null
          vacancy_days: number | null
        }
        Insert: {
          ancillary_costs?: number | null
          area_sqm?: number | null
          area_usable_sqm?: number | null
          balcony_flag?: boolean | null
          bathrooms_count?: number | null
          code?: string | null
          condition_grade?: string | null
          created_at?: string
          current_monthly_rent?: number | null
          dossier_asof_date?: string | null
          dossier_data_quality?: string | null
          energy_certificate_type?: string | null
          energy_certificate_valid_until?: string | null
          energy_certificate_value?: number | null
          expose_headline?: string | null
          expose_subline?: string | null
          features_tags?: Json | null
          floor?: number | null
          garden_flag?: boolean | null
          hausgeld_monthly?: number | null
          heating_supply?: string | null
          id?: string
          last_renovation_year?: number | null
          mea_share?: number | null
          parking_count?: number | null
          position?: string | null
          property_id: string
          public_id: string
          rooms?: number | null
          tenant_id: string
          unit_number?: string
          updated_at?: string
          usage_type?: string | null
          vacancy_days?: number | null
        }
        Update: {
          ancillary_costs?: number | null
          area_sqm?: number | null
          area_usable_sqm?: number | null
          balcony_flag?: boolean | null
          bathrooms_count?: number | null
          code?: string | null
          condition_grade?: string | null
          created_at?: string
          current_monthly_rent?: number | null
          dossier_asof_date?: string | null
          dossier_data_quality?: string | null
          energy_certificate_type?: string | null
          energy_certificate_valid_until?: string | null
          energy_certificate_value?: number | null
          expose_headline?: string | null
          expose_subline?: string | null
          features_tags?: Json | null
          floor?: number | null
          garden_flag?: boolean | null
          hausgeld_monthly?: number | null
          heating_supply?: string | null
          id?: string
          last_renovation_year?: number | null
          mea_share?: number | null
          parking_count?: number | null
          position?: string | null
          property_id?: string
          public_id?: string
          rooms?: number | null
          tenant_id?: string
          unit_number?: string
          updated_at?: string
          usage_type?: string | null
          vacancy_days?: number | null
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
          compliance_doc_id: string | null
          compliance_version: number | null
          consented_at: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          status: Database["public"]["Enums"]["consent_status"]
          template_id: string | null
          template_version: number | null
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          compliance_doc_id?: string | null
          compliance_version?: number | null
          consented_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          status?: Database["public"]["Enums"]["consent_status"]
          template_id?: string | null
          template_version?: number | null
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          compliance_doc_id?: string | null
          compliance_version?: number | null
          consented_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          status?: Database["public"]["Enums"]["consent_status"]
          template_id?: string | null
          template_version?: number | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_compliance_doc_id_fkey"
            columns: ["compliance_doc_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
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
      user_contact_links: {
        Row: {
          contact_id: string
          created_at: string
          folder: string | null
          id: string
          in_outreach_queue: boolean | null
          mandate_id: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          folder?: string | null
          id?: string
          in_outreach_queue?: boolean | null
          mandate_id?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          folder?: string | null
          id?: string
          in_outreach_queue?: boolean | null
          mandate_id?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_contact_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_contact_links_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "acq_mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_outbound_identities: {
        Row: {
          brand_key: string
          created_at: string
          display_name: string
          from_email: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_key: string
          created_at?: string
          display_name?: string
          from_email: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_key?: string
          created_at?: string
          display_name?: string
          from_email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          amount: number | null
          amount_max: number | null
          auto_renew: boolean | null
          category: Database["public"]["Enums"]["subscription_category"] | null
          confidence: number | null
          created_at: string
          custom_name: string | null
          estimated_renewal: string | null
          estimated_start: string | null
          frequency: string | null
          id: string
          last_payment_date: string | null
          merchant: string | null
          notes: string | null
          payment_source_account_id: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          amount_max?: number | null
          auto_renew?: boolean | null
          category?: Database["public"]["Enums"]["subscription_category"] | null
          confidence?: number | null
          created_at?: string
          custom_name?: string | null
          estimated_renewal?: string | null
          estimated_start?: string | null
          frequency?: string | null
          id?: string
          last_payment_date?: string | null
          merchant?: string | null
          notes?: string | null
          payment_source_account_id?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          amount_max?: number | null
          auto_renew?: boolean | null
          category?: Database["public"]["Enums"]["subscription_category"] | null
          confidence?: number | null
          created_at?: string
          custom_name?: string | null
          estimated_renewal?: string | null
          estimated_start?: string | null
          frequency?: string | null
          id?: string
          last_payment_date?: string | null
          merchant?: string | null
          notes?: string | null
          payment_source_account_id?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      video_call_invites: {
        Row: {
          call_id: string
          created_at: string
          expires_at: string | null
          id: string
          invited_by_user_id: string | null
          invitee_email: string
          invitee_name: string | null
          joined_at: string | null
          opened_at: string | null
          sent_at: string | null
          status: string
          token_hash: string
        }
        Insert: {
          call_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invited_by_user_id?: string | null
          invitee_email: string
          invitee_name?: string | null
          joined_at?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          token_hash: string
        }
        Update: {
          call_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invited_by_user_id?: string | null
          invitee_email?: string
          invitee_name?: string | null
          joined_at?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_call_invites_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "video_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      video_call_participants: {
        Row: {
          call_id: string
          display_name: string | null
          email: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          call_id: string
          display_name?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          call_id?: string
          display_name?: string | null
          email?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "video_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      video_calls: {
        Row: {
          created_at: string
          ends_at: string | null
          expires_at: string | null
          host_user_id: string
          id: string
          livekit_room_name: string
          starts_at: string | null
          status: string
          tenant_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          expires_at?: string | null
          host_user_id: string
          id?: string
          livekit_room_name: string
          starts_at?: string | null
          status?: string
          tenant_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          expires_at?: string | null
          host_user_id?: string
          id?: string
          livekit_room_name?: string
          starts_at?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vorsorge_contracts: {
        Row: {
          balance_date: string | null
          bu_monthly_benefit: number | null
          category: string
          contract_no: string | null
          contract_type: string | null
          created_at: string
          current_balance: number | null
          dynamics_percent: number | null
          end_date: string | null
          growth_rate_override: number | null
          id: string
          insured_sum: number | null
          monthly_benefit: number | null
          notes: string | null
          payment_interval:
            | Database["public"]["Enums"]["payment_interval"]
            | null
          person_id: string | null
          premium: number | null
          projected_end_value: number | null
          provider: string | null
          start_date: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_date?: string | null
          bu_monthly_benefit?: number | null
          category?: string
          contract_no?: string | null
          contract_type?: string | null
          created_at?: string
          current_balance?: number | null
          dynamics_percent?: number | null
          end_date?: string | null
          growth_rate_override?: number | null
          id?: string
          insured_sum?: number | null
          monthly_benefit?: number | null
          notes?: string | null
          payment_interval?:
            | Database["public"]["Enums"]["payment_interval"]
            | null
          person_id?: string | null
          premium?: number | null
          projected_end_value?: number | null
          provider?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_date?: string | null
          bu_monthly_benefit?: number | null
          category?: string
          contract_no?: string | null
          contract_type?: string | null
          created_at?: string
          current_balance?: number | null
          dynamics_percent?: number | null
          end_date?: string | null
          growth_rate_override?: number | null
          id?: string
          insured_sum?: number | null
          monthly_benefit?: number | null
          notes?: string | null
          payment_interval?:
            | Database["public"]["Enums"]["payment_interval"]
            | null
          person_id?: string | null
          premium?: number | null
          projected_end_value?: number | null
          provider?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vorsorge_contracts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "household_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      vv_annual_data: {
        Row: {
          confirmed: boolean | null
          cost_bank_fees: number | null
          cost_disagio: number | null
          cost_financing_fees: number | null
          cost_insurance_non_recoverable: number | null
          cost_legal_advisory: number | null
          cost_maintenance: number | null
          cost_management_fee: number | null
          cost_other: number | null
          cost_travel: number | null
          created_at: string | null
          heritage_afa_amount: number | null
          id: string
          income_insurance_payout: number | null
          income_other: number | null
          locked_at: string | null
          notes: string | null
          property_id: string
          relative_rental: boolean | null
          special_afa_amount: number | null
          status: string | null
          tax_year: number
          tenant_id: string
          updated_at: string | null
          vacancy_days: number | null
          vacancy_intent_confirmed: boolean | null
        }
        Insert: {
          confirmed?: boolean | null
          cost_bank_fees?: number | null
          cost_disagio?: number | null
          cost_financing_fees?: number | null
          cost_insurance_non_recoverable?: number | null
          cost_legal_advisory?: number | null
          cost_maintenance?: number | null
          cost_management_fee?: number | null
          cost_other?: number | null
          cost_travel?: number | null
          created_at?: string | null
          heritage_afa_amount?: number | null
          id?: string
          income_insurance_payout?: number | null
          income_other?: number | null
          locked_at?: string | null
          notes?: string | null
          property_id: string
          relative_rental?: boolean | null
          special_afa_amount?: number | null
          status?: string | null
          tax_year: number
          tenant_id: string
          updated_at?: string | null
          vacancy_days?: number | null
          vacancy_intent_confirmed?: boolean | null
        }
        Update: {
          confirmed?: boolean | null
          cost_bank_fees?: number | null
          cost_disagio?: number | null
          cost_financing_fees?: number | null
          cost_insurance_non_recoverable?: number | null
          cost_legal_advisory?: number | null
          cost_maintenance?: number | null
          cost_management_fee?: number | null
          cost_other?: number | null
          cost_travel?: number | null
          created_at?: string | null
          heritage_afa_amount?: number | null
          id?: string
          income_insurance_payout?: number | null
          income_other?: number | null
          locked_at?: string | null
          notes?: string | null
          property_id?: string
          relative_rental?: boolean | null
          special_afa_amount?: number | null
          status?: string | null
          tax_year?: number
          tenant_id?: string
          updated_at?: string | null
          vacancy_days?: number | null
          vacancy_intent_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vv_annual_data_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vv_annual_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          tenant_id: string
          title: string
          website_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          tenant_id: string
          title: string
          website_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          tenant_id?: string
          title?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      website_sections: {
        Row: {
          content_json: Json
          created_at: string
          design_json: Json
          id: string
          is_visible: boolean
          page_id: string
          section_type: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content_json?: Json
          created_at?: string
          design_json?: Json
          id?: string
          is_visible?: boolean
          page_id: string
          section_type: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content_json?: Json
          created_at?: string
          design_json?: Json
          id?: string
          is_visible?: boolean
          page_id?: string
          section_type?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "website_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_versions: {
        Row: {
          id: string
          published_at: string
          published_by: string
          snapshot_json: Json
          tenant_id: string
          version_number: number
          website_id: string
        }
        Insert: {
          id?: string
          published_at?: string
          published_by: string
          snapshot_json: Json
          tenant_id: string
          version_number: number
          website_id: string
        }
        Update: {
          id?: string
          published_at?: string
          published_by?: string
          snapshot_json?: Json
          tenant_id?: string
          version_number?: number
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_versions_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "tenant_websites"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          access_token_ref: string | null
          business_account_id: string | null
          created_at: string
          id: string
          phone_number_id: string
          status: string
          system_phone_e164: string
          tenant_id: string
          updated_at: string
          waba_provider: string
          webhook_verify_token: string | null
        }
        Insert: {
          access_token_ref?: string | null
          business_account_id?: string | null
          created_at?: string
          id?: string
          phone_number_id: string
          status?: string
          system_phone_e164: string
          tenant_id: string
          updated_at?: string
          waba_provider?: string
          webhook_verify_token?: string | null
        }
        Update: {
          access_token_ref?: string | null
          business_account_id?: string | null
          created_at?: string
          id?: string
          phone_number_id?: string
          status?: string
          system_phone_e164?: string
          tenant_id?: string
          updated_at?: string
          waba_provider?: string
          webhook_verify_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          message_id: string
          mime_type: string | null
          size_bytes: number | null
          storage_node_id: string | null
          tenant_id: string
          wa_media_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          message_id: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_node_id?: string | null
          tenant_id: string
          wa_media_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_node_id?: string | null
          tenant_id?: string
          wa_media_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_attachments_storage_node_id_fkey"
            columns: ["storage_node_id"]
            isOneToOne: false
            referencedRelation: "storage_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          created_at: string
          id: string
          is_owner_control: boolean
          last_message_at: string | null
          tenant_id: string
          unread_count: number
          updated_at: string
          wa_contact_e164: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          id?: string
          is_owner_control?: boolean
          last_message_at?: string | null
          tenant_id: string
          unread_count?: number
          updated_at?: string
          wa_contact_e164: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          id?: string
          is_owner_control?: boolean
          last_message_at?: string | null
          tenant_id?: string
          unread_count?: number
          updated_at?: string
          wa_contact_e164?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body_text: string | null
          conversation_id: string
          created_at: string
          direction: string
          from_e164: string
          id: string
          media_count: number
          message_type: string
          owner_control_command: boolean
          raw_payload: Json | null
          status: string
          tenant_id: string
          to_e164: string
          wa_message_id: string | null
        }
        Insert: {
          body_text?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          from_e164: string
          id?: string
          media_count?: number
          message_type?: string
          owner_control_command?: boolean
          raw_payload?: Json | null
          status?: string
          tenant_id: string
          to_e164: string
          wa_message_id?: string | null
        }
        Update: {
          body_text?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          from_e164?: string
          id?: string
          media_count?: number
          message_type?: string
          owner_control_command?: boolean
          raw_payload?: Json | null
          status?: string
          tenant_id?: string
          to_e164?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_user_settings: {
        Row: {
          auto_reply_enabled: boolean
          auto_reply_text: string | null
          created_at: string
          id: string
          owner_control_e164: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reply_enabled?: boolean
          auto_reply_text?: string | null
          created_at?: string
          id?: string
          owner_control_e164?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reply_enabled?: boolean
          auto_reply_text?: string | null
          created_at?: string
          id?: string
          owner_control_e164?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_user_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_preferences: {
        Row: {
          config_json: Json | null
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          updated_at: string
          user_id: string
          widget_code: string
        }
        Insert: {
          config_json?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          updated_at?: string
          user_id: string
          widget_code: string
        }
        Update: {
          config_json?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          widget_code?: string
        }
        Relationships: []
      }
      zone3_website_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone3_website_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_all_transactions: {
        Row: {
          account_ref: string | null
          amount: number | null
          booking_date: string | null
          counterpart_iban: string | null
          counterparty: string | null
          created_at: string | null
          id: string | null
          match_category: string | null
          match_confidence: number | null
          match_rule_code: string | null
          match_status: string | null
          owner_id: string | null
          owner_type: string | null
          purpose: string | null
          source: string | null
          tenant_id: string | null
          value_date: string | null
        }
        Relationships: []
      }
      v_armstrong_costs_daily: {
        Row: {
          action_code: string | null
          avg_duration_ms: number | null
          date: string | null
          failure_count: number | null
          org_id: string | null
          run_count: number | null
          total_cost_cents: number | null
          total_tokens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "armstrong_action_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_armstrong_dashboard_kpis: {
        Row: {
          actions_24h: number | null
          active_policies_count: number | null
          avg_response_ms_24h: number | null
          costs_30d_cents: number | null
          error_rate_7d: number | null
          knowledge_items_count: number | null
        }
        Relationships: []
      }
      v_platform_cost_summary: {
        Row: {
          action_code: string | null
          avg_cost_cents: number | null
          avg_duration_ms: number | null
          avg_tokens: number | null
          completed_runs: number | null
          failed_runs: number | null
          first_run_at: string | null
          last_run_at: string | null
          margin_cents: number | null
          theoretical_revenue_cents: number | null
          total_cost_cents: number | null
          total_credits_charged: number | null
          total_runs: number | null
          total_tokens: number | null
        }
        Relationships: []
      }
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
          annual_income: number | null
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
      check_data_orphans: { Args: { p_tenant_id: string }; Returns: Json }
      check_missing_indexes: {
        Args: never
        Returns: {
          column_name: string
          issue: string
          table_name: string
        }[]
      }
      cleanup_golden_path_data: { Args: never; Returns: Json }
      cleanup_rate_limit_counters: { Args: never; Returns: undefined }
      delete_test_batch: {
        Args: { p_batch_id: string }
        Returns: {
          deleted_count: number
          entity_type: string
        }[]
      }
      ensure_module_root_folders: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      generate_armstrong_email: {
        Args: {
          p_auth_email: string
          p_first_name: string
          p_last_name: string
        }
        Returns: string
      }
      generate_correlation_key: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: string
      }
      generate_public_id: { Args: { prefix: string }; Returns: string }
      generate_sot_email: {
        Args: {
          p_auth_email: string
          p_first_name: string
          p_last_name: string
        }
        Returns: string
      }
      get_active_outbound_identity: {
        Args: { p_user_id: string }
        Returns: {
          brand_key: string
          display_name: string
          from_email: string
        }[]
      }
      get_active_tenant_mode: { Args: never; Returns: string }
      get_tiles_for_role:
        | {
            Args: { _role: Database["public"]["Enums"]["membership_role"] }
            Returns: string[]
          }
        | { Args: { p_role: string }; Returns: string[] }
      get_user_memberships: {
        Args: { p_user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["membership_role"]
          tenant_id: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_delegation_scope: {
        Args: {
          _client_org_id: string
          _manager_org_id: string
          _module_code: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hybrid_search_documents: {
        Args: {
          p_limit?: number
          p_query: string
          p_query_embedding?: string
          p_tenant_id: string
          p_vector_weight?: number
        }
        Returns: {
          chunk_id: string
          chunk_text: string
          combined_score: number
          document_id: string
          page_number: number
          ts_rank: number
          vector_similarity: number
        }[]
      }
      increment_billing_usage: {
        Args: {
          p_cost_cents: number
          p_engine: string
          p_pages: number
          p_period_end: string
          p_period_start: string
          p_source: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      increment_lovable_ai_usage: {
        Args: {
          p_calls?: number
          p_period_end: string
          p_period_start: string
          p_tenant_id: string
          p_tokens?: number
        }
        Returns: undefined
      }
      increment_sequence_stats: {
        Args: { p_field: string; p_sequence_id: string }
        Returns: undefined
      }
      increment_thread_message_count: {
        Args: { p_thread_id: string }
        Returns: undefined
      }
      increment_unread: {
        Args: { conversation_uuid: string }
        Returns: undefined
      }
      is_akquise_manager: { Args: { _user_id: string }; Returns: boolean }
      is_kaufy_public_image_document: {
        Args: { doc_id: string }
        Returns: boolean
      }
      is_kaufy_storage_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      is_parent_access_blocked: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      is_partner_network_storage_object: {
        Args: { object_name: string }
        Returns: boolean
      }
      is_platform_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      log_data_event: {
        Args: {
          p_direction: string
          p_entity_id: string
          p_entity_type: string
          p_event_type: string
          p_payload?: Json
          p_source: string
          p_tenant_id: string
          p_zone: string
        }
        Returns: string
      }
      my_scope_org_ids: { Args: { active_org_id: string }; Returns: string[] }
      purge_expired_ledger_entries: {
        Args: { p_retention_days?: number }
        Returns: Json
      }
      reset_sandbox_tenant: { Args: { p_tenant_id: string }; Returns: Json }
      rpc_armstrong_log_action_run: {
        Args: {
          p_action_code: string
          p_correlation_id: string
          p_cost_cents?: number
          p_duration_ms?: number
          p_error_message?: string
          p_input_context?: Json
          p_org_id: string
          p_output_result?: Json
          p_pii_present?: boolean
          p_session_id: string
          p_status: string
          p_tokens_used?: number
          p_user_id: string
          p_zone: string
        }
        Returns: string
      }
      rpc_credit_deduct: {
        Args: {
          p_action_code: string
          p_credits: number
          p_ref_id?: string
          p_ref_type?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      rpc_credit_preflight: {
        Args: {
          p_action_code?: string
          p_required_credits: number
          p_tenant_id: string
        }
        Returns: Json
      }
      rpc_credit_topup: {
        Args: {
          p_credits: number
          p_ref_id?: string
          p_ref_type?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      search_document_chunks: {
        Args: { p_limit?: number; p_query: string; p_tenant_id: string }
        Returns: {
          chunk_id: string
          chunk_text: string
          document_id: string
          page_number: number
          rank: number
        }[]
      }
      seed_golden_path_data: { Args: { p_tenant_id?: string }; Returns: Json }
      sync_tiles_for_user: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      acq_analysis_status: "pending" | "running" | "completed" | "failed"
      acq_analysis_type:
        | "ai_research"
        | "geomap"
        | "calc_bestand"
        | "calc_aufteiler"
        | "enrichment"
        | "extraction"
      acq_mandate_event_type:
        | "created"
        | "submitted"
        | "assigned"
        | "assignment_accepted"
        | "split_confirmed"
        | "status_changed"
        | "profile_generated"
        | "email_sent"
        | "inbound_received"
        | "offer_created"
        | "analysis_completed"
        | "delivery_sent"
        | "closed"
        | "activated"
        | "paused"
        | "resumed"
      acq_mandate_status:
        | "draft"
        | "submitted_to_zone1"
        | "assigned"
        | "active"
        | "paused"
        | "closed"
      acq_offer_source:
        | "inbound_email"
        | "upload"
        | "manual"
        | "portal_scrape"
        | "firecrawl"
      acq_offer_status:
        | "new"
        | "analyzing"
        | "analyzed"
        | "presented"
        | "accepted"
        | "rejected"
        | "archived"
      acq_outbound_status:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "opened"
        | "bounced"
        | "replied"
        | "failed"
      acq_routing_method:
        | "token"
        | "email_match"
        | "thread"
        | "ai_fallback"
        | "manual"
      app_role:
        | "platform_admin"
        | "moderator"
        | "user"
        | "finance_manager"
        | "akquise_manager"
        | "sales_partner"
        | "super_user"
        | "client_user"
      bank_account_category:
        | "privat"
        | "vermietung"
        | "tagesgeld"
        | "pv"
        | "sonstiges"
      candidate_status:
        | "pending"
        | "accepted_subscription"
        | "accepted_insurance"
        | "accepted_vorsorge"
        | "ignored"
        | "merged"
      car_claim_status:
        | "draft"
        | "open"
        | "awaiting_docs"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "closed"
      car_coverage_type: "liability_only" | "liability_tk" | "liability_vk"
      car_damage_type:
        | "accident"
        | "theft"
        | "glass"
        | "vandalism"
        | "storm"
        | "animal"
        | "fire"
        | "other"
      car_fault_assessment:
        | "own_fault"
        | "partial_fault"
        | "no_fault"
        | "unclear"
      car_finance_status: "active" | "completed" | "terminated"
      car_finance_type: "owned" | "financed" | "leased"
      car_fuel_type:
        | "petrol"
        | "diesel"
        | "electric"
        | "hybrid_petrol"
        | "hybrid_diesel"
        | "lpg"
        | "cng"
        | "hydrogen"
      car_insurance_status: "active" | "expired" | "cancelled" | "draft"
      car_logbook_provider: "vimcar" | "carcloud" | "none"
      car_logbook_status: "not_connected" | "pending" | "connected" | "error"
      car_offer_provider:
        | "bmw_dealer"
        | "mercedes_dealer"
        | "vw_dealer"
        | "audi_dealer"
        | "miete24"
        | "generic"
      car_offer_type: "leasing" | "rental"
      car_payment_frequency: "monthly" | "quarterly" | "semi_annual" | "yearly"
      car_trip_classification:
        | "business"
        | "private"
        | "commute"
        | "unclassified"
      car_trip_source: "manual" | "sync"
      car_vehicle_status: "active" | "inactive" | "sold" | "returned"
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
      insurance_category:
        | "haftpflicht"
        | "hausrat"
        | "wohngebaeude"
        | "rechtsschutz"
        | "kfz"
        | "unfall"
        | "berufsunfaehigkeit"
        | "sonstige"
      insurance_status: "aktiv" | "gekuendigt" | "ruhend" | "auslaufend"
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
        | "kaufy_armstrong"
        | "kaufy_expose_request"
        | "futureroom_armstrong"
        | "sot_demo_booking"
        | "ncore_projekt"
        | "ncore_kooperation"
        | "otto_advisory_kontakt"
        | "otto_advisory_finanzierung"
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
        | "finance_manager"
        | "akquise_manager"
        | "future_room_web_user_lite"
        | "project_manager"
        | "pet_manager"
        | "super_manager"
      org_type: "internal" | "partner" | "sub_partner" | "client" | "renter"
      partner_verification_status:
        | "pending"
        | "documents_submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      payment_interval:
        | "monatlich"
        | "vierteljaehrlich"
        | "halbjaehrlich"
        | "jaehrlich"
        | "einmalig"
      pet_booking_status:
        | "requested"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      pet_caring_event_type:
        | "feeding"
        | "walking"
        | "grooming"
        | "medication"
        | "vet_appointment"
        | "vaccination"
        | "deworming"
        | "flea_treatment"
        | "training"
        | "weight_check"
        | "other"
      pet_gender: "male" | "female" | "unknown"
      pet_price_type:
        | "fixed"
        | "hourly"
        | "daily"
        | "per_session"
        | "on_request"
      pet_provider_status: "pending" | "active" | "suspended"
      pet_provider_type:
        | "grooming"
        | "boarding"
        | "walking"
        | "training"
        | "veterinary"
        | "sitting"
        | "daycare"
        | "transport"
        | "other"
      pet_service_category:
        | "grooming"
        | "boarding"
        | "walking"
        | "training"
        | "veterinary"
        | "sitting"
        | "daycare"
        | "transport"
        | "nutrition"
        | "other"
        | "puppy_class"
      pet_species:
        | "dog"
        | "cat"
        | "bird"
        | "rabbit"
        | "hamster"
        | "fish"
        | "reptile"
        | "horse"
        | "other"
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
      scan_status: "pending" | "running" | "completed" | "failed"
      subscription_category:
        | "streaming_video"
        | "streaming_music"
        | "cloud_storage"
        | "software_saas"
        | "news_media"
        | "ecommerce_membership"
        | "telecom_mobile"
        | "internet"
        | "utilities_energy"
        | "mobility"
        | "fitness"
        | "other"
      subscription_status: "active" | "cancelled" | "past_due" | "trialing"
      tenant_mode: "reference" | "sandbox" | "demo" | "production"
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
      acq_analysis_status: ["pending", "running", "completed", "failed"],
      acq_analysis_type: [
        "ai_research",
        "geomap",
        "calc_bestand",
        "calc_aufteiler",
        "enrichment",
        "extraction",
      ],
      acq_mandate_event_type: [
        "created",
        "submitted",
        "assigned",
        "assignment_accepted",
        "split_confirmed",
        "status_changed",
        "profile_generated",
        "email_sent",
        "inbound_received",
        "offer_created",
        "analysis_completed",
        "delivery_sent",
        "closed",
        "activated",
        "paused",
        "resumed",
      ],
      acq_mandate_status: [
        "draft",
        "submitted_to_zone1",
        "assigned",
        "active",
        "paused",
        "closed",
      ],
      acq_offer_source: [
        "inbound_email",
        "upload",
        "manual",
        "portal_scrape",
        "firecrawl",
      ],
      acq_offer_status: [
        "new",
        "analyzing",
        "analyzed",
        "presented",
        "accepted",
        "rejected",
        "archived",
      ],
      acq_outbound_status: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "opened",
        "bounced",
        "replied",
        "failed",
      ],
      acq_routing_method: [
        "token",
        "email_match",
        "thread",
        "ai_fallback",
        "manual",
      ],
      app_role: [
        "platform_admin",
        "moderator",
        "user",
        "finance_manager",
        "akquise_manager",
        "sales_partner",
        "super_user",
        "client_user",
      ],
      bank_account_category: [
        "privat",
        "vermietung",
        "tagesgeld",
        "pv",
        "sonstiges",
      ],
      candidate_status: [
        "pending",
        "accepted_subscription",
        "accepted_insurance",
        "accepted_vorsorge",
        "ignored",
        "merged",
      ],
      car_claim_status: [
        "draft",
        "open",
        "awaiting_docs",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "closed",
      ],
      car_coverage_type: ["liability_only", "liability_tk", "liability_vk"],
      car_damage_type: [
        "accident",
        "theft",
        "glass",
        "vandalism",
        "storm",
        "animal",
        "fire",
        "other",
      ],
      car_fault_assessment: [
        "own_fault",
        "partial_fault",
        "no_fault",
        "unclear",
      ],
      car_finance_status: ["active", "completed", "terminated"],
      car_finance_type: ["owned", "financed", "leased"],
      car_fuel_type: [
        "petrol",
        "diesel",
        "electric",
        "hybrid_petrol",
        "hybrid_diesel",
        "lpg",
        "cng",
        "hydrogen",
      ],
      car_insurance_status: ["active", "expired", "cancelled", "draft"],
      car_logbook_provider: ["vimcar", "carcloud", "none"],
      car_logbook_status: ["not_connected", "pending", "connected", "error"],
      car_offer_provider: [
        "bmw_dealer",
        "mercedes_dealer",
        "vw_dealer",
        "audi_dealer",
        "miete24",
        "generic",
      ],
      car_offer_type: ["leasing", "rental"],
      car_payment_frequency: ["monthly", "quarterly", "semi_annual", "yearly"],
      car_trip_classification: [
        "business",
        "private",
        "commute",
        "unclassified",
      ],
      car_trip_source: ["manual", "sync"],
      car_vehicle_status: ["active", "inactive", "sold", "returned"],
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
      insurance_category: [
        "haftpflicht",
        "hausrat",
        "wohngebaeude",
        "rechtsschutz",
        "kfz",
        "unfall",
        "berufsunfaehigkeit",
        "sonstige",
      ],
      insurance_status: ["aktiv", "gekuendigt", "ruhend", "auslaufend"],
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
        "kaufy_armstrong",
        "kaufy_expose_request",
        "futureroom_armstrong",
        "sot_demo_booking",
        "ncore_projekt",
        "ncore_kooperation",
        "otto_advisory_kontakt",
        "otto_advisory_finanzierung",
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
        "finance_manager",
        "akquise_manager",
        "future_room_web_user_lite",
        "project_manager",
        "pet_manager",
        "super_manager",
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
      payment_interval: [
        "monatlich",
        "vierteljaehrlich",
        "halbjaehrlich",
        "jaehrlich",
        "einmalig",
      ],
      pet_booking_status: [
        "requested",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      pet_caring_event_type: [
        "feeding",
        "walking",
        "grooming",
        "medication",
        "vet_appointment",
        "vaccination",
        "deworming",
        "flea_treatment",
        "training",
        "weight_check",
        "other",
      ],
      pet_gender: ["male", "female", "unknown"],
      pet_price_type: ["fixed", "hourly", "daily", "per_session", "on_request"],
      pet_provider_status: ["pending", "active", "suspended"],
      pet_provider_type: [
        "grooming",
        "boarding",
        "walking",
        "training",
        "veterinary",
        "sitting",
        "daycare",
        "transport",
        "other",
      ],
      pet_service_category: [
        "grooming",
        "boarding",
        "walking",
        "training",
        "veterinary",
        "sitting",
        "daycare",
        "transport",
        "nutrition",
        "other",
        "puppy_class",
      ],
      pet_species: [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "hamster",
        "fish",
        "reptile",
        "horse",
        "other",
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
      scan_status: ["pending", "running", "completed", "failed"],
      subscription_category: [
        "streaming_video",
        "streaming_music",
        "cloud_storage",
        "software_saas",
        "news_media",
        "ecommerce_membership",
        "telecom_mobile",
        "internet",
        "utilities_energy",
        "mobility",
        "fitness",
        "other",
      ],
      subscription_status: ["active", "cancelled", "past_due", "trialing"],
      tenant_mode: ["reference", "sandbox", "demo", "production"],
    },
  },
} as const
