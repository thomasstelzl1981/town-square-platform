import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { lat, lon, peakpower, loss, angle, aspect, pvtechchoice, address } = body;

    // Geocode address if lat/lon not provided
    if ((!lat || !lon) && address) {
      const gKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
      if (!gKey) {
        return new Response(
          JSON.stringify({ error: "Kein Google Maps Key konfiguriert und keine Koordinaten angegeben." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${gKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData.status !== "OK" || !geoData.results?.length) {
        return new Response(
          JSON.stringify({ error: "Adresse konnte nicht geocodiert werden.", detail: geoData.status }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      lat = geoData.results[0].geometry.location.lat;
      lon = geoData.results[0].geometry.location.lng;
    }

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "lat/lon oder address erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build PVGIS URL
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      peakpower: String(peakpower ?? 10),
      loss: String(loss ?? 14),
      angle: String(angle ?? 35),
      aspect: String(aspect ?? 0),
      outputformat: "json",
    });
    if (pvtechchoice) params.set("pvtechchoice", pvtechchoice);

    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?${params.toString()}`;
    console.log("PVGIS request:", pvgisUrl);

    const pvRes = await fetch(pvgisUrl);
    if (!pvRes.ok) {
      const errText = await pvRes.text();
      return new Response(
        JSON.stringify({ error: "PVGIS API Fehler", detail: errText, status: pvRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pvData = await pvRes.json();

    // Extract monthly and totals
    const monthly = pvData?.outputs?.monthly?.fixed ?? [];
    const totals = pvData?.outputs?.totals?.fixed ?? {};
    const optAngle = pvData?.inputs?.mounting_system?.fixed?.slope?.optimal ?? null;

    const result = {
      lat,
      lon,
      monthly: monthly.map((m: any) => ({
        month: m.month,
        E_d: m.E_d,
        E_m: m.E_m,
        H_i_d: m["H(i)_d"],
        H_i_m: m["H(i)_m"],
        SD_m: m.SD_m,
      })),
      totals: {
        E_d: totals.E_d,
        E_m: totals.E_m,
        E_y: totals.E_y,
        H_i_d: totals["H(i)_d"],
        H_i_m: totals["H(i)_m"],
        H_i_y: totals["H(i)_y"],
      },
      optimal_angle: optAngle,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pvgis-proxy error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
