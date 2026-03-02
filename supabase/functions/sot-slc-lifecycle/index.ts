import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-slc-lifecycle — Sales Lifecycle Controller Cron Function
 * 
 * Daily CRON (04:00 UTC) — monitors SLC process health:
 * 1. Stuck-Cases: phase-change timestamp vs SLC_STUCK_THRESHOLDS
 * 2. Expired Reservations: auto-event deal.reservation_expired
 * 3. Channel Drift: expected_hash ≠ last_synced_hash
 * 4. Pending Settlements: notary_completed >14d without settlement
 * 5. AI Summary: Gemini generates "Next Best Actions"
 * 
 * All events use idempotency_key for safe retries.
 * Stuck-clock uses phase-change timestamp (NOT updated_at).
 */

// ─── Inline SLC constants (mirroring src/engines/slc/spec.ts) ───

const SLC_STUCK_THRESHOLDS: Record<string, number> = {
  captured: 7,
  readiness_check: 14,
  mandate_active: 14,
  published: 60,
  inquiry: 21,
  reserved: 30,
  finance_submitted: 21,
  contract_draft: 14,
  notary_scheduled: 30,
  notary_completed: 60,
  handover: 14,
  settlement: 30,
};

const SLC_PHASE_LABELS: Record<string, string> = {
  captured: 'Objekt erfasst',
  readiness_check: 'Verkaufsbereitschaft',
  mandate_active: 'Verkaufsauftrag aktiv',
  published: 'Veröffentlicht',
  inquiry: 'Anfrage eingegangen',
  reserved: 'Reserviert',
  finance_submitted: 'Finanzierung eingereicht',
  contract_draft: 'Kaufvertragsentwurf',
  notary_scheduled: 'Notartermin vereinbart',
  notary_completed: 'Beurkundet',
  handover: 'Übergabe',
  settlement: 'Abrechnung',
  closed_won: 'Abgeschlossen (Verkauf)',
  closed_lost: 'Abgeschlossen (kein Verkauf)',
};

function daysSince(dateStr: string, now: Date): number {
  return (now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * F3: Find the timestamp when the case entered its current phase.
 * Looks for the last event where phase_after = currentPhase AND phase_before != phase_after.
 * Falls back to opened_at if no phase-change event is found.
 */
async function findPhaseEnteredAt(
  supabase: any,
  caseId: string,
  currentPhase: string,
  fallbackDate: string
): Promise<string> {
  const { data: phaseEvents } = await supabase
    .from("sales_lifecycle_events")
    .select("created_at")
    .eq("case_id", caseId)
    .eq("phase_after", currentPhase)
    .neq("phase_before", currentPhase)
    .order("created_at", { ascending: false })
    .limit(1);

  if (phaseEvents && phaseEvents.length > 0) {
    return phaseEvents[0].created_at;
  }
  return fallbackDate;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    console.log(`[SLC-Lifecycle] Starting daily check for ${today}`);

    // ─── 1. Fetch active sales_cases ───
    const { data: cases, error: casesErr } = await supabase
      .from("sales_cases")
      .select("id, asset_type, asset_id, property_id, project_id, listing_id, current_phase, deal_contact_id, tenant_id, opened_at, closed_at, close_reason, updated_at")
      .is("closed_at", null);

    if (casesErr) throw casesErr;
    if (!cases || cases.length === 0) {
      console.log("[SLC-Lifecycle] No active cases found");
      
      await supabase.from("process_health_log").insert({
        system: "slc",
        run_date: today,
        cases_checked: 0,
        issues_found: 0,
        events_created: 0,
        status: "skipped",
        details: { message: "No active cases" },
      });

      return new Response(JSON.stringify({ processed: 0, version: "1.1.0" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[SLC-Lifecycle] Processing ${cases.length} active cases`);

    let totalEvents = 0;
    let totalIssues = 0;
    const allFindings: any[] = [];

    // ─── 2. Check each case for stuck status ───
    for (const slcCase of cases) {
      const phase = slcCase.current_phase;
      const threshold = SLC_STUCK_THRESHOLDS[phase];
      const findings: string[] = [];

      if (threshold) {
        // F3: Use phase-change timestamp, NOT updated_at
        const phaseEnteredAt = await findPhaseEnteredAt(
          supabase, slcCase.id, phase, slcCase.opened_at
        );
        const days = daysSince(phaseEnteredAt, now);

        if (days > threshold) {
          totalIssues++;
          const isSLA = days > threshold * 2;
          findings.push(`Stuck in "${SLC_PHASE_LABELS[phase] || phase}" seit ${Math.round(days)} Tagen (Schwellwert: ${threshold}d)`);

          // F4: Idempotency key for stuck events
          const stuckKey = `stuck:${slcCase.id}:${phase}:${today}`;
          const { error: stuckErr } = await supabase.from("sales_lifecycle_events").insert({
            case_id: slcCase.id,
            event_type: "case.stuck_detected",
            severity: isSLA ? "error" : "warning",
            phase_before: phase,
            phase_after: phase,
            actor_id: null,
            actor_type: "cron",
            event_source: "edge_fn:sot-slc-lifecycle",
            idempotency_key: stuckKey,
            payload: {
              triggered_by: "cron",
              check_type: "stuck_detection",
              days_in_phase: Math.round(days),
              threshold_days: threshold,
              is_sla_breach: isSLA,
              phase_entered_at: phaseEnteredAt,
            },
            tenant_id: slcCase.tenant_id,
          });

          if (stuckErr) {
            if (stuckErr.code === "23505") {
              findings.push(`(idempotent skip — bereits gemeldet)`);
            } else {
              console.error(`[SLC-Lifecycle] Stuck event error for ${slcCase.id}:`, stuckErr);
            }
          } else {
            totalEvents++;
          }
        }
      }

      // ─── 3. Check expired reservations for this case ───
      if (slcCase.listing_id) {
        const { data: reservations } = await supabase
          .from("sales_reservations")
          .select("id, expiry_date, status")
          .eq("listing_id", slcCase.listing_id)
          .eq("status", "pending")
          .lt("expiry_date", now.toISOString());

        for (const res of reservations || []) {
          totalIssues++;
          findings.push(`Reservierung ${res.id.slice(0, 8)} abgelaufen am ${res.expiry_date}`);

          // Auto-expire the reservation
          await supabase.from("sales_reservations").update({ status: "expired" }).eq("id", res.id);

          // F4: Idempotency key for reservation expiry
          const expiryKey = `reservation_expired:${res.id}`;
          const { error: evtErr } = await supabase.from("sales_lifecycle_events").insert({
            case_id: slcCase.id,
            event_type: "deal.reservation_expired",
            severity: "warning",
            phase_before: phase,
            phase_after: phase,
            actor_id: null,
            actor_type: "cron",
            event_source: "edge_fn:sot-slc-lifecycle",
            idempotency_key: expiryKey,
            payload: {
              triggered_by: "cron",
              reservation_id: res.id,
              expiry_date: res.expiry_date,
            },
            tenant_id: slcCase.tenant_id,
          });

          if (evtErr) {
            if (evtErr.code === "23505") {
              findings.push(`(idempotent skip — reservation expiry already recorded)`);
            }
          } else {
            totalEvents++;
          }
        }
      }

      // ─── 4. Check channel drift ───
      if (slcCase.listing_id) {
        const { data: pubs } = await supabase
          .from("listing_publications")
          .select("id, channel, expected_hash, last_synced_hash")
          .eq("listing_id", slcCase.listing_id)
          .eq("status", "active");

        for (const pub of pubs || []) {
          if (pub.expected_hash && pub.last_synced_hash && pub.expected_hash !== pub.last_synced_hash) {
            totalIssues++;
            findings.push(`Channel-Drift: ${pub.channel} (Hash-Mismatch)`);

            // F4: Idempotency key for drift events
            const driftKey = `drift:${slcCase.id}:${pub.channel}:${today}`;
            const { error: evtErr } = await supabase.from("sales_lifecycle_events").insert({
              case_id: slcCase.id,
              event_type: "channel.sync_failed",
              severity: "warning",
              phase_before: phase,
              phase_after: phase,
              actor_id: null,
              actor_type: "cron",
              event_source: "edge_fn:sot-slc-lifecycle",
              idempotency_key: driftKey,
              payload: {
                triggered_by: "cron",
                check_type: "channel_drift",
                channel: pub.channel,
                publication_id: pub.id,
              },
              tenant_id: slcCase.tenant_id,
            });

            if (evtErr) {
              if (evtErr.code === "23505") {
                findings.push(`(idempotent skip — drift already reported)`);
              }
            } else {
              totalEvents++;
            }
          }
        }
      }

      // ─── 5. Check pending settlements (notary_completed > 14d) ───
      if (phase === "notary_completed" || phase === "handover") {
        const phaseEnteredAt = await findPhaseEnteredAt(
          supabase, slcCase.id, phase, slcCase.opened_at
        );
        const days = daysSince(phaseEnteredAt, now);

        if (days > 14) {
          const { data: settlements } = await supabase
            .from("sales_settlements")
            .select("id")
            .eq("case_id", slcCase.id)
            .limit(1);

          if (!settlements || settlements.length === 0) {
            totalIssues++;
            findings.push(`Settlement ausstehend seit ${Math.round(days)} Tagen nach Beurkundung/Übergabe`);

            // F4: Idempotency key for settlement pending
            const settlementKey = `settlement_pending:${slcCase.id}:${today}`;
            const { error: evtErr } = await supabase.from("sales_lifecycle_events").insert({
              case_id: slcCase.id,
              event_type: "deal.settlement_pending",
              severity: "warning",
              phase_before: phase,
              phase_after: phase,
              actor_id: null,
              actor_type: "cron",
              event_source: "edge_fn:sot-slc-lifecycle",
              idempotency_key: settlementKey,
              payload: {
                triggered_by: "cron",
                check_type: "settlement_pending",
                days_since_phase: Math.round(days),
              },
              tenant_id: slcCase.tenant_id,
            });

            if (evtErr) {
              if (evtErr.code === "23505") {
                findings.push(`(idempotent skip — settlement pending already reported)`);
              }
            } else {
              totalEvents++;
            }
          }
        }
      }

      if (findings.length > 0) {
        allFindings.push({
          caseId: slcCase.id,
          phase,
          phaseLabel: SLC_PHASE_LABELS[phase] || phase,
          assetType: slcCase.asset_type,
          tenantId: slcCase.tenant_id,
          findings,
        });
      }
    }

    // ─── 6. AI Summary via Gemini ───
    let aiSummary: string | null = null;
    if (lovableApiKey && allFindings.length > 0) {
      try {
        const prompt = `Du bist ein KI-Assistent für Immobilien-Verkaufsprozesse (Sales Lifecycle Controller / SLC).
Analysiere die folgenden SLC-Prüfergebnisse und erstelle eine kurze Zusammenfassung (max 200 Wörter) mit den wichtigsten Handlungsempfehlungen auf Deutsch.

Prüfergebnisse (${cases.length} aktive Fälle, ${totalIssues} Probleme gefunden):
${JSON.stringify(allFindings.slice(0, 15), null, 2)}

Antworte NUR mit der Zusammenfassung. Priorisiere nach Dringlichkeit.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices?.[0]?.message?.content || null;
          console.log("[SLC-Lifecycle] AI summary generated");
        } else {
          console.warn("[SLC-Lifecycle] AI response not ok:", aiResponse.status);
        }
      } catch (aiErr) {
        console.error("[SLC-Lifecycle] AI summary failed:", aiErr);
      }
    }

    // ─── 7. Write to process_health_log ───
    await supabase.from("process_health_log").insert({
      system: "slc",
      run_date: today,
      cases_checked: cases.length,
      issues_found: totalIssues,
      events_created: totalEvents,
      ai_summary: aiSummary,
      status: "success",
      details: {
        findings: allFindings,
        version: "1.1.0",
      },
    });

    const result = {
      version: "1.1.0",
      processed: cases.length,
      issuesFound: totalIssues,
      eventsCreated: totalEvents,
      casesWithFindings: allFindings.length,
      aiSummary,
      timestamp: now.toISOString(),
    };

    console.log(`[SLC-Lifecycle] Complete: ${totalEvents} events, ${totalIssues} issues for ${allFindings.length}/${cases.length} cases`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[SLC-Lifecycle] Error:", err);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from("process_health_log").insert({
        system: "slc",
        run_date: new Date().toISOString().split("T")[0],
        cases_checked: 0,
        issues_found: 0,
        events_created: 0,
        status: "error",
        error_message: err instanceof Error ? err.message : "Unknown error",
      });
    } catch (_) { /* ignore logging errors */ }

    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", version: "1.1.0" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
