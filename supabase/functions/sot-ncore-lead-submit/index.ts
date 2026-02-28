/**
 * sot-ncore-lead-submit — Public edge function for ALL Zone 3 brand contact forms
 * Creates leads in Zone 1 pool with proper source tagging + sends email notification
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Brand config: label, notification email, lead source prefix */
const BRAND_CONFIG: Record<string, { label: string; notifyEmail: string; sourcePrefix: string }> = {
  ncore:      { label: 'Ncore Business Consulting', notifyEmail: 'info@ncore.online',           sourcePrefix: 'ncore' },
  otto:       { label: 'Otto² Advisory',            notifyEmail: 'info@otto2advisory.com',       sourcePrefix: 'otto_advisory' },
  zlwohnbau:  { label: 'ZL Wohnbau',               notifyEmail: 'info@zl-wohnbau.de',           sourcePrefix: 'zlwohnbau' },
  kaufy:      { label: 'KAUFY',                    notifyEmail: 'info@kaufy.immo',              sourcePrefix: 'kaufy' },
  futureroom: { label: 'FutureRoom',               notifyEmail: 'info@futureroom.de',           sourcePrefix: 'futureroom' },
  acquiary:   { label: 'ACQUIARY',                 notifyEmail: 'info@acquiary.de',              sourcePrefix: 'acquiary' },
  lennox:     { label: 'Lennox & Friends',          notifyEmail: 'info@lennoxandfriends.app',    sourcePrefix: 'lennox' },
  sot:        { label: 'System of a Town',          notifyEmail: 'info@systemofatown.com',       sourcePrefix: 'sot' },
};

async function sendNotificationEmail(brand: typeof BRAND_CONFIG[string], payload: {
  name: string; email: string; phone?: string; company?: string; message: string; type?: string;
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set, skipping notification email');
    return;
  }

  const typeLabel = payload.type === 'kooperation' ? 'Kooperationsanfrage' : payload.type || 'Allgemein';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Neue Kontaktanfrage — ${brand.label}</h2>
        <p style="margin: 8px 0 0; opacity: 0.7; font-size: 14px;">${typeLabel}</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${payload.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">E-Mail</td><td style="padding: 8px 0;"><a href="mailto:${payload.email}" style="color: #2563eb;">${payload.email}</a></td></tr>
          ${payload.phone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Telefon</td><td style="padding: 8px 0;">${payload.phone}</td></tr>` : ''}
          ${payload.company ? `<tr><td style="padding: 8px 0; color: #6b7280;">Unternehmen</td><td style="padding: 8px 0;">${payload.company}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Nachricht</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${payload.message}</p>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">Dieser Lead wurde automatisch im Zone 1 Pool erstellt.</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${brand.label} Kontakt <noreply@systemofatown.com>`,
        to: [brand.notifyEmail],
        reply_to: payload.email,
        subject: `Neue Anfrage von ${payload.name} — ${brand.label}`,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
    } else {
      console.log(`Notification email sent to ${brand.notifyEmail}`);
    }
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { type, name, email, phone, company, message, brand } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Name, E-Mail und Nachricht sind erforderlich.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve brand config
    const brandKey = brand || 'ncore';
    const brandCfg = BRAND_CONFIG[brandKey] || BRAND_CONFIG.ncore;

    const leadSource = `${brandCfg.sourcePrefix}_${type || 'kontakt'}`;
    const interestType = type === 'kooperation' ? 'kooperation' : 'beratung';

    // Find or create the platform org for website leads
    let tenantId: string;
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'ncore-website')
      .maybeSingle();

    if (existingOrg) {
      tenantId = existingOrg.id;
    } else {
      const { data: fallbackOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('org_type', 'internal')
        .limit(1)
        .maybeSingle();

      if (!fallbackOrg) {
        return new Response(
          JSON.stringify({ error: 'No organization configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      tenantId = fallbackOrg.id;
    }

    // Create contact if not exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    let contactId = existingContact?.id;

    if (!contactId) {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(' ') || null;

      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          tenant_id: tenantId,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone || null,
          company: company || null,
          source: 'website',
        })
        .select('id')
        .maybeSingle();

      if (contactError) {
        console.error('Contact creation error:', contactError);
      } else {
        contactId = newContact?.id;
      }
    }

    // Create lead
    const typeLabel = type || 'Kontaktanfrage';

    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenantId,
        source: leadSource,
        status: 'new',
        interest_type: interestType,
        zone1_pool: true,
        contact_id: contactId || null,
        notes: `[${brandCfg.label} Website — ${typeLabel}]\nName: ${name}\nE-Mail: ${email}\nTelefon: ${phone || 'k.A.'}\nUnternehmen: ${company || 'k.A.'}\n\n${message}`,
      });

    if (leadError) {
      console.error('Lead creation error:', leadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lead created: ${leadSource} from ${email}`);

    // Send notification email (fire & forget)
    sendNotificationEmail(brandCfg, { name, email, phone, company, message, type }).catch(err =>
      console.error('Notification failed:', err)
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lead submit error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
