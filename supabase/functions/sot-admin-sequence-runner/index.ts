/**
 * sot-admin-sequence-runner — Automated Email Sequence Engine
 * Cron job that processes email sequences and sends scheduled emails
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Enrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  current_step: number;
  status: string;
  last_sent_at: string | null;
  next_send_at: string | null;
  sequence: {
    id: string;
    name: string;
    status: string;
  };
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company: string | null;
  };
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  template_id: string | null;
  subject_override: string | null;
  body_override: string | null;
  delay_days: number;
  delay_hours: number;
  send_condition: string;
  template?: {
    id: string;
    subject: string;
    body_html: string;
    body_text: string;
    variables: unknown;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const now = new Date().toISOString();
    console.log(`[sequence-runner] Starting run at ${now}`);

    // 1. Get all active enrollments that are due for next email
    const { data: enrollments, error: enrollError } = await supabase
      .from("admin_email_enrollments")
      .select(`
        id,
        sequence_id,
        contact_id,
        current_step,
        status,
        last_sent_at,
        next_send_at,
        sequence:admin_email_sequences(id, name, status),
        contact:contacts(id, first_name, last_name, email, company)
      `)
      .eq("status", "active")
      .lte("next_send_at", now);

    if (enrollError) {
      console.error("Error fetching enrollments:", enrollError);
      throw enrollError;
    }

    console.log(`[sequence-runner] Found ${enrollments?.length || 0} enrollments due`);

    let processed = 0;
    let errors = 0;

    for (const enrollment of (enrollments || []) as Enrollment[]) {
      try {
        // Skip if sequence is not active
        if (enrollment.sequence?.status !== "active") {
          console.log(`[sequence-runner] Skipping ${enrollment.id}: sequence not active`);
          continue;
        }

        // Skip if contact has no email
        if (!enrollment.contact?.email) {
          console.log(`[sequence-runner] Skipping ${enrollment.id}: no contact email`);
          continue;
        }

        // 2. Get the current step for this sequence
        const { data: steps, error: stepsError } = await supabase
          .from("admin_email_sequence_steps")
          .select(`
            id,
            sequence_id,
            step_order,
            template_id,
            subject_override,
            body_override,
            delay_days,
            delay_hours,
            send_condition,
            template:admin_email_templates(id, subject, body_html, body_text, variables)
          `)
          .eq("sequence_id", enrollment.sequence_id)
          .order("step_order", { ascending: true });

        if (stepsError) throw stepsError;

        const currentStep = (steps as SequenceStep[])?.find(
          s => s.step_order === enrollment.current_step
        );

        if (!currentStep) {
          // No more steps - mark enrollment as completed
          await supabase
            .from("admin_email_enrollments")
            .update({
              status: "completed",
              completed_at: now,
            })
            .eq("id", enrollment.id);
          console.log(`[sequence-runner] Completed enrollment ${enrollment.id}`);
          continue;
        }

        // 3. Check send condition
        if (currentStep.send_condition === "if_not_replied") {
          // Check if contact has replied since last email
          const { count } = await supabase
            .from("admin_inbound_emails")
            .select("id", { count: "exact" })
            .eq("contact_id", enrollment.contact_id)
            .gte("received_at", enrollment.last_sent_at || "1970-01-01");

          if (count && count > 0) {
            // Contact replied - skip to next step or complete
            const nextStep = (steps as SequenceStep[])?.find(
              s => s.step_order === enrollment.current_step + 1
            );

            if (nextStep) {
              const nextSendAt = calculateNextSendTime(nextStep.delay_days, nextStep.delay_hours);
              await supabase
                .from("admin_email_enrollments")
                .update({
                  current_step: enrollment.current_step + 1,
                  next_send_at: nextSendAt,
                })
                .eq("id", enrollment.id);
            } else {
              await supabase
                .from("admin_email_enrollments")
                .update({
                  status: "completed",
                  completed_at: now,
                })
                .eq("id", enrollment.id);
            }
            console.log(`[sequence-runner] Contact replied, skipping step for ${enrollment.id}`);
            continue;
          }
        }

        // 4. Prepare email content
        const template = currentStep.template;
        const subject = currentStep.subject_override || template?.subject || "Nachricht";
        let bodyText = currentStep.body_override || template?.body_text || "";
        let bodyHtml = template?.body_html || `<div>${bodyText.replace(/\n/g, "<br>")}</div>`;

        // Replace variables
        const variables: Record<string, string> = {
          VORNAME: enrollment.contact.first_name || "",
          NACHNAME: enrollment.contact.last_name || "",
          FIRMA: enrollment.contact.company || "",
          EMAIL: enrollment.contact.email || "",
        };

        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          bodyText = bodyText.replace(regex, value);
          bodyHtml = bodyHtml.replace(regex, value);
        }

        // 5. Send email via Resend
        const routingToken = crypto.randomUUID();

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "System of a Town <noreply@systemofatown.de>",
            to: `${enrollment.contact.first_name} ${enrollment.contact.last_name} <${enrollment.contact.email}>`,
            reply_to: `admin+${routingToken}@incoming.systemofatown.de`,
            subject,
            html: bodyHtml,
            text: bodyText,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error(`[sequence-runner] Resend error for ${enrollment.id}:`, errorData);
          errors++;
          continue;
        }

        const resendData = await resendResponse.json();

        // 6. Record the outbound email
        await supabase.from("admin_outbound_emails").insert({
          to_email: enrollment.contact.email,
          to_name: `${enrollment.contact.first_name} ${enrollment.contact.last_name}`,
          contact_id: enrollment.contact_id,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
          routing_token: routingToken,
          resend_message_id: resendData.id,
          status: "sent",
          sent_at: now,
          enrollment_id: enrollment.id,
          sequence_step_id: currentStep.id,
        });

        // 7. Update enrollment for next step
        const nextStep = (steps as SequenceStep[])?.find(
          s => s.step_order === enrollment.current_step + 1
        );

        if (nextStep) {
          const nextSendAt = calculateNextSendTime(nextStep.delay_days, nextStep.delay_hours);
          await supabase
            .from("admin_email_enrollments")
            .update({
              current_step: enrollment.current_step + 1,
              last_sent_at: now,
              next_send_at: nextSendAt,
            })
            .eq("id", enrollment.id);
        } else {
          // Last step - mark as completed
          await supabase
            .from("admin_email_enrollments")
            .update({
              status: "completed",
              last_sent_at: now,
              completed_at: now,
            })
            .eq("id", enrollment.id);
        }

        // 8. Update sequence stats
        await supabase.rpc("increment_sequence_stats", {
          p_sequence_id: enrollment.sequence_id,
          p_field: "emails_sent",
        });

        processed++;
        console.log(`[sequence-runner] Sent email for enrollment ${enrollment.id}, step ${enrollment.current_step}`);

      } catch (err) {
        console.error(`[sequence-runner] Error processing enrollment ${enrollment.id}:`, err);
        errors++;
      }
    }

    console.log(`[sequence-runner] Completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        timestamp: now,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[sequence-runner] Fatal error:", errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateNextSendTime(delayDays: number, delayHours: number): string {
  const next = new Date();
  next.setDate(next.getDate() + (delayDays || 0));
  next.setHours(next.getHours() + (delayHours || 0));
  return next.toISOString();
}
