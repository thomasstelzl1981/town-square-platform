/**
 * sot-pdf-to-csv — Reusable Edge Function
 * Extracts table data from PDFs as semicolon-delimited CSV via Gemini Flash.
 * 
 * Used by: sot-project-intake, sot-document-parser, any Magic Intake module.
 * 
 * Input:  { storagePath: string, bucket?: string, hint?: string }
 * Output: { csv: string, rowCount: number }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/** Chunked Base64 — safe for large files */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

const CSV_EXTRACTION_PROMPT = `Du bist ein hochpräziser Tabellen-Extraktor. Extrahiere ALLE Tabellenzeilen aus diesem Dokument als semikolon-getrennte CSV.

Regeln:
- Erste Zeile = exakte Spaltenüberschriften aus dem Dokument
- Jede weitere Zeile = eine Datenzeile
- Trennzeichen: Semikolon (;)
- Zahlen: Punkt als Dezimaltrennzeichen, keine Tausenderpunkte (z.B. 149900.00 statt 149.900,00)
- Keine Markdown-Formatierung, kein Code-Block, keine Backticks, nur roher CSV-Text
- JEDE Zeile im Dokument MUSS enthalten sein. Überspringe KEINE Zeile.
- Wenn ein Feld leer ist, lasse es leer (zwei Semikolons hintereinander)
- Entferne Währungszeichen (€, EUR) aus Zahlenwerten
- Prozentzeichen (%) entfernen, Wert als Dezimalzahl ausgeben (z.B. 4.5 statt 4,5%)

Ausgabe NUR den CSV-Text, nichts anderes.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storagePath, bucket = 'tenant-documents', hint } = await req.json();

    if (!storagePath) {
      return new Response(JSON.stringify({ error: 'storagePath is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download file from storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: fileData, error: dlError } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (dlError || !fileData) {
      console.error('Download error:', dlError);
      return new Response(JSON.stringify({ error: `File download failed: ${dlError?.message}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (fileData.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large (max 20MB)' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const buffer = await fileData.arrayBuffer();
    const base64 = uint8ToBase64(new Uint8Array(buffer));

    // Build prompt with optional context hint
    let systemPrompt = CSV_EXTRACTION_PROMPT;
    if (hint) {
      systemPrompt += `\n\nZUSÄTZLICHER KONTEXT: ${hint}`;
    }

    console.log(`PDF-to-CSV: Processing ${storagePath} (${(fileData.size / 1024).toFixed(0)} KB)`);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahiere alle Tabellenzeilen aus diesem PDF als CSV.' },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } },
            ],
          },
        ],
        max_tokens: 32000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'KI-Rate-Limit erreicht. Bitte versuchen Sie es in einer Minute erneut.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'KI-Credits aufgebraucht. Bitte laden Sie Credits nach.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    let csv = aiResult.choices?.[0]?.message?.content || '';

    // Clean up: remove markdown code fences if present
    csv = csv.replace(/^```(?:csv)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    // Count data rows (minus header)
    const lines = csv.split('\n').filter((l: string) => l.trim().length > 0);
    const rowCount = Math.max(0, lines.length - 1);

    console.log(`PDF-to-CSV: Extracted ${rowCount} data rows, ${csv.length} chars`);

    return new Response(JSON.stringify({ csv, rowCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sot-pdf-to-csv error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
