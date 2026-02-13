/**
 * sot-website-lead-capture — Receives contact form submissions from Zone 3
 * Writes to contact_staging (no auth required — public endpoint)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, email, phone, message, website_id, tenant_id } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Name und E-Mail sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to write to contact_staging (public endpoint)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert into contact_staging for processing
    const { error } = await supabase.from("contact_staging").insert({
      tenant_id: tenant_id || null,
      full_name: name,
      email,
      phone: phone || null,
      source: "website_builder",
      source_detail: `website:${website_id}`,
      status: "new",
      raw_payload: { message, website_id },
    });

    if (error) {
      console.error("Lead capture insert error:", error);
      // Don't expose internal errors to public
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead captured from website ${website_id}: ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lead capture error:", error);
    return new Response(
      JSON.stringify({ success: true }), // Always return success to public
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
