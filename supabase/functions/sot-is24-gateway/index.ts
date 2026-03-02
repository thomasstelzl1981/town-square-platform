/**
 * sot-is24-gateway — ImmobilienScout24 API Gateway
 * 
 * Reseller-Modell: Zone 1 Backbone orchestriert IS24-Publikationen.
 * OAuth 1.0a (HMAC-SHA1) 2-legged Signing für Sandbox.
 * 
 * Actions: create_listing, update_listing, deactivate_listing, get_listing
 * Credit-Kosten: 2 Credits pro Publish-Aktion
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IS24_SANDBOX_BASE = "https://rest.sandbox-immobilienscout24.de/restapi/api";
const CREDIT_COST_PUBLISH = 2;

// ── OAuth 1.0a HMAC-SHA1 Signing ──

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function signRequest(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  additionalParams: Record<string, string> = {}
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
    ...additionalParams,
  };

  // Parse URL to separate base URL and query params
  const urlObj = new URL(url);
  const allParams: Record<string, string> = { ...oauthParams };
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  // Sort and encode parameters
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join("&");

  const baseUrl = `${urlObj.origin}${urlObj.pathname}`;
  const signatureBase = `${method.toUpperCase()}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`;

  // 2-legged: signing key = consumerSecret& (no token secret)
  const signingKey = `${percentEncode(consumerSecret)}&`;
  const signature = await hmacSha1(signingKey, signatureBase);

  // Build Authorization header
  const authParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const authHeader = "OAuth " +
    Object.keys(authParams)
      .sort()
      .map((key) => `${percentEncode(key)}="${percentEncode(authParams[key])}"`)
      .join(", ");

  return authHeader;
}

// ── IS24 Object Type Mapping ──

interface IS24RealEstate {
  title: string;
  address: {
    street?: string;
    houseNumber?: string;
    postcode?: string;
    city?: string;
    quarter?: string;
  };
  showAddress: boolean;
  price: { value: number; currency: string };
  livingSpace?: number;
  numberOfRooms?: number;
  yearConstructed?: number;
  descriptionNote?: string;
  furnishingNote?: string;
  locationNote?: string;
  otherNote?: string;
  externalId?: string;
}

function buildApartmentBuyPayload(data: Record<string, unknown>): Record<string, unknown> {
  return {
    "realestates.apartmentBuy": {
      externalId: data.external_id || `sot-${data.listing_id}`,
      title: data.title || "Eigentumswohnung",
      address: {
        street: data.street || "",
        houseNumber: data.house_number || "",
        postcode: data.postal_code || "",
        city: data.city || "",
      },
      showAddress: true,
      price: {
        value: data.asking_price || 0,
        currency: "EUR",
        marketingType: "PURCHASE",
        priceIntervalType: "ONE_TIME_CHARGE",
      },
      livingSpace: data.area_sqm || 0,
      numberOfRooms: data.rooms || 1,
      yearConstructed: data.year_built || null,
      descriptionNote: data.description || "",
      locationNote: data.location_note || "",
      otherNote: data.other_note || "",
      courtage: {
        hasCourtage: data.commission_rate ? "YES" : "NO",
        courtage: data.commission_rate ? `${data.commission_rate}% zzgl. MwSt.` : undefined,
      },
    },
  };
}

function buildHouseBuyPayload(data: Record<string, unknown>): Record<string, unknown> {
  return {
    "realestates.houseBuy": {
      externalId: data.external_id || `sot-${data.listing_id}`,
      title: data.title || "Haus",
      address: {
        street: data.street || "",
        houseNumber: data.house_number || "",
        postcode: data.postal_code || "",
        city: data.city || "",
      },
      showAddress: true,
      price: {
        value: data.asking_price || 0,
        currency: "EUR",
        marketingType: "PURCHASE",
        priceIntervalType: "ONE_TIME_CHARGE",
      },
      livingSpace: data.area_sqm || 0,
      numberOfRooms: data.rooms || 1,
      yearConstructed: data.year_built || null,
      descriptionNote: data.description || "",
      courtage: {
        hasCourtage: data.commission_rate ? "YES" : "NO",
        courtage: data.commission_rate ? `${data.commission_rate}% zzgl. MwSt.` : undefined,
      },
    },
  };
}

function buildApartmentRentPayload(data: Record<string, unknown>): Record<string, unknown> {
  return {
    "realestates.apartmentRent": {
      externalId: data.external_id || `sot-rental-${data.rental_listing_id}`,
      title: data.title || "Mietwohnung",
      address: {
        street: data.street || "",
        houseNumber: data.house_number || "",
        postcode: data.postal_code || "",
        city: data.city || "",
      },
      showAddress: true,
      baseRent: data.cold_rent || 0,
      totalRent: data.warm_rent || 0,
      serviceCharge: (data.warm_rent as number || 0) - (data.cold_rent as number || 0),
      deposit: data.deposit || "",
      livingSpace: data.area_sqm || 0,
      numberOfRooms: data.rooms || 1,
      yearConstructed: data.year_built || null,
      descriptionNote: data.description || "",
      petsAllowed: data.pets_allowed === true ? "YES" : data.pets_allowed === false ? "NO" : "NEGOTIABLE",
      courtage: {
        hasCourtage: "NO",
      },
    },
  };
}

function buildHouseRentPayload(data: Record<string, unknown>): Record<string, unknown> {
  return {
    "realestates.houseRent": {
      externalId: data.external_id || `sot-rental-${data.rental_listing_id}`,
      title: data.title || "Miethaus",
      address: {
        street: data.street || "",
        houseNumber: data.house_number || "",
        postcode: data.postal_code || "",
        city: data.city || "",
      },
      showAddress: true,
      baseRent: data.cold_rent || 0,
      totalRent: data.warm_rent || 0,
      serviceCharge: (data.warm_rent as number || 0) - (data.cold_rent as number || 0),
      deposit: data.deposit || "",
      livingSpace: data.area_sqm || 0,
      numberOfRooms: data.rooms || 1,
      yearConstructed: data.year_built || null,
      descriptionNote: data.description || "",
      petsAllowed: data.pets_allowed === true ? "YES" : data.pets_allowed === false ? "NO" : "NEGOTIABLE",
      courtage: {
        hasCourtage: "NO",
      },
    },
  };
}

function buildPayload(objectType: string, data: Record<string, unknown>): Record<string, unknown> {
  switch (objectType) {
    case "ApartmentBuy": return buildApartmentBuyPayload(data);
    case "HouseBuy": return buildHouseBuyPayload(data);
    case "ApartmentRent": return buildApartmentRentPayload(data);
    case "HouseRent": return buildHouseRentPayload(data);
    default: return buildApartmentBuyPayload(data);
  }
}

// ── Credit Preflight ──

async function checkAndChargeCredits(
  supabaseAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  actionCode: string,
  credits: number
): Promise<{ ok: boolean; balance?: number; error?: string }> {
  // Check balance
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("credit_balance")
    .eq("id", tenantId)
    .single();

  if (!org || (org.credit_balance || 0) < credits) {
    return { ok: false, balance: org?.credit_balance || 0, error: `Nicht genügend Credits (benötigt: ${credits}, verfügbar: ${org?.credit_balance || 0})` };
  }

  // Deduct credits
  const { error: deductError } = await supabaseAdmin.rpc("rpc_credit_deduct", {
    p_org_id: tenantId,
    p_amount: credits,
    p_reason: `IS24 ${actionCode}`,
    p_actor_id: userId,
  });

  if (deductError) {
    // Fallback: direct update
    const { error: updateError } = await supabaseAdmin
      .from("organizations")
      .update({ credit_balance: (org.credit_balance || 0) - credits })
      .eq("id", tenantId);

    if (updateError) {
      return { ok: false, error: "Credit-Abzug fehlgeschlagen" };
    }
  }

  // Log billing event
  await supabaseAdmin.from("armstrong_billing_events").insert({
    org_id: tenantId,
    action_code: `is24_${actionCode}`,
    credits_charged: credits,
    cost_model: "per_action",
  });

  return { ok: true, balance: (org.credit_balance || 0) - credits };
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const consumerKey = Deno.env.get("IS24_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("IS24_CONSUMER_SECRET");

    if (!consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ error: "IS24 credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", userId)
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
    const action = body.action as string;

    // ── CREATE LISTING on IS24 ──
    if (action === "create_listing") {
      const {
        listing_id,
        rental_listing_id,
        object_type = "ApartmentBuy",
        data: listingData,
      } = body;

      // Credit preflight
      const creditResult = await checkAndChargeCredits(
        supabaseAdmin, tenantId, userId, "create_listing", CREDIT_COST_PUBLISH
      );
      if (!creditResult.ok) {
        return new Response(
          JSON.stringify({ error: creditResult.error, balance: creditResult.balance }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build IS24 payload
      const payload = buildPayload(object_type, {
        ...listingData,
        listing_id,
        rental_listing_id,
      });

      // Sign and send to IS24
      const is24Url = `${IS24_SANDBOX_BASE}/offer/v1.0/user/me/realestate`;
      const authHeaderValue = await signRequest("POST", is24Url, consumerKey, consumerSecret);

      const is24Response = await fetch(is24Url, {
        method: "POST",
        headers: {
          Authorization: authHeaderValue,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const is24Body = await is24Response.text();
      let is24Id: string | null = null;

      if (is24Response.ok) {
        // Parse IS24 response for the created ID
        try {
          const parsed = JSON.parse(is24Body);
          // IS24 returns message with id in various formats
          is24Id = parsed?.["common.messages"]?.[0]?.message?.match(/id \[(\d+)\]/)?.[1]
            || parsed?.id
            || parsed?.realEstateId
            || null;
        } catch {
          // Try regex from text response
          const match = is24Body.match(/id["\s:[\]]*(\d+)/);
          is24Id = match?.[1] || null;
        }
      }

      // Store publication record
      const publicationTable = rental_listing_id ? "rental_publications" : "listing_publications";
      const foreignKey = rental_listing_id
        ? { rental_listing_id }
        : { listing_id };

      const pubData = {
        ...foreignKey,
        tenant_id: tenantId,
        channel: "scout24",
        status: is24Response.ok ? "active" : "error",
        published_at: is24Response.ok ? new Date().toISOString() : null,
        external_id: is24Id,
        metadata: {
          is24_status: is24Response.status,
          is24_response: is24Body.substring(0, 500),
          object_type,
        },
      };

      await supabaseAdmin.from(publicationTable).upsert(pubData, {
        onConflict: rental_listing_id ? "rental_listing_id,channel" : "listing_id,channel",
      });

      // Log activity
      if (listing_id) {
        await supabaseAdmin.from("listing_activities").insert({
          tenant_id: tenantId,
          listing_id,
          activity_type: "listing.is24_published",
          description: is24Response.ok
            ? `Auf ImmobilienScout24 veröffentlicht (ID: ${is24Id})`
            : `IS24-Veröffentlichung fehlgeschlagen (HTTP ${is24Response.status})`,
          performed_by: userId,
          metadata: { is24_id: is24Id, object_type, status: is24Response.status },
        });
      }

      // Audit event
      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: userId,
        target_org_id: tenantId,
        event_type: "is24.listing_created",
        payload: {
          listing_id,
          rental_listing_id,
          is24_id: is24Id,
          object_type,
          is24_status: is24Response.status,
          credits_charged: CREDIT_COST_PUBLISH,
        },
      });

      // DSGVO Ledger
      await logDataEvent(supabaseAdmin, {
        tenant_id: tenantId,
        zone: "Z1",
        actor_user_id: userId,
        event_type: "is24.listing_created",
        direction: "egress",
        source: "sot-is24-gateway",
        entity_type: rental_listing_id ? "rental_listing" : "listing",
        entity_id: rental_listing_id || listing_id,
        payload: { is24_id: is24Id, object_type },
      }, req);

      if (!is24Response.ok) {
        return new Response(
          JSON.stringify({
            error: "IS24 API Fehler",
            is24_status: is24Response.status,
            is24_body: is24Body.substring(0, 500),
            credits_charged: CREDIT_COST_PUBLISH,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          is24_id: is24Id,
          credits_charged: CREDIT_COST_PUBLISH,
          remaining_balance: creditResult.balance,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE LISTING on IS24 ──
    if (action === "update_listing") {
      const { is24_id, object_type = "ApartmentBuy", data: listingData } = body;

      if (!is24_id) {
        return new Response(
          JSON.stringify({ error: "is24_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = buildPayload(object_type, listingData || {});
      const is24Url = `${IS24_SANDBOX_BASE}/offer/v1.0/user/me/realestate/${is24_id}`;
      const authHeaderValue = await signRequest("PUT", is24Url, consumerKey, consumerSecret);

      const is24Response = await fetch(is24Url, {
        method: "PUT",
        headers: {
          Authorization: authHeaderValue,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const is24Body = await is24Response.text();

      return new Response(
        JSON.stringify({
          success: is24Response.ok,
          is24_status: is24Response.status,
          message: is24Response.ok ? "Listing aktualisiert" : is24Body.substring(0, 500),
        }),
        { status: is24Response.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── DEACTIVATE LISTING on IS24 ──
    if (action === "deactivate_listing") {
      const { is24_id, listing_id, rental_listing_id } = body;

      if (!is24_id) {
        return new Response(
          JSON.stringify({ error: "is24_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const is24Url = `${IS24_SANDBOX_BASE}/offer/v1.0/user/me/realestate/${is24_id}`;
      const authHeaderValue = await signRequest("DELETE", is24Url, consumerKey, consumerSecret);

      const is24Response = await fetch(is24Url, {
        method: "DELETE",
        headers: {
          Authorization: authHeaderValue,
          Accept: "application/json",
        },
      });

      const is24Body = await is24Response.text();

      // Update publication status
      const publicationTable = rental_listing_id ? "rental_publications" : "listing_publications";
      const foreignKey = rental_listing_id
        ? { rental_listing_id }
        : { listing_id };

      if (listing_id || rental_listing_id) {
        await supabaseAdmin
          .from(publicationTable)
          .update({ status: "deactivated", removed_at: new Date().toISOString() })
          .match({ ...foreignKey, channel: "scout24" });
      }

      return new Response(
        JSON.stringify({
          success: is24Response.ok,
          is24_status: is24Response.status,
          message: is24Response.ok ? "Listing deaktiviert" : is24Body.substring(0, 500),
        }),
        { status: is24Response.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET LISTING from IS24 ──
    if (action === "get_listing") {
      const { is24_id } = body;

      if (!is24_id) {
        return new Response(
          JSON.stringify({ error: "is24_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const is24Url = `${IS24_SANDBOX_BASE}/offer/v1.0/user/me/realestate/${is24_id}`;
      const authHeaderValue = await signRequest("GET", is24Url, consumerKey, consumerSecret);

      const is24Response = await fetch(is24Url, {
        method: "GET",
        headers: {
          Authorization: authHeaderValue,
          Accept: "application/json",
        },
      });

      const is24Body = await is24Response.text();

      return new Response(
        is24Body,
        { status: is24Response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sot-is24-gateway error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
