import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_tenant_id) {
      return new Response(
        JSON.stringify({ error: "No active tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = profile.active_tenant_id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const action = body.action || "list";

    // LIST assigned leads for partner
    if (action === "list") {
      const { status_filter } = body;

      let query = supabaseAdmin
        .from("lead_assignments")
        .select(`
          id, status, offered_at, accepted_at, rejected_at,
          leads (
            id, public_id, status, interest_type, source, notes,
            budget_min, budget_max, created_at,
            contacts (first_name, last_name, email, phone)
          )
        `)
        .eq("partner_org_id", tenantId)
        .order("offered_at", { ascending: false });

      if (status_filter) {
        query = query.eq("status", status_filter);
      }

      const { data: assignments, error } = await query;

      if (error) {
        console.error("Lead list error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to list leads" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ leads: assignments, count: assignments?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ACCEPT lead assignment
    if (action === "accept") {
      const { assignment_id } = body;

      if (!assignment_id) {
        return new Response(
          JSON.stringify({ error: "assignment_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify assignment belongs to this partner
      const { data: assignment } = await supabaseAdmin
        .from("lead_assignments")
        .select("id, lead_id, status")
        .eq("id", assignment_id)
        .eq("partner_org_id", tenantId)
        .maybeSingle();

      if (!assignment) {
        return new Response(
          JSON.stringify({ error: "Assignment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (assignment.status !== "offered") {
        return new Response(
          JSON.stringify({ error: "Lead already processed", current_status: assignment.status }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update assignment status
      const { error: updateError } = await supabaseAdmin
        .from("lead_assignments")
        .update({ 
          status: "accepted", 
          accepted_at: new Date().toISOString() 
        })
        .eq("id", assignment_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to accept lead" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update lead status
      await supabaseAdmin
        .from("leads")
        .update({ 
          status: "qualified",
          assigned_partner_id: tenantId,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", assignment.lead_id);

      // Log activity
      await supabaseAdmin.from("lead_activities").insert({
        tenant_id: tenantId,
        lead_id: assignment.lead_id,
        activity_type: "assignment_accepted",
        description: "Lead assignment accepted by partner",
        performed_by: user.id,
      });

      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "lead.accepted",
        payload: { assignment_id, lead_id: assignment.lead_id },
      });

      console.log(`Lead accepted: ${assignment.lead_id} by ${tenantId}`);

      return new Response(
        JSON.stringify({ 
          accepted: true, 
          assignment_id, 
          lead_id: assignment.lead_id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // REJECT lead assignment
    if (action === "reject") {
      const { assignment_id, reason } = body;

      if (!assignment_id) {
        return new Response(
          JSON.stringify({ error: "assignment_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: assignment } = await supabaseAdmin
        .from("lead_assignments")
        .select("id, lead_id, status")
        .eq("id", assignment_id)
        .eq("partner_org_id", tenantId)
        .maybeSingle();

      if (!assignment) {
        return new Response(
          JSON.stringify({ error: "Assignment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (assignment.status !== "offered") {
        return new Response(
          JSON.stringify({ error: "Lead already processed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin
        .from("lead_assignments")
        .update({ 
          status: "rejected", 
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || null,
        })
        .eq("id", assignment_id);

      // Return lead to pool
      await supabaseAdmin
        .from("leads")
        .update({ zone1_pool: true })
        .eq("id", assignment.lead_id);

      await supabaseAdmin.from("lead_activities").insert({
        tenant_id: tenantId,
        lead_id: assignment.lead_id,
        activity_type: "assignment_rejected",
        description: reason || "Lead assignment rejected",
        performed_by: user.id,
      });

      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "lead.rejected",
        payload: { assignment_id, lead_id: assignment.lead_id, reason },
      });

      console.log(`Lead rejected: ${assignment.lead_id} by ${tenantId}`);

      return new Response(
        JSON.stringify({ rejected: true, assignment_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CREATE Deal from Lead
    if (action === "create_deal") {
      const { lead_id, expected_close_date } = body;

      if (!lead_id) {
        return new Response(
          JSON.stringify({ error: "lead_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify lead is assigned to this partner
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("id, contact_id, budget_max")
        .eq("id", lead_id)
        .eq("assigned_partner_id", tenantId)
        .maybeSingle();

      if (!lead) {
        return new Response(
          JSON.stringify({ error: "Lead not found or not assigned to you" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create deal
      const { data: deal, error: dealError } = await supabaseAdmin
        .from("partner_deals")
        .insert({
          tenant_id: tenantId,
          lead_id: lead_id,
          contact_id: lead.contact_id,
          deal_value: lead.budget_max,
          stage: "initial_contact",
          expected_close_date: expected_close_date || null,
        })
        .select("id, stage")
        .single();

      if (dealError) {
        console.error("Deal create error:", dealError);
        return new Response(
          JSON.stringify({ error: "Failed to create deal" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update lead status
      await supabaseAdmin
        .from("leads")
        .update({ status: "in_progress" })
        .eq("id", lead_id);

      await supabaseAdmin.from("lead_activities").insert({
        tenant_id: tenantId,
        lead_id: lead_id,
        deal_id: deal.id,
        activity_type: "deal_created",
        description: "Deal created from lead",
        performed_by: user.id,
      });

      console.log(`Deal created: ${deal.id} from lead ${lead_id}`);

      return new Response(
        JSON.stringify({ deal_id: deal.id, stage: deal.stage }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: list, accept, reject, create_deal" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Lead inbox error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
