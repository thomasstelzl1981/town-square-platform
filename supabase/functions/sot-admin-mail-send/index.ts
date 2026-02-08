/**
 * sot-admin-mail-send — Zone 1 Admin Email via Resend
 * Sends transactional emails and stores in admin_outbound_emails
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to_email: string;
  to_name?: string;
  contact_id?: string;
  subject: string;
  body_text: string;
  body_html?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check platform_admin role
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .maybeSingle();
    
    if (!membership) {
      throw new Error("Forbidden: platform_admin role required");
    }

    const payload: EmailRequest = await req.json();
    
    if (!payload.to_email || !payload.subject || !payload.body_text) {
      throw new Error("Missing required fields: to_email, subject, body_text");
    }

    // Generate routing token for reply tracking
    const routingToken = crypto.randomUUID();

    // Convert plain text to simple HTML if no HTML provided
    const bodyHtml = payload.body_html || `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5;">${payload.body_text.replace(/\n/g, '<br>')}</div>`;

    // Create outbound record first (queued status)
    const { data: emailRecord, error: insertError } = await supabase
      .from("admin_outbound_emails")
      .insert({
        to_email: payload.to_email,
        to_name: payload.to_name || null,
        contact_id: payload.contact_id || null,
        subject: payload.subject,
        body_html: bodyHtml,
        body_text: payload.body_text,
        routing_token: routingToken,
        status: "queued",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create email record:", insertError);
      throw new Error("Failed to create email record");
    }

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "System of a Town <noreply@systemofatown.de>",
        to: payload.to_name ? `${payload.to_name} <${payload.to_email}>` : payload.to_email,
        reply_to: `admin+${routingToken}@incoming.systemofatown.de`,
        subject: payload.subject,
        html: bodyHtml,
        text: payload.body_text,
      }),
    });

    const resendData = await resendResponse.json();
    
    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      
      // Update record with error
      await supabase
        .from("admin_outbound_emails")
        .update({
          status: "failed",
          error_message: resendData.message || "Unknown error",
        })
        .eq("id", emailRecord.id);
      
      throw new Error(`Failed to send email: ${resendData.message || "Unknown error"}`);
    }

    // Update record with success
    await supabase
      .from("admin_outbound_emails")
      .update({
        resend_message_id: resendData.id,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", emailRecord.id);

    console.log(`Email sent successfully: ${resendData.id} to ${payload.to_email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailRecord.id,
        resend_id: resendData.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("sot-admin-mail-send error:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
