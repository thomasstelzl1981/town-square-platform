import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function createLiveKitToken(
  apiKey: string, apiSecret: string,
  identity: string, roomName: string, ttlSeconds: number = 7200
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey, sub: identity, iat: now, exp: now + ttlSeconds, nbf: now,
    video: { roomCreate: true, roomJoin: true, room: roomName, canPublish: true, canSubscribe: true },
    jti: crypto.randomUUID(),
  };
  const enc = new TextEncoder();
  const b64url = (data: Uint8Array) => {
    let s = ""; for (const b of data) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const b64urlStr = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey("raw", enc.encode(apiSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(signingInput)));
  return `${signingInput}.${b64url(sig)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) throw new Error('LiveKit credentials not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY;
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { callId } = body;
    if (!callId) throw new Error('Missing callId');

    // Load existing call
    const { data: call } = await supabase
      .from('video_calls')
      .select('id, host_user_id, livekit_room_name, title, status')
      .eq('id', callId)
      .single();

    if (!call) throw new Error('Call not found');
    if (call.host_user_id !== user.id) throw new Error('Not authorized — only the host can rejoin');
    if (call.status === 'ended' || call.status === 'expired') throw new Error('Call is no longer active');

    // Generate fresh token for EXISTING room
    const hostToken = await createLiveKitToken(
      LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
      user.email || user.id, call.livekit_room_name, 7200
    );

    const livekitUrl = Deno.env.get('LIVEKIT_URL') || '';

    return new Response(
      JSON.stringify({ callId: call.id, roomName: call.livekit_room_name, hostToken, livekitUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-videocall-rejoin:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
