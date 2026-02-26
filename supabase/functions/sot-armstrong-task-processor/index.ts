/**
 * SOT-ARMSTRONG-TASK-PROCESSOR
 * 
 * Processes pending inbound tasks from armstrong_inbound_tasks.
 * - Reads tasks with status = 'pending'
 * - Extracts instruction from subject + body
 * - Calls sot-armstrong-advisor internally (service-role)
 * - Stores result in armstrong_inbound_tasks.result
 * - Sends response email to user via sot-system-mail-send
 * - Sets status to 'completed' or 'failed'
 * 
 * Called by Cron/Webhook — no JWT required.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch pending tasks (max 10 per run)
    const { data: tasks, error: fetchError } = await supabase
      .from("armstrong_inbound_tasks")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;
    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending tasks" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[TaskProcessor] Processing ${tasks.length} pending tasks`);

    let processed = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        // 2. Mark as processing
        await supabase
          .from("armstrong_inbound_tasks")
          .update({ status: "processing" })
          .eq("id", task.id);

        // 3. Build instruction from subject + body
        const instruction = [task.subject, task.body_text].filter(Boolean).join("\n\n").trim();
        if (!instruction) {
          await supabase
            .from("armstrong_inbound_tasks")
            .update({
              status: "failed",
              result: { error: "Leere Nachricht — keine Anweisung erkannt." },
              processed_at: new Date().toISOString(),
            })
            .eq("id", task.id);
          failed++;
          continue;
        }

        // 4. Resolve user profile for context
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, armstrong_email, sot_email")
          .eq("id", task.user_id)
          .single();

        // 5. Call sot-armstrong-advisor internally
        const advisorPayload = {
          zone: "Z2",
          module: "MOD-00",
          route: "/portal/dashboard",
          entity: { type: "none", id: null },
          message: instruction,
          conversation: { last_messages: [] },
          action_request: null,
          flow: null,
          document_context: null,
        };

        const advisorResponse = await fetch(`${SUPABASE_URL}/functions/v1/sot-armstrong-advisor`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(advisorPayload),
        });

        if (!advisorResponse.ok) {
          const errText = await advisorResponse.text();
          console.error(`[TaskProcessor] Advisor error for task ${task.id}:`, errText);
          await supabase
            .from("armstrong_inbound_tasks")
            .update({
              status: "failed",
              result: { error: `Advisor error: ${advisorResponse.status}` },
              processed_at: new Date().toISOString(),
            })
            .eq("id", task.id);
          failed++;
          continue;
        }

        const advisorResult = await advisorResponse.json();

        // 6. Store result
        await supabase
          .from("armstrong_inbound_tasks")
          .update({
            status: "completed",
            action_code: advisorResult.suggested_actions?.[0]?.action_code || null,
            result: advisorResult,
            processed_at: new Date().toISOString(),
          })
          .eq("id", task.id);

        // 7. Send response email to user
        const userName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Nutzer";
        const replyTo = task.from_email || profile?.sot_email || profile?.armstrong_email;
        const responseText = advisorResult.message || "Armstrong hat Ihre Anfrage verarbeitet.";
        const draftInfo = advisorResult.draft
          ? `\n\n---\n\nEntwurf:\n${advisorResult.draft.content || ""}`
          : "";

        const htmlBody = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="border-bottom: 2px solid #1a365d; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #1a365d; font-size: 18px;">🚀 Armstrong — Ergebnis</h2>
              <p style="margin: 4px 0 0; color: #718096; font-size: 13px;">Antwort auf: ${task.subject || "Ihre Anfrage"}</p>
            </div>
            <div style="color: #2d3748; font-size: 15px; line-height: 1.7;">
              ${responseText.replace(/\n/g, "<br>")}
              ${draftInfo ? `<hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;"><div style="background: #f7fafc; border-radius: 8px; padding: 16px;">${draftInfo.replace(/\n/g, "<br>")}</div>` : ""}
            </div>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
              Armstrong AI · System of a Town<br>
              Diese E-Mail wurde automatisch erstellt.
            </div>
          </div>`;

        if (replyTo) {
          await fetch(`${SUPABASE_URL}/functions/v1/sot-system-mail-send`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: replyTo,
              subject: `Re: ${task.subject || "Armstrong-Ergebnis"}`,
              html: htmlBody,
              context: "armstrong_task_processor",
              from_override: "armstrong@systemofatown.com",
            }),
          });
        }

        processed++;
        console.log(`[TaskProcessor] Task ${task.id} completed successfully`);
      } catch (taskErr) {
        console.error(`[TaskProcessor] Error processing task ${task.id}:`, taskErr);
        await supabase
          .from("armstrong_inbound_tasks")
          .update({
            status: "failed",
            result: { error: taskErr instanceof Error ? taskErr.message : "Unknown error" },
            processed_at: new Date().toISOString(),
          })
          .eq("id", task.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed, failed, total: tasks.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[TaskProcessor] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
