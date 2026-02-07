import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const key =
      Deno.env.get("VITE_GOOGLE_MAPS_API_KEY") ??
      Deno.env.get("GOOGLE_MAPS_API_KEY") ??
      "";

    if (!key) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_MAPS_API_KEY_NOT_CONFIGURED" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return new Response(JSON.stringify({ key }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error in sot-google-maps-key:", error);
    return new Response(JSON.stringify({ error: "UNKNOWN_ERROR" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }
});
