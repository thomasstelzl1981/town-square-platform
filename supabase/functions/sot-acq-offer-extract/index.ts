/**
 * SOT-ACQ-OFFER-EXTRACT
 * 
 * Extract structured property data from uploaded documents (Exposés) using AI
 * Supports two modes:
 *   1. Standard: offerId + documentId → reads from acq_offer_documents, updates DB
 *   2. Standalone: standaloneMode + storagePath + bucketName → reads file directly, no DB writes
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Extraction Prompt (shared between both modes)
const buildExtractionPrompt = (documentContent: string, fileName: string) => `
Du bist ein Exposé-Analyst. Extrahiere strukturierte Immobiliendaten aus dem folgenden Dokument.

**Dokument:** ${fileName}
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

async function callAI(prompt: string, apiKey: string) {
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI API error: ${aiResponse.status}`);
  }

  return aiResponse.json();
}

function parseExtraction(aiData: any) {
  const content = aiData.choices?.[0]?.message?.content;
  let extractedData: Record<string, unknown> = {};
  let confidence = 50;

  if (content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
        const filledFields = Object.values(extractedData).filter(v => v !== null && v !== 'unbekannt').length;
        confidence = Math.min(95, 30 + filledFields * 5);
      }
    } catch {
      console.error('Failed to parse extraction:', content);
      extractedData = { raw_response: content, parse_error: true };
    }
  }

  return { extractedData, confidence, tokensUsed: aiData.usage?.total_tokens };
}

async function readDocumentContent(fileData: Blob, mimeType: string, fileName: string, apiKey?: string): Promise<string> {
  const isPDF = mimeType === 'application/pdf';
  
  if (isPDF && apiKey) {
    // Send PDF as base64 to Gemini for native PDF parsing
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      // Convert to base64 in chunks to avoid stack overflow
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
      }
      const base64 = btoa(binary);

      console.log(`Sending PDF to Gemini for extraction: ${fileName} (${fileData.size} bytes)`);

      const pdfResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_tokens: 16000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extrahiere den vollständigen Text aus diesem PDF-Dokument. Gib den gesamten Textinhalt strukturiert zurück, einschließlich aller Zahlen, Adressen, Preise und Kontaktdaten. Formatiere den Text übersichtlich mit Zeilenumbrüchen.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          }],
        }),
      });

      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json();
        const extractedText = pdfData.choices?.[0]?.message?.content;
        if (extractedText && extractedText.length > 50) {
          console.log(`PDF text extracted successfully: ${extractedText.length} chars`);
          return extractedText;
        }
      } else {
        console.error('Gemini PDF extraction failed:', pdfResponse.status);
      }
    } catch (pdfErr) {
      console.error('PDF extraction error:', pdfErr);
    }
    // Fallback if Gemini PDF fails
    return `[PDF-Dokument: ${fileName}]\nGröße: ${fileData.size} Bytes\nHinweis: PDF-Extraktion fehlgeschlagen.`;
  }
  
  if (isPDF) {
    return `[PDF-Dokument: ${fileName}]\nGröße: ${fileData.size} Bytes`;
  }
  
  try {
    return await fileData.text();
  } catch {
    return `[Binärdatei: ${fileName}]`;
  }
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();

    // ── STANDALONE MODE ──
    if (body.standaloneMode === true) {
      const { storagePath, bucketName } = body;
      
      if (!storagePath || !bucketName) {
        throw new Error('standaloneMode requires storagePath and bucketName');
      }

      // Download file directly from the specified bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(storagePath);

      if (downloadError || !fileData) {
        throw new Error('Failed to download document: ' + downloadError?.message);
      }

      // Determine mime type from path
      const fileName = storagePath.split('/').pop() || 'document';
      const mimeType = fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain';
      const documentContent = await readDocumentContent(fileData, mimeType, fileName, LOVABLE_API_KEY);

      // AI Extraction
      const prompt = buildExtractionPrompt(documentContent, fileName);
      const aiData = await callAI(prompt, LOVABLE_API_KEY);
      const { extractedData, confidence } = parseExtraction(aiData);

      console.log('Standalone extraction complete:', { storagePath, confidence });

      return new Response(
        JSON.stringify({ success: true, extractedData, confidence }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── STANDARD MODE (offerId + documentId) ──
    const { offerId, documentId } = body;

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
      .from('tenant-documents')
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download document: ' + downloadError?.message);
    }

    const documentContent = await readDocumentContent(fileData, doc.mime_type || '', doc.file_name, LOVABLE_API_KEY);

    // AI Extraction
    const prompt = buildExtractionPrompt(documentContent, doc.file_name);
    const aiData = await callAI(prompt, LOVABLE_API_KEY);
    const { extractedData, confidence, tokensUsed } = parseExtraction(aiData);

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
        model_used: 'google/gemini-2.5-flash',
        tokens_used: tokensUsed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run?.id);

    // Update offer with extracted data
    const offerUpdates: Record<string, unknown> = {
      extracted_data: extractedData,
      extraction_confidence: confidence,
      updated_at: new Date().toISOString(),
    };

    if (extractedData.title) offerUpdates.title = extractedData.title;
    if (extractedData.address) offerUpdates.address = extractedData.address;
    if (extractedData.postal_code) offerUpdates.postal_code = extractedData.postal_code;
    if (extractedData.city) offerUpdates.city = extractedData.city;
    if (extractedData.price_asking) offerUpdates.price_asking = extractedData.price_asking;
    if (extractedData.yield_indicated) offerUpdates.yield_indicated = extractedData.yield_indicated;
    if (extractedData.noi_indicated) offerUpdates.noi_indicated = extractedData.noi_indicated;
    if (extractedData.units_count) offerUpdates.units_count = extractedData.units_count;
    if (extractedData.area_sqm) offerUpdates.area_sqm = extractedData.area_sqm;
    if (extractedData.year_built) offerUpdates.year_built = extractedData.year_built;
    if (extractedData.notes) offerUpdates.notes = extractedData.notes;
    if (extractedData.contact_broker?.company) offerUpdates.provider_name = extractedData.contact_broker.company;
    if (extractedData.contact_broker?.name || extractedData.contact_broker?.phone) {
      const parts = [extractedData.contact_broker.name, extractedData.contact_broker.phone].filter(Boolean);
      offerUpdates.provider_contact = parts.join(' | ');
    }

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
