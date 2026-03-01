import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Bundle map: approved Regulatory Bundles per number type for DE
const DE_BUNDLES: Record<string, string | null> = {
  Local: "BU7b6e70441548870e7a0655d5b4d63474",
  Mobile: null,
  TollFree: null,
};

// Address SIDs linked to the DE bundle profile (not exposed via ItemAssignments API)
const DE_BUNDLE_ADDRESS: Record<string, string | null> = {
  Local: "ADdfec635e3ea56ba7095db1d937345dce",
  Mobile: null,
  TollFree: null,
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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    console.log("authenticated user:", userId);

    const { action, country_code, brand_key, phone_number: requestedNumber, number_type, area_code } = await req.json();
    console.log("action:", action, "country_code:", country_code, "brand_key:", brand_key, "number_type:", number_type, "area_code:", area_code);

    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY_SID");
    const TWILIO_API_SECRET = Deno.env.get("TWILIO_API_KEY_SECRET");

    const hasTokenAuth = !!TWILIO_SID && !!TWILIO_AUTH_TOKEN;
    const hasApiKeyAuth = !!TWILIO_SID && !!TWILIO_API_KEY && !!TWILIO_API_SECRET;

    if (!hasTokenAuth && !hasApiKeyAuth) {
      console.error(
        "Missing Twilio creds — SID:",
        !!TWILIO_SID,
        "AUTH_TOKEN:",
        !!TWILIO_AUTH_TOKEN,
        "API_KEY:",
        !!TWILIO_API_KEY,
        "API_SECRET:",
        !!TWILIO_API_SECRET,
      );
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usingAuthToken = hasTokenAuth;
    const twilioAuth = usingAuthToken
      ? btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN ?? ""}`)
      : btoa(`${TWILIO_API_KEY ?? ""}:${TWILIO_API_SECRET ?? ""}`);
    const webhookBaseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";
    console.log("Twilio auth mode:", usingAuthToken ? "account_token" : "api_key");

    const configuredRegion = (Deno.env.get("TWILIO_REGION") || "").trim().toLowerCase();
    const hostFromRegion = (region: string) =>
      region === "us1" ? "api.twilio.com" : `api.${region}.twilio.com`;
    const twilioHosts = configuredRegion
      ? [hostFromRegion(configuredRegion)]
      : ["api.twilio.com", "api.ie1.twilio.com"];

    const isBrandMode = !!brand_key;
    const lookupFilter = isBrandMode
      ? { column: "brand_key", value: brand_key }
      : { column: "user_id", value: userId };

    // Debug action: list all Twilio addresses
    if (action === "list_addresses") {
      const allAddresses = [];
      for (const host of twilioHosts) {
        const addrUrl = `https://${host}/2010-04-01/Accounts/${TWILIO_SID}/Addresses.json?PageSize=50`;
        const addrRes = await fetch(addrUrl, {
          headers: { Authorization: `Basic ${twilioAuth}` },
        });
        const addrText = await addrRes.text();
        try {
          const addrData = JSON.parse(addrText);
          if (addrData.addresses) {
            for (const a of addrData.addresses) {
              allAddresses.push({
                sid: a.sid,
                friendly_name: a.friendly_name,
                customer_name: a.customer_name,
                street: a.street,
                city: a.city,
                region: a.region,
                postal_code: a.postal_code,
                country: a.iso_country,
                validated: a.validated,
                verified: a.verified,
              });
            }
          }
        } catch { /* ignore parse errors */ }
      }
      return new Response(
        JSON.stringify({ addresses: allAddresses, count: allAddresses.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Debug action: inspect bundle item assignments
    if (action === "debug_bundle") {
      const bundleSid = DE_BUNDLES["Local"];
      if (!bundleSid) {
        return new Response(JSON.stringify({ error: "No Local bundle configured" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const assignUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundleSid}/ItemAssignments`;
      console.log("debug_bundle: fetching", assignUrl);
      const assignRes = await fetch(assignUrl, {
        headers: { Authorization: `Basic ${twilioAuth}` },
      });
      const rawText = await assignRes.text();
      console.log("debug_bundle: status", assignRes.status, "body:", rawText);
      let parsed: any = null;
      try { parsed = JSON.parse(rawText); } catch { /* */ }
      return new Response(JSON.stringify({
        bundle_sid: bundleSid,
        status: assignRes.status,
        raw: parsed || rawText,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── SEARCH: return a list of available numbers ──
    if (action === "search") {
      const cc = country_code || "DE";
      // DE numbers are restricted to area code 089 (Munich) to match the registered
      // regulatory bundle address (Oberhaching). Only Local type has an approved bundle.
      const types = cc === "DE" ? ["Local"] : ["Local", "Mobile", "TollFree"];
      const hardcodedAreaCode = cc === "DE" ? "+4989" : null;
      const allNumbers: any[] = [];

      for (const host of twilioHosts) {
        for (const numType of types) {
          let searchUrl = `https://${host}/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/${cc}/${numType}.json?PageSize=10`;
          // For DE: always search +4989* numbers; for others: use client-supplied area_code
          const effectiveCode = hardcodedAreaCode || (area_code ? area_code.replace(/^\+?49/, '').replace(/^0/, '') : null);
          if (effectiveCode) {
            searchUrl += `&Contains=${encodeURIComponent(effectiveCode)}`;
          }
          console.log(`search ${cc} ${numType} on ${host}`, `area_code=${effectiveCode || 'none'}`);
          const searchRes = await fetch(searchUrl, {
            headers: { Authorization: `Basic ${twilioAuth}` },
          });
          if (!searchRes.ok) continue;
          try {
            const data = JSON.parse(await searchRes.text());
            for (const n of data.available_phone_numbers ?? []) {
              allNumbers.push({
                phone_number: n.phone_number,
                friendly_name: n.friendly_name,
                locality: n.locality || n.region || "",
                type: numType,
                capabilities: n.capabilities,
              });
            }
          } catch { /* skip */ }
        }
        if (allNumbers.length > 0) break;
      }

      return new Response(
        JSON.stringify({ numbers: allNumbers, count: allNumbers.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PURCHASE: buy a specific or first available number ──
    if (action === "purchase") {
      const cc = country_code || "DE";
      let numberToBuy = requestedNumber;
      let selectedHost = twilioHosts[0];
      // Determine the number type from request or default to Local
      const purchaseType = number_type || "Local";

      // If no specific number requested, search for one
      if (!numberToBuy) {
        const types = [purchaseType]; // Only search for the requested type
        let searchData: any = { available_phone_numbers: [] };

        hostLoop:
        for (const host of twilioHosts) {
          for (const numType of types) {
            const searchUrl = `https://${host}/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/${cc}/${numType}.json?PageSize=1`;
            console.log(`searching ${cc} ${numType} on ${host}...`);
            const searchRes = await fetch(searchUrl, {
              headers: { Authorization: `Basic ${twilioAuth}` },
            });
            if (!searchRes.ok) continue;
            try { searchData = JSON.parse(await searchRes.text()); } catch { searchData = { available_phone_numbers: [] }; }
            if (searchData.available_phone_numbers?.length) {
              selectedHost = host;
              break hostLoop;
            }
          }
        }

        if (!searchData.available_phone_numbers?.length) {
          return new Response(
            JSON.stringify({ error: "Keine Nummern verfügbar", country: cc }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        numberToBuy = searchData.available_phone_numbers[0].phone_number;
      }

      const friendlyName = isBrandMode
        ? `SoT-Brand-${brand_key}`
        : `SoT-PhoneAssistant-${userId.slice(0, 8)}`;

      // Fetch the correct AddressSid from the Regulatory Bundle's Item Assignments
      // (required for DE numbers — the address must be the one registered IN the bundle)
      let addressSid = "";
      if (cc === "DE") {
        const bundleSid = DE_BUNDLES[purchaseType];
        if (bundleSid) {
          try {
            const assignUrl = `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${bundleSid}/ItemAssignments`;
            const assignRes = await fetch(assignUrl, {
              headers: { Authorization: `Basic ${twilioAuth}` },
            });
            if (assignRes.ok) {
              const assignData = await assignRes.json();
              const assignmentItems = [
                ...(Array.isArray(assignData?.results) ? assignData.results : []),
                ...(Array.isArray(assignData?.item_assignments) ? assignData.item_assignments : []),
              ];
              const addrAssignment = assignmentItems.find((item: any) => {
                const sid = item?.object_sid || item?.objectSid || item?.sid;
                return typeof sid === "string" && sid.startsWith("AD");
              });
              if (addrAssignment) {
                addressSid = addrAssignment.object_sid || addrAssignment.objectSid || addrAssignment.sid;
                console.log("Using bundle AddressSid:", addressSid);
              }
            } else {
              console.warn("Bundle ItemAssignments fetch failed:", assignRes.status);
            }
          } catch (e) {
            console.warn("Could not fetch bundle item assignments:", e);
          }
        }
      }
      // Fallback: only for non-DE. For DE, never force an account-level AddressSid,
      // because it can conflict with the selected Regulatory Bundle and trigger 21651.
      if (!addressSid && cc !== "DE") {
        try {
          const addrUrl = `https://${selectedHost}/2010-04-01/Accounts/${TWILIO_SID}/Addresses.json?PageSize=1`;
          const addrRes = await fetch(addrUrl, {
            headers: { Authorization: `Basic ${twilioAuth}` },
          });
          if (addrRes.ok) {
            const addrData = await addrRes.json();
            if (addrData.addresses?.length) {
              addressSid = addrData.addresses[0].sid;
              console.log("Using fallback AddressSid:", addressSid);
            }
          }
        } catch (e) {
          console.warn("Could not fetch Twilio addresses:", e);
        }
      }

      // Check if we have an approved bundle for this number type
      if (cc === "DE") {
        const bundleSid = DE_BUNDLES[purchaseType];
        if (!bundleSid) {
          return new Response(
            JSON.stringify({
              error: `Kein genehmigtes Regulatory Bundle für ${purchaseType}-Nummern vorhanden`,
              details: `Für den Nummerntyp "${purchaseType}" muss zunächst ein Bundle bei Twilio erstellt und genehmigt werden. Aktuell ist nur "Local" (Festnetz) genehmigt.`,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const buyUrl = `https://${selectedHost}/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json`;
      const buyParams: Record<string, string> = {
        PhoneNumber: numberToBuy,
        VoiceUrl: `${webhookBaseUrl}/sot-phone-inbound`,
        VoiceMethod: "POST",
        StatusCallback: `${webhookBaseUrl}/sot-phone-postcall`,
        StatusCallbackMethod: "POST",
        FriendlyName: friendlyName,
      };
      // For DE: send BundleSid AND the bundle-profile AddressSid together.
      // The AddressSid is embedded in the bundle profile but not returned by
      // the ItemAssignments API, so we map it explicitly via DE_BUNDLE_ADDRESS.
      if (cc === "DE") {
        const bundleSid = DE_BUNDLES[purchaseType];
        const bundleAddr = DE_BUNDLE_ADDRESS[purchaseType];
        if (bundleSid) {
          buyParams.BundleSid = bundleSid;
          console.log("Using BundleSid for DE:", bundleSid);
        }
        if (bundleAddr) {
          buyParams.AddressSid = bundleAddr;
          console.log("Using bundle AddressSid for DE:", bundleAddr);
        }
      } else if (addressSid) {
        buyParams.AddressSid = addressSid;
        console.log("Using AddressSid:", addressSid);
      }
      const buyBody = new URLSearchParams(buyParams);

      console.log("purchasing number:", numberToBuy, "type:", purchaseType);
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
          JSON.stringify({
            error: "Nummernkauf fehlgeschlagen",
            details: buyData.message || buyData.more_info || "Unbekannter Twilio-Fehler",
            twilio_code: buyData.code,
          }),
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

      let releaseOk = false;
      let lastReleaseStatus = 500;

      for (const host of twilioHosts) {
        const releaseUrl = `https://${host}/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers/${assistant.twilio_number_sid}.json`;
        const releaseRes = await fetch(releaseUrl, {
          method: "DELETE",
          headers: { Authorization: `Basic ${twilioAuth}` },
        });

        lastReleaseStatus = releaseRes.status;
        if (releaseRes.ok || releaseRes.status === 404) {
          releaseOk = true;
          break;
        }
      }

      if (!releaseOk) {
        return new Response(
          JSON.stringify({ error: "Nummer-Release fehlgeschlagen", status: lastReleaseStatus }),
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
      JSON.stringify({ error: "Unknown action. Use 'search', 'purchase' or 'release'." }),
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
