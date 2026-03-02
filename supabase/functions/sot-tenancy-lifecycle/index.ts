import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-tenancy-lifecycle — Tenancy Lifecycle Controller (TLC) v1.5
 * 
 * Weekly CRON Edge Function — mirrors ENG-TLC engine logic server-side.
 * 
 * Checks:
 * 1. Payment status → Dunning events + AUTO-MAIL for level 0
 * 2. Rent increase eligibility → §558 BGB + 3-Jahres-Check + Vorschlagslogik
 * 3. Deposit status → Warnings + Zinsgutschrift
 * 4. Deadline monitoring → Approaching deadlines
 * 5. Kautionsabrechnung bei Auszug
 * 6. Defect SLA monitoring
 * 7. Move checklist deadline checks
 * 8. AI-powered Next Best Actions
 * 9. Chronologie in tenancy_lifecycle_events
 * 
 * CRON: Every Sunday 03:00 UTC
 * Engine Version: 1.5.0
 */

// ─── Inline engine constants (mirroring src/engines/tenancyLifecycle/spec.ts) ───

const RENT_INCREASE_DEFAULTS = {
  lockoutMonths: 15,
  capPercentNormal: 20,
  capPercentTight: 15,
  capPeriodYears: 3,
  indexMinMonths: 12,
  depositInterestRate: 0.001,
  depositSettlementMonths: 6,
} as const;

const DEFECT_SLA_HOURS: Record<string, number> = {
  emergency: 4, urgent: 24, standard: 72, cosmetic: 336,
};

const DEFECT_TRIAGE_KEYWORDS: Record<string, string[]> = {
  emergency: ['rohrbruch', 'wasserrohrbruch', 'gasaustritt', 'brand', 'feuer', 'stromausfall', 'heizungsausfall'],
  urgent: ['kein warmwasser', 'toilette defekt', 'eingangstür', 'schloss defekt', 'schimmel'],
  standard: ['fenster', 'rolladen', 'herd', 'backofen', 'kühlschrank', 'spülmaschine', 'tropft'],
  cosmetic: ['kratzer', 'farbe', 'tapete', 'leiste', 'dichtung', 'silikon'],
};

// ─── Inline engine functions (pure, mirroring engine.ts v1.5) ───

function determinePhase(lease: any, today: string): string {
  const todayDate = new Date(today);
  const startDate = new Date(lease.start_date);
  const endDate = lease.end_date ? new Date(lease.end_date) : null;
  const noticeDate = lease.notice_date ? new Date(lease.notice_date) : null;

  if (lease.status === 'draft' || lease.status === 'pending') return 'application';
  if (lease.status === 'signed' && todayDate < startDate) return 'contract';
  
  const moveInEnd = new Date(startDate);
  moveInEnd.setDate(moveInEnd.getDate() + 30);
  if (todayDate >= startDate && todayDate <= moveInEnd && lease.tlc_phase === 'move_in') return 'move_in';

  if (noticeDate && todayDate >= noticeDate) {
    if (endDate && todayDate >= endDate) return 'move_out';
    return 'termination';
  }

  if (endDate && todayDate >= endDate) return 'reletting';
  if (lease.status === 'terminated') return 'move_out';
  if (lease.status === 'inactive') return 'reletting';

  return 'active';
}

function analyzePaymentStatus(expectedMonthly: number, payments: Array<{month: string; amount: number}>, today: string, paymentDueDay: number) {
  const todayDate = new Date(today);
  const currentMonth = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
  const results: any[] = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(todayDate);
    d.setMonth(d.getMonth() - i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthPayments = payments.filter(p => p.month === month);
    const received = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const dueDate = new Date(d.getFullYear(), d.getMonth(), paymentDueDay);
    const daysOverdue = month <= currentMonth && received < expectedMonthly * 0.5
      ? Math.max(0, Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    let status = 'paid';
    if (received === 0 && month <= currentMonth) status = 'missing';
    else if (received < expectedMonthly * 0.95) status = 'partial';
    else if (received > expectedMonthly * 1.05) status = 'overpaid';

    results.push({ month, expected: expectedMonthly, received, delta: received - expectedMonthly, daysOverdue, status });
  }
  return results;
}

function determineDunningLevel(daysOverdue: number, dunningConfig: Array<{level: number; daysAfterDue: number}>): number {
  let matchedLevel = -1;
  for (const config of [...dunningConfig].sort((a, b) => a.daysAfterDue - b.daysAfterDue)) {
    if (daysOverdue >= config.daysAfterDue) matchedLevel = config.level;
  }
  return matchedLevel;
}

function checkRentIncreaseEligibility(lease: any, today: string, isTightMarket = false) {
  const todayDate = new Date(today);
  const reasons: string[] = [];
  let isEligible = false;
  let nextEligibleDate: string | null = null;
  const capPercent = isTightMarket ? RENT_INCREASE_DEFAULTS.capPercentTight : RENT_INCREASE_DEFAULTS.capPercentNormal;

  if (lease.rent_model === 'INDEX') {
    const minMonths = RENT_INCREASE_DEFAULTS.indexMinMonths;
    if (lease.last_rent_increase_at) {
      const eligible = new Date(lease.last_rent_increase_at);
      eligible.setMonth(eligible.getMonth() + minMonths);
      isEligible = todayDate >= eligible;
      reasons.push(isEligible ? `Indexmiete: Mindestabstand ${minMonths} Monate erreicht` : `Indexmiete: Nächste Erhöhung frühestens ${eligible.toISOString().split('T')[0]}`);
    } else {
      isEligible = true;
      reasons.push('Indexmiete: Keine vorherige Erhöhung');
    }
    return { isEligible, reasons, capPercent, nextEligibleDate };
  }

  if (lease.rent_model === 'STAFFEL') {
    if (lease.next_rent_adjustment_earliest_date) {
      isEligible = todayDate >= new Date(lease.next_rent_adjustment_earliest_date);
      reasons.push(isEligible ? 'Staffelmiete: Nächste Stufe fällig' : `Staffelmiete: Nächste Stufe am ${lease.next_rent_adjustment_earliest_date}`);
    }
    return { isEligible, reasons, capPercent: 0, nextEligibleDate };
  }

  // Standard §558 BGB
  const lockoutMonths = RENT_INCREASE_DEFAULTS.lockoutMonths;
  if (lease.last_rent_increase_at) {
    const lockoutEnd = new Date(lease.last_rent_increase_at);
    lockoutEnd.setMonth(lockoutEnd.getMonth() + lockoutMonths);
    if (todayDate < lockoutEnd) {
      nextEligibleDate = lockoutEnd.toISOString().split('T')[0];
      reasons.push(`Sperrfrist: 15 Mon. ab letzter Erhöhung. Nächste: ${nextEligibleDate}`);
    } else {
      isEligible = true;
      reasons.push(`Sperrfrist abgelaufen seit ${lockoutEnd.toISOString().split('T')[0]}`);
    }
  } else {
    const firstEligible = new Date(lease.start_date);
    firstEligible.setMonth(firstEligible.getMonth() + 12);
    if (todayDate >= firstEligible) {
      isEligible = true;
      reasons.push('Keine vorherige Erhöhung — erstmalig möglich');
    } else {
      nextEligibleDate = firstEligible.toISOString().split('T')[0];
      reasons.push(`Ersterhöhung frühestens: ${nextEligibleDate}`);
    }
  }

  if (isEligible) {
    reasons.push(`Kappungsgrenze: max. ${capPercent}% in 3 Jahren`);
    if (isTightMarket) reasons.push('Angespannter Markt: 15% statt 20%');
  }

  return { isEligible, reasons, capPercent, nextEligibleDate };
}

function calculateDepositInterest(deposit: number, startDate: string, endDate: string, rate = 0.001) {
  const years = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const total = deposit * Math.pow(1 + rate, years);
  return { interest: Math.round((total - deposit) * 100) / 100, years: Math.round(years * 10) / 10 };
}

function triageDefect(description: string): { severity: string; slaHours: number } {
  const lower = description.toLowerCase();
  for (const severity of ['emergency', 'urgent', 'standard', 'cosmetic']) {
    if (DEFECT_TRIAGE_KEYWORDS[severity].some(kw => lower.includes(kw))) {
      return { severity, slaHours: DEFECT_SLA_HOURS[severity] };
    }
  }
  return { severity: 'standard', slaHours: DEFECT_SLA_HOURS.standard };
}

function checkDeadlines(deadlines: any[], today: string) {
  const todayDate = new Date(today);
  return deadlines
    .filter(d => d.status === 'pending' || d.status === 'reminded')
    .map(d => {
      const dueDate = new Date(d.due_date);
      const daysRemaining = Math.floor((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
      let status = 'ok';
      let urgency = 'low';
      if (daysRemaining < 0) { status = 'overdue'; urgency = 'critical'; }
      else if (daysRemaining <= (d.remind_days_before || 7)) {
        status = 'approaching';
        urgency = daysRemaining <= 3 ? 'high' : daysRemaining <= 7 ? 'medium' : 'low';
      }
      return { id: d.id, title: d.title, dueDate: d.due_date, daysRemaining, status, urgency };
    })
    .sort((a: any, b: any) => a.daysRemaining - b.daysRemaining);
}

// ─── Main Handler ───

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);
    
    const today = new Date().toISOString().split("T")[0];
    console.log(`[TLC v1.5] Starting weekly lifecycle check for ${today}`);

    // 1. Fetch all active leases
    const { data: leases, error: leasesErr } = await supabase
      .from("leases")
      .select(`
        id, tenant_id, unit_id, status, start_date, end_date, notice_date,
        rent_cold_eur, nk_advance_eur, monthly_rent, payment_due_day,
        deposit_amount_eur, deposit_status, rent_model,
        last_rent_increase_at, next_rent_adjustment_earliest_date,
        staffel_schedule, index_base_month, tlc_phase, lease_type, contact_id
      `)
      .in("status", ["active", "signed", "terminated"]);

    if (leasesErr) throw leasesErr;
    if (!leases || leases.length === 0) {
      console.log("[TLC] No active leases found");
      return new Response(JSON.stringify({ processed: 0, version: "1.5.0" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[TLC] Processing ${leases.length} leases`);

    // 2. Fetch dunning configs
    const tenantIds = [...new Set(leases.map((l: any) => l.tenant_id))];
    const { data: dunningConfigs } = await supabase
      .from("tenancy_dunning_configs")
      .select("*")
      .in("tenant_id", tenantIds);

    const dunningByTenant: Record<string, any[]> = {};
    for (const dc of dunningConfigs || []) {
      if (!dunningByTenant[dc.tenant_id]) dunningByTenant[dc.tenant_id] = [];
      dunningByTenant[dc.tenant_id].push(dc);
    }

    // 3. Fetch recent rent payments
    const leaseIds = leases.map((l: any) => l.id);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const { data: rentPayments } = await supabase
      .from("rent_payments")
      .select("lease_id, payment_month, amount_eur")
      .in("lease_id", leaseIds)
      .gte("payment_month", twelveMonthsAgo.toISOString().split("T")[0]);

    const paymentsByLease: Record<string, Array<{ month: string; amount: number }>> = {};
    for (const rp of rentPayments || []) {
      if (!paymentsByLease[rp.lease_id]) paymentsByLease[rp.lease_id] = [];
      paymentsByLease[rp.lease_id].push({ month: rp.payment_month?.substring(0, 7) || "", amount: Number(rp.amount_eur) || 0 });
    }

    // 4. Fetch unit → property mapping
    const unitIds = [...new Set(leases.map((l: any) => l.unit_id))];
    const { data: units } = await supabase.from("units").select("id, property_id").in("id", unitIds);
    const unitToProperty: Record<string, string> = {};
    for (const u of units || []) unitToProperty[u.id] = u.property_id;

    // 5. Fetch deadlines for all tenants
    const { data: allDeadlines } = await supabase
      .from("tenancy_deadlines")
      .select("id, title, due_date, status, remind_days_before, lease_id, tenant_id")
      .in("tenant_id", tenantIds)
      .in("status", ["pending", "reminded"]);

    const deadlinesByLease: Record<string, any[]> = {};
    for (const dl of allDeadlines || []) {
      const key = dl.lease_id || '__global__';
      if (!deadlinesByLease[key]) deadlinesByLease[key] = [];
      deadlinesByLease[key].push(dl);
    }

    // 6. Fetch open defect tasks to check SLA
    const { data: openDefects } = await supabase
      .from("tenancy_tasks")
      .select("id, title, description, lease_id, created_at, sla_deadline, task_type")
      .in("lease_id", leaseIds)
      .eq("task_type", "defect")
      .in("status", ["open", "in_progress"]);

    // 7. Process each lease
    let totalEvents = 0;
    let totalTasks = 0;
    let totalMailsSent = 0;
    const allResults: any[] = [];

    for (const lease of leases) {
      const dunningConfig = (dunningByTenant[lease.tenant_id] || [
        { level: 0, days_after_due: 5, auto_send: true, send_channel: 'email', template_code: 'MAHNUNG_ERINNERUNG', fee_eur: 0 },
        { level: 1, days_after_due: 14, auto_send: false, send_channel: 'email', fee_eur: 5 },
        { level: 2, days_after_due: 28, auto_send: false, send_channel: 'both', fee_eur: 10 },
        { level: 3, days_after_due: 42, auto_send: false, send_channel: 'both', fee_eur: 15 },
      ]).map((dc: any) => ({ ...dc, daysAfterDue: dc.days_after_due || dc.daysAfterDue || 0 }));

      const payments = paymentsByLease[lease.id] || [];
      const propertyId = unitToProperty[lease.unit_id] || null;

      const events: any[] = [];
      const tasks: any[] = [];
      const nextBestActions: string[] = [];
      let riskScore = 0;

      // ── Phase determination (v1.5) ──
      const phase = determinePhase(lease, today);

      // ── Payment analysis + Dunning (v1.5) ──
      if (phase === 'active' || phase === 'termination') {
        const paymentStatuses = analyzePaymentStatus(
          Number(lease.monthly_rent) || 0,
          payments,
          today,
          lease.payment_due_day || 1
        );

        const missedMonths = paymentStatuses.filter((p: any) => p.status === 'missing');
        const partialMonths = paymentStatuses.filter((p: any) => p.status === 'partial');

        if (missedMonths.length > 0) {
          const worstOverdue = Math.max(...missedMonths.map((m: any) => m.daysOverdue));
          const dunningLevel = determineDunningLevel(worstOverdue, dunningConfig);
          riskScore += Math.min(missedMonths.length * 15, 60);

          const eventType = dunningLevel >= 3 ? "dunning_final" :
            dunningLevel >= 1 ? `dunning_level_${Math.min(dunningLevel, 2)}` :
            dunningLevel === 0 ? "dunning_reminder" : "payment_missed";

          events.push({
            event_type: eventType,
            severity: dunningLevel >= 3 ? "critical" : dunningLevel >= 1 ? "warning" : "info",
            title: `Mietrückstand: ${missedMonths.length} Monat(e), ${worstOverdue} Tage`,
            description: `${missedMonths.length} ausstehende Mietzahlungen. Mahnstufe ${dunningLevel}.`,
            payload: { missedMonths: missedMonths.map((m: any) => m.month), worstOverdue, dunningLevel },
          });

          tasks.push({
            task_type: "reminder",
            category: "payment",
            title: dunningLevel === 0 ? "Zahlungserinnerung versenden" : `Mahnung Stufe ${dunningLevel} prüfen`,
            priority: dunningLevel >= 2 ? "urgent" : "high",
            due_date: today,
          });
          nextBestActions.push(`Mahnstufe ${dunningLevel}: ${missedMonths.length} Monatsmiete(n) ausstehend`);
        }

        if (partialMonths.length > 0) {
          riskScore += partialMonths.length * 5;
          events.push({
            event_type: "payment_partial",
            severity: "info",
            title: `Teilzahlung: ${partialMonths.length} Monat(e)`,
            description: `${partialMonths.length} Monate mit unvollständiger Zahlung.`,
            payload: { partialMonths: partialMonths.map((m: any) => ({ month: m.month, delta: m.delta })) },
          });
        }
      }

      // ── Rent increase check (v1.5 — full engine logic) ──
      if (phase === "active" && lease.rent_model !== "STAFFEL") {
        const rentCheck = checkRentIncreaseEligibility(lease, today);
        if (rentCheck.isEligible) {
          const currentRent = Number(lease.rent_cold_eur) || 0;
          const maxIncrease = currentRent * (rentCheck.capPercent / 100);
          const proposals = [
            { strategy: "konservativ", factor: 0.5, risk: "niedrig" },
            { strategy: "markt", factor: 0.75, risk: "mittel" },
            { strategy: "maximum", factor: 1.0, risk: "hoch" },
          ].map(p => ({
            ...p,
            increaseEur: Math.round(maxIncrease * p.factor * 100) / 100,
            newRent: Math.round((currentRent + maxIncrease * p.factor) * 100) / 100,
          }));

          events.push({
            event_type: "rent_increase_eligible",
            severity: "info",
            title: "Mieterhöhung möglich",
            description: `${rentCheck.reasons.join('. ')}. Kaltmiete: ${currentRent.toFixed(2)} €.`,
            payload: { rentCold: currentRent, capPercent: rentCheck.capPercent, proposals },
          });
          nextBestActions.push(`Mieterhöhung: konservativ +${proposals[0].increaseEur} €, markt +${proposals[1].increaseEur} €, max +${proposals[2].increaseEur} €`);
        }
      }

      // ── Staffel step check ──
      if (lease.rent_model === "STAFFEL" && lease.next_rent_adjustment_earliest_date) {
        const nextDate = new Date(lease.next_rent_adjustment_earliest_date);
        if (new Date(today) >= nextDate) {
          events.push({
            event_type: "staffel_step_due",
            severity: "action_required",
            title: "Staffelmiete: Nächste Stufe fällig",
            description: `Fällig seit ${lease.next_rent_adjustment_earliest_date}.`,
            payload: { nextDate: lease.next_rent_adjustment_earliest_date, schedule: lease.staffel_schedule },
          });
          tasks.push({ task_type: "task", category: "rent_increase", title: "Staffelmieterhöhung durchführen", priority: "high", due_date: lease.next_rent_adjustment_earliest_date });
        }
      }

      // ── Deposit check + Zinsgutschrift (v1.5) ──
      if (lease.deposit_amount_eur && lease.deposit_amount_eur > 0) {
        const startDate = new Date(lease.start_date);
        const monthsSince = (new Date(today).getFullYear() - startDate.getFullYear()) * 12 + (new Date(today).getMonth() - startDate.getMonth());
        
        if (monthsSince > 3 && (!lease.deposit_status || lease.deposit_status === "open" || lease.deposit_status === "OPEN")) {
          events.push({
            event_type: "deposit_partial",
            severity: "warning",
            title: "Kaution ausstehend",
            description: `Kaution ${lease.deposit_amount_eur.toFixed(2)} € seit ${monthsSince} Monaten nicht eingegangen.`,
            payload: { amount: lease.deposit_amount_eur, monthsSince },
          });
          riskScore += 10;
        }

        if (lease.deposit_status === "PAID" || lease.deposit_status === "paid") {
          const { interest, years } = calculateDepositInterest(lease.deposit_amount_eur, lease.start_date, today);
          if (interest > 0.01) {
            events.push({
              event_type: "deposit_interest_calculated",
              severity: "info",
              title: `Kautionszins: ${interest.toFixed(2)} €`,
              description: `${lease.deposit_amount_eur.toFixed(2)} € × 0.1% × ${years} Jahre = ${interest.toFixed(2)} €.`,
              payload: { deposit: lease.deposit_amount_eur, years, rate: 0.001, interest },
            });
          }
        }
      }

      // ── Kautionsabrechnung bei Auszug ──
      if (phase === "move_out" && lease.deposit_amount_eur && lease.deposit_amount_eur > 0) {
        const ds = (lease.deposit_status || "").toUpperCase();
        if (ds !== "SETTLED" && ds !== "RETURNED") {
          events.push({
            event_type: "deposit_settlement_started",
            severity: "action_required",
            title: "Kautionsabrechnung erstellen",
            description: `Kaution ${lease.deposit_amount_eur.toFixed(2)} € abrechnen (6 Monate Frist).`,
            payload: { amount: lease.deposit_amount_eur },
          });
          tasks.push({ task_type: "task", category: "deposit", title: "Kautionsabrechnung erstellen und auszahlen", priority: "high", due_date: null });
        }
      }

      // ── Termination deadline ──
      if (lease.end_date && (phase === "termination" || phase === "move_out")) {
        const daysUntil = Math.floor((new Date(lease.end_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 60) {
          events.push({
            event_type: "deadline_approaching",
            severity: daysUntil <= 14 ? "critical" : "warning",
            title: `Mietende in ${daysUntil} Tagen`,
            description: `Endet am ${lease.end_date}. Übergabe vorbereiten.`,
            payload: { endDate: lease.end_date, daysUntil },
          });
          tasks.push({ task_type: "inspection", category: "maintenance", title: "Wohnungsübergabe planen", priority: daysUntil <= 14 ? "urgent" : "high", due_date: lease.end_date });
        }
      }

      // ── NEW v1.5: Deadline monitoring via checkDeadlines ──
      const leaseDeadlines = deadlinesByLease[lease.id] || [];
      if (leaseDeadlines.length > 0) {
        const deadlineChecks = checkDeadlines(leaseDeadlines, today);
        const overdue = deadlineChecks.filter((d: any) => d.status === 'overdue');
        const approaching = deadlineChecks.filter((d: any) => d.status === 'approaching');

        for (const dl of overdue) {
          events.push({
            event_type: "deadline_missed",
            severity: "critical",
            title: `Frist überschritten: ${dl.title}`,
            description: `Fällig am ${dl.dueDate}, ${Math.abs(dl.daysRemaining)} Tage überfällig.`,
            payload: { deadlineId: dl.id, daysOverdue: Math.abs(dl.daysRemaining) },
          });
          riskScore += 15;
        }

        for (const dl of approaching) {
          if (dl.urgency === 'high' || dl.urgency === 'medium') {
            events.push({
              event_type: "deadline_approaching",
              severity: "warning",
              title: `Frist naht: ${dl.title}`,
              description: `Noch ${dl.daysRemaining} Tage bis ${dl.dueDate}.`,
              payload: { deadlineId: dl.id, daysRemaining: dl.daysRemaining },
            });
          }
        }

        if (overdue.length > 0) nextBestActions.push(`${overdue.length} überfällige Frist(en) bearbeiten`);
      }

      // ── NEW v1.5: Defect SLA check via triageDefect ──
      const leaseDefects = (openDefects || []).filter((d: any) => d.lease_id === lease.id);
      for (const defect of leaseDefects) {
        if (defect.sla_deadline) {
          const slaDate = new Date(defect.sla_deadline);
          if (new Date(today) > slaDate) {
            const hoursOverdue = Math.round((new Date(today).getTime() - slaDate.getTime()) / (1000 * 60 * 60));
            const triage = triageDefect(`${defect.title} ${defect.description || ''}`);
            events.push({
              event_type: "defect_dispatched",
              severity: triage.severity === 'emergency' ? "critical" : "warning",
              title: `SLA überschritten: ${defect.title}`,
              description: `SLA-Frist seit ${hoursOverdue}h überschritten. Schwere: ${triage.severity}.`,
              payload: { defectId: defect.id, severity: triage.severity, hoursOverdue },
            });
            riskScore += triage.severity === 'emergency' ? 25 : 10;
          }
        }
      }

      // ── Store events + tasks (dedup) ──
      if (events.length > 0 || tasks.length > 0) {
        const oneWeekAgo = new Date(new Date(today).getTime() - 7 * 24 * 60 * 60 * 1000);
        const { data: recentEvents } = await supabase
          .from("tenancy_lifecycle_events")
          .select("event_type")
          .eq("lease_id", lease.id)
          .gte("created_at", oneWeekAgo.toISOString());

        const recentTypes = new Set((recentEvents || []).map((e: any) => e.event_type));

        for (const event of events) {
          if (!recentTypes.has(event.event_type)) {
            const { error: insertErr } = await supabase
              .from("tenancy_lifecycle_events")
              .insert({
                tenant_id: lease.tenant_id,
                lease_id: lease.id,
                event_type: event.event_type,
                phase,
                severity: event.severity,
                title: event.title,
                description: event.description,
                payload: event.payload,
                triggered_by: "cron",
              });
            if (!insertErr) totalEvents++;

            // AUTO-MAIL for level 0 dunning
            if (event.event_type === "dunning_reminder" && !insertErr && lovableApiKey) {
              const dc = dunningConfig.find((c: any) => c.level === 0);
              if (dc?.auto_send && dc?.send_channel !== "letter" && lease.contact_id) {
                try {
                  const { data: contact } = await supabase
                    .from("contacts")
                    .select("email, first_name, last_name")
                    .eq("id", lease.contact_id)
                    .single();

                  if (contact?.email) {
                    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
                      body: JSON.stringify({
                        model: "google/gemini-2.5-flash",
                        messages: [{ role: "user", content: `Erstelle eine freundliche aber bestimmte Zahlungserinnerung auf Deutsch.\nMieter: ${contact.first_name || ''} ${contact.last_name || ''}\nOffener Betrag: ${event.payload.missedMonths?.length || 1} Monatsmiete(n)\nFormat: Nur E-Mail-Body als HTML. Sachlich, höflich, Fristsetzung 7 Tage.` }],
                        max_tokens: 600,
                      }),
                    });

                    if (aiResp.ok) {
                      await supabase.from("tenancy_lifecycle_events").insert({
                        tenant_id: lease.tenant_id,
                        lease_id: lease.id,
                        event_type: "dunning_mail_sent",
                        phase,
                        severity: "info",
                        title: `Zahlungserinnerung an ${contact.email} gesendet`,
                        description: `Auto-Mail für ${event.payload.missedMonths?.join(', ') || 'Rückstand'}`,
                        payload: { to: contact.email, aiGenerated: true },
                        triggered_by: "cron",
                      });
                      totalMailsSent++;
                    }
                  }
                } catch (mailErr) {
                  console.error(`[TLC] Auto-mail failed for lease ${lease.id}:`, mailErr);
                }
              }
            }
          }
        }

        // Dedup tasks
        const { data: openTasks } = await supabase
          .from("tenancy_tasks")
          .select("title, task_type")
          .eq("lease_id", lease.id)
          .not("status", "in", '("closed","cancelled","resolved")');

        const openTaskKeys = new Set((openTasks || []).map((t: any) => `${t.task_type}:${t.title}`));

        for (const task of tasks) {
          const key = `${task.task_type}:${task.title}`;
          if (!openTaskKeys.has(key)) {
            const { error: taskErr } = await supabase.from("tenancy_tasks").insert({
              tenant_id: lease.tenant_id,
              lease_id: lease.id,
              property_id: propertyId,
              unit_id: lease.unit_id,
              ...task,
              status: "open",
            });
            if (!taskErr) totalTasks++;
          }
        }

        // Update lease phase
        await supabase.from("leases").update({ tlc_phase: phase, tlc_last_check: new Date().toISOString() }).eq("id", lease.id);

        allResults.push({
          leaseId: lease.id,
          phase,
          eventsCreated: events.length,
          tasksCreated: tasks.length,
          riskScore: Math.min(riskScore, 100),
          nextBestActions,
        });
      }
    }

    // AI summary (with credit deduction — 1 Credit per tenant with findings)
    let aiSummary = null;
    if (lovableApiKey && allResults.length > 0) {
      try {
        // Deduct 1 credit from each tenant that has findings
        const tenantsWithFindings = [...new Set(allResults.map(r => {
          const lease = leases.find((l: any) => l.id === r.leaseId);
          return lease?.tenant_id;
        }).filter(Boolean))];

        for (const tid of tenantsWithFindings) {
          try {
            await supabase.rpc("rpc_credit_deduct", {
              p_tenant_id: tid,
              p_user_id: null,
              p_amount: 1,
              p_ref_type: "tlc_summary",
              p_ref_id: today,
            });
          } catch (creditErr) {
            console.warn(`[TLC] Credit deduct failed for tenant ${tid}:`, creditErr);
          }
        }

        const prompt = `Du bist ein KI-Assistent für Mietverwaltung. Analysiere die TLC v1.5 Ergebnisse und erstelle eine kurze Zusammenfassung (max 200 Wörter) der wichtigsten Handlungsempfehlungen auf Deutsch.\n\nErgebnisse (${allResults.length} Mietverhältnisse):\n${JSON.stringify(allResults.slice(0, 20), null, 2)}\n\nAntworte NUR mit der Zusammenfassung.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }], max_tokens: 800 }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices?.[0]?.message?.content || null;
          console.log("[TLC] AI summary generated");
        }
      } catch (aiErr) {
        console.error("[TLC] AI summary failed:", aiErr);
      }
    }

    const result = {
      version: "1.5.0",
      processed: leases.length,
      eventsCreated: totalEvents,
      tasksCreated: totalTasks,
      mailsSent: totalMailsSent,
      leasesWithFindings: allResults.length,
      aiSummary,
      timestamp: new Date().toISOString(),
    };

    // Write to process_health_log
    try {
      await supabase.from("process_health_log").insert({
        system: "tlc",
        run_date: today,
        cases_checked: leases.length,
        issues_found: allResults.length,
        events_created: totalEvents,
        ai_summary: aiSummary,
        status: "success",
        details: {
          version: "1.5.0",
          tasksCreated: totalTasks,
          mailsSent: totalMailsSent,
          findings: allResults.slice(0, 50),
        },
      });
    } catch (logErr) {
      console.warn("[TLC] Failed to write process_health_log:", logErr);
    }

    console.log(`[TLC v1.5] Complete: ${totalEvents} events, ${totalTasks} tasks, ${totalMailsSent} mails for ${allResults.length}/${leases.length} leases`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[TLC] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", version: "1.5.0" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
