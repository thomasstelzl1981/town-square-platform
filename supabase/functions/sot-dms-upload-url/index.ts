import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  filename: string;
  mime_type: string;
  size_bytes?: number;
  folder?: string; // optional subfolder within tenant folder
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
    const { filename, mime_type, size_bytes, folder }: UploadRequest = await req.json();

    if (!filename || !mime_type) {
      return new Response(
        JSON.stringify({ error: "Missing filename or mime_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique file path: {tenant_id}/{folder?}/{timestamp}_{filename}
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = folder 
      ? `${tenantId}/${folder}/${timestamp}_${safeName}`
      : `${tenantId}/${timestamp}_${safeName}`;

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
