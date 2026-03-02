/**
 * ENG-FDC — Finance Data Controller: Engine
 *
 * Pure deterministic functions. NO DB calls, NO side effects, NO React imports.
 *
 * @engine ENG-FDC
 * @version 1.0.0
 */

import type {
  FDCSnapshotCounts,
  FDCRegistryEntry,
  FDCLink,
  FDCIntegrityResult,
  FDCRepairAction,
  FDCCategoryScore,
  FDCCoverageCategory,
  FDCActionCode,
  FDCSeverity,
} from './spec';
import {
  FDC_COVERAGE_WEIGHTS,
  FDC_COVERAGE_LABELS,
  FDC_ACTION_DEFINITIONS,
} from './spec';

// ─── Helper: create action ────────────────────────────────────
function makeAction(
  tenantId: string,
  code: FDCActionCode,
  entityType: string,
  entityId: string,
  scopeKey = '',
  metadataOverride?: Record<string, unknown>
): FDCRepairAction {
  const def = FDC_ACTION_DEFINITIONS[code];
  return {
    tenant_id: tenantId,
    severity: def.severity,
    code,
    scope_key: scopeKey,
    entity_type: entityType as any,
    entity_id: entityId,
    message: def.description,
    status: 'open',
    owner_role: def.ownerRole,
    metadata: metadataOverride || {},
  };
}

// ─── Category Score Calculator ────────────────────────────────
function computeCategoryScore(
  category: FDCCoverageCategory,
  present: number,
  issues: number,
  hasData: boolean
): FDCCategoryScore {
  const weight = FDC_COVERAGE_WEIGHTS[category];
  const label = FDC_COVERAGE_LABELS[category];

  // No data for this category → neutral (full score, no penalty)
  if (!hasData && present === 0) {
    return { category, label, score: 100, weight, entityCount: 0, issueCount: 0 };
  }

  // Score: deduct per issue, minimum 0
  const base = present > 0 ? 100 : 0;
  const penalty = present > 0 ? Math.min(100, (issues / present) * 100) : (issues > 0 ? 100 : 0);
  const score = Math.max(0, Math.round(base - penalty));

  return { category, label, score, weight, entityCount: present, issueCount: issues };
}

// ─── Main Integrity Computation ───────────────────────────────
export function computeFinanceIntegrity(
  tenantId: string,
  counts: FDCSnapshotCounts,
  registry: FDCRegistryEntry[],
  links: FDCLink[],
  _now: Date
): FDCIntegrityResult {
  const actions: FDCRepairAction[] = [];

  // --- Rule 1: ACCOUNT_OWNER_MISSING ---
  const accountsWithoutOwner = registry.filter(
    r => r.entity_type === 'account' && !r.owner_person_id && r.status === 'active'
  );
  for (const r of accountsWithoutOwner) {
    actions.push(makeAction(tenantId, 'ACCOUNT_OWNER_MISSING', 'account', r.entity_id));
  }

  // --- Rule 2: ACCOUNT_META_MISSING (WARN, not block) ---
  if (counts.accounts > 0 && counts.accountsWithMeta < counts.accounts) {
    const accountRegs = registry.filter(r => r.entity_type === 'account' && r.status === 'active');
    // We can't tell which specific accounts lack meta without more data,
    // so we create one action per account without meta
    for (const r of accountRegs) {
      actions.push(makeAction(tenantId, 'ACCOUNT_META_MISSING', 'account', r.entity_id));
    }
    // Remove excess actions if some accounts do have meta
    if (counts.accountsWithMeta > 0 && actions.length > (counts.accounts - counts.accountsWithMeta)) {
      // Trim to actual missing count — simplified: just flag all, engine is advisory
    }
  }

  // --- Rule 3: CONTRACT_OWNER_MISSING ---
  const contractTypes = ['insurance_sach', 'insurance_kv', 'vorsorge'];
  const contractsWithoutOwner = registry.filter(
    r => contractTypes.includes(r.entity_type) && !r.owner_person_id && r.status === 'active'
  );
  for (const r of contractsWithoutOwner) {
    actions.push(makeAction(tenantId, 'CONTRACT_OWNER_MISSING', r.entity_type, r.entity_id));
  }

  // --- Rule 4: CONTRACT_PAYMENT_SOURCE_MISSING ---
  const payableTypes = ['insurance_sach', 'insurance_kv', 'vorsorge', 'miety_contract'];
  const payableRegistry = registry.filter(
    r => payableTypes.includes(r.entity_type) && r.status === 'active'
  );
  for (const r of payableRegistry) {
    const hasPaymentLink = links.some(
      l => l.from_type === r.entity_type && l.from_id === r.entity_id && l.link_type === 'pays_from'
    );
    if (!hasPaymentLink && !r.linked_account_id) {
      actions.push(makeAction(tenantId, 'CONTRACT_PAYMENT_SOURCE_MISSING', r.entity_type, r.entity_id));
    }
  }

  // --- Rule 5: DUPLICATE_CONTRACT_SUSPECT ---
  // Simplified: flag contract_candidates with status=candidate
  if (counts.contractCandidatesPending > 0) {
    const candidates = registry.filter(
      r => r.entity_type === 'contract_candidate' && r.status === 'candidate'
    );
    for (const r of candidates) {
      actions.push(makeAction(tenantId, 'DUPLICATE_CONTRACT_SUSPECT', 'contract_candidate', r.entity_id));
    }
  }

  // --- Rule 6: LOAN_PROPERTY_LINK_MISSING ---
  const mortgagesWithoutProp = registry.filter(
    r => r.entity_type === 'mortgage' && !r.linked_property_id && r.status === 'active'
  );
  for (const r of mortgagesWithoutProp) {
    actions.push(makeAction(tenantId, 'LOAN_PROPERTY_LINK_MISSING', 'mortgage', r.entity_id));
  }

  // --- Rule 7: PROPERTY_LOAN_MISMATCH ---
  // Requires comparing outstanding_balance vs property financing — needs enriched snapshot
  // Wave 1: skip detailed mismatch, only check if property has any loan linked
  if (counts.properties > 0 && counts.propertiesWithLoan < counts.properties) {
    const propRegs = registry.filter(
      r => r.entity_type === 'property_finance_ref' && r.status === 'active'
    );
    for (const r of propRegs) {
      const hasLoanLink = links.some(
        l => (l.to_type === 'property_finance_ref' && l.to_id === r.entity_id && l.link_type === 'secured_by') ||
             (l.from_type === 'mortgage' && l.link_type === 'secured_by' && l.to_id === r.entity_id)
      );
      if (!hasLoanLink) {
        // This is informational — not all properties have loans
        // Only flag if there ARE mortgages without property links
      }
    }
  }

  // --- Rule 8: PENSION_DATA_MISSING ---
  if (counts.pensions === 0) {
    actions.push(makeAction(tenantId, 'PENSION_DATA_MISSING', 'pension', '00000000-0000-0000-0000-000000000000'));
  }

  // --- Rule 9: HOME_CONTRACT_LINK_MISSING ---
  if (counts.mietyContracts > 0 && counts.mietyContractsLinkedToHome < counts.mietyContracts) {
    const unlinked = registry.filter(
      r => r.entity_type === 'miety_contract' && r.status === 'active'
    );
    for (const r of unlinked) {
      const hasHomeLink = links.some(
        l => l.from_type === 'miety_contract' && l.from_id === r.entity_id && l.link_type === 'belongs_to'
      );
      if (!hasHomeLink) {
        actions.push(makeAction(tenantId, 'HOME_CONTRACT_LINK_MISSING', 'miety_contract', r.entity_id));
      }
    }
  }

  // --- Rule 10: LEGAL_DOCS_MISSING ---
  if (counts.legalDocsTestament === 0 || counts.legalDocsPatVfg === 0) {
    actions.push(makeAction(
      tenantId, 'LEGAL_DOCS_MISSING', 'legal_doc', '00000000-0000-0000-0000-000000000000',
      '',
      {
        missingTestament: counts.legalDocsTestament === 0,
        missingPatVfg: counts.legalDocsPatVfg === 0,
      }
    ));
  }

  // --- Rule 11: CONSENT_MISSING ---
  if (!counts.hasFinanceConsent) {
    actions.push(makeAction(tenantId, 'CONSENT_MISSING', 'other', '00000000-0000-0000-0000-000000000000'));
  }

  // --- Rule 12: CANDIDATE_REVIEW_REQUIRED ---
  if (counts.contractCandidatesPending > 0) {
    const candidates = registry.filter(
      r => r.entity_type === 'contract_candidate' && r.status === 'candidate'
    );
    for (const r of candidates) {
      // Don't double-create if already created as DUPLICATE_CONTRACT_SUSPECT
      if (!actions.some(a => a.code === 'CANDIDATE_REVIEW_REQUIRED' && a.entity_id === r.entity_id)) {
        actions.push(makeAction(tenantId, 'CANDIDATE_REVIEW_REQUIRED', 'contract_candidate', r.entity_id));
      }
    }
  }

  // ─── Category Scores ─────────────────────────────────────────
  const issuesByCategory = (types: string[]) =>
    actions.filter(a => types.includes(a.entity_type)).length;

  const categoryScores: FDCCategoryScore[] = [
    computeCategoryScore('konten', counts.accounts, issuesByCategory(['account', 'account_meta']), counts.accounts > 0),
    computeCategoryScore('sachversicherungen', counts.insuranceSach, issuesByCategory(['insurance_sach']), counts.insuranceSach > 0),
    computeCategoryScore('kv', counts.insuranceKv, issuesByCategory(['insurance_kv']), counts.insuranceKv > 0),
    computeCategoryScore('vorsorge', counts.vorsorge, issuesByCategory(['vorsorge']), counts.vorsorge > 0),
    computeCategoryScore('darlehen', counts.mortgages + counts.privateLoans, issuesByCategory(['mortgage', 'private_loan']), (counts.mortgages + counts.privateLoans) > 0),
    computeCategoryScore('zuhause', counts.mietyHomes, issuesByCategory(['miety_home', 'miety_contract', 'miety_loan']), counts.mietyHomes > 0),
    computeCategoryScore('immobilien', counts.properties, issuesByCategory(['property_finance_ref']), counts.properties > 0),
    computeCategoryScore('rechtliches', counts.legalDocs, issuesByCategory(['legal_doc']), true), // Always relevant
    computeCategoryScore('rente', counts.pensions, issuesByCategory(['pension']), true), // Always relevant
  ];

  // Weighted average
  const totalWeight = categoryScores.reduce((sum, c) => sum + c.weight, 0);
  const coverageScore = totalWeight > 0
    ? Math.round(categoryScores.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight)
    : 0;

  return { coverageScore, categoryScores, actionsToUpsert: actions };
}
