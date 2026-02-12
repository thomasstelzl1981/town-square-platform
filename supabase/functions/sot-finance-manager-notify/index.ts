/**
 * Edge Function: sot-finance-manager-notify
 * Sends personalized notification email to customer when mandate is accepted.
 * Loads template from admin_email_templates (category='finance', name='FM Vorstellung').
 * Uses manager's outbound identity as sender via sot-system-mail-send.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotifyRequest {
  mandateId: string;
  managerId: string;
  notificationType?: 'mandate_accepted' | 'contract_available';
}

/** Replace {{placeholder}} tokens in a template string */
function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || '');
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mandateId, managerId, notificationType = 'mandate_accepted' } = await req.json() as NotifyRequest;

    if (!mandateId || !managerId) {
      throw new Error('mandateId and managerId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get mandate with request and applicant
    const { data: mandate, error: mandateError } = await supabase
      .from('finance_mandates')
      .select(`
        *,
        finance_requests (
          id,
          public_id,
          tenant_id,
          applicant_profiles (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('id', mandateId)
      .single();

    if (mandateError || !mandate) {
      throw new Error(`Mandate not found: ${mandateError?.message}`);
    }

    // Get FULL manager profile (including contact details for Visitenkarte)
    const { data: manager, error: managerError } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, email, phone_mobile, phone_landline, letterhead_company_line, street, house_number, postal_code, city')
      .eq('id', managerId)
      .single();

    if (managerError || !manager) {
      throw new Error(`Manager not found: ${managerError?.message}`);
    }

    // Resolve manager's outbound identity for From address
    const { data: identityRows } = await supabase.rpc('get_active_outbound_identity', {
      p_user_id: managerId,
    });

    let managerFromEmail = manager.email || 'futureroom@systemofatown.com';
    if (identityRows && identityRows.length > 0) {
      managerFromEmail = identityRows[0].from_email || managerFromEmail;
    }

    const request = mandate.finance_requests;
    const applicant = request?.applicant_profiles?.[0];

    if (!applicant?.email) {
      console.log('No applicant email found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No email to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build template variables
    const managerFullName = [manager.first_name, manager.last_name].filter(Boolean).join(' ') || manager.display_name || 'Finanzierungsmanager';
    const managerPhone = manager.phone_mobile || manager.phone_landline || '—';
    const managerCompany = manager.letterhead_company_line || '';

    const templateVars: Record<string, string> = {
      customer_name: applicant.first_name || 'Kunde',
      manager_name: managerFullName,
      manager_phone: managerPhone,
      manager_email: managerFromEmail,
      manager_company: managerCompany,
      public_id: request?.public_id || mandateId,
    };

    let subject: string;
    let bodyHtml: string;

    if (notificationType === 'contract_available') {
      subject = `Ihr Vertrag ist verfügbar — ${request?.public_id || ''}`;
      bodyHtml = `
        <p>Guten Tag ${applicant.first_name || 'Kunde'},</p>
        <p>Der Vertrag zu Ihrem Finanzierungsantrag (<strong>${request?.public_id}</strong>) steht nun in Ihrem Portal zur Verfügung.</p>
        <p><strong>Ihr Ansprechpartner:</strong><br/>
        ${managerFullName}<br/>
        Telefon: ${managerPhone}<br/>
        E-Mail: ${managerFromEmail}<br/>
        ${managerCompany}</p>
        <p>Sie können den Vertrag und den Status Ihrer Anfrage jederzeit in Ihrem Portal unter "Finanzierung > Status" einsehen.</p>
        <p>Mit freundlichen Grüßen,<br/>${managerFullName}</p>
      `;
    } else {
      // mandate_accepted → load template from DB
      const { data: template } = await supabase
        .from('admin_email_templates')
        .select('subject, body_html')
        .eq('category', 'finance')
        .eq('name', 'FM Vorstellung')
        .eq('is_active', true)
        .single();

      if (template) {
        subject = replaceTemplateVars(template.subject, templateVars);
        bodyHtml = replaceTemplateVars(template.body_html || '', templateVars);
        console.log('[sot-finance-manager-notify] Using DB template "FM Vorstellung"');
      } else {
        // Fallback if no template in DB
        console.warn('[sot-finance-manager-notify] No DB template found, using hardcoded fallback');
        subject = `Ihr Finanzierungsmanager stellt sich vor — ${request?.public_id || ''}`;
        bodyHtml = `
          <p>Guten Tag ${applicant.first_name || 'Kunde'},</p>
          <p>mein Name ist <strong>${managerFullName}</strong>, ich bin Ihr zugewiesener Finanzierungsmanager für Ihren Antrag <strong>${request?.public_id}</strong>.</p>
          <p><strong>Meine Kontaktdaten:</strong><br/>
          Telefon: ${managerPhone}<br/>
          E-Mail: ${managerFromEmail}<br/>
          ${managerCompany}</p>
          <p>Ich melde mich umgehend bei Ihnen, sobald ich Ihre Anfrage prüfen konnte. Melden Sie sich gerne jederzeit bei mir!</p>
          <p>Mit freundlichen Grüßen,<br/>${managerFullName}</p>
        `;
      }
    }

    // Send via sot-system-mail-send with manager's outbound identity
    try {
      const mailResponse = await fetch(`${supabaseUrl}/functions/v1/sot-system-mail-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: applicant.email,
          subject,
          html: bodyHtml,
          context: `finance_${notificationType}`,
          from_override: managerFromEmail,
        }),
      });

      const mailResult = await mailResponse.json();
      console.log(`[sot-finance-manager-notify] Mail sent from=${managerFromEmail} to=${applicant.email}:`, mailResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification sent',
          from: managerFromEmail,
          mailResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (mailError) {
      console.error('[sot-finance-manager-notify] Mail send failed:', mailError);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification logged (mail send fallback)',
          emailContent: { to: applicant.email, subject, bodyHtml, from: managerFromEmail },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in sot-finance-manager-notify:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
