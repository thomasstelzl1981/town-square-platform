import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, offerId, reason, proposedPrice, currentPrice, requestedDocuments, createDataRoom, customMessage } = await req.json();

    console.log('Generating response:', { type, offerId, reason });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = `Du bist ein professioneller Immobilien-Akquisemanager. Schreibe eine höfliche und professionelle E-Mail auf Deutsch.
    
Die E-Mail sollte:
- Kurz und prägnant sein (max. 150 Wörter)
- Höflich aber direkt
- Professionellen Ton haben
- Mit "Sehr geehrte Damen und Herren," beginnen
- Mit "Mit freundlichen Grüßen" enden (ohne Namen, da dieser vom System hinzugefügt wird)`;

    let userPrompt = '';

    switch (type) {
      case 'rejection':
        const reasonTexts: Record<string, string> = {
          'price_too_high': 'Der Kaufpreis liegt über unserem Budget',
          'location_not_matching': 'Die Lage entspricht nicht unseren Suchkriterien',
          'object_type_not_matching': 'Der Objekttyp passt nicht zu unserem Ankaufsprofil',
          'yield_too_low': 'Die Rendite liegt unter unseren Mindestanforderungen',
          'condition_too_bad': 'Der Zustand des Objekts erfordert zu hohe Investitionen',
          'no_capacity': 'Wir haben aktuell keine Kapazitäten für neue Objekte',
          'other': customMessage || 'Das Objekt entspricht nicht unseren aktuellen Anforderungen',
        };
        
        userPrompt = `Schreibe eine Absage-E-Mail für ein Immobilienangebot.
        
Absagegrund: ${reasonTexts[reason] || reason}
${customMessage ? `Zusätzliche Anmerkung: ${customMessage}` : ''}

Die E-Mail sollte den Anbieter wertschätzend behandeln und die Tür für zukünftige Angebote offen lassen.`;
        break;

      case 'price_proposal':
        const docLabels: Record<string, string> = {
          'mietliste': 'Mietliste mit IST-Mieten',
          'flurstueck': 'Flurstücksnachweis',
          'grundbuch': 'Grundbuchauszug',
          'teilungserklaerung': 'Teilungserklärung',
          'energieausweis': 'Energieausweis',
          'wirtschaftsplan': 'Wirtschaftsplan',
          'grundrisse': 'Grundrisse',
          'fotos': 'Weitere Fotos',
        };
        
        const docList = requestedDocuments?.map((d: string) => docLabels[d] || d).join(', ');
        const priceDiff = currentPrice && proposedPrice 
          ? ((proposedPrice - currentPrice) / currentPrice * 100).toFixed(0)
          : null;

        userPrompt = `Schreibe eine E-Mail mit einem Preisvorschlag für ein Immobilienangebot.

Angebotspreis: ${currentPrice ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(currentPrice) : 'nicht bekannt'}
Unser Vorschlag: ${proposedPrice ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(proposedPrice) : 'nicht angegeben'}
${priceDiff ? `Differenz: ${priceDiff}%` : ''}

Benötigte Unterlagen für weitere Prüfung: ${docList || 'keine spezifischen'}
${customMessage ? `Zusätzliche Anmerkung: ${customMessage}` : ''}

Die E-Mail sollte unser ernsthaftes Interesse zeigen, aber den niedrigeren Preis professionell begründen. Erwähne, dass wir nach Erhalt der Unterlagen eine finale Entscheidung treffen können.`;
        break;

      case 'interest':
        userPrompt = `Schreibe eine E-Mail, um Interesse an einem Immobilienangebot zu bekunden.

${createDataRoom ? 'Wir werden einen Datenraum einrichten und freuen uns auf weitere Unterlagen.' : ''}
${customMessage ? `Zusätzliche Anmerkung: ${customMessage}` : ''}

Die E-Mail sollte unser Interesse klar kommunizieren und die nächsten Schritte ansprechen (z.B. Besichtigung, weitere Unterlagen, Gespräch).`;
        break;

      default:
        throw new Error(`Unbekannter Antworttyp: ${type}`);
    }

    console.log('Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit erreicht, bitte versuchen Sie es später erneut.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Kontingent erschöpft, bitte laden Sie Credits auf.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const email = data.choices?.[0]?.message?.content || '';

    console.log('Email generated successfully');

    return new Response(JSON.stringify({ email, type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sot-acq-generate-response error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
