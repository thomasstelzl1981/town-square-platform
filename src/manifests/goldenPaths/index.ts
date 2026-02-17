/**
 * Golden Path Manifests — Registry + Re-Exports
 * 
 * Zentrale SSOT fuer alle Golden-Path-Definitionen.
 * Registrierung erfolgt hier — Engine wird nicht editiert fuer neue Module.
 */

export type {
  StepType,
  TaskKind,
  ContractDirection,
  StepPrecondition,
  StepCompletion,
  ContractRef,
  GoldenPathStep,
  RequiredEntity,
  RequiredContract,
  LedgerEventRef,
  SuccessState,
  GoldenPathDefinition,
  GoldenPathContext,
  StepEvaluation,
  PhaseEvaluation,
  PreconditionResult,
  ContractResult,
  BackboneValidationResult,
  // P0 Hardening
  FailStateRecovery,
  StepFailState,
} from './types';

export { MOD_04_GOLDEN_PATH } from './MOD_04';
export { MOD_07_11_GOLDEN_PATH } from './MOD_07_11';
export { MOD_08_12_GOLDEN_PATH } from './MOD_08_12';
export { MOD_13_GOLDEN_PATH } from './MOD_13';
export { GP_VERMIETUNG_GOLDEN_PATH } from './GP_VERMIETUNG';
export { GP_LEAD_GOLDEN_PATH } from './GP_LEAD';
export { GP_FINANCE_Z3_GOLDEN_PATH } from './GP_FINANCE_Z3';

// ═══════════════════════════════════════════════════════════════
// Ledger Event Whitelist (mirrors data_event_ledger RPC)
// ═══════════════════════════════════════════════════════════════

export const LEDGER_EVENT_WHITELIST: ReadonlySet<string> = new Set([
  // ─── Bestehende Events ─────────────────────────────────────
  'document.uploaded',
  'document.signed_url.view',
  'document.signed_url.download',
  'access_grant.created',
  'access_grant.revoked',
  'inbound.email.received',
  'outbound.email.sent',
  'inbound.webhook.received',
  'listing.published',
  'listing.unpublished',
  'tenant.reset.started',
  'tenant.reset.completed',
  'data.purge.executed',

  // ─── GP-02: Finanzierung ───────────────────────────────────
  'finance.request.submitted',
  'finance.mandate.assigned',
  'finance.bank.submitted',

  // ─── GP-03: Akquise ────────────────────────────────────────
  'acq.mandate.submitted',
  'acq.mandate.assigned',
  'acq.offer.created',

  // ─── GP-05: Projekte ───────────────────────────────────────
  'project.created',
  'project.phase.changed',

  // ─── GP-10: Vermietung ─────────────────────────────────────
  'renter.invite.sent',
  'renter.invite.accepted',

  // ─── GP-09: Lead-Generierung ───────────────────────────────
  'lead.captured',
  'lead.assigned',

  // ═══════════════════════════════════════════════════════════
  // P0 HARDENING: Fail-State Events
  // ═══════════════════════════════════════════════════════════

  // ─── MOD-04: Immobilie Fail-States ─────────────────────────
  'mod05.visibility.error',
  'sales.desk.submit.timeout',
  'sales.desk.submit.error',
  'listing.distribution.timeout',
  'listing.distribution.rejected',
  'listing.distribution.duplicate_detected',
  'listing.distribution.error',
  'finance.handoff.timeout',
  'finance.handoff.error',
  'project.intake.timeout',
  'project.intake.error',

  // ─── GP-02: Finanzierung Fail-States ───────────────────────
  'finance.request.submit.timeout',
  'finance.request.submit.duplicate_detected',
  'finance.request.submit.error',
  'finance.mandate.assignment.timeout',
  'finance.mandate.assignment.rejected',
  'finance.mandate.assignment.error',
  'finance.bank.submit.timeout',
  'finance.bank.submit.error',

  // ─── GP-03: Akquise Fail-States ────────────────────────────
  'acq.mandate.submit.timeout',
  'acq.mandate.submit.duplicate_detected',
  'acq.mandate.submit.error',
  'acq.mandate.assignment.timeout',
  'acq.mandate.assignment.rejected',
  'acq.mandate.assignment.error',
  'acq.outbound.response.timeout',
  'acq.outbound.send.error',

  // ─── GP-05: Projekte Fail-States ───────────────────────────
  'project.phase.change.timeout',
  'project.phase.change.error',
  'project.listing.distribution.timeout',
  'project.listing.distribution.rejected',
  'project.listing.distribution.error',
  'project.landing_page.timeout',
  'project.landing_page.error',

  // ─── GP-10: Vermietung Fail-States ─────────────────────────
  'renter.invite.send.timeout',
  'renter.invite.duplicate_detected',
  'renter.invite.send.error',
  'renter.invite.expired',
  'renter.invite.rejected',
  'renter.invite.accept.error',
  'renter.data_room.activation.error',
  'renter.portal.activation.error',
  'renter.org.provisioned',
  'data_room.access.granted',

  // ─── GP-09: Lead Fail-States ───────────────────────────────
  'lead.capture.duplicate_detected',
  'lead.capture.error',

  // ─── GP-FINANCE-Z3: Zone 3 Finanzierungseinreichung ────────
  'finance.z3.request.submitted',
  'finance.z3.lead.created',
  'finance.z3.dataroom.created',
  'finance.z3.email.sent',
  'finance.z3.triaged',
  'finance.z3.manager.assigned',

  // ─── GP-FINANCE-Z3: Fail-States ───────────────────────────
  'finance.z3.submit.error',
  'finance.z3.submit.duplicate_detected',
  'finance.z3.lead.create.error',
  'finance.z3.dataroom.create.error',
  'finance.z3.email.send.error',
  'finance.z3.triage.timeout',
  'finance.z3.manager.assignment.timeout',
  'finance.z3.manager.assignment.rejected',
  'finance.z3.manager.assignment.error',
  'finance.z3.bank.submit.error',

  // ═══════════════════════════════════════════════════════════
  // P0 HARDENING: DSGVO Consent Events (Art. 7)
  // ═══════════════════════════════════════════════════════════
  'consent.given',
  'consent.revoked',
  'consent.updated',

  // ═══════════════════════════════════════════════════════════
  // P0 HARDENING: PII Audit Events
  // ═══════════════════════════════════════════════════════════
  'applicant_profile.updated',
  'applicant_profile.delete_requested',
  'applicant_profile.deleted',
  'contact.updated',
  'contact.delete_requested',
  'contact.deleted',
  'profile.updated',
  'profile.delete_requested',
  'profile.deleted',
]);

// ═══════════════════════════════════════════════════════════════
// Registry — alle GP-Definitionen hier registrieren
// ═══════════════════════════════════════════════════════════════

import { registerGoldenPath } from '@/goldenpath/engine';
import { MOD_04_GOLDEN_PATH as _MOD_04 } from './MOD_04';
import { MOD_07_11_GOLDEN_PATH as _MOD_07_11 } from './MOD_07_11';
import { MOD_08_12_GOLDEN_PATH as _MOD_08_12 } from './MOD_08_12';
import { MOD_13_GOLDEN_PATH as _MOD_13 } from './MOD_13';
import { GP_VERMIETUNG_GOLDEN_PATH as _GP_VERMIETUNG } from './GP_VERMIETUNG';
import { GP_LEAD_GOLDEN_PATH as _GP_LEAD } from './GP_LEAD';
import { GP_FINANCE_Z3_GOLDEN_PATH as _GP_FINANCE_Z3 } from './GP_FINANCE_Z3';

// Registrierung aller Golden Paths
registerGoldenPath('MOD-04', _MOD_04);
registerGoldenPath('MOD-07', _MOD_07_11);
registerGoldenPath('MOD-08', _MOD_08_12);
registerGoldenPath('MOD-13', _MOD_13);
registerGoldenPath('GP-VERMIETUNG', _GP_VERMIETUNG);
registerGoldenPath('GP-LEAD', _GP_LEAD);
registerGoldenPath('GP-FINANCE-Z3', _GP_FINANCE_Z3);
