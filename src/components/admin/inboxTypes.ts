/**
 * R-3: Extracted types from Inbox.tsx (Admin Zone 1)
 */

export interface InboundItem {
  id: string;
  source: string;
  external_id: string | null;
  sender_info: unknown;
  recipient_info: unknown;
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  metadata: unknown;
  status: string;
  assigned_tenant_id: string | null;
  assigned_contact_id: string | null;
  assigned_property_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  notes: string | null;
  created_at: string;
  mandate_id: string | null;
  routed_to_zone2_at: string | null;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  match_conditions: unknown;
  action_type: string;
  action_config: unknown;
  created_at: string;
  mandate_id: string | null;
  target_tenant_id: string | null;
  target_module: string | null;
}

export interface PostserviceMandate {
  id: string;
  tenant_id: string;
  requested_by_user_id: string;
  type: string;
  status: string;
  contract_terms: unknown;
  payload_json: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
}
