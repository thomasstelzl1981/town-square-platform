/**
 * ENG-TLC — Tenancy Lifecycle Controller: Engine
 * 
 * Pure functions for lease lifecycle analysis.
 * NO side effects, NO DB calls, NO UI imports.
 * 
 * @engine ENG-TLC
 * @version 1.0.0
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
  
  // Move-in window: 30 days around start
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
  
  // Check last 12 months
  for (let i = 0; i < 12; i++) {
    const d = new Date(todayDate);
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const monthPayments = payments.filter(p => p.month === month);
    const received = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const delta = received - expectedMonthly;
    
    // Calculate days overdue
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
      capPercent: 0, // Index hat keine Kappungsgrenze
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
    // No prior increase — check from lease start + 12 months
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

  // Check if deposit should have been received by now (within 3 months of start)
  if (monthsSinceStart > 3 && (!depositStatus || depositStatus === 'open' || depositStatus === 'OPEN')) {
    return {
      eventType: 'deposit_partial',
      severity: 'warning',
      title: 'Kaution ausstehend',
      description: `Kaution von ${depositAmount.toFixed(2)} € seit ${monthsSinceStart} Monaten nicht eingegangen.`,
      payload: { depositAmount, depositStatus, monthsSinceStart },
    };
  }

  // Legal max: 3 Nettokaltmieten
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

// ─── Full Lease Analysis ──────────────────────────────────────

export function analyzeLease(
  lease: LeaseAnalysisInput,
  payments: Array<{ month: string; amount: number }>,
  dunningConfig: Array<{ level: number; daysAfterDue: number }>,
  today: string,
  options: { isTightMarket?: boolean } = {}
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
      events.push({
        eventType: 'rent_increase_eligible',
        severity: 'info',
        title: 'Mieterhöhung möglich',
        description: rentCheck.reasons.join('. '),
        payload: rentCheck as unknown as Record<string, unknown>,
      });
      nextBestActions.push('Mieterhöhung prüfen — Sperrfrist abgelaufen');
      tasks.push({
        taskType: 'task',
        category: 'rent_increase',
        title: 'Mieterhöhung prüfen und vorbereiten',
        description: rentCheck.reasons.join('. '),
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

  // 5. NK period check (annual)
  if (phase === 'active') {
    const todayDate = new Date(today);
    const currentYear = todayDate.getFullYear();
    const lastYear = currentYear - 1;
    // If we're past June and no NK settlement for last year, flag it
    if (todayDate.getMonth() >= 5) { // June = month 5
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
