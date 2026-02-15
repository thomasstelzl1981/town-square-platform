const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    let { latitude, longitude } = body;
    const { address } = body;

    // Geocode address if no coordinates provided
    if ((!latitude || !longitude) && address) {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.status !== "OK" || !geoData.results?.[0]) {
        return new Response(JSON.stringify({ error: "Geocoding failed", detail: geoData.status }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      latitude = geoData.results[0].geometry.location.lat;
      longitude = geoData.results[0].geometry.location.lng;
    }

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: "latitude/longitude or address required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Google Solar API
    const solarUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=HIGH&key=${GOOGLE_API_KEY}`;
    const solarRes = await fetch(solarUrl);
    const solarData = await solarRes.json();

    if (solarData.error) {
      return new Response(JSON.stringify({
        error: "Google Solar API error",
        detail: solarData.error.message || solarData.error.status,
        hint: "Stellen Sie sicher, dass die Solar API in Ihrem Google Cloud Projekt aktiviert ist.",
      }), {
        status: solarData.error.code || 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract key insights
    const panel = solarData.solarPotential;
    const result = {
      latitude,
      longitude,
      maxSunshineHoursPerYear: panel?.maxSunshineHoursPerYear ?? null,
      maxArrayPanelsCount: panel?.maxArrayPanelsCount ?? null,
      maxArrayAreaMeters2: panel?.maxArrayAreaMeters2 ?? null,
      yearlyEnergyDcKwh: panel?.solarPanelConfigs?.[panel.solarPanelConfigs.length - 1]?.yearlyEnergyDcKwh ?? null,
      carbonOffsetFactorKgPerMwh: panel?.carbonOffsetFactorKgPerMwh ?? null,
      roofSegments: panel?.roofSegmentStats?.length ?? 0,
      imageryDate: solarData.imageryDate ?? null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
