/**
 * ENG-TLC — Tenancy Lifecycle Controller: Engine
 * 
 * Pure functions for lease lifecycle analysis.
 * NO side effects, NO DB calls, NO UI imports.
 * 
 * @engine ENG-TLC
 * @version 1.1.0
 */

import {
  type TLCPhase,
  type TLCCheckResult,
  type TLCEventCandidate,
  type TLCTaskCandidate,
  type LeaseAnalysisInput,
  type RentIncreaseCheck,
  RENT_INCREASE_DEFAULTS,
} from './spec';

// ─── Phase Determination ──────────────────────────────────────

export function determinePhase(lease: LeaseAnalysisInput, today: string): TLCPhase {
  const todayDate = new Date(today);
  const startDate = new Date(lease.startDate);
  const endDate = lease.endDate ? new Date(lease.endDate) : null;
  const noticeDate = lease.noticeDate ? new Date(lease.noticeDate) : null;

  if (lease.status === 'draft' || lease.status === 'pending') return 'application';
  if (lease.status === 'signed' && todayDate < startDate) return 'contract';
  
  const moveInEnd = new Date(startDate);
  moveInEnd.setDate(moveInEnd.getDate() + 30);
  if (todayDate >= startDate && todayDate <= moveInEnd && lease.phase === 'move_in') return 'move_in';

  if (noticeDate && todayDate >= noticeDate) {
    if (endDate && todayDate >= endDate) return 'move_out';
    return 'termination';
  }

  if (endDate && todayDate >= endDate) return 'reletting';
  if (lease.status === 'terminated') return 'move_out';
  if (lease.status === 'inactive') return 'reletting';

  return 'active';
}

// ─── Payment Analysis ─────────────────────────────────────────

export interface PaymentStatus {
  month: string;
  expected: number;
  received: number;
  delta: number;
  daysOverdue: number;
  status: 'paid' | 'partial' | 'missing' | 'overpaid';
}

export function analyzePaymentStatus(
  expectedMonthly: number,
  payments: Array<{ month: string; amount: number }>,
  today: string,
  paymentDueDay: number = 1
): PaymentStatus[] {
  const todayDate = new Date(today);
  const currentMonth = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
  
  const results: PaymentStatus[] = [];
  
  for (let i = 0; i < 12; i++) {
    const d = new Date(todayDate);
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const monthPayments = payments.filter(p => p.month === month);
    const received = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const delta = received - expectedMonthly;
    
    const dueDate = new Date(d.getFullYear(), d.getMonth(), paymentDueDay);
    const daysOverdue = month < currentMonth && received < expectedMonthly
      ? Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    let status: PaymentStatus['status'] = 'paid';
    if (received === 0 && month <= currentMonth) status = 'missing';
    else if (received < expectedMonthly * 0.95) status = 'partial';
    else if (received > expectedMonthly * 1.05) status = 'overpaid';

    results.push({ month, expected: expectedMonthly, received, delta, daysOverdue, status });
  }

  return results;
}

// ─── Dunning Level Determination ──────────────────────────────

export function determineDunningLevel(
  daysOverdue: number,
  dunningConfig: Array<{ level: number; daysAfterDue: number }>
): number {
  let matchedLevel = -1;
  for (const config of dunningConfig.sort((a, b) => a.daysAfterDue - b.daysAfterDue)) {
    if (daysOverdue >= config.daysAfterDue) {
      matchedLevel = config.level;
    }
  }
  return matchedLevel;
}

// ─── Dunning Chronology Builder ───────────────────────────────

export interface DunningChronologyEntry {
  date: string;
  level: number;
  label: string;
  action: string;
  amount: number;
  feeEur: number;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export function buildDunningChronology(
  events: Array<{ event_type: string; created_at: string; payload: Record<string, unknown> }>,
  dunningConfig: Array<{ level: number; label: string; fee_eur: number; send_channel: string }>
): DunningChronologyEntry[] {
  const dunningEvents = events.filter(e => 
    e.event_type.startsWith('dunning_') || e.event_type === 'payment_missed'
  );

  return dunningEvents.map(e => {
    const payload = e.payload || {};
    const level = (payload.dunningLevel as number) ?? 0;
    const config = dunningConfig.find(dc => dc.level === level);
    
    return {
      date: e.created_at,
      level,
      label: config?.label || `Stufe ${level}`,
      action: e.event_type === 'dunning_reminder' ? 'Erinnerung versendet' :
              e.event_type === 'dunning_level_1' ? '1. Mahnung versendet' :
              e.event_type === 'dunning_level_2' ? '2. Mahnung versendet' :
              e.event_type === 'dunning_final' ? 'Letzte Mahnung versendet' :
              e.event_type === 'dunning_escalation_inkasso' ? 'An Inkasso übergeben' :
              'Zahlungsrückstand erkannt',
      amount: (payload.expected as number) || 0,
      feeEur: config?.fee_eur || 0,
      channel: config?.send_channel || 'email',
      status: ((payload.mailSent as boolean) ? 'sent' : 'pending') as DunningChronologyEntry['status'],
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ─── Rent Increase Eligibility (§558 BGB) ─────────────────────

export function checkRentIncreaseEligibility(
  lease: LeaseAnalysisInput,
  today: string,
  isTightMarket: boolean = false
): RentIncreaseCheck {
  const todayDate = new Date(today);
  const reasons: string[] = [];
  let isEligible = false;
  let nextEligibleDate: string | null = null;

  const defaults = RENT_INCREASE_DEFAULTS;
  const capPercent = isTightMarket ? defaults.capPercentTight : defaults.capPercentNormal;

  // Indexmiete: separate rules
  if (lease.rentModel === 'INDEX') {
    const minMonths = defaults.indexMinMonths;
    if (lease.lastRentIncreaseAt) {
      const lastIncrease = new Date(lease.lastRentIncreaseAt);
      const eligible = new Date(lastIncrease);
      eligible.setMonth(eligible.getMonth() + minMonths);
      if (todayDate >= eligible) {
        isEligible = true;
        reasons.push(`Indexmiete: Mindestabstand ${minMonths} Monate erreicht`);
      } else {
        nextEligibleDate = eligible.toISOString().split('T')[0];
        reasons.push(`Indexmiete: Nächste Erhöhung frühestens ${nextEligibleDate}`);
      }
    } else {
      isEligible = true;
      reasons.push('Indexmiete: Keine vorherige Erhöhung gefunden');
    }

    return {
      leaseId: lease.leaseId,
      currentRentCold: lease.rentColdEur || 0,
      lastIncreaseAt: lease.lastRentIncreaseAt,
      rentModel: lease.rentModel,
      leaseStartDate: lease.startDate,
      lockoutMonths: minMonths,
      capPercent: 0,
      capPeriodYears: 0,
      isEligible,
      nextEligibleDate,
      reasons,
    };
  }

  // Staffelmiete: automatic steps
  if (lease.rentModel === 'STAFFEL') {
    if (lease.nextRentAdjustmentDate) {
      const nextDate = new Date(lease.nextRentAdjustmentDate);
      if (todayDate >= nextDate) {
        isEligible = true;
        reasons.push('Staffelmiete: Nächste Staffelstufe fällig');
      } else {
        nextEligibleDate = lease.nextRentAdjustmentDate;
        reasons.push(`Staffelmiete: Nächste Stufe am ${nextEligibleDate}`);
      }
    }

    return {
      leaseId: lease.leaseId,
      currentRentCold: lease.rentColdEur || 0,
      lastIncreaseAt: lease.lastRentIncreaseAt,
      rentModel: lease.rentModel,
      leaseStartDate: lease.startDate,
      lockoutMonths: 0,
      capPercent: 0,
      capPeriodYears: 0,
      isEligible,
      nextEligibleDate,
      reasons,
    };
  }

  // Standard rent increase (§558 BGB)
  const lockoutMonths = defaults.lockoutMonths;
  
  if (lease.lastRentIncreaseAt) {
    const lastIncrease = new Date(lease.lastRentIncreaseAt);
    const lockoutEnd = new Date(lastIncrease);
    lockoutEnd.setMonth(lockoutEnd.getMonth() + lockoutMonths);
    
    if (todayDate < lockoutEnd) {
      nextEligibleDate = lockoutEnd.toISOString().split('T')[0];
      reasons.push(`Sperrfrist: §558 BGB, 15 Monate ab letzter Erhöhung (${lease.lastRentIncreaseAt})`);
      reasons.push(`Nächste Erhöhung frühestens: ${nextEligibleDate}`);
    } else {
      isEligible = true;
      reasons.push(`Sperrfrist abgelaufen seit ${lockoutEnd.toISOString().split('T')[0]}`);
    }
  } else {
    const startDate = new Date(lease.startDate);
    const firstEligible = new Date(startDate);
    firstEligible.setMonth(firstEligible.getMonth() + 12);
    
    if (todayDate >= firstEligible) {
      isEligible = true;
      reasons.push('Keine vorherige Mieterhöhung — erstmalig möglich');
    } else {
      nextEligibleDate = firstEligible.toISOString().split('T')[0];
      reasons.push(`Ersterhöhung frühestens 12 Monate nach Mietbeginn: ${nextEligibleDate}`);
    }
  }

  if (isEligible) {
    reasons.push(`Kappungsgrenze: max. ${capPercent}% in ${defaults.capPeriodYears} Jahren`);
    if (isTightMarket) {
      reasons.push('Angespannter Wohnungsmarkt: Kappungsgrenze 15% statt 20%');
    }
  }

  return {
    leaseId: lease.leaseId,
    currentRentCold: lease.rentColdEur || 0,
    lastIncreaseAt: lease.lastRentIncreaseAt,
    rentModel: lease.rentModel,
    leaseStartDate: lease.startDate,
    lockoutMonths,
    capPercent,
    capPeriodYears: defaults.capPeriodYears,
    isEligible,
    nextEligibleDate,
    reasons,
  };
}

// ─── Rent Increase Proposal (Vorschlagslogik) ─────────────────

export type RentIncreaseStrategy = 'conservative' | 'market' | 'maximum';

export interface RentIncreaseProposal {
  strategy: RentIncreaseStrategy;
  currentRent: number;
  proposedRent: number;
  increaseEur: number;
  increasePercent: number;
  capLimit: number;
  withinCap: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

/**
 * Calculate rent increase proposals with three strategies:
 * - conservative: 50% of cap limit
 * - market: 75% of cap limit (or up to Vergleichsmiete if provided)
 * - maximum: full cap limit (§558 Abs. 3 BGB)
 */
export function calculateRentIncreaseProposals(
  currentRent: number,
  rentThreeYearsAgo: number | null,
  capPercent: number,
  vergleichsmiete: number | null = null
): RentIncreaseProposal[] {
  const baseRent = rentThreeYearsAgo ?? currentRent;
  const capLimit = baseRent * (capPercent / 100);
  const maxIncrease = capLimit; // maximum allowed in cap period
  
  // How much has already been increased in the cap period?
  const alreadyIncreased = currentRent - baseRent;
  const remainingCap = Math.max(0, maxIncrease - alreadyIncreased);

  const strategies: Array<{ strategy: RentIncreaseStrategy; factor: number; risk: 'low' | 'medium' | 'high' }> = [
    { strategy: 'conservative', factor: 0.5, risk: 'low' },
    { strategy: 'market', factor: 0.75, risk: 'medium' },
    { strategy: 'maximum', factor: 1.0, risk: 'high' },
  ];

  return strategies.map(({ strategy, factor, risk }) => {
    let proposedIncrease = remainingCap * factor;
    
    // If Vergleichsmiete is provided, cap at that level for market strategy
    if (strategy === 'market' && vergleichsmiete && vergleichsmiete > currentRent) {
      proposedIncrease = Math.min(proposedIncrease, vergleichsmiete - currentRent);
    }

    const proposedRent = currentRent + proposedIncrease;
    const increasePercent = currentRent > 0 ? (proposedIncrease / currentRent) * 100 : 0;
    const withinCap = (currentRent + proposedIncrease - baseRent) <= maxIncrease;

    const reasoning = strategy === 'conservative'
      ? `Vorsichtige Erhöhung um ${increasePercent.toFixed(1)}% — minimales Konfliktrisiko`
      : strategy === 'market'
      ? `Marktorientierte Erhöhung${vergleichsmiete ? ` (Vergleichsmiete: ${vergleichsmiete.toFixed(2)} €)` : ''} — moderates Risiko`
      : `Maximale Erhöhung bis Kappungsgrenze (${capPercent}% in 3 Jahren) — hohes Konfliktrisiko`;

    return {
      strategy,
      currentRent,
      proposedRent: Math.round(proposedRent * 100) / 100,
      increaseEur: Math.round(proposedIncrease * 100) / 100,
      increasePercent: Math.round(increasePercent * 10) / 10,
      capLimit: Math.round(maxIncrease * 100) / 100,
      withinCap,
      riskLevel: risk,
      reasoning,
    };
  });
}

// ─── 3-Jahres-Erhöhungscheck ──────────────────────────────────

export interface ThreeYearCheck {
  leaseId: string;
  unitId: string;
  currentRent: number;
  rentThreeYearsAgo: number | null;
  totalIncreaseEur: number;
  totalIncreasePercent: number;
  capPercent: number;
  capUsedPercent: number;
  remainingCapEur: number;
  status: 'within_cap' | 'near_cap' | 'at_cap' | 'over_cap';
  proposals: RentIncreaseProposal[];
}

export function performThreeYearCheck(
  lease: LeaseAnalysisInput,
  rentThreeYearsAgo: number | null,
  isTightMarket: boolean = false,
  vergleichsmiete: number | null = null
): ThreeYearCheck {
  const currentRent = lease.rentColdEur || 0;
  const baseRent = rentThreeYearsAgo ?? currentRent;
  const capPercent = isTightMarket ? RENT_INCREASE_DEFAULTS.capPercentTight : RENT_INCREASE_DEFAULTS.capPercentNormal;
  
  const totalIncreaseEur = currentRent - baseRent;
  const totalIncreasePercent = baseRent > 0 ? (totalIncreaseEur / baseRent) * 100 : 0;
  const maxIncrease = baseRent * (capPercent / 100);
  const capUsedPercent = maxIncrease > 0 ? (totalIncreaseEur / maxIncrease) * 100 : 0;
  const remainingCapEur = Math.max(0, maxIncrease - totalIncreaseEur);

  let status: ThreeYearCheck['status'] = 'within_cap';
  if (capUsedPercent >= 100) status = 'over_cap';
  else if (capUsedPercent >= 95) status = 'at_cap';
  else if (capUsedPercent >= 75) status = 'near_cap';

  const proposals = remainingCapEur > 0
    ? calculateRentIncreaseProposals(currentRent, rentThreeYearsAgo, capPercent, vergleichsmiete)
    : [];

  return {
    leaseId: lease.leaseId,
    unitId: lease.unitId,
    currentRent,
    rentThreeYearsAgo,
    totalIncreaseEur: Math.round(totalIncreaseEur * 100) / 100,
    totalIncreasePercent: Math.round(totalIncreasePercent * 10) / 10,
    capPercent,
    capUsedPercent: Math.round(capUsedPercent * 10) / 10,
    remainingCapEur: Math.round(remainingCapEur * 100) / 100,
    status,
    proposals,
  };
}

// ─── Deposit Status Check ─────────────────────────────────────

export function checkDepositStatus(
  depositAmount: number | null,
  depositStatus: string | null,
  rentCold: number | null,
  startDate: string,
  today: string
): TLCEventCandidate | null {
  if (!depositAmount || depositAmount <= 0) return null;
  
  const todayDate = new Date(today);
  const start = new Date(startDate);
  const monthsSinceStart = (todayDate.getFullYear() - start.getFullYear()) * 12 + (todayDate.getMonth() - start.getMonth());

  if (monthsSinceStart > 3 && (!depositStatus || depositStatus === 'open' || depositStatus === 'OPEN')) {
    return {
      eventType: 'deposit_partial',
      severity: 'warning',
      title: 'Kaution ausstehend',
      description: `Kaution von ${depositAmount.toFixed(2)} € seit ${monthsSinceStart} Monaten nicht eingegangen.`,
      payload: { depositAmount, depositStatus, monthsSinceStart },
    };
  }

  if (rentCold && depositAmount > rentCold * 3) {
    return {
      eventType: 'ai_anomaly_detected',
      severity: 'warning',
      title: 'Kaution übersteigt gesetzliches Maximum',
      description: `Kaution (${depositAmount.toFixed(2)} €) > 3 Nettokaltmieten (${(rentCold * 3).toFixed(2)} €). Prüfung empfohlen.`,
      payload: { depositAmount, maxLegal: rentCold * 3 },
    };
  }

  return null;
}

// ─── Kaution: Zinsgutschrift-Berechnung ───────────────────────

export interface DepositInterest {
  depositAmount: number;
  startDate: string;
  endDate: string;
  years: number;
  annualRate: number; // e.g. 0.01 for 1%
  accruedInterest: number;
  totalWithInterest: number;
}

/**
 * Calculate deposit interest accrual (§551 BGB: Kaution muss verzinslich angelegt werden)
 * Uses simple interest calculation (Sparbuch-Niveau)
 */
export function calculateDepositInterest(
  depositAmount: number,
  startDate: string,
  endDate: string,
  annualRate: number = 0.001 // 0.1% default (Sparbuchzins)
): DepositInterest {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Compound interest
  const totalWithInterest = depositAmount * Math.pow(1 + annualRate, years);
  const accruedInterest = totalWithInterest - depositAmount;

  return {
    depositAmount,
    startDate,
    endDate,
    years: Math.round(years * 10) / 10,
    annualRate,
    accruedInterest: Math.round(accruedInterest * 100) / 100,
    totalWithInterest: Math.round(totalWithInterest * 100) / 100,
  };
}

// ─── Kaution: Abrechnungs-Template ────────────────────────────

export interface DepositSettlement {
  depositAmount: number;
  accruedInterest: number;
  deductions: DepositDeduction[];
  totalDeductions: number;
  payoutAmount: number;
}

export interface DepositDeduction {
  category: 'nk_outstanding' | 'damage' | 'rent_arrears' | 'cleaning' | 'other';
  label: string;
  amount: number;
}

export function calculateDepositSettlement(
  depositAmount: number,
  accruedInterest: number,
  deductions: DepositDeduction[]
): DepositSettlement {
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const payoutAmount = Math.max(0, depositAmount + accruedInterest - totalDeductions);

  return {
    depositAmount,
    accruedInterest,
    deductions,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    payoutAmount: Math.round(payoutAmount * 100) / 100,
  };
}

// ─── Full Lease Analysis ──────────────────────────────────────

export function analyzeLease(
  lease: LeaseAnalysisInput,
  payments: Array<{ month: string; amount: number }>,
  dunningConfig: Array<{ level: number; daysAfterDue: number }>,
  today: string,
  options: { isTightMarket?: boolean; rentThreeYearsAgo?: number | null; vergleichsmiete?: number | null } = {}
): TLCCheckResult {
  const phase = determinePhase(lease, today);
  const events: TLCEventCandidate[] = [];
  const tasks: TLCTaskCandidate[] = [];
  const nextBestActions: string[] = [];
  let riskScore = 0;

  // 1. Payment analysis
  if (phase === 'active' || phase === 'termination') {
    const paymentStatuses = analyzePaymentStatus(
      lease.monthlyRent,
      payments,
      today,
      lease.paymentDueDay || 1
    );

    const missedMonths = paymentStatuses.filter(p => p.status === 'missing');
    const partialMonths = paymentStatuses.filter(p => p.status === 'partial');

    if (missedMonths.length > 0) {
      const worstOverdue = Math.max(...missedMonths.map(m => m.daysOverdue));
      const dunningLevel = determineDunningLevel(worstOverdue, dunningConfig);
      
      riskScore += Math.min(missedMonths.length * 15, 60);

      events.push({
        eventType: dunningLevel >= 1 ? `dunning_level_${Math.min(dunningLevel, 2)}` as any : 'payment_missed',
        severity: dunningLevel >= 3 ? 'critical' : dunningLevel >= 1 ? 'warning' : 'info',
        title: `Mietrückstand: ${missedMonths.length} Monat(e)`,
        description: `${missedMonths.length} ausstehende Mietzahlungen, längster Rückstand: ${worstOverdue} Tage.`,
        payload: { missedMonths: missedMonths.map(m => m.month), worstOverdue, dunningLevel },
      });

      if (dunningLevel >= 0) {
        tasks.push({
          taskType: 'reminder',
          category: 'payment',
          title: dunningLevel === 0 ? 'Zahlungserinnerung versenden' : `Mahnung Stufe ${dunningLevel} versenden`,
          description: `Mietrückstand seit ${worstOverdue} Tagen. Mahnstufe ${dunningLevel} fällig.`,
          priority: dunningLevel >= 3 ? 'urgent' : dunningLevel >= 1 ? 'high' : 'normal',
          dueDate: today,
        });
        nextBestActions.push(`Mahnstufe ${dunningLevel}: ${missedMonths.length} Monatsmiete(n) ausstehend`);
      }
    }

    if (partialMonths.length > 0) {
      riskScore += partialMonths.length * 5;
      events.push({
        eventType: 'payment_partial',
        severity: 'info',
        title: `Teilzahlung: ${partialMonths.length} Monat(e)`,
        description: `${partialMonths.length} Monate mit unvollständiger Mietzahlung.`,
        payload: { partialMonths: partialMonths.map(m => ({ month: m.month, delta: m.delta })) },
      });
    }
  }

  // 2. Rent increase check
  if (phase === 'active') {
    const rentCheck = checkRentIncreaseEligibility(lease, today, options.isTightMarket);
    if (rentCheck.isEligible) {
      // Also run 3-year check with proposals
      const threeYearCheck = performThreeYearCheck(
        lease,
        options.rentThreeYearsAgo ?? null,
        options.isTightMarket,
        options.vergleichsmiete ?? null
      );

      events.push({
        eventType: 'rent_increase_eligible',
        severity: 'info',
        title: 'Mieterhöhung möglich',
        description: rentCheck.reasons.join('. '),
        payload: {
          ...rentCheck as unknown as Record<string, unknown>,
          threeYearCheck: threeYearCheck as unknown as Record<string, unknown>,
        },
      });
      
      const proposalSummary = threeYearCheck.proposals.length > 0
        ? ` Vorschläge: ${threeYearCheck.proposals.map(p => `${p.strategy}: +${p.increaseEur.toFixed(2)} €`).join(', ')}`
        : '';
      
      nextBestActions.push(`Mieterhöhung prüfen — Sperrfrist abgelaufen.${proposalSummary}`);
      tasks.push({
        taskType: 'task',
        category: 'rent_increase',
        title: 'Mieterhöhung prüfen und vorbereiten',
        description: `${rentCheck.reasons.join('. ')}${proposalSummary}`,
        priority: 'normal',
        dueDate: null,
      });
    }
  }

  // 3. Deposit check
  const depositEvent = checkDepositStatus(
    lease.depositAmountEur,
    lease.depositStatus,
    lease.rentColdEur,
    lease.startDate,
    today
  );
  if (depositEvent) {
    events.push(depositEvent);
    riskScore += 10;
    nextBestActions.push('Kautionsstatus prüfen');
  }

  // 4. Termination deadline check
  if (lease.noticeDate && phase === 'termination') {
    const endDate = lease.endDate ? new Date(lease.endDate) : null;
    if (endDate) {
      const daysUntilEnd = Math.floor((endDate.getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd <= 30 && daysUntilEnd > 0) {
        events.push({
          eventType: 'deadline_approaching',
          severity: 'warning',
          title: `Mietende in ${daysUntilEnd} Tagen`,
          description: `Mietverhältnis endet am ${lease.endDate}. Übergabe und Kautionsabrechnung vorbereiten.`,
          payload: { endDate: lease.endDate, daysUntilEnd },
        });
        riskScore += 5;
        tasks.push({
          taskType: 'inspection',
          category: 'maintenance',
          title: 'Übergabe planen',
          description: `Wohnungsübergabe vor ${lease.endDate} terminieren.`,
          priority: 'high',
          dueDate: lease.endDate,
        });
        nextBestActions.push(`Auszug in ${daysUntilEnd} Tagen — Übergabe planen`);
      }
    }
  }

  // 5. Deposit settlement check at move-out
  if (phase === 'move_out' && lease.depositAmountEur && lease.depositAmountEur > 0) {
    const depositStatus = lease.depositStatus?.toUpperCase();
    if (depositStatus !== 'SETTLED' && depositStatus !== 'RETURNED') {
      events.push({
        eventType: 'deposit_settlement_started',
        severity: 'action_required',
        title: 'Kautionsabrechnung erstellen',
        description: `Kaution ${lease.depositAmountEur.toFixed(2)} € muss abgerechnet werden (Frist: 6 Monate nach Auszug).`,
        payload: { depositAmount: lease.depositAmountEur },
      });
      tasks.push({
        taskType: 'task',
        category: 'deposit',
        title: 'Kautionsabrechnung erstellen und Kaution auszahlen',
        description: `Kaution inkl. Zinsen abrechnen, offene NK und Schäden gegenrechnen.`,
        priority: 'high',
        dueDate: null,
      });
      nextBestActions.push('Kautionsabrechnung erstellen — Auszahlung innerhalb von 6 Monaten');
    }
  }

  // 6. NK period check (annual)
  if (phase === 'active') {
    const todayDate = new Date(today);
    const currentYear = todayDate.getFullYear();
    const lastYear = currentYear - 1;
    if (todayDate.getMonth() >= 5) {
      nextBestActions.push(`NK-Abrechnung ${lastYear} prüfen (Frist: 12 Monate nach Abrechnungszeitraum)`);
    }
  }

  return {
    leaseId: lease.leaseId,
    phase,
    events,
    tasks,
    nextBestActions,
    riskScore: Math.min(riskScore, 100),
  };
}
