/**
 * SOT Storage Extractor — ENG-STOREX v2.0 (Runde 2 Upgrade)
 * 
 * Bulk document extraction engine with structured data intelligence.
 * 
 * Actions:
 *   scan           — Count files, estimate credits (Free)
 *   start          — Create job, reserve credits
 *   process-batch  — Extract next N documents via Gemini + structured data
 *   status         — Return current job progress
 *   cancel         — Stop/pause a running job
 * 
 * NEW in v2.0:
 *   - Structured extraction: Kaufverträge, Mietverträge, Versicherungspolicen
 *   - Results stored in document_structured_data (JSONB)
 *   - Armstrong can query structured fields directly
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDITS_PER_DOC = 1;
const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 20;

const EXTRACTABLE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "text/plain", "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isExtractable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return EXTRACTABLE_MIME_TYPES.some(t => mimeType.startsWith(t.split("/")[0]) || mimeType === t);
}

// ─── Structured Extraction Prompt (v2.0) ───
const STRUCTURED_EXTRACTION_PROMPT = `Du bist ein Dokumenten-Extraktions-Spezialist für ein Immobilien-Portfolio-System.

Aufgabe 1: Extrahiere ALLEN Text als durchsuchbaren Volltext.
Aufgabe 2: Erkenne den Dokumententyp und extrahiere STRUKTURIERTE Felder.

DOKUMENTTYPEN UND FELDER:

kaufvertrag:
  - notar_name, notar_ort, urkundennummer
  - kaufpreis, kaufdatum, uebergabedatum
  - grundbuch_amtsgericht, grundbuch_blatt, grundbuch_flurstueck
  - kaeufer_name, verkaeufer_name
  - grunderwerbsteuer_prozent

mietvertrag:
  - mieter_name, mieter_vorname
  - kaltmiete_eur, nk_vorauszahlung_eur
  - mietbeginn, mietende, kuendigungsfrist_monate
  - kaution_eur, staffelmiete_details
  - wohnflaeche_qm, zimmer_anzahl, etage
  - indexmiete (ja/nein), index_referenz

versicherung:
  - versicherungstyp (gebaeudeversicherung, haftpflicht, rechtsschutz, etc.)
  - policennummer, versicherungsnehmer
  - praemie_jaehrlich_eur, selbstbeteiligung_eur
  - deckungssumme_eur, versicherungsbeginn, versicherungsende

darlehensvertrag:
  - bank_name, darlehensnummer
  - darlehensbetrag_eur, zinssatz_prozent, tilgungssatz_prozent
  - zinsbindung_bis, rate_monatlich_eur
  - sondertilgung_prozent, bereitstellungszinsen

grundbuchauszug:
  - amtsgericht, grundbuchbezirk, blatt_nr
  - eigentuemer, abteilung_ii_lasten, abteilung_iii_hypotheken

bescheid:
  - bescheid_typ (grundsteuer, einkommensteuer, gewerbesteuer)
  - aktenzeichen, bescheid_datum
  - festgesetzter_betrag_eur, frist_einspruch

kontoauszug:
  - bank_name, kontonummer_iban
  - zeitraum_von, zeitraum_bis
  - anfangssaldo_eur, endsaldo_eur

Antworte NUR mit validem JSON:
{
  "doc_type": "kaufvertrag|mietvertrag|versicherung|darlehensvertrag|grundbuchauszug|bescheid|kontoauszug|rechnung|brief|expose|sonstiges",
  "confidence": 0.0-1.0,
  "summary": "Kurzzusammenfassung in 1-2 Sätzen",
  "extracted_text": "Kompletter Text, Seiten getrennt mit ---PAGE_BREAK---",
  "structured_fields": { ...typ-spezifische Felder von oben... },
  "key_data": {
    "datum": "falls erkannt",
    "betrag": "falls erkannt",
    "absender": "falls erkannt",
    "empfaenger": "falls erkannt",
    "aktenzeichen": "falls erkannt"
  }
}

WICHTIG: structured_fields NUR befüllen wenn du SICHER bist (confidence >= 0.7).
Felder die du nicht findest: weglassen (nicht null setzen).`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, tenant_id, job_id, folder_id, batch_size } = body;

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[sot-storage-extractor] Action: ${action}, Tenant: ${tenant_id}`);

    // =========================================================================
    // ACTION: scan
    // =========================================================================
    if (action === "scan") {
      let query = supabaseUser
        .from("storage_nodes")
        .select("id, name, mime_type, file_size", { count: "exact" })
        .eq("tenant_id", tenant_id)
        .eq("node_type", "file");

      if (folder_id) query = query.eq("parent_id", folder_id);

      const { data: allFiles, count: totalCount, error: filesError } = await query;
      if (filesError) throw filesError;

      const fileIds = (allFiles || []).map(f => f.id);
      let extractedCount = 0;
      if (fileIds.length > 0) {
        const { count } = await supabaseUser
          .from("document_chunks")
          .select("source_node_id", { count: "exact", head: true })
          .in("source_node_id", fileIds.slice(0, 1000));
        extractedCount = count || 0;
      }

      const extractableFiles = (allFiles || []).filter(f => isExtractable(f.mime_type));
      const toProcess = extractableFiles.length - extractedCount;
      const creditsNeeded = Math.max(0, toProcess) * CREDITS_PER_DOC;

      return new Response(JSON.stringify({
        success: true,
        scan: {
          total_files: totalCount || 0,
          extractable_files: extractableFiles.length,
          already_extracted: extractedCount,
          to_process: Math.max(0, toProcess),
          credits_needed: creditsNeeded,
          credits_per_doc: CREDITS_PER_DOC,
          estimated_minutes: Math.ceil(toProcess / DEFAULT_BATCH_SIZE) * 0.5,
          folder_id: folder_id || null,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ACTION: start
    // =========================================================================
    if (action === "start") {
      let query = supabaseUser
        .from("storage_nodes")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenant_id)
        .eq("node_type", "file");

      if (folder_id) query = query.eq("parent_id", folder_id);

      const { count: totalFiles, error: countError } = await query;
      if (countError) throw countError;

      const creditsNeeded = (totalFiles || 0) * CREDITS_PER_DOC;

      const { data: creditCheck, error: creditError } = await supabaseAdmin
        .rpc("sot_credit_preflight", { p_tenant_id: tenant_id, p_credits_needed: creditsNeeded });

      if (creditError) {
        console.warn("[sot-storage-extractor] Proceeding without credit check (dev mode)");
      } else if (creditCheck && !creditCheck.approved) {
        return new Response(JSON.stringify({
          error: "Nicht genügend Credits",
          credits_needed: creditsNeeded,
          credits_available: creditCheck.available || 0,
        }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobError } = await supabaseUser
        .from("extraction_jobs")
        .insert({
          tenant_id,
          status: "running",
          folder_id: folder_id || null,
          total_files: totalFiles || 0,
          credits_reserved: creditsNeeded,
          batch_size: Math.min(batch_size || DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE),
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      return new Response(JSON.stringify({
        success: true,
        job,
        thinking_steps: [
          { label: `Datenraum gescannt (${totalFiles} Dateien)`, status: "completed" },
          { label: `Credits reserviert: ${creditsNeeded}`, status: "completed" },
          { label: "Batch-Verarbeitung gestartet (v2.0 Strukturiert)", status: "active" },
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ACTION: process-batch (v2.0 with structured extraction)
    // =========================================================================
    if (action === "process-batch") {
      if (!job_id) {
        return new Response(JSON.stringify({ error: "job_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobError } = await supabaseUser
        .from("extraction_jobs")
        .select("*")
        .eq("id", job_id)
        .single();

      if (jobError || !job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (job.status !== "running") {
        return new Response(JSON.stringify({ success: false, error: `Job is ${job.status}`, job }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: processedChunks } = await supabaseUser
        .from("document_chunks")
        .select("source_node_id")
        .eq("tenant_id", tenant_id);

      const processedIds = new Set((processedChunks || []).map(c => c.source_node_id).filter(Boolean));

      let filesQuery = supabaseUser
        .from("storage_nodes")
        .select("id, name, mime_type, storage_path, file_size")
        .eq("tenant_id", tenant_id)
        .eq("node_type", "file")
        .limit(job.batch_size || DEFAULT_BATCH_SIZE);

      if (job.folder_id) filesQuery = filesQuery.eq("parent_id", job.folder_id);

      const { data: files, error: filesError } = await filesQuery;
      if (filesError) throw filesError;

      const toProcess = (files || []).filter(f => !processedIds.has(f.id) && isExtractable(f.mime_type));

      if (toProcess.length === 0) {
        await supabaseUser.from("extraction_jobs")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", job_id);

        return new Response(JSON.stringify({
          success: true, batch_complete: true, job_complete: true, processed_in_batch: 0,
          job: { ...job, status: "completed" },
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      let batchProcessed = 0;
      let batchFailed = 0;
      let structuredCount = 0;
      const errors: Array<{ file: string; error: string }> = [];

      for (const file of toProcess) {
        try {
          const { data: signedData, error: signedError } = await supabaseAdmin
            .storage.from("tenant-documents")
            .createSignedUrl(file.storage_path, 300);

          if (signedError || !signedData?.signedUrl) {
            throw new Error(`Signed URL failed: ${signedError?.message || "unknown"}`);
          }

          const fileResponse = await fetch(signedData.signedUrl);
          if (!fileResponse.ok) throw new Error(`Download failed: ${fileResponse.status}`);

          const fileBuffer = await fileResponse.arrayBuffer();
          const fileBytes = new Uint8Array(fileBuffer);
          let base64Content = "";
          const chunkSize = 8192;
          for (let i = 0; i < fileBytes.length; i += chunkSize) {
            const chunk = fileBytes.slice(i, i + chunkSize);
            base64Content += String.fromCharCode(...chunk);
          }
          base64Content = btoa(base64Content);

          // v2.0: Use structured extraction prompt
          const aiMessages = file.mime_type?.startsWith("image") || file.mime_type === "application/pdf"
            ? [
                { role: "system", content: STRUCTURED_EXTRACTION_PROMPT },
                {
                  role: "user",
                  content: [
                    { type: "text", text: `Extrahiere alle Informationen aus: ${file.name}` },
                    { type: "image_url", image_url: { url: `data:${file.mime_type};base64,${base64Content}` } },
                  ],
                },
              ]
            : [
                { role: "system", content: STRUCTURED_EXTRACTION_PROMPT },
                {
                  role: "user",
                  content: `Extrahiere alle Informationen aus: ${file.name}\n\nInhalt:\n${new TextDecoder().decode(fileBuffer).substring(0, 50000)}`,
                },
              ];

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro",
              messages: aiMessages,
              temperature: 0.1,
              max_tokens: 32000,
            }),
          });

          if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            throw new Error(`AI error ${aiResponse.status}: ${errText}`);
          }

          const aiResult = await aiResponse.json();
          const rawContent = aiResult.choices?.[0]?.message?.content || "";

          // Try to parse as structured JSON
          let parsed: any = null;
          try {
            const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(jsonStr);
          } catch {
            parsed = { extracted_text: rawContent, doc_type: "sonstiges", confidence: 0.3 };
          }

          const extractedText = parsed.extracted_text || rawContent;

          // Store chunks in document_chunks (existing behavior)
          const chunks = chunkText(extractedText, 500);
          for (let i = 0; i < chunks.length; i++) {
            await supabaseAdmin.from("document_chunks").insert({
              tenant_id,
              source_node_id: file.id,
              chunk_index: i,
              content: chunks[i],
              metadata: {
                filename: file.name,
                mime_type: file.mime_type,
                extracted_by: "ENG-STOREX-v2",
                doc_type: parsed.doc_type,
                confidence: parsed.confidence,
                extraction_date: new Date().toISOString(),
              },
            });
          }

          // v2.0: Store structured data if extracted
          if (parsed.structured_fields && Object.keys(parsed.structured_fields).length > 0 && (parsed.confidence || 0) >= 0.7) {
            // Find linked document_id for this storage_node
            const { data: docLink } = await supabaseAdmin
              .from("document_links")
              .select("document_id")
              .eq("tenant_id", tenant_id)
              .or(`object_id.eq.${file.id}`)
              .maybeSingle();

            await supabaseAdmin.from("document_structured_data").upsert({
              tenant_id,
              document_id: docLink?.document_id || null,
              storage_node_id: file.id,
              doc_category: parsed.doc_type || "sonstiges",
              extracted_fields: parsed.structured_fields,
              confidence: parsed.confidence || 0.5,
              needs_review: (parsed.confidence || 0) < 0.9,
              extractor_version: "STOREX-v2.0",
              extracted_at: new Date().toISOString(),
            }, {
              onConflict: "storage_node_id",
              ignoreDuplicates: false,
            });

            structuredCount++;
            console.log(`[STOREX-v2] Structured data extracted for ${file.name}: ${parsed.doc_type} (${Object.keys(parsed.structured_fields).length} fields)`);
          }

          batchProcessed++;
        } catch (fileError) {
          console.error(`[sot-storage-extractor] Failed to process ${file.name}:`, fileError);
          batchFailed++;
          errors.push({
            file: file.name,
            error: fileError instanceof Error ? fileError.message : "Unknown error",
          });
        }
      }

      // Update job progress
      const newProcessed = (job.processed_files || 0) + batchProcessed;
      const newFailed = (job.failed_files || 0) + batchFailed;
      const newCreditsUsed = (job.credits_used || 0) + batchProcessed * CREDITS_PER_DOC;
      const isComplete = newProcessed + newFailed >= (job.total_files || 0);

      const existingErrors = Array.isArray(job.error_log) ? job.error_log : [];

      await supabaseUser.from("extraction_jobs").update({
        processed_files: newProcessed,
        failed_files: newFailed,
        credits_used: newCreditsUsed,
        error_log: [...existingErrors, ...errors],
        status: isComplete ? "completed" : "running",
        completed_at: isComplete ? new Date().toISOString() : null,
      }).eq("id", job_id);

      const batchNumber = Math.ceil(newProcessed / (job.batch_size || DEFAULT_BATCH_SIZE));
      const totalBatches = Math.ceil((job.total_files || 0) / (job.batch_size || DEFAULT_BATCH_SIZE));

      return new Response(JSON.stringify({
        success: true,
        batch_complete: true,
        job_complete: isComplete,
        processed_in_batch: batchProcessed,
        structured_in_batch: structuredCount,
        failed_in_batch: batchFailed,
        total_processed: newProcessed,
        total_failed: newFailed,
        credits_used: newCreditsUsed,
        errors: errors.length > 0 ? errors : undefined,
        thinking_steps: [
          { label: `Batch ${batchNumber}/${totalBatches} verarbeitet (${structuredCount} strukturiert)`, status: "completed" },
          ...(isComplete
            ? [{ label: `Extraktion abgeschlossen (${newProcessed} Dateien, davon ${structuredCount} strukturiert)`, status: "completed" as const }]
            : [{ label: `Batch ${batchNumber + 1}/${totalBatches} wird verarbeitet...`, status: "active" as const }]
          ),
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ACTION: status
    // =========================================================================
    if (action === "status") {
      if (!job_id) {
        const { data: jobs, error: jobsError } = await supabaseUser
          .from("extraction_jobs")
          .select("*")
          .eq("tenant_id", tenant_id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (jobsError) throw jobsError;
        return new Response(JSON.stringify({ success: true, job: jobs?.[0] || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobError } = await supabaseUser
        .from("extraction_jobs")
        .select("*")
        .eq("id", job_id)
        .single();

      if (jobError) throw jobError;
      return new Response(JSON.stringify({ success: true, job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // ACTION: cancel
    // =========================================================================
    if (action === "cancel") {
      if (!job_id) {
        return new Response(JSON.stringify({ error: "job_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job, error: jobError } = await supabaseUser
        .from("extraction_jobs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", job_id)
        .eq("status", "running")
        .select()
        .single();

      if (jobError) {
        return new Response(JSON.stringify({ error: "Job not found or not running" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[sot-storage-extractor] Job ${job_id} cancelled`);
      return new Response(JSON.stringify({ success: true, job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[sot-storage-extractor] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// =============================================================================
// HELPERS
// =============================================================================

function chunkText(text: string, maxChunkSize: number): string[] {
  if (!text || text.length <= maxChunkSize) return [text || ""];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChunkSize) {
      chunks.push(remaining);
      break;
    }

    let breakPoint = remaining.lastIndexOf("\n\n", maxChunkSize);
    if (breakPoint < maxChunkSize * 0.3) {
      breakPoint = remaining.lastIndexOf("\n", maxChunkSize);
    }
    if (breakPoint < maxChunkSize * 0.3) {
      breakPoint = remaining.lastIndexOf(". ", maxChunkSize);
    }
    if (breakPoint < maxChunkSize * 0.3) {
      breakPoint = maxChunkSize;
    }

    chunks.push(remaining.substring(0, breakPoint + 1).trim());
    remaining = remaining.substring(breakPoint + 1).trim();
  }

  return chunks;
}
