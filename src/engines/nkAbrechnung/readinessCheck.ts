/**
 * Readiness Check — Prueft ob alle Voraussetzungen fuer eine NK-Abrechnung erfuellt sind.
 * 
 * Pflichtdokumente:
 * 1. WEG-Jahresabrechnung (linked + review_state approved)
 * 2. Grundsteuerbescheid (linked + review_state approved) — Grundsteuer ist IMMER Direktzahlung
 * 
 * Optional:
 * 3. Wirtschaftsplan (nice-to-have, Plausibilisierung)
 */

import { NKReadinessStatus, NKDocRequirement, NKReadinessResult } from './spec';
import { supabase } from '@/integrations/supabase/client';

const REQUIRED_DOC_TYPES = [
  { docType: 'WEG_JAHRESABRECHNUNG', label: 'WEG-Jahresabrechnung', required: true },
  { docType: 'GRUNDSTEUER_BESCHEID', label: 'Grundsteuerbescheid', required: true },
  { docType: 'WEG_WIRTSCHAFTSPLAN', label: 'Wirtschaftsplan', required: false },
];

/**
 * Prueft die Readiness einer Property fuer ein bestimmtes Abrechnungsjahr.
 * Nutzt einen JOIN über document_links → documents, um nach doc_type zu filtern.
 */
export async function checkReadiness(
  propertyId: string,
  tenantId: string,
  year: number
): Promise<NKReadinessResult> {
  const blockers: string[] = [];
  const documents: NKDocRequirement[] = [];

  // 1. Alle document_links für diese Property laden, mit JOIN auf documents
  const { data: allLinks } = await (supabase as any)
    .from('document_links')
    .select('id, link_status, document_id, documents!inner(id, doc_type, review_state, created_at)')
    .eq('object_type', 'property')
    .eq('object_id', propertyId)
    .eq('tenant_id', tenantId)
    .eq('link_status', 'linked');

  // 2. Für jeden benötigten Dokumenttyp prüfen
  for (const req of REQUIRED_DOC_TYPES) {
    const matchingLink = allLinks?.find(
      (link: any) => link.documents?.doc_type === req.docType
    );

    if (!matchingLink) {
      documents.push({
        docType: req.docType,
        label: req.label,
        required: req.required,
        status: 'missing',
        documentId: null,
        acceptedAt: null,
      });
      if (req.required) {
        blockers.push(`${req.label} fehlt`);
      }
    } else {
      const reviewState = matchingLink.documents?.review_state;
      const docStatus: NKDocRequirement['status'] =
        reviewState === 'approved'
          ? 'accepted'
          : reviewState === 'needs_review'
          ? 'needs_review'
          : 'pending';

      documents.push({
        docType: req.docType,
        label: req.label,
        required: req.required,
        status: docStatus,
        documentId: matchingLink.document_id,
        acceptedAt: docStatus === 'accepted' ? matchingLink.documents?.created_at : null,
      });

      if (req.required && docStatus !== 'accepted') {
        blockers.push(`${req.label}: ${docStatus}`);
      }
    }
  }

  // 3. Lease-Daten pruefen
  const { data: leases } = await (supabase as any)
    .from('leases')
    .select('id, rent_cold_eur, nk_advance_eur')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId);

  const activeLeases = leases?.filter((l: any) => l.rent_cold_eur > 0) || [];

  if (activeLeases.length === 0) {
    blockers.push('Kein aktiver Mietvertrag vorhanden');
  }

  // Status bestimmen
  let status: NKReadinessStatus;
  if (blockers.length === 0) {
    status = NKReadinessStatus.READY;
  } else if (documents.some((d) => d.status === 'needs_review')) {
    status = NKReadinessStatus.NEEDS_REVIEW;
  } else {
    status = NKReadinessStatus.MISSING_DOCS;
  }

  return {
    status,
    propertyId,
    year,
    documents,
    leaseCount: activeLeases.length,
    canCalculate: blockers.length === 0,
    blockers,
  };
}
