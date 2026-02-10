/**
 * Post Routing Engine
 * 
 * Handles the routing of inbound items from Zone 1 to Zone 2 DMS.
 * Routes based on Tenant-ID matching against active routing rules.
 * 
 * System-E-Mail-Adresse: posteingang@inbound.systemofatown.com
 * Dort kommt die Post zentral an, wird geparst und als inbound_item gespeichert.
 * Routing-Regeln leiten die Post dann automatisch an den richtigen Tenant weiter.
 */
import { supabase } from '@/integrations/supabase/client';

/** Die zentrale Posteingang-Adresse für Zone 1 */
export const SYSTEM_INBOX_EMAIL = 'posteingang@inbound.systemofatown.com';

interface RoutingRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  match_conditions: Record<string, unknown>;
  action_config: Record<string, unknown>;
  target_tenant_id: string | null;
  mandate_id: string | null;
}

/**
 * Find the best matching routing rule for a given tenant ID.
 * Returns the highest-priority active rule that matches.
 */
export function matchRoutingRule(
  tenantId: string,
  rules: RoutingRule[]
): RoutingRule | null {
  const activeRules = rules
    .filter(r => r.is_active && r.target_tenant_id === tenantId)
    .sort((a, b) => b.priority - a.priority);

  return activeRules[0] || null;
}

/**
 * Route an inbound item from Zone 1 to Zone 2 DMS Posteingang.
 * 
 * Steps:
 * 1. Creates a document entry in the documents table
 * 2. Creates a document_link to place it in the DMS
 * 3. Marks the inbound item as routed
 * 
 * Idempotency: Checks routed_to_zone2_at before processing.
 */
export async function routeToZone2(
  inboundItemId: string,
  targetTenantId: string,
  mandateId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch the inbound item
    const { data: item, error: itemError } = await supabase
      .from('inbound_items')
      .select('*')
      .eq('id', inboundItemId)
      .single();

    if (itemError || !item) {
      return { success: false, error: 'Inbound item nicht gefunden' };
    }

    // Idempotency check
    if ((item as any).routed_to_zone2_at) {
      return { success: false, error: 'Bereits zugestellt' };
    }

    // 2. Create document in Zone 2
    const publicId = `post-${inboundItemId.slice(0, 8)}-${Date.now()}`;
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        tenant_id: targetTenantId,
        name: item.file_name || 'Zugestellte Post',
        file_path: item.file_path || '',
        mime_type: item.mime_type || 'application/pdf',
        size_bytes: item.file_size_bytes || 0,
        source: 'postservice',
        public_id: publicId,
      })
      .select('id')
      .single();

    if (docError) {
      console.error('Document creation failed:', docError);
      return { success: false, error: 'Dokument-Erstellung fehlgeschlagen' };
    }

    // 3. Create document_link so the document appears in the tenant's DMS
    const { error: linkError } = await supabase
      .from('document_links')
      .insert({
        tenant_id: targetTenantId,
        document_id: doc.id,
        object_type: 'postservice_delivery',
        object_id: inboundItemId,
        link_status: 'current',
      });

    if (linkError) {
      console.error('Document link creation failed:', linkError);
      // Non-fatal: document exists, just not linked
    }

    // 4. Mark inbound item as routed
    const updatePayload: Record<string, unknown> = {
      status: 'assigned',
      assigned_tenant_id: targetTenantId,
      routed_to_zone2_at: new Date().toISOString(),
    };
    if (mandateId) {
      updatePayload.mandate_id = mandateId;
    }

    const { error: updateError } = await supabase
      .from('inbound_items')
      .update(updatePayload)
      .eq('id', inboundItemId);

    if (updateError) {
      console.error('Inbound item update failed:', updateError);
      return { success: false, error: 'Status-Update fehlgeschlagen' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Routing error:', err);
    return { success: false, error: err.message || 'Unbekannter Fehler' };
  }
}
