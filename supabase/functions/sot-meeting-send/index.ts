import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, recipients } = await req.json();
    if (!session_id || !recipients?.length) throw new Error("session_id and recipients required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load session + output
    const { data: session } = await supabase
      .from("meeting_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session) throw new Error("Session not found");

    const { data: output } = await supabase
      .from("meeting_outputs")
      .select("*")
      .eq("session_id", session_id)
      .single();

    if (!output) throw new Error("No output found for session");

    const summary = (output as any).summary_md || "Keine Zusammenfassung verfügbar.";
    const actionItems = (output as any).action_items_json || [];

    // Build email body
    const actionList = actionItems.length > 0
      ? actionItems.map((a: any, i: number) => `${i + 1}. ${a.title}${a.owner ? ` (${a.owner})` : ""}`).join("\n")
      : "Keine Aufgaben.";

    const emailBody = `Meeting-Protokoll: ${session.title}\n\n${summary}\n\nAufgaben:\n${actionList}`;
    const emailHtml = `<h2>Meeting-Protokoll: ${session.title}</h2>
<div>${summary.replace(/\n/g, "<br>")}</div>
<h3>Aufgaben</h3>
<ul>${actionItems.map((a: any) => `<li><strong>${a.title}</strong>${a.owner ? ` — ${a.owner}` : ""}${a.description ? `<br><small>${a.description}</small>` : ""}</li>`).join("")}</ul>`;

    const results = [];

    for (const recipient of recipients) {
      const toEmail = recipient.email || null;

      // If contact, look up email
      let contactEmail = toEmail;
      if (recipient.type === "contact" && recipient.id) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("email, first_name, last_name")
          .eq("id", recipient.id)
          .single();

        if (contact?.email) {
          contactEmail = contact.email;
        }

        // Archive in contact conversations
        await supabase.from("contact_conversations").insert({
          tenant_id: session.tenant_id,
          contact_id: recipient.id,
          type: "meeting_summary",
          subject: `Meeting-Protokoll: ${session.title}`,
          body_md: summary,
          linked_session_id: session_id,
          created_by: session.user_id,
        });
      }

      if (!contactEmail) {
        results.push({ recipient, status: "skipped", reason: "no email" });
        continue;
      }

      // Send via Resend
      if (resendApiKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Armstrong <no-reply@systemofatown.de>",
              to: [contactEmail],
              subject: `Meeting-Protokoll: ${session.title}`,
              html: emailHtml,
              text: emailBody,
            }),
          });
          const resData = await res.json();
          results.push({ recipient, status: "sent", resend_id: resData.id });
        } catch (e) {
          results.push({ recipient, status: "error", error: e.message });
        }
      } else {
        results.push({ recipient, status: "skipped", reason: "no RESEND_API_KEY" });
      }
    }

    // Update session status
    await supabase.from("meeting_sessions").update({ status: "sent" }).eq("id", session_id);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[sot-meeting-send] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
