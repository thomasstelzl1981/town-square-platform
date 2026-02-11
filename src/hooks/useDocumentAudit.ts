/**
 * useDocumentAudit — SBC-R04 Audit Logging Hook
 * 
 * Erzeugt audit_events-Eintraege fuer:
 * - document.view (Preview-URL erstellt)
 * - document.download (Download-URL erstellt)
 * - grant.created (access_grant erstellt)
 * - grant.revoked (access_grant widerrufen)
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AuditEventType = 'document.view' | 'document.download' | 'grant.created' | 'grant.revoked';

interface AuditPayload {
  document_id?: string;
  grant_id?: string;
  scope_id?: string;
  scope?: string;
  subject_id?: string;
  [key: string]: unknown;
}

async function logAuditEvent(
  eventType: AuditEventType,
  tenantId: string,
  payload: AuditPayload
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_events').insert([{
      event_type: eventType,
      actor_user_id: user.id,
      target_org_id: tenantId,
      payload: payload as any,
    }]);
  } catch (err) {
    // Audit logging should never block business logic
    console.warn(`[SBC-R04] Audit log failed for ${eventType}:`, err);
  }
}

export function useDocumentAudit() {
  const logDocumentView = useCallback(
    (tenantId: string, documentId: string, scope?: string) =>
      logAuditEvent('document.view', tenantId, { document_id: documentId, scope: scope ?? 'tenant' }),
    []
  );

  const logDocumentDownload = useCallback(
    (tenantId: string, documentId: string, scope?: string) =>
      logAuditEvent('document.download', tenantId, { document_id: documentId, scope: scope ?? 'tenant' }),
    []
  );

  const logGrantCreated = useCallback(
    (tenantId: string, grantId: string, scopeId: string, subjectId: string) =>
      logAuditEvent('grant.created', tenantId, { grant_id: grantId, scope_id: scopeId, subject_id: subjectId }),
    []
  );

  const logGrantRevoked = useCallback(
    (tenantId: string, grantId: string, scopeId: string) =>
      logAuditEvent('grant.revoked', tenantId, { grant_id: grantId, scope_id: scopeId }),
    []
  );

  return {
    logDocumentView,
    logDocumentDownload,
    logGrantCreated,
    logGrantRevoked,
  };
}
