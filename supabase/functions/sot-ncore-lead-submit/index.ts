/**
 * sot-ncore-lead-submit — Public edge function for Ncore & Otto² Advisory contact forms
 * Creates leads in Zone 1 pool with proper source tagging
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Determine source based on brand and type
    const brandKey = brand || 'ncore';
    let leadSource: string;
    let interestType: string;

    if (brandKey === 'otto') {
      leadSource = 'otto_advisory_kontakt';
      interestType = 'beratung';
    } else {
      leadSource = type === 'kooperation' ? 'ncore_kooperation' : 'ncore_projekt';
      interestType = type === 'kooperation' ? 'kooperation' : 'beratung';
    }

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
      // Fallback: use first internal org
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
    const brandLabel = brandKey === 'otto' ? 'Otto² Advisory' : 'Ncore';
    const typeLabel = type === 'kooperation' ? 'Kooperationsanfrage' : 'Projektanfrage';

    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenantId,
        source: leadSource,
        status: 'new',
        interest_type: interestType,
        zone1_pool: true,
        contact_id: contactId || null,
        notes: `[${brandLabel} Website — ${typeLabel}]\nName: ${name}\nE-Mail: ${email}\nTelefon: ${phone || 'k.A.'}\nUnternehmen: ${company || 'k.A.'}\n\n${message}`,
      });

    if (leadError) {
      console.error('Lead creation error:', leadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lead created: ${leadSource} from ${email}`);

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
