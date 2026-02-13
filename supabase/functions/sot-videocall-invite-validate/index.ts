import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function createLiveKitToken(
  apiKey: string, apiSecret: string,
  identity: string, roomName: string, ttlSeconds: number = 600
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey, sub: identity, iat: now, exp: now + ttlSeconds, nbf: now,
    video: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true },
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

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) throw new Error('LiveKit not configured');

    const body = await req.json();
    const { inviteId, token } = body;
    if (!inviteId || !token) throw new Error('Missing inviteId or token');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load invite
    const { data: invite } = await supabase
      .from('video_call_invites')
      .select('*, video_calls(*)')
      .eq('id', inviteId)
      .single();

    if (!invite) throw new Error('Invite not found');

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error('Invite expired');
    }

    // Check status
    if (invite.status === 'revoked') throw new Error('Invite revoked');

    // Verify token hash
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(token));
    const computedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedHash !== invite.token_hash) {
      throw new Error('Invalid token');
    }

    const call = invite.video_calls;
    if (!call || call.status === 'ended' || call.status === 'expired') {
      throw new Error('Call is no longer active');
    }

    // Update invite status
    await supabase
      .from('video_call_invites')
      .update({ status: 'joined', joined_at: new Date().toISOString() })
      .eq('id', inviteId);

    // Add participant
    await supabase.from('video_call_participants').insert({
      call_id: call.id,
      email: invite.invitee_email,
      display_name: invite.invitee_name || invite.invitee_email,
      role: 'guest',
    });

    // Get host name
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', call.host_user_id)
      .single();

    const hostName = hostProfile
      ? `${hostProfile.first_name || ''} ${hostProfile.last_name || ''}`.trim()
      : 'Host';

    // Generate guest token
    const guestToken = await createLiveKitToken(
      LIVEKIT_API_KEY, LIVEKIT_API_SECRET,
      invite.invitee_email, call.livekit_room_name, 600
    );

    const livekitUrl = Deno.env.get('LIVEKIT_URL') || '';

    return new Response(
      JSON.stringify({
        callId: call.id,
        roomName: call.livekit_room_name,
        guestToken,
        hostName,
        callTitle: call.title,
        livekitUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-videocall-invite-validate:', error);
    const status = (error instanceof Error && ['Invite expired', 'Invite revoked', 'Invalid token'].includes(error.message)) ? 403 : 500;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
