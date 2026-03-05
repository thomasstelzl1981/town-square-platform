/**
 * SOT-GEOMAP-SNAPSHOT
 * 
 * GeoMap integration for location-based KPIs and market data
 * Supports two modes:
 *   1. Standard: offerId → reads from acq_offers, creates analysis run, updates DB
 *   2. Standalone: standalone=true + address → no DB operations, returns AI analysis directly
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function runGeoMapAI(address: string, postalCode: string, city: string, apiKey: string): Promise<Record<string, unknown>> {
  const geoPrompt = `
Du bist ein deutscher Immobilienmarkt-Experte. Analysiere den folgenden Standort:

Adresse: ${address}
PLZ: ${postalCode || 'unbekannt'}
Stadt: ${city || 'unbekannt'}

Erstelle eine detaillierte Standortanalyse mit realistischen Schätzwerten.
Antworte NUR mit einem JSON-Objekt:

{
  "location": {
    "latitude": null,
    "longitude": null,
    "district": "Stadtteil/Bezirk",
    "region": "Region/Bundesland"
  },
  "demographics": {
    "population": "Einwohnerzahl der Stadt/Gemeinde",
    "population_trend": "wachsend|stabil|schrumpfend",
    "average_age": "Durchschnittsalter",
    "household_income": "Durchschnittseinkommen"
  },
  "infrastructure": {
    "public_transport_score": 1-10,
    "schools_nearby": "Anzahl im Umkreis 2km",
    "shopping_score": 1-10,
    "healthcare_score": 1-10
  },
  "real_estate_market": {
    "avg_rent_sqm": "Durchschnittsmiete €/m²",
    "avg_price_sqm": "Durchschnittspreis €/m²",
    "vacancy_rate": "Leerstandsquote %",
    "market_trend": "steigend|stabil|fallend",
    "price_development_5y": "Preisentwicklung letzte 5 Jahre %"
  },
  "risk_factors": {
    "flood_zone": false,
    "noise_level": "niedrig|mittel|hoch",
    "air_quality": "gut|mittel|schlecht",
    "economic_dependency": "Beschreibung der wirtschaftlichen Abhängigkeiten"
  },
  "investment_rating": {
    "overall_score": 1-10,
    "rental_potential": 1-10,
    "appreciation_potential": 1-10,
    "summary": "Kurze Zusammenfassung"
  }
}
`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 4000,
      messages: [{ role: 'user', content: geoPrompt }],
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI API error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content;

  if (content) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsed.source = 'ai_estimation';
      parsed.generated_at = new Date().toISOString();
      return parsed;
    }
  }

  return {};
}

// Map raw AI data to the flat GeoMapResult shape the frontend expects
function mapToGeoMapResult(raw: Record<string, unknown>): Record<string, unknown> {
  const re = (raw.real_estate_market || {}) as any;
  const infra = (raw.infrastructure || {}) as any;
  const risk = (raw.risk_factors || {}) as any;
  const invest = (raw.investment_rating || {}) as any;
  const demo = (raw.demographics || {}) as any;
  const loc = (raw.location || {}) as any;

  return {
    // Flat fields expected by useStandaloneGeoMap / GeoMapResult type
    location_score: invest.overall_score || 5,
    avg_rent_sqm: parseFloat(re.avg_rent_sqm) || 0,
    avg_price_sqm: parseFloat(re.avg_price_sqm) || 0,
    vacancy_rate: parseFloat(re.vacancy_rate) || 0,
    population_density: parseInt(demo.population) || 0,
    infrastructure_score: Math.round(
      ((infra.public_transport_score || 5) + (infra.shopping_score || 5) + (infra.healthcare_score || 5)) / 3
    ),
    flood_zone: risk.flood_zone || false,
    noise_level: risk.noise_level || 'niedrig',
    poi_summary: [
      loc.district && `Bezirk: ${loc.district}`,
      loc.region && `Region: ${loc.region}`,
      re.market_trend && `Markttrend: ${re.market_trend}`,
      invest.summary,
    ].filter(Boolean),
    // Keep full nested data for detailed views
    ...raw,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body = await req.json();
    const { offerId, address, standalone } = body;

    // ══════════════════════════════════════════════════════════════
    // STANDALONE MODE — no DB operations
    // ══════════════════════════════════════════════════════════════
    if (standalone === true) {
      if (!address) {
        throw new Error('standalone mode requires address');
      }

      // Extract postal code and city from address string
      const plzMatch = address.match(/\b(\d{5})\b/);
      const postalCode = plzMatch ? plzMatch[1] : '';
      // Simple heuristic: city is the word after the postal code
      const cityMatch = address.match(/\d{5}\s+([A-Za-zÄÖÜäöüß\s-]+)/);
      const city = cityMatch ? cityMatch[1].trim() : '';

      console.log(`GeoMap standalone: address="${address}", plz=${postalCode}, city=${city}`);

      const rawData = await runGeoMapAI(address, postalCode, city, LOVABLE_API_KEY);
      const mappedData = mapToGeoMapResult(rawData);

      console.log('GeoMap standalone complete:', { address, hasData: Object.keys(rawData).length > 0 });

      return new Response(
        JSON.stringify({ success: true, data: mappedData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ══════════════════════════════════════════════════════════════
    // STANDARD MODE — offerId required, DB operations
    // ══════════════════════════════════════════════════════════════
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get offer
    const { data: offer } = await supabase
      .from('acq_offers')
      .select('mandate_id, postal_code, city')
      .eq('id', offerId)
      .single();

    // Create analysis run
    const { data: run } = await supabase
      .from('acq_analysis_runs')
      .insert([{
        offer_id: offerId,
        mandate_id: offer?.mandate_id,
        run_type: 'geomap',
        status: 'running',
        input_data: { 
          address, 
          postal_code: offer?.postal_code, 
          city: offer?.city 
        },
        started_at: new Date().toISOString(),
      }])
      .select()
      .single();

    const rawData = await runGeoMapAI(
      address || '',
      offer?.postal_code || '',
      offer?.city || '',
      LOVABLE_API_KEY
    );
    const geomapData = mapToGeoMapResult(rawData);

    // Update analysis run
    await supabase
      .from('acq_analysis_runs')
      .update({
        status: 'completed',
        output_data: geomapData,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run?.id);

    // Update offer with geomap data
    await supabase
      .from('acq_offers')
      .update({
        geomap_data: geomapData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    console.log('GeoMap snapshot complete:', { offerId, hasData: Object.keys(geomapData).length > 0 });

    return new Response(
      JSON.stringify({ success: true, data: geomapData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-geomap-snapshot:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
