/**
 * Provisions-Engine — Reine Funktionen
 */

import type {
  CommissionInput,
  CommissionResult,
  CommissionPartyResult,
  PartnerShareInput,
  PartnerShareResult,
  TippgeberInput,
  TippgeberResult,
  SystemFeeInput,
  SystemFeeResult,
} from './spec';
import { PROVISION_DEFAULTS } from './spec';

function calcParty(dealValue: number, percent: number, vatPercent: number): CommissionPartyResult {
  const netto = dealValue * (percent / 100);
  const vat = netto * (vatPercent / 100);
  return { brutto: netto + vat, netto, vat };
}

export function calcCommission(input: CommissionInput): CommissionResult {
  const vat = input.vatPercent ?? PROVISION_DEFAULTS.vatPercent;
  const buyer = calcParty(input.dealValue, input.buyerCommissionPercent, vat);
  const seller = calcParty(input.dealValue, input.sellerCommissionPercent, vat);
  return {
    buyer,
    seller,
    total: {
      brutto: buyer.brutto + seller.brutto,
      netto: buyer.netto + seller.netto,
      vat: buyer.vat + seller.vat,
    },
  };
}

export function calcPartnerShare(input: PartnerShareInput): PartnerShareResult {
  const partnerAmount =
    input.partnerFixAmount != null
      ? input.partnerFixAmount
      : input.commissionNetto * (input.partnerSharePercent / 100);
  return {
    partnerAmount,
    houseAmount: input.commissionNetto - partnerAmount,
  };
}

export function calcTippgeberFee(input: TippgeberInput): TippgeberResult {
  const sotPercent = input.sotSharePercent ?? PROVISION_DEFAULTS.sotSharePercent;
  const tippPercent = input.tippgeberSharePercent ?? PROVISION_DEFAULTS.tippgeberSharePercent;

  const sotAmount = input.commissionNetto * (sotPercent / 100);
  const tippgeberFee = sotAmount * (tippPercent / 100);
  return {
    sotAmount,
    tippgeberFee,
    remaining: input.commissionNetto - tippgeberFee,
  };
}

// ─── Systemgebühr (erfolgsabhängig) ─────────────────────────────

/**
 * Berechnet die erfolgsabhängige Systemgebühr, die ein Manager
 * bei erfolgreichem Abschluss an SoT abführt.
 *
 * SoT ist KEIN Tippgeber und erhält KEINE Provision.
 * Es handelt sich um eine nutzungsbasierte Plattformgebühr.
 */
export function calcSystemFee(input: SystemFeeInput): SystemFeeResult {
  const pct = input.systemFeePct ?? PROVISION_DEFAULTS.systemFeePct;
  const systemFee = input.grossCommission * (pct / 100);
  return {
    systemFee,
    managerNetto: input.grossCommission - systemFee,
  };
}

// ─── Aggregation Helper ─────────────────────────────────────────

export interface CommissionLineItem {
  amount: number;
  status: string;
}

export interface CommissionAggregation {
  total: number;
  paid: number;
  pending: number;
  paidCount: number;
  pendingCount: number;
}

/**
 * Aggregates commission line items by status.
 * Replaces inline .reduce() blocks across NetworkTab, ProvisionenUebersicht, CommissionApproval.
 */
export function aggregateCommissions(
  items: CommissionLineItem[],
  paidStatuses: string[] = ['paid', 'completed'],
  cancelledStatuses: string[] = ['cancelled'],
): CommissionAggregation {
  let total = 0;
  let paid = 0;
  let pending = 0;
  let paidCount = 0;
  let pendingCount = 0;

  for (const item of items) {
    const amount = item.amount || 0;
    if (cancelledStatuses.includes(item.status)) continue;
    total += amount;
    if (paidStatuses.includes(item.status)) {
      paid += amount;
      paidCount++;
    } else {
      pending += amount;
      pendingCount++;
    }
  }

  return { total, paid, pending, paidCount, pendingCount };
}
