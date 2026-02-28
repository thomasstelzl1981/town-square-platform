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
    console.log("provision handler called, method:", req.method);
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

    // Fixed: use getUser() instead of non-existent getClaims()
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    console.log("authenticated user:", userId);

    const { action, country_code, brand_key } = await req.json();
    console.log("action:", action, "country_code:", country_code, "brand_key:", brand_key);

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

    // Determine lookup: brand_key (Zone 1) or user_id (Zone 2)
    const isBrandMode = !!brand_key;
    const lookupFilter = isBrandMode
      ? { column: "brand_key", value: brand_key }
      : { column: "user_id", value: userId };

    if (action === "purchase") {
      const cc = country_code || "DE";
      // Try Local first, then Mobile, then Toll-Free
      const types = ["Local", "Mobile", "TollFree"];
      let searchData: any = { available_phone_numbers: [] };
      
      for (const numType of types) {
        const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/${cc}/${numType}.json?PageSize=1`;
        console.log(`searching Twilio for ${cc} ${numType} numbers...`);
        const searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Basic ${twilioAuth}` },
        });
        console.log(`Twilio ${numType} search response status:`, searchRes.status);
        searchData = await searchRes.json();
        console.log(`Twilio ${numType} results:`, searchData.available_phone_numbers?.length ?? 0);
        if (searchData.available_phone_numbers?.length) break;
      }

      if (!searchData.available_phone_numbers?.length) {
        return new Response(
          JSON.stringify({ error: "Keine Nummern verfügbar", country: cc }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const number = searchData.available_phone_numbers[0];
      const friendlyName = isBrandMode
        ? `SoT-Brand-${brand_key}`
        : `SoT-PhoneAssistant-${userId.slice(0, 8)}`;

      const buyUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json`;
      const buyBody = new URLSearchParams({
        PhoneNumber: number.phone_number,
        VoiceUrl: `${webhookBaseUrl}/sot-phone-inbound`,
        VoiceMethod: "POST",
        StatusCallback: `${webhookBaseUrl}/sot-phone-postcall`,
        StatusCallbackMethod: "POST",
        FriendlyName: friendlyName,
      });

      console.log("purchasing number:", number.phone_number);
      const buyRes = await fetch(buyUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${twilioAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: buyBody.toString(),
      });
      const buyData = await buyRes.json();
      console.log("Twilio buy response status:", buyRes.status, "sid:", buyData.sid);

      if (!buyRes.ok) {
        console.error("Twilio purchase failed:", buyData);
        return new Response(
          JSON.stringify({ error: "Nummernkauf fehlgeschlagen", details: buyData.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update assistant record (by brand_key or user_id)
      const { error: updateErr } = await supabase
        .from("commpro_phone_assistants")
        .update({
          twilio_number_sid: buyData.sid,
          twilio_phone_number_e164: buyData.phone_number,
          forwarding_number_e164: buyData.phone_number,
          binding_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq(lookupFilter.column, lookupFilter.value);

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
      const { data: assistant } = await supabase
        .from("commpro_phone_assistants")
        .select("twilio_number_sid")
        .eq(lookupFilter.column, lookupFilter.value)
        .single();

      if (!assistant?.twilio_number_sid) {
        return new Response(
          JSON.stringify({ error: "Keine Nummer zugewiesen" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

      await supabase
        .from("commpro_phone_assistants")
        .update({
          twilio_number_sid: null,
          twilio_phone_number_e164: null,
          forwarding_number_e164: null,
          binding_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq(lookupFilter.column, lookupFilter.value);

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
