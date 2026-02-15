/**
 * sot-rent-arrears-check — Edge Function
 * 
 * Checks all active leases for unpaid rent on the current month.
 * If no paid entry exists, creates a task_widget (type: 'letter') on the dashboard.
 * Intended to run on the 10th of each month via cron or manual trigger.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${currentMonth}-01`;

    // 1. Fetch all active leases with contact info
    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select("id, monthly_rent, rent_cold_eur, nk_advance_eur, heating_advance_eur, tenant_contact_id, tenant_id, unit_id, payment_due_day")
      .eq("status", "active");

    if (leasesError) throw leasesError;
    if (!leases || leases.length === 0) {
      return new Response(JSON.stringify({ message: "No active leases", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch rent_payments for current month
    const leaseIds = leases.map((l: any) => l.id);
    const { data: payments } = await supabase
      .from("rent_payments")
      .select("lease_id, status")
      .in("lease_id", leaseIds)
      .gte("due_date", monthStart)
      .lt("due_date", `${currentMonth}-32`);

    const paidLeaseIds = new Set(
      (payments || [])
        .filter((p: any) => p.status === "paid")
        .map((p: any) => p.lease_id)
    );

    // 3. Check for existing task_widgets this month to avoid duplicates
    const { data: existingWidgets } = await supabase
      .from("task_widgets")
      .select("parameters")
      .eq("action_code", "ARM.RENT.REMINDER")
      .in("status", ["pending", "executing"]);

    const existingPeriods = new Set(
      (existingWidgets || []).map((w: any) => {
        const params = w.parameters as Record<string, unknown> | null;
        return params ? `${params.leaseId}-${params.period}` : "";
      })
    );

    // 4. Fetch contact names
    const contactIds = [...new Set(leases.map((l: any) => l.tenant_contact_id))];
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, company")
      .in("id", contactIds);

    const contactMap = new Map(
      (contacts || []).map((c: any) => [
        c.id,
        c.company || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Mieter",
      ])
    );

    // 5. Fetch unit → property mapping
    const unitIds = [...new Set(leases.map((l: any) => l.unit_id))];
    const { data: units } = await supabase
      .from("units")
      .select("id, property_id")
      .in("id", unitIds);

    const unitPropertyMap = new Map(
      (units || []).map((u: any) => [u.id, u.property_id])
    );

    // 6. Create task_widgets for unpaid leases
    let created = 0;
    const monthLabel = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(now);

    for (const lease of leases) {
      if (paidLeaseIds.has(lease.id)) continue;

      const key = `${lease.id}-${currentMonth}`;
      if (existingPeriods.has(key)) continue;

      const warmmiete =
        lease.rent_cold_eur && (lease.nk_advance_eur || lease.heating_advance_eur)
          ? (lease.rent_cold_eur || 0) + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0)
          : lease.monthly_rent;

      const contactName = contactMap.get(lease.tenant_contact_id) || "Mieter";
      const propertyId = unitPropertyMap.get(lease.unit_id) || null;

      const { error: insertError } = await supabase.from("task_widgets").insert({
        tenant_id: lease.tenant_id,
        user_id: lease.tenant_id, // fallback — will be picked up by any tenant user
        type: "letter",
        title: `Mietrückstand: ${contactName}`,
        description: `Für ${monthLabel} steht noch keine Mietzahlung aus. Mahnung erstellen?`,
        status: "pending",
        risk_level: "medium",
        cost_model: "free",
        source: "system",
        source_ref: `rent-arrears-${currentMonth}`,
        action_code: "ARM.RENT.REMINDER",
        parameters: {
          leaseId: lease.id,
          contactId: lease.tenant_contact_id,
          propertyId,
          letterType: "mahnung",
          amount: warmmiete,
          period: currentMonth,
        },
      });

      if (insertError) {
        console.error(`Failed to create widget for lease ${lease.id}:`, insertError);
      } else {
        created++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Arrears check complete`, checked: leases.length, created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sot-rent-arrears-check error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
