/**
 * SOT-ACQ-AI-RESEARCH
 * 
 * AI-powered property research: Location analysis, market data, risk assessment
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

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { offerId, mandateId } = await req.json();

    // Get offer details
    const { data: offer, error: offerError } = await supabase
      .from('acq_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      throw new Error('Offer not found');
    }

    // Create analysis run
    const { data: run } = await supabase
      .from('acq_analysis_runs')
      .insert([{
        offer_id: offerId,
        mandate_id: mandateId,
        run_type: 'ai_research',
        status: 'running',
        input_data: {
          title: offer.title,
          address: offer.address,
          city: offer.city,
          postal_code: offer.postal_code,
          price: offer.price_asking,
          units: offer.units_count,
          area: offer.area_sqm,
          year_built: offer.year_built,
        },
        started_at: new Date().toISOString(),
      }])
      .select()
      .single();

    // Update offer status
    await supabase
      .from('acq_offers')
      .update({ status: 'analyzing' })
      .eq('id', offerId);

    // ========================================
    // AI Research Prompt
    // ========================================
    const researchPrompt = `
Du bist ein erfahrener Immobilien-Analyst. Analysiere folgendes Objekt:

**Objektdaten:**
- Titel: ${offer.title || 'Nicht angegeben'}
- Adresse: ${offer.address || 'Nicht angegeben'}
- PLZ/Ort: ${offer.postal_code || ''} ${offer.city || ''}
- Kaufpreis: ${offer.price_asking ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(offer.price_asking) : 'Nicht angegeben'}
- Einheiten: ${offer.units_count || 'Nicht angegeben'}
- Fläche: ${offer.area_sqm ? `${offer.area_sqm} m²` : 'Nicht angegeben'}
- Baujahr: ${offer.year_built || 'Nicht angegeben'}
- Angezeigte Rendite: ${offer.yield_indicated ? `${offer.yield_indicated}%` : 'Nicht angegeben'}

Erstelle eine umfassende Analyse mit folgenden Punkten:

1. **Standortbewertung** (1-10 Punkte mit Begründung)
   - Makrolage (Region, Wirtschaft, Demografie)
   - Mikrolage (Infrastruktur, Anbindung, Umfeld)
   
2. **Markteinschätzung**
   - Mietpreisniveau im Vergleich
   - Kaufpreisniveau im Vergleich
   - Markttrend (steigend/stabil/fallend)
   
3. **Risikobewertung**
   - Hauptrisiken identifizieren
   - Risiko-Score (1-10, 1=niedrig)
   
4. **Investment-Empfehlung**
   - Geeignet für: Bestand / Aufteilung / Beides
   - Stärken
   - Schwächen
   - Handlungsempfehlung

Antworte NUR mit einem JSON-Objekt (keine Markdown-Formatierung):
{
  "location_score": 7,
  "location_analysis": {
    "macro": "Beschreibung Makrolage",
    "micro": "Beschreibung Mikrolage"
  },
  "market_assessment": {
    "rent_level": "überdurchschnittlich|durchschnittlich|unterdurchschnittlich",
    "price_level": "überdurchschnittlich|durchschnittlich|unterdurchschnittlich",
    "trend": "steigend|stabil|fallend"
  },
  "risk_score": 4,
  "risks": ["Risiko 1", "Risiko 2"],
  "recommendation": {
    "strategy": "bestand|aufteilung|beides",
    "strengths": ["Stärke 1", "Stärke 2"],
    "weaknesses": ["Schwäche 1", "Schwäche 2"],
    "action": "Konkrete Handlungsempfehlung"
  },
  "summary": "Kurze Zusammenfassung in 2-3 Sätzen"
}
`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let analysisResult: Record<string, unknown> = {};

    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        analysisResult = {
          raw_response: content,
          parse_error: true,
        };
      }
    }

    // Update analysis run
    await supabase
      .from('acq_analysis_runs')
      .update({
        status: 'completed',
        output_data: analysisResult,
        model_used: 'google/gemini-2.5-pro',
        tokens_used: aiData.usage?.total_tokens,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run?.id);

    // Update offer with analysis summary
    await supabase
      .from('acq_offers')
      .update({
        status: 'analyzed',
        analysis_summary: analysisResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    // Log audit event
    await supabase.from('acq_mandate_events').insert([{
      mandate_id: mandateId,
      event_type: 'offer_analyzed',
      payload: {
        offer_id: offerId,
        analysis_type: 'ai_research',
        location_score: analysisResult.location_score,
        risk_score: analysisResult.risk_score,
      },
    }]);

    console.log('AI Research complete:', { offerId, locationScore: analysisResult.location_score });

    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-acq-ai-research:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
