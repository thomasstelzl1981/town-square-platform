import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  filename: string;
  mime_type: string;
  size_bytes?: number;
  folder?: string; // legacy: optional subfolder within tenant folder
  property_code?: string; // Akten-ID (e.g., IMM-2026-00001)
  subfolder?: string; // folder name from storage_nodes (e.g., 07_Kaufvertrag)
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token for RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user and their tenant
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's active tenant
    const { data: profile, error: profileError } = await supabaseUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.active_tenant_id) {
      return new Response(
        JSON.stringify({ error: "No active tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = profile.active_tenant_id;

    // Parse request body
    const { filename, mime_type, size_bytes, folder, property_code, subfolder }: UploadRequest = await req.json();

    if (!filename || !mime_type) {
      return new Response(
        JSON.stringify({ error: "Missing filename or mime_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path based on context
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    
    let filePath: string;
    if (property_code) {
      // New structured path: {tenant_id}/Immobilien/{property_code}/{subfolder}/{timestamp}_{filename}
      const safePropertyCode = property_code.replace(/[^a-zA-Z0-9._-]/g, "_");
      const safeSubfolder = subfolder ? subfolder.replace(/[^a-zA-Z0-9._-äöüÄÖÜß ]/g, "_") : "Allgemein";
      filePath = `${tenantId}/Immobilien/${safePropertyCode}/${safeSubfolder}/${timestamp}_${safeName}`;
    } else if (folder) {
      // Legacy path with folder
      filePath = `${tenantId}/${folder}/${timestamp}_${safeName}`;
    } else {
      // Fallback path
      filePath = `${tenantId}/raw/${timestamp}_${safeName}`;
    }

    // Use service role client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create signed upload URL (valid for 1 hour)
    const { data: signedUrl, error: signedError } = await supabaseAdmin.storage
      .from("tenant-documents")
      .createSignedUploadUrl(filePath);

    if (signedError) {
      console.error("Signed URL error:", signedError);
      return new Response(
        JSON.stringify({ error: "Failed to create upload URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-create document record in pending state
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .insert({
        tenant_id: tenantId,
        name: filename,
        file_path: filePath,
        mime_type: mime_type,
        size_bytes: size_bytes || 0,
        uploaded_by: user.id,
      })
      .select("id, public_id")
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      return new Response(
        JSON.stringify({ error: "Failed to create document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Upload URL created for tenant ${tenantId}: ${filePath}`);

    return new Response(
      JSON.stringify({
        upload_url: signedUrl.signedUrl,
        token: signedUrl.token,
        file_path: filePath,
        document_id: document.id,
        public_id: document.public_id,
        expires_in: 3600,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload URL error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
