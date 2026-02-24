/**
 * sot-renter-invite — Renter Invite Lifecycle (CONTRACT_RENTER_INVITE)
 * 
 * Actions:
 *   - send: Create invite + send email via user mail account or Resend fallback
 *   - accept: Validate token, provision renter org, grant data room access
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendViaUserAccountOrResend } from "../_shared/userMailSend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const action = body.action || "send";

    if (action === "accept") {
      return await handleAccept(supabase, body);
    }
    return await handleSend(supabase, req, body);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("sot-renter-invite error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleSend(supabase: any, req: Request, body: any) {
  // Auth required for send
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Authorization required");
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) throw new Error("Unauthorized");

  const { lease_id, email, contact_id, tenant_id } = body;
  if (!lease_id || !email || !contact_id || !tenant_id) {
    throw new Error("Missing required fields: lease_id, email, contact_id, tenant_id");
  }

  // Validate lease exists and belongs to tenant
  const { data: lease, error: leaseErr } = await supabase
    .from("leases").select("id, unit_id").eq("id", lease_id).eq("tenant_id", tenant_id).single();
  if (leaseErr || !lease) throw new Error("Lease not found or access denied");

  // Generate invite token
  const inviteToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  // Insert invite (unique partial index prevents duplicates for pending)
  const { data: invite, error: insertErr } = await supabase
    .from("renter_invites")
    .insert({
      tenant_id, lease_id, unit_id: lease.unit_id, contact_id,
      email, token: inviteToken, status: "pending",
      expires_at: expiresAt, created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Duplicate — idempotent response
      return new Response(
        JSON.stringify({ success: true, duplicate: true, message: "Invite already pending for this lease" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    throw new Error(`Failed to create invite: ${insertErr.message}`);
  }

  // Ledger: renter.invite.sent
  await supabase.rpc("log_data_event", {
    p_tenant_id: tenant_id, p_zone: "Z2", p_event_type: "renter.invite.sent",
    p_direction: "egress", p_source: "sot-renter-invite",
    p_entity_type: "renter_invites", p_entity_id: invite.id,
    p_payload: { invite_id: invite.id, lease_id, email_hash: email.substring(0, 3) + "***" },
  });

  // Send email via user's connected mail account (preferred) or Resend fallback
  const sendResult = await sendViaUserAccountOrResend({
    supabase,
    userId: user.id,
    to: [email],
    subject: "Einladung zum Mieter-Portal",
    bodyHtml: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;">
      <h2>Sie wurden zum Mieter-Portal eingeladen</h2>
      <p>Ihr Vermieter hat Sie eingeladen, dem Mieter-Portal beizutreten.</p>
      <p>Ihr Einladungscode: <strong>${inviteToken}</strong></p>
      <p>Dieser Code ist 72 Stunden gueltig.</p>
    </div>`,
    resendFrom: "System of a Town <noreply@systemofatown.de>",
  });

  if (sendResult.method === 'skipped') {
    console.warn('[sot-renter-invite] No mail account and no RESEND_API_KEY — email not sent');
  } else {
    console.log(`[sot-renter-invite] Email sent via ${sendResult.method}: ${sendResult.messageId || 'n/a'}`);
  }

  return new Response(
    JSON.stringify({ success: true, invite_id: invite.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAccept(supabase: any, body: any) {
  const { token: inviteToken } = body;
  if (!inviteToken) throw new Error("Missing token");

  // Find invite by token
  const { data: invite, error: findErr } = await supabase
    .from("renter_invites")
    .select("*")
    .eq("token", inviteToken)
    .single();

  if (findErr || !invite) throw new Error("Invalid invite token");

  // Idempotent: already accepted
  if (invite.status === "accepted") {
    return new Response(
      JSON.stringify({ success: true, already_accepted: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    await supabase.from("renter_invites").update({ status: "expired" }).eq("id", invite.id);
    await supabase.rpc("log_data_event", {
      p_tenant_id: invite.tenant_id, p_zone: "Z1", p_event_type: "renter.invite.expired",
      p_direction: "mutate", p_source: "sot-renter-invite",
      p_entity_type: "renter_invites", p_entity_id: invite.id,
      p_payload: { invite_id: invite.id, lease_id: invite.lease_id },
    });
    throw new Error("Invite has expired");
  }

  // Accept invite
  await supabase.from("renter_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // Provision renter org
  const { data: renterOrg } = await supabase
    .from("organizations")
    .insert({ name: `Mieter (${invite.email})`, org_type: "renter" })
    .select("id")
    .single();

  const renterOrgId = renterOrg?.id;

  // Update lease with renter_org_id if column exists
  if (renterOrgId) {
    await supabase.from("leases").update({ renter_org_id: renterOrgId }).eq("id", invite.lease_id);
  }

  // Create access grant
  if (renterOrgId) {
    await supabase.from("access_grants").insert({
      tenant_id: invite.tenant_id,
      subject_type: "organization", subject_id: renterOrgId,
      scope_type: "lease", scope_id: invite.lease_id,
      status: "active", can_view: true, can_download: true,
    });
  }

  // Ledger events
  await supabase.rpc("log_data_event", {
    p_tenant_id: invite.tenant_id, p_zone: "Z1", p_event_type: "renter.invite.accepted",
    p_direction: "mutate", p_source: "sot-renter-invite",
    p_entity_type: "renter_invites", p_entity_id: invite.id,
    p_payload: { invite_id: invite.id, lease_id: invite.lease_id, renter_org_id: renterOrgId },
  });

  if (renterOrgId) {
    await supabase.rpc("log_data_event", {
      p_tenant_id: invite.tenant_id, p_zone: "Z1", p_event_type: "renter.org.provisioned",
      p_direction: "mutate", p_source: "sot-renter-invite",
      p_entity_type: "organizations", p_entity_id: renterOrgId,
      p_payload: { org_id: renterOrgId, lease_id: invite.lease_id, renter_name: `Mieter (${invite.email})` },
    });

    await supabase.rpc("log_data_event", {
      p_tenant_id: invite.tenant_id, p_zone: "Z1", p_event_type: "data_room.access.granted",
      p_direction: "mutate", p_source: "sot-renter-invite",
      p_entity_type: "access_grants", p_entity_id: renterOrgId,
      p_payload: { grant_id: renterOrgId, lease_id: invite.lease_id, renter_org_id: renterOrgId },
    });
  }

  return new Response(
    JSON.stringify({ success: true, invite_id: invite.id, renter_org_id: renterOrgId }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
