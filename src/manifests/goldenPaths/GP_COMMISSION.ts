/**
 * GP-COMMISSION: Cross-Module Golden Path für erfolgsabhängige Systemgebühr
 * 
 * Einheitlicher Lifecycle für MOD-09 (Immo), MOD-11 (Finance), MOD-12 (Akquise).
 * SoT erhebt eine nutzungsbasierte Plattformgebühr (25%) — KEINE Provision.
 */

import type { GoldenPathDefinition } from './types';

export const GP_COMMISSION_GOLDEN_PATH: GoldenPathDefinition = {
  id: 'gp-commission-system-fee',
  module: 'CROSS-MODULE',
  moduleCode: 'GP-COMMISSION',
  version: '1.0.0',
  label: 'Systemgebühr — Erfolgsabhängige Plattformgebühr',
  description:
    'Cross-Module Golden Path für die erfolgsabhängige Systemgebühr. Manager erhalten Provisionen aus Mandaten; SoT erhebt 25% als Plattformgebühr für Lead-Zulieferung und Tools.',

  required_entities: [
    {
      table: 'commissions',
      description: 'Commission-Record muss bei erfolgreichem Abschluss erstellt werden',
      scope: 'entity_id',
    },
  ],

  required_contracts: [
    {
      key: 'system_fee_agreement',
      source: 'user_consents',
      description: 'Systemgebühr-Vereinbarung (25%) durch Manager akzeptiert',
    },
  ],

  ledger_events: [
    { event_type: 'commission.agreement.accepted', trigger: 'on_complete' },
    { event_type: 'commission.record.created', trigger: 'on_complete' },
    { event_type: 'commission.invoiced', trigger: 'on_complete' },
    { event_type: 'commission.paid', trigger: 'on_complete' },
  ],

  success_state: {
    required_flags: [
      'system_fee_agreement_accepted',
      'deal_closed',
      'commission_record_created',
      'system_fee_paid',
    ],
    description: 'Mandat erfolgreich abgeschlossen, Systemgebühr berechnet und bezahlt.',
  },

  failure_redirect: '/portal',

  steps: [
    // PHASE 1: Lead/Anfrage eingeht (Z3 → Z1) — Precondition, nicht dupliziert
    {
      id: 'lead_received',
      phase: 1,
      label: 'Lead/Anfrage eingegangen',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP_COMMISSION_01_LEAD_RECEIVED',
      completion: [
        {
          key: 'lead_exists',
          source: 'leads',
          check: 'exists',
          description: 'Lead oder Anfrage existiert im System',
        },
      ],
    },

    // PHASE 2: Zuweisung an Manager (Z1 → Z2)
    {
      id: 'lead_assigned',
      phase: 2,
      label: 'Lead an Manager zugewiesen',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP_COMMISSION_02_LEAD_ASSIGNED',
      contract_refs: [
        {
          key: 'CONTRACT_LEAD_ASSIGNMENT',
          direction: 'Z1->Z2',
          correlation_keys: ['tenant_id', 'lead_id', 'assigned_manager_user_id'],
          description: 'Z1 weist Lead an Manager in Zone 2 zu',
        },
      ],
      preconditions: [
        { key: 'lead_exists', source: 'leads', description: 'Lead muss existieren' },
      ],
      completion: [
        {
          key: 'manager_assigned',
          source: 'leads',
          check: 'not_null',
          description: 'assigned_manager_user_id ist gesetzt',
        },
      ],
      on_timeout: {
        ledger_event: 'commission.assignment.timeout',
        status_update: 'timeout',
        recovery_strategy: 'escalate_to_z1',
        escalate_to: 'Z1',
        description: 'Manager-Zuweisung nicht innerhalb 24h erfolgt',
      },
    },

    // PHASE 3: Systemgebühr-Vereinbarung akzeptieren
    {
      id: 'terms_accepted',
      phase: 3,
      label: 'Systemgebühr-Vereinbarung akzeptieren',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_COMMISSION_03_TERMS_ACCEPTED',
      preconditions: [
        { key: 'manager_assigned', source: 'leads', description: 'Manager muss zugewiesen sein' },
      ],
      completion: [
        {
          key: 'system_fee_agreement_accepted',
          source: 'user_consents',
          check: 'exists',
          description: 'Systemgebühr-Vereinbarung wurde akzeptiert',
        },
      ],
      on_rejected: {
        ledger_event: 'commission.agreement.rejected',
        status_update: 'rejected',
        recovery_strategy: 'abort',
        description: 'Manager lehnt Systemgebühr-Vereinbarung ab — kein Mandat möglich',
      },
    },

    // PHASE 4: Deal erfolgreich abgeschlossen
    {
      id: 'deal_closed',
      phase: 4,
      label: 'Mandat erfolgreich abgeschlossen',
      type: 'action',
      task_kind: 'user_task',
      camunda_key: 'GP_COMMISSION_04_DEAL_CLOSED',
      preconditions: [
        {
          key: 'system_fee_agreement_accepted',
          source: 'user_consents',
          description: 'Vereinbarung muss akzeptiert sein',
        },
      ],
      completion: [
        {
          key: 'deal_closed',
          source: 'commissions',
          check: 'exists',
          description: 'Commission-Record wurde erstellt',
        },
      ],
    },

    // PHASE 5: Systemgebühr berechnet + in Rechnung gestellt
    {
      id: 'system_fee_invoiced',
      phase: 5,
      label: 'Systemgebühr berechnet und fakturiert',
      type: 'system',
      task_kind: 'service_task',
      camunda_key: 'GP_COMMISSION_05_INVOICED',
      preconditions: [
        { key: 'deal_closed', source: 'commissions', description: 'Deal muss abgeschlossen sein' },
      ],
      completion: [
        {
          key: 'commission_invoiced',
          source: 'commissions',
          check: 'equals',
          value: 'invoiced',
          description: 'commissions.status = invoiced',
        },
      ],
    },

    // PHASE 6: Systemgebühr bezahlt
    {
      id: 'system_fee_paid',
      phase: 6,
      label: 'Systemgebühr bezahlt',
      type: 'system',
      task_kind: 'wait_message',
      camunda_key: 'GP_COMMISSION_06_PAID',
      preconditions: [
        {
          key: 'commission_invoiced',
          source: 'commissions',
          description: 'Rechnung muss gestellt sein',
        },
      ],
      completion: [
        {
          key: 'system_fee_paid',
          source: 'commissions',
          check: 'equals',
          value: 'paid',
          description: 'commissions.status = paid',
        },
      ],
      on_timeout: {
        ledger_event: 'commission.payment.timeout',
        status_update: 'overdue',
        recovery_strategy: 'manual_review',
        escalate_to: 'Z1',
        description: 'Systemgebühr-Zahlung nicht innerhalb Zahlungsfrist eingegangen',
      },
    },
  ],
};
