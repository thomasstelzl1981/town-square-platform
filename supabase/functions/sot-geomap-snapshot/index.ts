/**
 * SOT-GEOMAP-SNAPSHOT
 * 
 * GeoMap integration for location-based KPIs and market data
 * Uses AI to generate location insights when external API not available
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GEOMAP_API_KEY = Deno.env.get('GEOMAP_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { offerId, address } = await req.json();

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

    let geomapData: Record<string, unknown> = {};

    // ========================================
    // Try GeoMap API if configured
    // ========================================
    if (GEOMAP_API_KEY) {
      try {
        // Note: Replace with actual GeoMap API endpoint
        const geoResponse = await fetch(`https://api.geomap.example/v1/location-data`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GEOMAP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address,
            postal_code: offer?.postal_code,
            city: offer?.city,
          }),
        });

        if (geoResponse.ok) {
          geomapData = await geoResponse.json();
        }
      } catch (geoError) {
        console.log('GeoMap API not available, using AI fallback');
      }
    }

    // ========================================
    // AI Fallback for GeoMap Data
    // ========================================
    if (Object.keys(geomapData).length === 0 && LOVABLE_API_KEY) {
      const geoPrompt = `
Du bist ein deutscher Immobilienmarkt-Experte. Analysiere den folgenden Standort:

Adresse: ${address}
PLZ: ${offer?.postal_code || 'unbekannt'}
Stadt: ${offer?.city || 'unbekannt'}

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
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: geoPrompt,
            },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (content) {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              geomapData = JSON.parse(jsonMatch[0]);
              geomapData.source = 'ai_estimation';
              geomapData.generated_at = new Date().toISOString();
            }
          } catch (parseError) {
            console.error('Failed to parse GeoMap AI response');
          }
        }
      }
    }

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
