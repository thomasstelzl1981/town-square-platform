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

    // Only run on the 10th of the month (or allow manual trigger)
    const { forceRun } = await req.json().catch(() => ({}));
    if (dayOfMonth !== 10 && !forceRun) {
      return new Response(
        JSON.stringify({ message: "Not the 10th, skipping reminder check", dayOfMonth }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting reminder check for premium MSV enrollments...");

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
              auto_sent: false // Will be set to true after sending
            })
            .select()
            .single();

          if (!reminderError) {
            remindersCreated.push({
              lease_id: lease.id,
              stage: newStage,
              contact: contact?.email,
              reminder_id: reminder.id
            });

            // TODO: Send via Resend when RESEND_API_KEY is configured
            // For now, just mark as created
            console.log(`Created ${newStage} reminder for lease ${lease.id}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today.toISOString(),
        remindersCreated: remindersCreated.length,
        details: remindersCreated
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
