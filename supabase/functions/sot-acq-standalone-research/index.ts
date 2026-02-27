/**
 * SOT-ACQ-STANDALONE-RESEARCH
 * 
 * Standalone AI research for MOD-12 Tools page.
 * Returns structured location, market, risk, and recommendation data.
 * 
 * Uses Lovable AI (Gemini) for analysis.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ResearchRequest {
  query: string;
  mode?: 'ai' | 'geomap' | 'both';
}

interface StructuredResearchResult {
  query: string;
  timestamp: string;
  location?: {
    score: number;
    macroLocation: string;
    microLocation: string;
    infrastructure: string[];
    publicTransport: string[];
  };
  market?: {
    avgRentPerSqm: number;
    avgPricePerSqm: number;
    vacancyRate: number;
    trend: 'rising' | 'stable' | 'falling';
    trendDescription: string;
  };
  risks?: {
    score: number;
    floodZone: boolean;
    noiseLevel: 'low' | 'medium' | 'high';
    economicDependency: string;
    factors: string[];
  };
  recommendation?: {
    strategies: string[];
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mode = 'ai' }: ResearchRequest = await req.json();

    if (!query || query.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Query zu kurz (min. 5 Zeichen)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[standalone-research] Query: ${query}, Mode: ${mode}`);

    // Use Lovable AI for structured analysis
    const analysisPrompt = `Du bist ein Immobilien-Analyst für den deutschen Markt. Analysiere die folgende Immobilie oder Standort und liefere eine strukturierte Bewertung.

EINGABE: ${query}

Liefere deine Analyse im folgenden JSON-Format. Erfinde realistische Werte basierend auf deinem Wissen über den deutschen Immobilienmarkt:

{
  "location": {
    "score": <1-10>,
    "macroLocation": "<Beschreibung der Region/Stadt>",
    "microLocation": "<Beschreibung der unmittelbaren Umgebung>",
    "infrastructure": ["<Stärke 1>", "<Stärke 2>", ...],
    "publicTransport": ["<ÖPNV-Anbindung 1>", ...]
  },
  "market": {
    "avgRentPerSqm": <Euro/m²>,
    "avgPricePerSqm": <Euro/m²>,
    "vacancyRate": <0-100 Prozent>,
    "trend": "rising" | "stable" | "falling",
    "trendDescription": "<Kurze Trendbeschreibung>"
  },
  "risks": {
    "score": <1-10, wobei 1 = sehr riskant, 10 = sehr sicher>,
    "floodZone": true/false,
    "noiseLevel": "low" | "medium" | "high",
    "economicDependency": "<Beschreibung der wirtschaftlichen Abhängigkeit>",
    "factors": ["<Risikofaktor 1>", ...]
  },
  "recommendation": {
    "strategies": ["Bestand", "Aufteilung", ...],
    "strengths": ["<Stärke 1>", "<Stärke 2>", ...],
    "weaknesses": ["<Schwäche 1>", "<Schwäche 2>", ...],
    "summary": "<Zusammenfassende Empfehlung in 2-3 Sätzen>"
  }
}

Antworte NUR mit dem JSON, ohne Erklärungen oder Markdown-Formatierung.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let result: StructuredResearchResult;

    if (LOVABLE_API_KEY) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: 'Du bist ein deutscher Immobilien-Analyst. Antworte immer auf Deutsch und nur mit validem JSON.' },
            { role: 'user', content: analysisPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          query,
          timestamp: new Date().toISOString(),
          ...parsed,
        };
      } else {
        throw new Error('Keine valide JSON-Antwort vom AI');
      }
    } else {
      // Fallback: Generate mock data for demo
      console.log('[standalone-research] No OPENROUTER_API_KEY, using mock data');
      result = generateMockResult(query);
    }

    console.log('[standalone-research] Analysis complete');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[standalone-research] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Research fehlgeschlagen' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMockResult(query: string): StructuredResearchResult {
  // Extract city from query if possible
  const cityMatch = query.match(/Berlin|München|Hamburg|Frankfurt|Köln|Düsseldorf|Stuttgart/i);
  const city = cityMatch ? cityMatch[0] : 'Berlin';

  return {
    query,
    timestamp: new Date().toISOString(),
    location: {
      score: 7,
      macroLocation: `${city} ist einer der wichtigsten Immobilienmärkte Deutschlands mit stabiler Nachfrage und guter Wirtschaftslage.`,
      microLocation: 'Gute Wohnlage mit gemischter Bebauung, Nahversorgung fußläufig erreichbar.',
      infrastructure: ['Schulen in der Nähe', 'Einkaufsmöglichkeiten', 'Ärzte und Apotheken'],
      publicTransport: ['U-Bahn (5 min)', 'S-Bahn (10 min)', 'Bus direkt vor der Tür'],
    },
    market: {
      avgRentPerSqm: 12.50,
      avgPricePerSqm: 4200,
      vacancyRate: 1.2,
      trend: 'rising',
      trendDescription: 'Moderate Preissteigerungen erwartet, stabile Mietentwicklung.',
    },
    risks: {
      score: 7,
      floodZone: false,
      noiseLevel: 'medium',
      economicDependency: 'Diversifizierte Wirtschaftsstruktur mit geringer Abhängigkeit von Einzelunternehmen.',
      factors: ['Mietpreisbremse aktiv', 'Politische Regulierung möglich'],
    },
    recommendation: {
      strategies: ['Bestand', 'Aufteilung'],
      strengths: ['Zentrale Lage', 'Gute Verkehrsanbindung', 'Stabile Nachfrage'],
      weaknesses: ['Hohe Einstiegspreise', 'Mietpreisbremse begrenzt Mietsteigerungen'],
      summary: `Das Objekt in ${city} eignet sich sowohl für eine Bestandsstrategie als auch für eine Aufteilung. Die zentrale Lage und gute Anbindung sprechen für eine langfristige Wertsteigerung.`,
    },
  };
}
