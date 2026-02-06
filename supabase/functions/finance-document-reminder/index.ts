/**
 * Edge Function: finance-document-reminder
 * 
 * Sends weekly email reminders for missing mandatory documents in finance requests.
 * Triggered via cron or manual invocation.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  finance_request_id: string | null;
  reminder_type: string;
  next_reminder_at: string | null;
  profiles: { email: string; display_name: string | null } | null;
  finance_requests: { public_id: string | null; object_address: string | null } | null;
}

interface ChecklistItem {
  id: string;
  doc_type: string;
  label: string;
  is_required: boolean;
  checklist_type: string;
  for_employment_type: string | null;
}

interface DocumentLink {
  document: { doc_type: string | null } | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // 1. Fetch all active reminders that are due
    const { data: reminders, error: remindersError } = await supabase
      .from("document_reminders")
      .select(`
        id,
        tenant_id,
        user_id,
        finance_request_id,
        reminder_type,
        next_reminder_at,
        profiles:user_id(email, display_name),
        finance_requests:finance_request_id(public_id, object_address)
      `)
      .eq("reminder_type", "weekly")
      .lte("next_reminder_at", now);

    if (remindersError) {
      throw new Error(`Failed to fetch reminders: ${remindersError.message}`);
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders due", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${reminders.length} due reminders`);

    // 2. Fetch checklist items (system-wide)
    const { data: checklistItems } = await supabase
      .from("document_checklist_items")
      .select("id, doc_type, label, is_required, checklist_type, for_employment_type")
      .eq("is_required", true);

    const requiredDocs = (checklistItems || []) as ChecklistItem[];

    let processedCount = 0;
    let emailsSent = 0;

    // 3. Process each reminder
    for (const reminder of reminders as ReminderRecord[]) {
      try {
        // Get applicant profile to check employment type
        const { data: profile } = await supabase
          .from("applicant_profiles")
          .select("id, employment_type")
          .eq("tenant_id", reminder.tenant_id)
          .is("finance_request_id", null)
          .limit(1)
          .maybeSingle();

        const employmentType = profile?.employment_type || "employed";

        // Filter required docs by employment type
        const applicableApplicantDocs = requiredDocs.filter(
          (d) =>
            d.checklist_type === "applicant" &&
            (d.for_employment_type === null || d.for_employment_type === employmentType)
        );

        const applicableRequestDocs = requiredDocs.filter(
          (d) => d.checklist_type === "request"
        );

        // Get uploaded docs for applicant
        let uploadedDocTypes: string[] = [];

        if (profile?.id) {
          const { data: applicantDocs } = await supabase
            .from("document_links")
            .select("document:documents(doc_type)")
            .eq("tenant_id", reminder.tenant_id)
            .eq("object_type", "applicant_profile")
            .eq("object_id", profile.id);

          uploadedDocTypes = (applicantDocs || [])
            .map((d: DocumentLink) => d.document?.doc_type)
            .filter(Boolean) as string[];
        }

        // Get uploaded docs for request (if applicable)
        if (reminder.finance_request_id) {
          const { data: requestDocs } = await supabase
            .from("document_links")
            .select("document:documents(doc_type)")
            .eq("tenant_id", reminder.tenant_id)
            .eq("object_type", "finance_request")
            .eq("object_id", reminder.finance_request_id);

          const requestDocTypes = (requestDocs || [])
            .map((d: DocumentLink) => d.document?.doc_type)
            .filter(Boolean) as string[];

          uploadedDocTypes = [...uploadedDocTypes, ...requestDocTypes];
        }

        // Calculate missing docs
        const missingApplicant = applicableApplicantDocs.filter(
          (d) => !uploadedDocTypes.includes(d.doc_type)
        );

        const missingRequest = reminder.finance_request_id
          ? applicableRequestDocs.filter((d) => !uploadedDocTypes.includes(d.doc_type))
          : [];

        const totalMissing = [...missingApplicant, ...missingRequest];

        if (totalMissing.length === 0) {
          // All documents complete - update next reminder
          await supabase
            .from("document_reminders")
            .update({
              last_sent_at: now,
              next_reminder_at: addDays(new Date(), 7).toISOString(),
            })
            .eq("id", reminder.id);

          processedCount++;
          continue;
        }

        // 4. Send reminder email (if Resend configured)
        const userEmail = reminder.profiles?.email;
        const userName = reminder.profiles?.display_name || userEmail?.split("@")[0] || "Kunde";

        if (resendApiKey && userEmail) {
          const missingList = totalMissing.map((d) => `• ${d.label}`).join("\n");

          const emailBody = `
Guten Tag ${userName},

für Ihre Finanzierungsanfrage fehlen noch folgende Unterlagen:

${missingList}

Bitte laden Sie diese Dokumente in Ihrem Portal hoch, um die Bearbeitung zu beschleunigen.

Mit freundlichen Grüßen,
Ihr Finanzierungsteam
          `.trim();

          try {
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Finanzierung <noreply@system-of-a-town.de>",
                to: userEmail,
                subject: `Erinnerung: ${totalMissing.length} Dokumente fehlen für Ihre Finanzierung`,
                text: emailBody,
              }),
            });

            if (emailRes.ok) {
              emailsSent++;
              console.log(`Email sent to ${userEmail}`);
            } else {
              console.error(`Failed to send email to ${userEmail}:`, await emailRes.text());
            }
          } catch (emailErr) {
            console.error(`Email error for ${userEmail}:`, emailErr);
          }
        }

        // 5. Update reminder record
        await supabase
          .from("document_reminders")
          .update({
            last_sent_at: now,
            next_reminder_at: addDays(new Date(), 7).toISOString(),
          })
          .eq("id", reminder.id);

        processedCount++;
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminders processed",
        processed: processedCount,
        emailsSent,
        dueReminders: reminders.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in finance-document-reminder:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
