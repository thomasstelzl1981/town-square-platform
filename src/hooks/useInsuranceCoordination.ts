/**
 * useInsuranceCoordination — Feld 21: Versicherungskoordination
 * 
 * Tracks insurance policies per property, manages claims,
 * and monitors renewal deadlines.
 * 
 * @field 21
 * @module TLC
 */

import { useMemo, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────

export type InsuranceType =
  | 'gebaeudeversicherung'   // Building insurance
  | 'haftpflicht'            // Liability
  | 'elementar'              // Natural hazards
  | 'glasbruch'              // Glass breakage
  | 'rechtsschutz'           // Legal protection
  | 'mietausfall'            // Rent loss
  | 'hausrat_vermieter'      // Landlord contents
  | 'photovoltaik';          // Solar panel insurance

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'acknowledged'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'paid'
  | 'closed';

export interface InsurancePolicy {
  id: string;
  propertyId: string;
  type: InsuranceType;
  insurer: string;
  policyNumber: string;
  premium: number;           // Annual premium
  deductible: number;        // Selbstbeteiligung
  coverageAmount: number;    // Versicherungssumme
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  cancellationDeadlineMonths: number;  // Kündigungsfrist in Monaten
  notes: string | null;
  isActive: boolean;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  propertyId: string;
  unitId: string | null;
  leaseId: string | null;
  defectTaskId: string | null;  // links to tenancy_tasks
  claimNumber: string | null;
  damageDate: string;
  reportedAt: string;
  description: string;
  estimatedDamage: number;
  claimAmount: number | null;
  approvedAmount: number | null;
  paidAmount: number | null;
  status: ClaimStatus;
  insurerResponse: string | null;
  closedAt: string | null;
}

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  gebaeudeversicherung: 'Gebäudeversicherung',
  haftpflicht: 'Haus- und Grundbesitzerhaftpflicht',
  elementar: 'Elementarschadenversicherung',
  glasbruch: 'Glasbruchversicherung',
  rechtsschutz: 'Vermieter-Rechtsschutz',
  mietausfall: 'Mietausfallversicherung',
  hausrat_vermieter: 'Vermieter-Hausrat',
  photovoltaik: 'Photovoltaikversicherung',
};

// ─── Pure Logic ───────────────────────────────────────────────

/** Check which policies are expiring soon */
export function checkPolicyRenewals(
  policies: InsurancePolicy[],
  today: string,
  warningDays: number = 90
): Array<{
  policy: InsurancePolicy;
  daysUntilExpiry: number;
  cancellationDeadline: string;
  urgency: 'ok' | 'attention' | 'urgent' | 'expired';
}> {
  const todayDate = new Date(today);

  return policies
    .filter(p => p.isActive)
    .map(p => {
      const endDate = new Date(p.endDate);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate cancellation deadline
      const cancelDeadline = new Date(endDate);
      cancelDeadline.setMonth(cancelDeadline.getMonth() - p.cancellationDeadlineMonths);
      const cancellationDeadline = cancelDeadline.toISOString().split('T')[0];

      const daysToCancelDeadline = Math.ceil((cancelDeadline.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

      let urgency: 'ok' | 'attention' | 'urgent' | 'expired' = 'ok';
      if (daysUntilExpiry < 0) urgency = 'expired';
      else if (daysToCancelDeadline <= 14) urgency = 'urgent';
      else if (daysUntilExpiry <= warningDays) urgency = 'attention';

      return { policy: p, daysUntilExpiry, cancellationDeadline, urgency };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/** Calculate total insurance costs per property */
export function calculateInsuranceCosts(policies: InsurancePolicy[]): {
  totalAnnualPremium: number;
  totalMonthlyPremium: number;
  byType: Record<InsuranceType, number>;
  byProperty: Record<string, number>;
} {
  const byType: Partial<Record<InsuranceType, number>> = {};
  const byProperty: Record<string, number> = {};
  let totalAnnualPremium = 0;

  for (const p of policies.filter(pol => pol.isActive)) {
    totalAnnualPremium += p.premium;
    byType[p.type] = (byType[p.type] || 0) + p.premium;
    byProperty[p.propertyId] = (byProperty[p.propertyId] || 0) + p.premium;
  }

  return {
    totalAnnualPremium: Math.round(totalAnnualPremium * 100) / 100,
    totalMonthlyPremium: Math.round((totalAnnualPremium / 12) * 100) / 100,
    byType: byType as Record<InsuranceType, number>,
    byProperty,
  };
}

/** Analyze claim history for a property */
export function analyzeClaimHistory(claims: InsuranceClaim[]): {
  totalClaims: number;
  totalEstimatedDamage: number;
  totalApproved: number;
  totalPaid: number;
  approvalRate: number;
  averageProcessingDays: number;
  byStatus: Record<ClaimStatus, number>;
} {
  const total = claims.length;
  const byStatus: Partial<Record<ClaimStatus, number>> = {};
  let totalEstimated = 0;
  let totalApproved = 0;
  let totalPaid = 0;
  let processingDays: number[] = [];
  let decidedCount = 0;
  let approvedCount = 0;

  for (const c of claims) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    totalEstimated += c.estimatedDamage;
    totalApproved += c.approvedAmount || 0;
    totalPaid += c.paidAmount || 0;

    if (['approved', 'partially_approved', 'rejected', 'paid', 'closed'].includes(c.status)) {
      decidedCount++;
      if (['approved', 'partially_approved', 'paid', 'closed'].includes(c.status)) {
        approvedCount++;
      }
    }

    if (c.closedAt) {
      const days = Math.ceil(
        (new Date(c.closedAt).getTime() - new Date(c.reportedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      processingDays.push(days);
    }
  }

  return {
    totalClaims: total,
    totalEstimatedDamage: Math.round(totalEstimated * 100) / 100,
    totalApproved: Math.round(totalApproved * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    approvalRate: decidedCount > 0 ? Math.round((approvedCount / decidedCount) * 100 * 10) / 10 : 0,
    averageProcessingDays: processingDays.length > 0
      ? Math.round(processingDays.reduce((s, d) => s + d, 0) / processingDays.length)
      : 0,
    byStatus: byStatus as Record<ClaimStatus, number>,
  };
}

/** Determine which insurance type to claim against for a defect */
export function suggestInsuranceType(defectDescription: string): InsuranceType | null {
  const text = defectDescription.toLowerCase();

  const mappings: Array<{ keywords: string[]; type: InsuranceType }> = [
    { keywords: ['rohrbruch', 'wasserschaden', 'leitungswasser', 'überschwemmung', 'feuer', 'brand', 'sturm', 'blitz', 'hagel'], type: 'gebaeudeversicherung' },
    { keywords: ['hochwasser', 'erdbeben', 'erdrutsch', 'starkregen', 'rückstau'], type: 'elementar' },
    { keywords: ['glasbruch', 'fensterscheibe', 'glasschaden'], type: 'glasbruch' },
    { keywords: ['haftpflicht', 'personenschaden', 'dritte', 'besucher'], type: 'haftpflicht' },
    { keywords: ['leerstand', 'mietausfall', 'mietnomaden'], type: 'mietausfall' },
    { keywords: ['rechtsstreit', 'klage', 'anwalt', 'räumung'], type: 'rechtsschutz' },
    { keywords: ['solaranlage', 'photovoltaik', 'pv-anlage', 'wechselrichter'], type: 'photovoltaik' },
  ];

  for (const m of mappings) {
    if (m.keywords.some(kw => text.includes(kw))) return m.type;
  }

  return 'gebaeudeversicherung'; // default fallback
}

// ─── Hook ─────────────────────────────────────────────────────

export function useInsuranceCoordination(
  policies: InsurancePolicy[] = [],
  claims: InsuranceClaim[] = []
) {
  const renewalAlerts = useMemo(
    () => checkPolicyRenewals(policies, new Date().toISOString().split('T')[0]),
    [policies]
  );

  const costSummary = useMemo(
    () => calculateInsuranceCosts(policies),
    [policies]
  );

  const claimAnalysis = useMemo(
    () => analyzeClaimHistory(claims),
    [claims]
  );

  const activePolicies = useMemo(
    () => policies.filter(p => p.isActive),
    [policies]
  );

  const openClaims = useMemo(
    () => claims.filter(c => !['paid', 'closed', 'rejected'].includes(c.status)),
    [claims]
  );

  const suggestInsurance = useCallback(
    (description: string) => suggestInsuranceType(description),
    []
  );

  return {
    activePolicies,
    renewalAlerts,
    costSummary,
    claimAnalysis,
    openClaims,
    suggestInsurance,
    typeLabels: INSURANCE_TYPE_LABELS,
  };
}
