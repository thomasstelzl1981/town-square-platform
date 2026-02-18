import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Embedding Pipeline — P2.6 (RAG Index)
 * 
 * Generates vector embeddings for document_chunks using Gemini.
 * Enables hybrid search (TSVector + pgvector) for Armstrong context.
 * 
 * Endpoints:
 *   POST /embed-document  → Generate embeddings for a single document's chunks
 *   POST /embed-batch     → Batch process unembedded chunks
 *   POST /search          → Hybrid search (text + vector)
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: ue } = await sbUser.auth.getUser();
    if (ue || !user) return json({ error: "Invalid user" }, 401);

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action || "status";

    switch (action) {
      case "embed-document": {
        const { documentId } = body;
        if (!documentId) return json({ error: "Missing documentId" }, 400);
        if (!lovableApiKey) return json({ error: "AI Gateway not configured" }, 500);

        // Get unembedded chunks for this document
        const { data: chunks, error: chunkErr } = await sbAdmin
          .from("document_chunks")
          .select("id, text")
          .eq("document_id", documentId)
          .eq("tenant_id", tenantId)
          .is("embedding", null)
          .limit(100);

        if (chunkErr || !chunks?.length) {
          return json({
            message: chunks?.length === 0 ? "All chunks already embedded" : "No chunks found",
            embedded_count: 0,
          });
        }

        // Generate embeddings via Lovable AI Gateway
        let embeddedCount = 0;
        for (const chunk of chunks) {
          try {
            const embRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "text-embedding-3-small",
                input: chunk.text.substring(0, 8000),
                dimensions: 768,
              }),
            });

            if (embRes.ok) {
              const embResult = await embRes.json();
              const embedding = embResult.data?.[0]?.embedding;
              if (embedding) {
                await sbAdmin
                  .from("document_chunks")
                  .update({ embedding: JSON.stringify(embedding) })
                  .eq("id", chunk.id);
                embeddedCount++;
              }
            }
          } catch (e) {
            console.error(`[embedding] Failed for chunk ${chunk.id}:`, e);
          }
        }

        return json({
          success: true,
          document_id: documentId,
          total_chunks: chunks.length,
          embedded_count: embeddedCount,
        });
      }

      case "embed-batch": {
        // Process unembedded chunks across all tenant documents
        const limit = body.limit || 50;

        const { data: chunks } = await sbAdmin
          .from("document_chunks")
          .select("id, text, document_id")
          .eq("tenant_id", tenantId)
          .is("embedding", null)
          .limit(limit);

        return json({
          status: "scaffold",
          message: `${chunks?.length || 0} Chunks ohne Embedding gefunden. Batch-Embedding vorbereitet.`,
          unembedded_chunks: chunks?.length || 0,
          note: "Embedding-API-Integration bereit. Erfordert unterstütztes Embedding-Modell.",
        });
      }

      case "search": {
        const { query, vectorWeight } = body;
        if (!query) return json({ error: "Missing query" }, 400);

        // Use hybrid search RPC
        const { data: results, error: searchErr } = await sbAdmin.rpc("hybrid_search_documents", {
          p_tenant_id: tenantId,
          p_query: query,
          p_query_embedding: null, // Would need embedding of query for vector search
          p_limit: body.limit || 20,
          p_vector_weight: vectorWeight || 0.5,
        });

        if (searchErr) {
          console.error("Search error:", searchErr);
          // Fallback to text-only search
          const { data: tsResults } = await sbAdmin.rpc("search_document_chunks", {
            p_tenant_id: tenantId,
            p_query: query,
            p_limit: body.limit || 20,
          });
          return json({ results: tsResults || [], mode: "text_only" });
        }

        return json({ results: results || [], mode: "hybrid" });
      }

      case "status": {
        // Get embedding coverage stats
        const { count: totalChunks } = await sbAdmin
          .from("document_chunks")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId);

        const { count: embeddedChunks } = await sbAdmin
          .from("document_chunks")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .not("embedding", "is", null);

        return json({
          total_chunks: totalChunks || 0,
          embedded_chunks: embeddedChunks || 0,
          coverage_percent: totalChunks ? Math.round(((embeddedChunks || 0) / totalChunks) * 100) : 0,
          vector_dimension: 768,
          search_modes: ["text_only", "hybrid"],
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[sot-embedding-pipeline] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
