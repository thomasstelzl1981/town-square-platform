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
} from './types';

export { MOD_04_GOLDEN_PATH } from './MOD_04';
export { MOD_07_11_GOLDEN_PATH } from './MOD_07_11';
export { MOD_08_12_GOLDEN_PATH } from './MOD_08_12';
export { MOD_13_GOLDEN_PATH } from './MOD_13';
export { GP_VERMIETUNG_GOLDEN_PATH } from './GP_VERMIETUNG';
export { GP_LEAD_GOLDEN_PATH } from './GP_LEAD';

// ═══════════════════════════════════════════════════════════════
// Ledger Event Whitelist (mirrors data_event_ledger RPC)
// ═══════════════════════════════════════════════════════════════

export const LEDGER_EVENT_WHITELIST: ReadonlySet<string> = new Set([
  // Bestehende Events
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
  // GP-02: Finanzierung
  'finance.request.submitted',
  'finance.mandate.assigned',
  'finance.bank.submitted',
  // GP-03: Akquise
  'acq.mandate.submitted',
  'acq.mandate.assigned',
  'acq.offer.created',
  // GP-05: Projekte
  'project.created',
  'project.phase.changed',
  // GP-10: Vermietung
  'renter.invite.sent',
  'renter.invite.accepted',
  // GP-09: Lead-Generierung
  'lead.captured',
  'lead.assigned',
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

// Registrierung aller Golden Paths
registerGoldenPath('MOD-04', _MOD_04);
registerGoldenPath('MOD-07', _MOD_07_11);
registerGoldenPath('MOD-08', _MOD_08_12);
registerGoldenPath('MOD-13', _MOD_13);
registerGoldenPath('GP-VERMIETUNG', _GP_VERMIETUNG);
registerGoldenPath('GP-LEAD', _GP_LEAD);
