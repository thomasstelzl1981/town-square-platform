import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // FIX 1: getUser() statt getClaims() (existiert nicht)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get camera_id from query params
    const url = new URL(req.url);
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) {
      return new Response(
        JSON.stringify({ error: "camera_id parameter required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch camera config (RLS ensures user can only access own cameras)
    const { data: camera, error: camError } = await supabase
      .from("cameras")
      .select("*")
      .eq("id", cameraId)
      .single();

    if (camError || !camera) {
      return new Response(
        JSON.stringify({ error: "Camera not found", details: camError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // FIX 3: URL-embedded credentials without double-encoding
    let snapshotUrl = camera.snapshot_url;
    if (camera.auth_user && camera.auth_pass) {
      try {
        const parsed = new URL(camera.snapshot_url);
        parsed.username = camera.auth_user;
        parsed.password = camera.auth_pass;
        snapshotUrl = parsed.toString();
      } catch {
        // URL parsing failed — use original
      }
    }

    // Fetch snapshot from camera with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // FIX 2: Explicit Basic Auth header as fallback
    const fetchOptions: RequestInit = { signal: controller.signal };
    if (camera.auth_user && camera.auth_pass) {
      const credentials = btoa(`${camera.auth_user}:${camera.auth_pass}`);
      fetchOptions.headers = { Authorization: `Basic ${credentials}` };
    }

    let cameraResponse: Response;
    try {
      cameraResponse = await fetch(snapshotUrl, fetchOptions);
    } catch (fetchErr) {
      clearTimeout(timeout);
      const message =
        fetchErr instanceof Error ? fetchErr.message : "Connection failed";
      return new Response(
        JSON.stringify({
          error: "Camera unreachable",
          details: message,
          status: "offline",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    clearTimeout(timeout);

    // FIX 2: Separate 401 handling with diagnostic info
    if (cameraResponse.status === 401) {
      const wwwAuth = cameraResponse.headers.get("www-authenticate") || "none";
      return new Response(
        JSON.stringify({
          error: "Kamera-Authentifizierung fehlgeschlagen",
          details: `Basic Auth wurde abgelehnt. WWW-Authenticate: ${wwwAuth}`,
          status: "auth_error",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!cameraResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Camera returned error",
          status_code: cameraResponse.status,
          status: "error",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return the image
    const imageBytes = await cameraResponse.arrayBuffer();
    const contentType =
      cameraResponse.headers.get("content-type") || "image/jpeg";

    return new Response(imageBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
