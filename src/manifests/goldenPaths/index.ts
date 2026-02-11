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

// ═══════════════════════════════════════════════════════════════
// Ledger Event Whitelist (mirrors data_event_ledger RPC)
// ═══════════════════════════════════════════════════════════════

export const LEDGER_EVENT_WHITELIST: ReadonlySet<string> = new Set([
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
]);

// ═══════════════════════════════════════════════════════════════
// Registry — alle GP-Definitionen hier registrieren
// ═══════════════════════════════════════════════════════════════

import { registerGoldenPath } from '@/goldenpath/engine';
import { MOD_04_GOLDEN_PATH as _MOD_04 } from './MOD_04';

// Registrierung aller Golden Paths
registerGoldenPath('MOD-04', _MOD_04);
