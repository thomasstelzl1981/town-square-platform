import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadRequest {
  document_id: string;
  expires_in?: number; // seconds, default 3600
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's active tenant
    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_tenant_id) {
      return new Response(
        JSON.stringify({ error: "No active tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { document_id, expires_in = 3600 }: DownloadRequest = await req.json();

    if (!document_id) {
      return new Response(
        JSON.stringify({ error: "Missing document_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch document with RLS (ensures user has access)
    const { data: document, error: docError } = await supabaseUser
      .from("documents")
      .select("id, name, file_path, mime_type, size_bytes, tenant_id")
      .eq("id", document_id)
      .eq("tenant_id", profile.active_tenant_id)
      .maybeSingle();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create signed download URL using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: signedUrl, error: signedError } = await supabaseAdmin.storage
      .from("tenant-documents")
      .createSignedUrl(document.file_path, expires_in);

    if (signedError) {
      console.error("Signed URL error:", signedError);
      return new Response(
        JSON.stringify({ error: "Failed to create download URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Download URL created for document ${document_id}`);

    // DSGVO Ledger: document signed URL issued
    await logDataEvent(supabaseAdmin, {
      tenant_id: profile.active_tenant_id,
      zone: "Z2",
      actor_user_id: user.id,
      event_type: "document.signed_url.view",
      direction: "egress",
      source: "ui",
      entity_type: "document",
      entity_id: document_id,
      payload: {
        document_id,
        expires_in,
        mime_type: document.mime_type,
        size_bytes: document.size_bytes,
      },
    }, req);

    return new Response(
      JSON.stringify({
        download_url: signedUrl.signedUrl,
        filename: document.name,
        mime_type: document.mime_type,
        size_bytes: document.size_bytes,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Download URL error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
