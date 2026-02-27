/**
 * SOT-ACQ-OFFER-EXTRACT
 * 
 * Extract structured property data from uploaded documents (Exposés) using AI
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
    const { offerId, documentId } = await req.json();

    // Get document
    const { data: doc, error: docError } = await supabase
      .from('acq_offer_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found');
    }

    // Get offer
    const { data: offer } = await supabase
      .from('acq_offers')
      .select('mandate_id')
      .eq('id', offerId)
      .single();

    // Create analysis run
    const { data: run } = await supabase
      .from('acq_analysis_runs')
      .insert([{
        offer_id: offerId,
        mandate_id: offer?.mandate_id,
        run_type: 'extraction',
        status: 'running',
        input_data: { documentId, fileName: doc.file_name, documentType: doc.document_type },
        started_at: new Date().toISOString(),
      }])
      .select()
      .single();

    // Download document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('acq-documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document: ' + downloadError?.message);
    }

    // For PDF extraction, we need the text content
    // In a real implementation, you'd use a PDF parsing library
    // For now, we'll try to extract what we can or note it's a PDF

    let documentContent = '';
    const isPDF = doc.mime_type === 'application/pdf';

    if (isPDF) {
      // Note: Actual PDF parsing would require additional libraries
      // For demo, we'll note the limitation
      documentContent = `[PDF-Dokument: ${doc.file_name}]\n` +
        `Größe: ${doc.file_size} Bytes\n` +
        `Typ: ${doc.document_type}\n` +
        `\nHinweis: Vollständige PDF-Extraktion erfordert OCR-Integration.`;
    } else {
      // Try to read as text
      try {
        documentContent = await fileData.text();
      } catch {
        documentContent = `[Binärdatei: ${doc.file_name}]`;
      }
    }

    // AI Extraction Prompt
    const extractionPrompt = `
Du bist ein Exposé-Analyst. Extrahiere strukturierte Immobiliendaten aus dem folgenden Dokument.

**Dokumentinhalt:**
${documentContent.slice(0, 10000)}

Extrahiere alle verfügbaren Informationen und antworte NUR mit einem JSON-Objekt:

{
  "title": "Objektbezeichnung",
  "address": "Vollständige Adresse",
  "postal_code": "PLZ",
  "city": "Stadt",
  "price_asking": null oder Zahl,
  "yield_indicated": null oder Prozent als Zahl,
  "noi_indicated": null oder Zahl (Netto-Mieteinnahmen p.a.),
  "units_count": null oder Anzahl,
  "area_sqm": null oder Fläche in m²,
  "year_built": null oder Baujahr,
  "property_type": "MFH|ETW|EFH|ZFH|WGH|GEW|unbekannt",
  "floors": null oder Anzahl Etagen,
  "parking_spaces": null oder Anzahl Stellplätze,
  "heating_type": "Gas|Öl|Fernwärme|Wärmepumpe|unbekannt",
  "energy_class": "A+|A|B|C|D|E|F|G|H|unbekannt",
  "renovation_status": "saniert|teilsaniert|unsaniert|neubau|unbekannt",
  "monthly_rent_current": null oder aktuelle Monatsmiete,
  "monthly_rent_potential": null oder Mietpotenzial,
  "vacancy_rate": null oder Leerstand in Prozent,
  "contact_broker": {
    "name": null oder Name,
    "company": null oder Firma,
    "phone": null oder Telefon,
    "email": null oder E-Mail
  },
  "highlights": ["Highlight 1", "Highlight 2"],
  "notes": "Weitere wichtige Informationen"
}

Wenn ein Wert nicht gefunden wird, setze null.
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let extractedData: Record<string, unknown> = {};
    let confidence = 50;

    if (content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
          
          // Calculate confidence based on filled fields
          const filledFields = Object.values(extractedData).filter(v => v !== null && v !== 'unbekannt').length;
          confidence = Math.min(95, 30 + filledFields * 5);
        }
      } catch (parseError) {
        console.error('Failed to parse extraction:', content);
        extractedData = { raw_response: content, parse_error: true };
      }
    }

    // Update document with extracted text
    await supabase
      .from('acq_offer_documents')
      .update({ extracted_text: documentContent.slice(0, 50000) })
      .eq('id', documentId);

    // Update analysis run
    await supabase
      .from('acq_analysis_runs')
      .update({
        status: 'completed',
        output_data: extractedData,
        model_used: 'google/gemini-2.5-pro',
        tokens_used: aiData.usage?.total_tokens,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run?.id);

    // Update offer with extracted data
    const offerUpdates: Record<string, unknown> = {
      extracted_data: extractedData,
      extraction_confidence: confidence,
      updated_at: new Date().toISOString(),
    };

    // Auto-fill empty offer fields
    if (extractedData.title && !offer) offerUpdates.title = extractedData.title;
    if (extractedData.address) offerUpdates.address = extractedData.address;
    if (extractedData.postal_code) offerUpdates.postal_code = extractedData.postal_code;
    if (extractedData.city) offerUpdates.city = extractedData.city;
    if (extractedData.price_asking) offerUpdates.price_asking = extractedData.price_asking;
    if (extractedData.yield_indicated) offerUpdates.yield_indicated = extractedData.yield_indicated;
    if (extractedData.noi_indicated) offerUpdates.noi_indicated = extractedData.noi_indicated;
    if (extractedData.units_count) offerUpdates.units_count = extractedData.units_count;
    if (extractedData.area_sqm) offerUpdates.area_sqm = extractedData.area_sqm;
    if (extractedData.year_built) offerUpdates.year_built = extractedData.year_built;

    await supabase
      .from('acq_offers')
      .update(offerUpdates)
      .eq('id', offerId);

    console.log('Extraction complete:', { offerId, documentId, confidence });

    return new Response(
      JSON.stringify({ success: true, extractedData, confidence }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-acq-offer-extract:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
