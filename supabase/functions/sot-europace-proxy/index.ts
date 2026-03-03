/**
 * sot-europace-proxy — Central proxy for all Europace API calls
 * 
 * Actions:
 *   request-vorschlaege  → POST baufinanzierung.api.europace.de/v1/vorschlaege
 *   poll-vorschlaege      → GET  baufinanzierung.api.europace.de/v1/vorschlaege/{anfrageId}
 *   bookmark-vorschlag    → POST baufinanzierung.api.europace.de/vorschlag/bookmark
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EUROPACE_TOKEN_URL = "https://api.europace.de/auth/token";
const EUROPACE_VORSCHLAEGE_BASE = "https://baufinanzierung.api.europace.de/v1/vorschlaege";
const EUROPACE_BOOKMARK_URL = "https://baufinanzierung.api.europace.de/vorschlag/bookmark";

/** Fetch an OAuth2 access token using Client Credentials + Impersonation */
async function getEuropaceToken(): Promise<string> {
  const clientId = Deno.env.get("EUROPACE_CLIENT_ID");
  const clientSecret = Deno.env.get("EUROPACE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("EUROPACE_CLIENT_ID or EUROPACE_CLIENT_SECRET not configured");
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    subject: "YFC80",
    actor: "BUU82",
    scope: "impersonieren baufinanzierung:angebote:ermitteln baufinanzierung:vorgaenge:schreiben",
  });

  const res = await fetch(EUROPACE_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Europace token error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth check: require logged-in user ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }

    // ── Parse action ──
    const { action, ...params } = await req.json();

    // Get Europace token
    const accessToken = await getEuropaceToken();

    // ── ACTION: request-vorschlaege ──
    if (action === "request-vorschlaege") {
      const { caseData } = params;
      if (!caseData) return json({ error: "caseData required" }, 400);

      const applicant = caseData.applicant || {};
      const property = caseData.property || {};

      // Map SOT case data → Europace schema
      const europacePayload = {
        metadaten: {
          datenkontext: "TEST_MODUS",
          extKundenId: caseData.caseId || "",
          extClientId: "",
          gewuenschteAnzahlVorschlaege: 3,
        },
        kundenangaben: {
          haushalte: [
            {
              kunden: [
                {
                  einkommenNetto: applicant.net_income_monthly || null,
                  geburtsdatum: applicant.birth_date || null,
                  beschaeftigungsArt: applicant.employment_type === "self_employed"
                    ? "SELBSTSTAENDIGER"
                    : "ANGESTELLTER",
                  beschaeftigtSeit: applicant.employed_since || null,
                  arbeitBefristet: applicant.contract_type === "befristet" ? true : false,
                },
              ],
              finanzielleSituation: {
                eigenKapital: applicant.equity_amount || 0,
                sonstigeEinnahmen: applicant.other_regular_income_monthly || 0,
                nichtAbgeloesteRatenkrediteRestschuld: 0,
              },
            },
          ],
          finanzierungsbedarf: {
            finanzierungszweck: "KAUF",
            kaufpreis: property.purchase_price || applicant.purchase_price || 0,
            praeferenzen: {
              rate: applicant.max_monthly_rate || null,
            },
          },
          finanzierungsobjekt: {
            objektArt: mapObjectType(property.object_type || applicant.object_type),
            vermietet: false,
            anschrift: {
              plz: property.postal_code || applicant.address_postal_code || "",
              ort: property.city || applicant.address_city || "",
            },
          },
        },
      };

      const epRes = await fetch(EUROPACE_VORSCHLAEGE_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(europacePayload),
      });

      const epData = await epRes.json();
      return json(epData, epRes.status);
    }

    // ── ACTION: poll-vorschlaege ──
    if (action === "poll-vorschlaege") {
      const { anfrageId } = params;
      if (!anfrageId) return json({ error: "anfrageId required" }, 400);

      const epRes = await fetch(`${EUROPACE_VORSCHLAEGE_BASE}/${anfrageId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // 202 = still processing, 200 = done
      if (epRes.status === 202) {
        return json({ status: "pending" }, 202);
      }

      const epData = await epRes.json();
      return json(epData, epRes.status);
    }

    // ── ACTION: bookmark-vorschlag ──
    if (action === "bookmark-vorschlag") {
      const { anfrageId, finanzierungsVorschlagId, vorgangId } = params;
      if (!anfrageId || !finanzierungsVorschlagId || !vorgangId) {
        return json({ error: "anfrageId, finanzierungsVorschlagId, vorgangId required" }, 400);
      }

      const epRes = await fetch(EUROPACE_BOOKMARK_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anfrageId,
          finanzierungsVorschlagId,
          vorgangId,
          directImport: true,
        }),
      });

      const epData = await epRes.json();
      return json(epData, epRes.status);
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("[sot-europace-proxy] Error:", err);
    return json({ error: err.message || "Internal error" }, 500);
  }
});

/** Map SOT object types → Europace enum */
function mapObjectType(type?: string): string {
  if (!type) return "EINFAMILIENHAUS";
  const t = type.toLowerCase();
  if (t.includes("wohnung") || t.includes("etw")) return "EIGENTUMSWOHNUNG";
  if (t.includes("mehrfamilien") || t.includes("mfh")) return "MEHRFAMILIENHAUS";
  if (t.includes("doppelhaus")) return "DOPPELHAUSHAELFTE";
  if (t.includes("reihen")) return "REIHENHAUS";
  if (t.includes("zweifamilien")) return "ZWEIFAMILIENHAUS";
  return "EINFAMILIENHAUS";
}
