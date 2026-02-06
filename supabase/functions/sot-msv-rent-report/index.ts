import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * SOT-MSV-RENT-REPORT (API-802)
 * 
 * Monatliche Mietberichte für Premium-MSV-Enrollments.
 * Läuft am 15. des Monats oder manuell mit forceRun: true.
 * 
 * Report enthält:
 * - Collection Rate (%)
 * - Bezahlt/Offen Counts
 * - Unit-Details mit Mieter und Status
 * - Anzahl gesendeter Mahnungen
 * 
 * E-Mail-Versand:
 * - Benötigt RESEND_API_KEY Secret
 * - Sender-Domain muss bei Resend verifiziert sein
 * - Ohne API-Key: Nur Report-Generierung, kein Versand
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML Report generieren
function generateReportHtml(report: any): string {
  const statusColor = report.collection_rate >= 90 ? "#22c55e" 
    : report.collection_rate >= 70 ? "#f59e0b" 
    : "#ef4444";

  const unitRows = report.unit_details?.map((unit: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${unit.unit || "—"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">${unit.tenant}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: right;">${unit.rent?.toLocaleString("de-DE", { style: "currency", currency: "EUR" }) || "—"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5;">
        <span style="color: ${unit.status === "bezahlt" ? "#22c55e" : "#ef4444"};">
          ${unit.status}
        </span>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e5e5; text-align: center;">${unit.reminders || 0}</td>
    </tr>
  `).join("") || "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a1a1a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Mietbericht ${report.month}</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.8;">${report.property_address} (${report.property_code})</p>
      </div>
      
      <div style="background: white; padding: 20px; border: 1px solid #e5e5e5;">
        <div style="display: flex; gap: 20px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${statusColor};">
              ${report.collection_rate}%
            </div>
            <div style="color: #666; font-size: 14px;">Collection Rate</div>
          </div>
          <div style="flex: 1; background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #22c55e;">
              ${report.total_received?.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
            </div>
            <div style="color: #666; font-size: 14px;">Einnahmen</div>
          </div>
          <div style="flex: 1; background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">
              ${report.paid_count}/${report.total_units}
            </div>
            <div style="color: #666; font-size: 14px;">Bezahlt</div>
          </div>
        </div>

        <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Einheitenübersicht</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Einheit</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Mieter</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Miete</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Status</th>
              <th style="padding: 12px 8px; text-align: center; font-weight: 600;">Mahnungen</th>
            </tr>
          </thead>
          <tbody>
            ${unitRows}
          </tbody>
        </table>
      </div>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 12px;">
        Generiert am ${new Date(report.generated_at).toLocaleString("de-DE")} • MSV Premium Mietsonderverwaltung
      </div>
    </div>
  `;
}

// Resend E-Mail versenden
async function sendReportEmail(params: {
  to: string;
  subject: string;
  html: string;
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
        from: "MSV Mietsonderverwaltung <msv@kaufy.app>",
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log(`Report email sent successfully: ${result.id}`);
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

    // Only run on the 15th of the month (or allow manual trigger)
    const { forceRun, tenantId, sendTo } = await req.json().catch(() => ({}));
    if (dayOfMonth !== 15 && !forceRun) {
      return new Response(
        JSON.stringify({ message: "Not the 15th, skipping report generation", dayOfMonth }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if Resend is configured
    const resendConfigured = !!Deno.env.get("RESEND_API_KEY");
    console.log(`Starting rent report generation... Resend configured: ${resendConfigured}`);

    // Get all premium enrollments (optionally filtered by tenant)
    let query = supabase
      .from("msv_enrollments")
      .select(`
        id,
        tenant_id,
        property_id,
        tier,
        organizations (
          name
        ),
        properties (
          address,
          code
        )
      `)
      .eq("tier", "premium")
      .eq("status", "active");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: enrollments, error: enrollmentError } = await query;
    if (enrollmentError) throw enrollmentError;

    console.log(`Found ${enrollments?.length || 0} premium enrollments`);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("de-DE", { month: "long" });

    const reports: any[] = [];
    const emailsSent: any[] = [];

    for (const enrollment of enrollments || []) {
      // Get all leases for this property
      const { data: leases } = await supabase
        .from("leases")
        .select(`
          id,
          unit_id,
          monthly_rent,
          tenant_contact_id,
          status,
          units!inner (
            unit_number,
            property_id
          ),
          contacts:tenant_contact_id (
            first_name,
            last_name
          )
        `)
        .eq("status", "active");

      // Filter leases that belong to enrollment's property
      const propertyLeases = leases?.filter(
        (l: any) => l.units?.property_id === enrollment.property_id
      ) || [];

      // Get payments for current month
      const periodStart = new Date(currentYear, currentMonth, 1);
      const periodEnd = new Date(currentYear, currentMonth + 1, 0);

      const { data: payments } = await supabase
        .from("rent_payments")
        .select("id, lease_id, amount, status, paid_date")
        .in("lease_id", propertyLeases.map((l: any) => l.id))
        .gte("due_date", periodStart.toISOString())
        .lte("due_date", periodEnd.toISOString());

      // Get reminders for current month
      const { data: reminders } = await supabase
        .from("rent_reminders")
        .select("id, lease_id, stage, status")
        .in("lease_id", propertyLeases.map((l: any) => l.id))
        .gte("created_at", periodStart.toISOString());

      // Build report data
      const paidPayments = payments?.filter((p) => p.status === "paid") || [];
      const openPayments = payments?.filter((p) => p.status !== "paid") || [];
      const totalExpected = propertyLeases.reduce((sum, l: any) => sum + (l.monthly_rent || 0), 0);
      const totalReceived = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

      const reportData = {
        enrollment_id: enrollment.id,
        tenant_id: enrollment.tenant_id,
        property_id: enrollment.property_id,
        property_address: (enrollment as any).properties?.address,
        property_code: (enrollment as any).properties?.code,
        org_name: (enrollment as any).organizations?.name,
        month: `${monthName} ${currentYear}`,
        total_units: propertyLeases.length,
        total_expected: totalExpected,
        total_received: totalReceived,
        collection_rate: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0,
        paid_count: paidPayments.length,
        open_count: openPayments.length,
        reminders_sent: reminders?.length || 0,
        unit_details: propertyLeases.map((lease: any) => {
          const leasePayments = payments?.filter((p) => p.lease_id === lease.id) || [];
          const leaseReminders = reminders?.filter((r) => r.lease_id === lease.id) || [];
          const isPaid = leasePayments.some((p) => p.status === "paid");

          return {
            unit: lease.units?.unit_number,
            tenant: lease.contacts ? `${lease.contacts.first_name} ${lease.contacts.last_name}` : "—",
            rent: lease.monthly_rent,
            status: isPaid ? "bezahlt" : "offen",
            reminders: leaseReminders.length
          };
        }),
        generated_at: today.toISOString()
      };

      reports.push(reportData);
      console.log(`Generated report for ${reportData.property_address}: ${reportData.collection_rate}% collected`);

      // Send email if configured and sendTo is provided (or use org admin email)
      if (sendTo) {
        const reportHtml = generateReportHtml(reportData);
        const emailResult = await sendReportEmail({
          to: sendTo,
          subject: `Mietbericht ${reportData.month} - ${reportData.property_address}`,
          html: reportHtml,
        });

        if (emailResult.success) {
          emailsSent.push({
            property_id: enrollment.property_id,
            to: sendTo,
            messageId: emailResult.messageId
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        month: `${monthName} ${currentYear}`,
        resendConfigured,
        reportsGenerated: reports.length,
        emailsSent: emailsSent.length,
        reports,
        emails: emailsSent
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating rent report:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
