import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const { callId, inviteeEmail, inviteeName } = body;

    if (!callId || !inviteeEmail) throw new Error('Missing callId or inviteeEmail');

    // Verify host ownership
    const { data: call } = await supabase
      .from('video_calls')
      .select('id, title, host_user_id')
      .eq('id', callId)
      .single();

    if (!call || call.host_user_id !== user.id) {
      throw new Error('Not authorized — only the host can send invites');
    }

    // Generate random token (32 bytes hex)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // SHA-256 hash
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(token));
    const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // Insert invite
    const { data: invite, error: insertError } = await supabase
      .from('video_call_invites')
      .insert({
        call_id: callId,
        invited_by_user_id: user.id,
        invitee_email: inviteeEmail,
        invitee_name: inviteeName || null,
        token_hash: tokenHash,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // Build join link
    const origin = req.headers.get('origin') || 'https://systemofatown.com';
    const joinLink = `${origin}/portal/office/videocalls/join/${invite.id}?t=${token}`;

    // Get host profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const hostName = profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : user.email || 'Ein Nutzer';

    // Send email via sot-system-mail-send
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1a1a1a; font-size: 20px; margin: 0;">Videocall-Einladung</h2>
        </div>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">
          <strong>${hostName}</strong> lädt Sie zu einem Videocall ein${call.title ? `: <em>${call.title}</em>` : ''}.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${joinLink}" 
             style="display: inline-block; padding: 14px 36px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Videocall öffnen
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          Dieser Link ist 2 Stunden gültig. | System of a Town
        </p>
      </div>
    `;

    // Call sot-system-mail-send
    await fetch(`${SUPABASE_URL}/functions/v1/sot-system-mail-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: inviteeEmail,
        subject: `Videocall Einladung – ${call.title || 'System of a Town'}`,
        html: htmlBody,
        context: 'videocall_invite',
      }),
    });

    return new Response(
      JSON.stringify({ inviteId: invite.id, joinLink }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-videocall-invite-send:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
