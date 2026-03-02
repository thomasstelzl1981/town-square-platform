import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * sot-flc-lifecycle — Financing Lifecycle Controller Cron Function
 * 
 * Daily CRON (03:00 UTC) — monitors FLC process health:
 * 1. Stuck-Cases: finance_requests vs FLC_STUCK_THRESHOLDS
 * 2. SLA Breach detection (2× threshold)
 * 3. Day-level idempotency (one alert per phase per day)
 * 
 * Results → finance_lifecycle_events + process_health_log
 */

// ─── Inline FLC constants (mirroring src/engines/flc/spec.ts) ───

const FLC_STUCK_THRESHOLDS: Record<string, number> = {
  intake_received: 2,
  ready_for_assignment: 2,
  assigned_to_manager: 3,
  accepted_by_manager: 1,
  handoff_to_mod11: 7,
  in_progress: 14,
  bank_submission_ready: 14,
  submitted_bank_email: 60,
  submitted_europace: 60,
  decision_pending: 30,
  approved: 30,
  signed: 14,
  paid_out: 14,
};

const FLC_PHASE_LABELS: Record<string, string> = {
  intake_received: 'Anfrage eingegangen',
  dataroom_linked: 'Datenraum verknüpft',
  validation_ok: 'Vorprüfung bestanden',
  ready_for_assignment: 'Bereit zur Zuweisung',
  assigned_to_manager: 'Manager zugewiesen',
  commission_terms_ready: 'Provisionskonditionen bereit',
  accepted_by_manager: 'Manager hat angenommen',
  intro_emails_sent: 'Vorstellungsmails versendet',
  handoff_to_mod11: 'Übergabe an FM',
  in_progress: 'In Bearbeitung',
  docs_complete: 'Unterlagen vollständig',
  bank_submission_ready: 'Bankeinreichung bereit',
  submitted_bank_email: 'Per E-Mail eingereicht',
  submitted_europace: 'Via Europace eingereicht',
  decision_pending: 'Bankentscheidung ausstehend',
  approved: 'Genehmigt',
  declined: 'Abgelehnt',
  signed: 'Unterschrieben',
  paid_out: 'Ausgezahlt',
  closed: 'Abgeschlossen',
};

function daysSince(dateStr: string, now: Date): number {
  return (now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Determine FLC phase from snapshot data (mirrors engine logic).
 * Pure function, no DB calls.
 */
function determineFLCPhase(r: any, m: any, c: any, comm: any): string {
  // Terminal
  if (r.status === 'completed' || r.status === 'closed' || r.status === 'cancelled' || r.status === 'rejected') return 'closed';
  // Settlement
  if (comm?.status === 'paid') return 'platform_fee_paid';
  if (comm?.status === 'invoiced') return 'platform_fee_invoiced';
  if (comm?.status === 'approved') return 'commission_confirmed';
  // Deal
  if (c?.bank_response === 'paid_out') return 'paid_out';
  if (c?.bank_response === 'signed') return 'signed';
  if (c?.bank_response === 'declined') return 'declined';
  if (c?.bank_response === 'approved') return 'approved';
  // Submission
  if (c?.submitted_to_bank_at) return 'decision_pending';
  if (c?.submission_channel === 'europace' && c?.submission_status === 'submitted') return 'submitted_europace';
  if (c?.submission_channel === 'email' && c?.submission_status === 'submitted') return 'submitted_bank_email';
  if (c?.submission_status === 'ready') return 'bank_submission_ready';
  // Processing
  if (c?.status === 'docs_complete' || c?.status === 'ready_to_submit') return 'docs_complete';
  if (c?.id && c?.first_action_at) return 'in_progress';
  if (c?.id) return 'handoff_to_mod11';
  // Assignment
  if (m?.accepted_at || m?.status === 'accepted') return 'accepted_by_manager';
  if (m?.assigned_manager_id) return 'assigned_to_manager';
  if (m?.id && (m?.status === 'new' || m?.status === 'triage')) return 'ready_for_assignment';
  // Intake
  return 'intake_received';
}

/** Write FLC event with idempotency */
async function writeFLCEvent(supabase: any, params: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('finance_lifecycle_events')
      .insert({
        finance_request_id: params.finance_request_id,
        finance_mandate_id: params.finance_mandate_id || null,
        future_room_case_id: params.future_room_case_id || null,
        event_type: params.event_type,
        phase: params.phase || null,
        actor_type: 'cron',
        event_source: 'cron:sot-flc-lifecycle',
        idempotency_key: params.idempotency_key,
        correlation_key: params.correlation_key || null,
        metadata: params.metadata || {},
      });
    if (error) {
      if (error.code === '23505') return false; // duplicate, already written today
      console.error(`[FLC-Cron] Event write failed:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[FLC-Cron] Event exception:`, e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    console.log(`[FLC-Lifecycle] Starting daily check for ${today}`);

    // ─── 1. Fetch open finance_requests with mandates + cases ───
    const { data: requests, error: reqErr } = await supabase
      .from('finance_requests')
      .select(`
        id, status, public_id, submitted_at, tenant_id,
        finance_mandates (
          id, status, assigned_manager_id, delegated_at, accepted_at
        ),
        future_room_cases (
          id, status, first_action_at, submission_channel, submission_status,
          submitted_to_bank_at, bank_response
        )
      `)
      .not('status', 'in', '("completed","cancelled","rejected","closed")')
      .limit(500);

    if (reqErr) {
      console.error('[FLC-Lifecycle] Query error:', reqErr.message);
      throw reqErr;
    }

    if (!requests || requests.length === 0) {
      console.log('[FLC-Lifecycle] No open cases found.');
      return new Response(
        JSON.stringify({ success: true, checked: 0, stuck: 0, breach: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FLC-Lifecycle] Checking ${requests.length} open cases`);

    // ─── 2. For each case, fetch latest phase-change event ───
    let stuckCount = 0;
    let breachCount = 0;
    const stuckCases: any[] = [];

    for (const r of requests) {
      const mandate = Array.isArray(r.finance_mandates) ? r.finance_mandates[0] : r.finance_mandates;
      const frc = Array.isArray(r.future_room_cases) ? r.future_room_cases[0] : r.future_room_cases;

      // Get latest commission for this request
      let comm = null;
      if (mandate?.id) {
        const { data: commData } = await supabase
          .from('commissions')
          .select('status, platform_share_pct')
          .eq('reference_id', mandate.id)
          .eq('reference_type', 'finance_mandate')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        comm = commData;
      }

      // Determine current phase
      const phase = determineFLCPhase(r, mandate, frc, comm);

      // Skip terminal phases
      if (phase === 'closed' || phase === 'declined' || phase === 'platform_fee_paid') continue;

      const threshold = FLC_STUCK_THRESHOLDS[phase];
      if (!threshold) continue;

      // Fix #2: Find phase_entered_at from last phase-change event, NOT last event
      const { data: phaseEvents } = await supabase
        .from('finance_lifecycle_events')
        .select('created_at, event_type, phase')
        .eq('finance_request_id', r.id)
        .not('phase', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      let phaseEnteredAt = r.submitted_at || r.created_at || now.toISOString();
      if (phaseEvents && phaseEvents.length > 0) {
        // Find the event that set the current phase
        const phaseEvent = phaseEvents.find((e: any) => e.phase === phase);
        if (phaseEvent) {
          phaseEnteredAt = phaseEvent.created_at;
        } else {
          // Fallback: most recent phase-change event
          phaseEnteredAt = phaseEvents[0].created_at;
        }
      }

      const days = daysSince(phaseEnteredAt, now);
      const isStuck = days > threshold;
      const isBreach = days > threshold * 2;

      if (isStuck) {
        stuckCount++;
        if (isBreach) breachCount++;

        const eventType = isBreach ? 'case.sla_breach' : 'case.stuck_detected';
        const keyPrefix = isBreach ? 'sla_breach' : 'stuck';

        const written = await writeFLCEvent(supabase, {
          finance_request_id: r.id,
          finance_mandate_id: mandate?.id || null,
          future_room_case_id: frc?.id || null,
          event_type: eventType,
          phase: phase,
          idempotency_key: `${keyPrefix}:${r.id}:${phase}:${today}`,
          correlation_key: r.public_id,
          metadata: {
            phase,
            phase_label: FLC_PHASE_LABELS[phase] || phase,
            days_in_phase: Math.round(days),
            threshold_days: threshold,
            phase_entered_at: phaseEnteredAt,
          },
        });

        if (written) {
          stuckCases.push({
            request_id: r.id,
            public_id: r.public_id,
            phase,
            days: Math.round(days),
            type: isBreach ? 'sla_breach' : 'stuck',
          });
        }
      }
    }

    console.log(`[FLC-Lifecycle] Done: ${requests.length} checked, ${stuckCount} stuck, ${breachCount} breaches`);

    // ─── 3. Write process health log ───
    try {
      await supabase.from('process_health_log').insert({
        controller: 'flc',
        run_date: today,
        cases_checked: requests.length,
        stuck_count: stuckCount,
        breach_count: breachCount,
        details: { stuck_cases: stuckCases },
      });
    } catch (e) {
      // process_health_log may not exist yet, that's OK
      console.warn('[FLC-Lifecycle] Could not write process_health_log:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: requests.length,
        stuck: stuckCount,
        breach: breachCount,
        stuck_cases: stuckCases,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FLC-Lifecycle] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
