import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { forceRun, tenantId } = await req.json().catch(() => ({}));
    if (dayOfMonth !== 15 && !forceRun) {
      return new Response(
        JSON.stringify({ message: "Not the 15th, skipping report generation", dayOfMonth }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting rent report generation for premium MSV enrollments...");

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

      // TODO: Generate PDF and send via Resend when configured
      console.log(`Generated report for ${reportData.property_address}: ${reportData.collection_rate}% collected`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        month: `${monthName} ${currentYear}`,
        reportsGenerated: reports.length,
        reports
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
