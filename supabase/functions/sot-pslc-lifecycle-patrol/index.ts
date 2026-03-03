/**
 * sot-pslc-lifecycle-patrol — Daily cron patrol for stuck PLC cases
 * Scans cases in non-terminal phases and emits case.stuck_detected events
 * with daily idempotency keys to prevent spam.
 * @wave D (SLA Completion)
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { createServiceClient } from '../_shared/z3SessionValidator.ts'

// SLA thresholds in hours (mirrors spec.ts)
const PLC_STUCK_THRESHOLDS: Record<string, number> = {
  provider_selected: 48,     // 48h for provider to respond
  deposit_requested: 24,     // 24h to complete payment
  deposit_paid: 48,          // 48h for provider to respond
  provider_confirmed: 168,   // 7d until check-in
  checked_in: 336,           // 14d max stay
  checked_out: 72,           // 3d for settlement
  settlement: 168,           // 7d to close
}

const NON_TERMINAL_PHASES = Object.keys(PLC_STUCK_THRESHOLDS)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const supabase = createServiceClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD for idempotency

    // Find candidates: non-terminal cases
    const { data: candidates, error: queryErr } = await supabase
      .from('pet_service_cases')
      .select('id, current_phase, phase_entered_at, tenant_id')
      .in('current_phase', NON_TERMINAL_PHASES)
      .is('closed_at', null)

    if (queryErr) throw queryErr
    if (!candidates?.length) {
      return new Response(JSON.stringify({ processed: 0, stuck: 0 }), { headers: corsHeaders })
    }

    let stuckCount = 0

    for (const c of candidates) {
      const threshold = PLC_STUCK_THRESHOLDS[c.current_phase]
      if (!threshold) continue

      const phaseAge = (now.getTime() - new Date(c.phase_entered_at).getTime()) / (1000 * 60 * 60)
      if (phaseAge <= threshold) continue

      // This case is stuck — emit event with daily idempotency
      const idempotencyKey = `stuck:${c.id}:${c.current_phase}:${today}`

      const { error: insertErr } = await supabase
        .from('pet_lifecycle_events')
        .insert({
          case_id: c.id,
          event_type: 'case.stuck_detected',
          phase_before: c.current_phase,
          phase_after: c.current_phase, // no phase change
          actor_id: null,
          actor_type: 'system',
          event_source: 'cron:pslc-patrol',
          idempotency_key: idempotencyKey,
          correlation_key: c.id,
          payload: {
            phase: c.current_phase,
            threshold_hours: threshold,
            actual_hours: Math.round(phaseAge),
            detected_at: now.toISOString(),
          },
        })

      if (insertErr) {
        // Duplicate idempotency key → already emitted today, skip
        if (insertErr.code === '23505') continue
        console.error(`Stuck event insert error for case ${c.id}:`, insertErr)
        continue
      }

      stuckCount++
    }

    return new Response(JSON.stringify({
      processed: candidates.length,
      stuck: stuckCount,
      date: today,
    }), { headers: corsHeaders })

  } catch (err) {
    console.error('sot-pslc-lifecycle-patrol error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
