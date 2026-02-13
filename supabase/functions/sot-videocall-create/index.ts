import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Minimal LiveKit JWT generation (no external SDK needed in Deno)
async function createLiveKitToken(
  apiKey: string,
  apiSecret: string,
  identity: string,
  roomName: string,
  ttlSeconds: number = 600
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: identity,
    iat: now,
    exp: now + ttlSeconds,
    nbf: now,
    video: {
      roomCreate: true,
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    },
    jti: crypto.randomUUID(),
  };

  const enc = new TextEncoder();
  const b64url = (data: Uint8Array) => {
    let s = "";
    for (const b of data) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const b64urlStr = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = b64urlStr(JSON.stringify(header));
  const payloadB64 = b64urlStr(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw", enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
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

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error('LiveKit credentials not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY;
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get tenant
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) throw new Error('No organization found');

    const body = await req.json();
    const title = body.title || 'Videocall';
    const roomName = `sot-${crypto.randomUUID().slice(0, 8)}`;

    // Create call
    const { data: call, error: insertError } = await supabase
      .from('video_calls')
      .insert({
        tenant_id: membership.organization_id,
        host_user_id: user.id,
        title,
        status: 'active',
        livekit_room_name: roomName,
        starts_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // Add host as participant
    await supabase.from('video_call_participants').insert({
      call_id: call.id,
      user_id: user.id,
      display_name: user.email,
      role: 'host',
    });

    // Generate LiveKit token
    const hostToken = await createLiveKitToken(
      LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
      user.email || user.id, roomName, 600
    );

    const livekitUrl = Deno.env.get('LIVEKIT_URL') || '';

    return new Response(
      JSON.stringify({ callId: call.id, roomName, hostToken, livekitUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-videocall-create:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
