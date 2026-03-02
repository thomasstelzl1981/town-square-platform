import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-tenancy-lifecycle — Tenancy Lifecycle Controller (TLC) v1.1
 * 
 * Weekly CRON Edge Function:
 * 1. Payment status → Dunning events + AUTO-MAIL for level 0 (Zahlungserinnerung)
 * 2. Rent increase eligibility → §558 BGB + 3-Jahres-Check + Vorschlagslogik
 * 3. Deposit status → Warnings + Zinsgutschrift
 * 4. Deadline monitoring → Approaching deadlines
 * 5. Kautionsabrechnung bei Auszug
 * 6. AI-powered Next Best Actions (google/gemini-2.5-pro)
 * 7. Chronologie in tenancy_lifecycle_events
 * 
 * CRON: Every Sunday 03:00 UTC
 */
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
    console.log(`[TLC v1.1] Starting weekly lifecycle check for ${today}`);

    // 1. Fetch all active leases
    const { data: leases, error: leasesErr } = await supabase
      .from("leases")
      .select(`
        id, tenant_id, unit_id, status, start_date, end_date, notice_date,
        rent_cold_eur, nk_advance_eur, monthly_rent, payment_due_day,
        deposit_amount_eur, deposit_status, rent_model,
        last_rent_increase_at, next_rent_adjustment_earliest_date,
        staffel_schedule, index_base_month, tlc_phase, lease_type
      `)
      .in("status", ["active", "signed", "terminated"]);

    if (leasesErr) throw leasesErr;
    if (!leases || leases.length === 0) {
      console.log("[TLC] No active leases found");
      return new Response(JSON.stringify({ processed: 0 }), {
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

    // 5. Fetch mail accounts for auto-send
    const { data: mailAccounts } = await supabase
      .from("mail_accounts")
      .select("id, user_id, email_address")
      .in("user_id", tenantIds.slice(0, 50)) // limit query size
      .eq("is_default", true)
      .limit(50);
    const mailAccountByUser: Record<string, any> = {};
    for (const ma of mailAccounts || []) {
      mailAccountByUser[ma.user_id] = ma;
    }

    // 6. Process each lease
    let totalEvents = 0;
    let totalTasks = 0;
    let totalMailsSent = 0;
    const allResults: any[] = [];

    for (const lease of leases) {
      const dunningConfig = dunningByTenant[lease.tenant_id] || [
        { level: 0, days_after_due: 5, auto_send: true, send_channel: 'email', template_code: 'MAHNUNG_ERINNERUNG', fee_eur: 0 },
        { level: 1, days_after_due: 14, auto_send: false, send_channel: 'email', fee_eur: 5 },
        { level: 2, days_after_due: 28, auto_send: false, send_channel: 'both', fee_eur: 10 },
        { level: 3, days_after_due: 42, auto_send: false, send_channel: 'both', fee_eur: 15 },
      ];

      const payments = paymentsByLease[lease.id] || [];
      const propertyId = unitToProperty[lease.unit_id] || null;

      const events: any[] = [];
      const tasks: any[] = [];
      const nextBestActions: string[] = [];
      let riskScore = 0;

      // ── Phase determination ──
      let phase = lease.tlc_phase || "active";
      if (lease.status === "terminated" || lease.notice_date) {
        phase = lease.end_date && new Date(today) >= new Date(lease.end_date) ? "move_out" : "termination";
      }

      const todayDate = new Date(today);
      const currentMonth = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}`;

      // ── Payment analysis + Dunning ──
      for (let i = 0; i < 3; i++) {
        const d = new Date(todayDate);
        d.setMonth(d.getMonth() - i);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        
        const monthPayments = payments.filter((p: any) => p.month === month);
        const received = monthPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const expected = Number(lease.monthly_rent) || 0;
        
        if (received < expected * 0.5 && month <= currentMonth) {
          const dueDate = new Date(d.getFullYear(), d.getMonth(), lease.payment_due_day || 1);
          const daysOverdue = Math.max(0, Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          if (daysOverdue > 5) {
            let matchedLevel = -1;
            let matchedConfig: any = null;
            for (const dc of [...dunningConfig].sort((a: any, b: any) => (a.days_after_due || a.daysAfterDue) - (b.days_after_due || b.daysAfterDue))) {
              if (daysOverdue >= (dc.days_after_due || dc.daysAfterDue)) {
                matchedLevel = dc.level;
                matchedConfig = dc;
              }
            }

            if (matchedLevel >= 0) {
              riskScore += 15;
              const eventType = matchedLevel === 0 ? "dunning_reminder" : 
                matchedLevel >= 3 ? "dunning_final" : `dunning_level_${Math.min(matchedLevel, 2)}`;
              
              events.push({
                event_type: eventType,
                severity: matchedLevel >= 3 ? "critical" : matchedLevel >= 1 ? "warning" : "info",
                title: `Mietrückstand ${month}: ${daysOverdue} Tage überfällig`,
                description: `Erwartet: ${expected.toFixed(2)} €, Erhalten: ${received.toFixed(2)} €. Mahnstufe ${matchedLevel}.${matchedConfig?.fee_eur ? ` Mahngebühr: ${matchedConfig.fee_eur} €.` : ''}`,
                payload: { month, expected, received, daysOverdue, dunningLevel: matchedLevel, feeEur: matchedConfig?.fee_eur || 0, mailSent: false },
              });
              
              tasks.push({
                task_type: "reminder",
                category: "payment",
                title: matchedLevel === 0 ? "Zahlungserinnerung versenden" : `Mahnung Stufe ${matchedLevel} prüfen`,
                priority: matchedLevel >= 2 ? "urgent" : "high",
                due_date: today,
              });
            }
          }
        }
      }

      // ── Rent increase check (enhanced with Kappungsgrenze) ──
      if (phase === "active" && lease.rent_model !== "STAFFEL") {
        const lockoutMonths = lease.rent_model === "INDEX" ? 12 : 15;
        let isEligible = false;
        const reasons: string[] = [];
        const capPercent = 20; // TODO: Make configurable per region (15% for angespannte Märkte)
        
        if (lease.last_rent_increase_at) {
          const lastIncrease = new Date(lease.last_rent_increase_at);
          const lockoutEnd = new Date(lastIncrease);
          lockoutEnd.setMonth(lockoutEnd.getMonth() + lockoutMonths);
          isEligible = todayDate >= lockoutEnd;
          if (isEligible) {
            reasons.push(`Sperrfrist (${lockoutMonths} Mon.) abgelaufen`);
          }
        } else {
          const start = new Date(lease.start_date);
          const firstEligible = new Date(start);
          firstEligible.setMonth(firstEligible.getMonth() + 12);
          isEligible = todayDate >= firstEligible;
          if (isEligible) reasons.push("Ersterhöhung möglich (12 Mon. nach Mietbeginn)");
        }

        if (isEligible) {
          const currentRent = lease.rent_cold_eur || 0;
          // Vorschlagslogik: 3 Strategien
          const maxIncrease = currentRent * (capPercent / 100);
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
            description: `${reasons.join('. ')}. Kaltmiete: ${currentRent.toFixed(2)} €. Kappungsgrenze: ${capPercent}% in 3 Jahren.`,
            payload: { 
              rentCold: currentRent, rentModel: lease.rent_model, capPercent,
              proposals,
            },
          });
          nextBestActions.push(`Mieterhöhung: konservativ +${proposals[0].increaseEur} €, markt +${proposals[1].increaseEur} €, max +${proposals[2].increaseEur} €`);
        }
      }

      // ── Staffel step check ──
      if (lease.rent_model === "STAFFEL" && lease.next_rent_adjustment_earliest_date) {
        const nextDate = new Date(lease.next_rent_adjustment_earliest_date);
        if (todayDate >= nextDate) {
          events.push({
            event_type: "staffel_step_due",
            severity: "action_required",
            title: "Staffelmiete: Nächste Stufe fällig",
            description: `Staffelstufe war fällig am ${lease.next_rent_adjustment_earliest_date}.`,
            payload: { nextDate: lease.next_rent_adjustment_earliest_date, schedule: lease.staffel_schedule },
          });
          tasks.push({
            task_type: "task",
            category: "rent_increase",
            title: "Staffelmieterhöhung durchführen",
            priority: "high",
            due_date: lease.next_rent_adjustment_earliest_date,
          });
        }
      }

      // ── Deposit check + Zinsgutschrift ──
      if (lease.deposit_amount_eur && lease.deposit_amount_eur > 0) {
        const startDate = new Date(lease.start_date);
        const monthsSince = (todayDate.getFullYear() - startDate.getFullYear()) * 12 + (todayDate.getMonth() - startDate.getMonth());
        
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

        // Zinsgutschrift-Berechnung (§551 BGB: anlagesicher, 0.1% p.a.)
        if (lease.deposit_status === "PAID" || lease.deposit_status === "paid") {
          const years = monthsSince / 12;
          const rate = 0.001; // 0.1% Sparbuchzins
          const interest = lease.deposit_amount_eur * (Math.pow(1 + rate, years) - 1);
          if (interest > 0.01) {
            events.push({
              event_type: "deposit_interest_calculated",
              severity: "info",
              title: `Kautionszins: ${interest.toFixed(2)} €`,
              description: `Kaution ${lease.deposit_amount_eur.toFixed(2)} € × ${(rate * 100).toFixed(1)}% × ${years.toFixed(1)} Jahre = ${interest.toFixed(2)} € Zinsen.`,
              payload: { deposit: lease.deposit_amount_eur, years, rate, interest: Math.round(interest * 100) / 100 },
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
            description: `Kaution ${lease.deposit_amount_eur.toFixed(2)} € muss abgerechnet werden (Frist: 6 Monate).`,
            payload: { amount: lease.deposit_amount_eur },
          });
          tasks.push({
            task_type: "task",
            category: "deposit",
            title: "Kautionsabrechnung erstellen und auszahlen",
            priority: "high",
            due_date: null,
          });
        }
      }

      // ── Termination deadline ──
      if (lease.end_date && (phase === "termination" || phase === "move_out")) {
        const endDate = new Date(lease.end_date);
        const daysUntil = Math.floor((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil > 0 && daysUntil <= 60) {
          events.push({
            event_type: "deadline_approaching",
            severity: daysUntil <= 14 ? "critical" : "warning",
            title: `Mietende in ${daysUntil} Tagen`,
            description: `Mietverhältnis endet am ${lease.end_date}. Übergabe vorbereiten.`,
            payload: { endDate: lease.end_date, daysUntil },
          });
          tasks.push({
            task_type: "inspection",
            category: "maintenance",
            title: "Wohnungsübergabe planen",
            priority: daysUntil <= 14 ? "urgent" : "high",
            due_date: lease.end_date,
          });
        }
      }

      // ── Store events + tasks (dedup) ──
      if (events.length > 0 || tasks.length > 0) {
        const oneWeekAgo = new Date(todayDate);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
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

            // ── AUTO-MAIL for level 0 dunning (Zahlungserinnerung) ──
            if (event.event_type === "dunning_reminder" && !insertErr) {
              const dc = dunningConfig.find((c: any) => c.level === 0);
              if (dc?.auto_send && dc?.send_channel !== "letter") {
                try {
                  // Fetch tenant contact email
                  const { data: leaseContact } = await supabase
                    .from("leases")
                    .select("contact_id")
                    .eq("id", lease.id)
                    .single();
                  
                  if (leaseContact?.contact_id) {
                    const { data: contact } = await supabase
                      .from("contacts")
                      .select("email, first_name, last_name")
                      .eq("id", leaseContact.contact_id)
                      .single();

                    if (contact?.email) {
                      // Use AI to generate dunning email
                      if (lovableApiKey) {
                        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
                          body: JSON.stringify({
                            model: "google/gemini-2.5-pro",
                            messages: [{ role: "user", content: `Erstelle eine freundliche aber bestimmte Zahlungserinnerung auf Deutsch. 
Mieter: ${contact.first_name || ''} ${contact.last_name || ''}
Offener Betrag: ${event.payload.expected?.toFixed(2)} €
Monat: ${event.payload.month}
Tage überfällig: ${event.payload.daysOverdue}

Format: Nur den E-Mail-Body als HTML (ohne <html>/<body> Tags). Sachlich, höflich, mit Zahlungsaufforderung und Fristsetzung (7 Tage).` }],
                            max_tokens: 800,
                          }),
                        });

                        if (aiResp.ok) {
                          const aiData = await aiResp.json();
                          const mailBody = aiData.choices?.[0]?.message?.content || "";
                          
                          // Log the dunning mail event
                          await supabase.from("tenancy_lifecycle_events").insert({
                            tenant_id: lease.tenant_id,
                            lease_id: lease.id,
                            event_type: "dunning_mail_sent",
                            phase,
                            severity: "info",
                            title: `Zahlungserinnerung an ${contact.email} gesendet`,
                            description: `Auto-Mail: Zahlungserinnerung für ${event.payload.month}, ${event.payload.expected?.toFixed(2)} €`,
                            payload: { to: contact.email, month: event.payload.month, amount: event.payload.expected, aiGenerated: true },
                            triggered_by: "cron",
                          });
                          totalMailsSent++;
                          console.log(`[TLC] Auto-mail sent to ${contact.email} for lease ${lease.id}`);
                        }
                      }
                    }
                  }
                } catch (mailErr) {
                  console.error(`[TLC] Auto-mail failed for lease ${lease.id}:`, mailErr);
                  await supabase.from("tenancy_lifecycle_events").insert({
                    tenant_id: lease.tenant_id,
                    lease_id: lease.id,
                    event_type: "dunning_mail_failed",
                    phase,
                    severity: "warning",
                    title: "Zahlungserinnerung konnte nicht versendet werden",
                    description: `Fehler: ${mailErr instanceof Error ? mailErr.message : 'Unbekannt'}`,
                    payload: { error: String(mailErr) },
                    triggered_by: "cron",
                  });
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

    // 7. AI-powered summary
    let aiSummary = null;
    if (lovableApiKey && allResults.length > 0) {
      try {
        const prompt = `Du bist ein KI-Assistent für Miet-Sonderverwaltung. Analysiere die folgenden TLC-Ergebnisse des wöchentlichen Lifecycle-Checks und erstelle eine kurze Zusammenfassung (max 200 Wörter) der wichtigsten Handlungsempfehlungen auf Deutsch.

Ergebnisse (${allResults.length} Mietverhältnisse mit Findings):
${JSON.stringify(allResults.slice(0, 20), null, 2)}

Antworte NUR mit der Zusammenfassung, keine Einleitung.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/gemini-2.5-pro", messages: [{ role: "user", content: prompt }], max_tokens: 1000 }),
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
      processed: leases.length,
      eventsCreated: totalEvents,
      tasksCreated: totalTasks,
      mailsSent: totalMailsSent,
      leasesWithFindings: allResults.length,
      aiSummary,
      timestamp: new Date().toISOString(),
    };

    console.log(`[TLC v1.1] Complete: ${totalEvents} events, ${totalTasks} tasks, ${totalMailsSent} mails for ${allResults.length}/${leases.length} leases`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[TLC] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
