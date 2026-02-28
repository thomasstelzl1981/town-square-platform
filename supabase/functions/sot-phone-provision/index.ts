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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { action, country_code } = await req.json();

    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!TWILIO_SID || !TWILIO_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioAuth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
    const webhookBaseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";

    if (action === "purchase") {
      // 1. Search for available local numbers
      const cc = country_code || "DE";
      const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/${cc}/Local.json?PageSize=1`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Basic ${twilioAuth}` },
      });
      const searchData = await searchRes.json();

      if (!searchData.available_phone_numbers?.length) {
        return new Response(
          JSON.stringify({ error: "Keine Nummern verfügbar", country: cc }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const number = searchData.available_phone_numbers[0];

      // 2. Purchase the number with webhook configuration
      const buyUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json`;
      const buyBody = new URLSearchParams({
        PhoneNumber: number.phone_number,
        VoiceUrl: `${webhookBaseUrl}/sot-phone-inbound`,
        VoiceMethod: "POST",
        StatusCallback: `${webhookBaseUrl}/sot-phone-postcall`,
        StatusCallbackMethod: "POST",
        FriendlyName: `SoT-PhoneAssistant-${userId.slice(0, 8)}`,
      });

      const buyRes = await fetch(buyUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: buyBody.toString(),
      });
      const buyData = await buyRes.json();

      if (!buyRes.ok) {
        console.error("Twilio purchase failed:", buyData);
        return new Response(
          JSON.stringify({ error: "Nummernkauf fehlgeschlagen", details: buyData.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Update assistant record
      const { error: updateErr } = await supabase
        .from("commpro_phone_assistants")
        .update({
          twilio_number_sid: buyData.sid,
          twilio_phone_number_e164: buyData.phone_number,
          forwarding_number_e164: buyData.phone_number,
          binding_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateErr) {
        console.error("DB update failed:", updateErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          phone_number: buyData.phone_number,
          sid: buyData.sid,
          friendly_name: buyData.friendly_name,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "release") {
      // Get current assistant to find Twilio SID
      const { data: assistant } = await supabase
        .from("commpro_phone_assistants")
        .select("twilio_number_sid")
        .eq("user_id", userId)
        .single();

      if (!assistant?.twilio_number_sid) {
        return new Response(
          JSON.stringify({ error: "Keine Nummer zugewiesen" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Release number on Twilio
      const releaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers/${assistant.twilio_number_sid}.json`;
      const releaseRes = await fetch(releaseUrl, {
        method: "DELETE",
        headers: { Authorization: `Basic ${twilioAuth}` },
      });

      if (!releaseRes.ok && releaseRes.status !== 404) {
        return new Response(
          JSON.stringify({ error: "Nummer-Release fehlgeschlagen" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clear DB
      await supabase
        .from("commpro_phone_assistants")
        .update({
          twilio_number_sid: null,
          twilio_phone_number_e164: null,
          forwarding_number_e164: null,
          binding_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'purchase' or 'release'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("phone-provision error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
