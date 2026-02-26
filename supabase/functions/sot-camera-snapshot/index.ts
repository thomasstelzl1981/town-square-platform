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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

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

    // Build request headers for camera
    const fetchHeaders: Record<string, string> = {};
    if (camera.auth_user && camera.auth_pass) {
      const credentials = btoa(`${camera.auth_user}:${camera.auth_pass}`);
      fetchHeaders["Authorization"] = `Basic ${credentials}`;
    }

    // Fetch snapshot from camera with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let cameraResponse: Response;
    try {
      cameraResponse = await fetch(camera.snapshot_url, {
        headers: fetchHeaders,
        signal: controller.signal,
      });
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
