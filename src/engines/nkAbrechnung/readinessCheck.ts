/**
 * Readiness Check — Prueft ob alle Voraussetzungen fuer eine NK-Abrechnung erfuellt sind.
 * 
 * Pflichtdokumente:
 * 1. WEG-Jahresabrechnung (accepted/current)
 * 2. Grundsteuerbescheid (accepted/current) — Grundsteuer ist IMMER Direktzahlung
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
 */
export async function checkReadiness(
  propertyId: string,
  tenantId: string,
  year: number
): Promise<NKReadinessResult> {
  const blockers: string[] = [];
  const documents: NKDocRequirement[] = [];

  // 1. Dokumente pruefen via document_links
  for (const req of REQUIRED_DOC_TYPES) {
    const { data: links } = await (supabase as any)
      .from('document_links')
      .select('id, link_status, document_id')
      .eq('object_type', 'property')
      .eq('object_id', propertyId)
      .eq('tenant_id', tenantId);

    const matchingLink = links?.[0];

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
      const linkStatus = matchingLink.link_status;
      const docStatus: NKDocRequirement['status'] =
        linkStatus === 'accepted' || linkStatus === 'current'
          ? 'accepted'
          : linkStatus === 'needs_review'
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

  // 2. Lease-Daten pruefen
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
