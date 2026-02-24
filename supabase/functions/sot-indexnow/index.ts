/**
 * IndexNow Edge Function
 * Notifies Bing/Yandex/IndexNow-compatible engines about new or updated URLs.
 * 
 * POST /sot-indexnow
 * Body: { urls: string[], host?: string }
 * 
 * The API key is stored at /.well-known/indexnow/<key>.txt (or we use auto-verify).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INDEXNOW_KEY = "sot2026indexnow"; // verification key
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { urls, host } = await req.json();
    
    if (!urls?.length) {
      return new Response(JSON.stringify({ error: "No URLs provided" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const targetHost = host || "systemofatown.com";

    const body = {
      host: targetHost,
      key: INDEXNOW_KEY,
      keyLocation: `https://${targetHost}/${INDEXNOW_KEY}.txt`,
      urlList: urls.map((u: string) => 
        u.startsWith("http") ? u : `https://${targetHost}${u}`
      ),
    };

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    const status = response.status;
    const text = await response.text();

    return new Response(
      JSON.stringify({ 
        success: status >= 200 && status < 300,
        indexnow_status: status,
        submitted_urls: urls.length,
        host: targetHost,
        response: text,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
