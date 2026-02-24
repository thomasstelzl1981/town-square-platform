import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * SOT-MSV-REMINDER-CHECK (API-801)
 * 
 * Automatisches Mahnwesen für Premium-MSV-Enrollments.
 * Läuft am 10. des Monats oder manuell mit forceRun: true.
 * 
 * Mahnstufen:
 * - friendly (Erinnerung) → MAHNUNG_1
 * - first (1. Mahnung) → MAHNUNG_2
 * - final (Letzte Mahnung) → MAHNUNG_3
 * 
 * E-Mail-Versand:
 * - Benötigt RESEND_API_KEY Secret
 * - Sender-Domain muss bei Resend verifiziert sein
 * - Ohne API-Key: Nur Reminder-Erstellung, kein Versand
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Resend E-Mail versenden (nur wenn API-Key konfiguriert)
async function sendReminderEmail(params: {
  to: string;
  subject: string;
  content: string;
  tenantName: string;
  stage: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured - skipping email send");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MSV Mietsonderverwaltung <msv@kaufy.app>", // Domain muss verifiziert sein
        to: [params.to],
        subject: params.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Zahlungserinnerung</h2>
            <p>Sehr geehrte/r ${params.tenantName},</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              ${params.content.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 12px;">
              Dies ist eine automatische Nachricht der Mietsonderverwaltung.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log(`Email sent successfully: ${result.id}`);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const dayOfMonth = today.getDate();

    // Only run on the 10th of the month (or allow manual trigger)
    const { forceRun } = await req.json().catch(() => ({}));
    if (dayOfMonth !== 10 && !forceRun) {
      return new Response(
        JSON.stringify({ message: "Not the 10th, skipping reminder check", dayOfMonth }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if Resend is configured
    const resendConfigured = !!Deno.env.get("RESEND_API_KEY");
    console.log(`Starting reminder check... Resend configured: ${resendConfigured}`);

    // Get all premium enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("msv_enrollments")
      .select(`
        id,
        tenant_id,
        property_id,
        tier,
        settings
      `)
      .eq("tier", "premium")
      .eq("status", "active");

    if (enrollmentError) throw enrollmentError;
    console.log(`Found ${enrollments?.length || 0} premium enrollments`);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const periodStart = new Date(currentYear, currentMonth, 1);
    const periodEnd = new Date(currentYear, currentMonth + 1, 0);

    const remindersCreated: any[] = [];
    const emailsSent: any[] = [];

    for (const enrollment of enrollments || []) {
      // Get active leases for this property
      const { data: leases } = await supabase
        .from("leases")
        .select(`
          id,
          unit_id,
          monthly_rent,
          tenant_contact_id,
          units!inner (property_id)
        `)
        .eq("status", "active");

      // Filter leases that belong to enrollment's property
      const propertyLeases = leases?.filter(
        (l: any) => l.units?.property_id === enrollment.property_id
      ) || [];

      for (const lease of propertyLeases) {
        // Check if rent payment exists for this period
        const { data: payments } = await supabase
          .from("rent_payments")
          .select("id, status, amount")
          .eq("lease_id", lease.id)
          .gte("due_date", periodStart.toISOString())
          .lte("due_date", periodEnd.toISOString());

        const hasPaidPayment = payments?.some((p) => p.status === "paid");

        if (!hasPaidPayment) {
          // Check existing reminders to determine stage
          const { data: existingReminders } = await supabase
            .from("rent_reminders")
            .select("id, stage")
            .eq("lease_id", lease.id)
            .gte("created_at", periodStart.toISOString())
            .order("created_at", { ascending: false })
            .limit(1);

          let newStage = "friendly";
          if (existingReminders?.length) {
            const lastStage = existingReminders[0].stage;
            if (lastStage === "friendly") newStage = "first";
            else if (lastStage === "first") newStage = "final";
            else continue; // Already at final stage
          }

          // Get template for this stage
          const templateCode = newStage === "friendly" ? "MAHNUNG_1" 
            : newStage === "first" ? "MAHNUNG_2" 
            : "MAHNUNG_3";

          const { data: template } = await supabase
            .from("msv_templates")
            .select("content, title")
            .eq("template_code", templateCode)
            .eq("is_active", true)
            .single();

          // Get contact info
          const { data: contact } = await supabase
            .from("contacts")
            .select("first_name, last_name, email")
            .eq("id", lease.tenant_contact_id)
            .single();

          // Create reminder record
          const { data: reminder, error: reminderError } = await supabase
            .from("rent_reminders")
            .insert({
              tenant_id: enrollment.tenant_id,
              lease_id: lease.id,
              stage: newStage,
              content_text: template?.content,
              status: "pending",
              auto_sent: false
            })
            .select()
            .single();

          if (!reminderError && reminder) {
            remindersCreated.push({
              lease_id: lease.id,
              stage: newStage,
              contact: contact?.email,
              reminder_id: reminder.id
            });

            console.log(`Created ${newStage} reminder for lease ${lease.id}`);

            // Attempt to send email if Resend is configured
            if (contact?.email && template?.content) {
              const tenantName = contact.first_name && contact.last_name 
                ? `${contact.first_name} ${contact.last_name}`
                : "Mieter/in";

              const emailResult = await sendReminderEmail({
                to: contact.email,
                subject: template.title || `Zahlungserinnerung - ${newStage === "friendly" ? "Freundliche Erinnerung" : newStage === "first" ? "1. Mahnung" : "Letzte Mahnung"}`,
                content: template.content,
                tenantName,
                stage: newStage,
              });

              if (emailResult.success) {
                // Update reminder as sent
                await supabase
                  .from("rent_reminders")
                  .update({ 
                    auto_sent: true, 
                    status: "sent",
                    sent_at: new Date().toISOString()
                  })
                  .eq("id", reminder.id);

                emailsSent.push({
                  reminder_id: reminder.id,
                  to: contact.email,
                  messageId: emailResult.messageId
                });
              }
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today.toISOString(),
        resendConfigured,
        remindersCreated: remindersCreated.length,
        emailsSent: emailsSent.length,
        details: { reminders: remindersCreated, emails: emailsSent }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in reminder check:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
