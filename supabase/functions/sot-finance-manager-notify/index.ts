/**
 * Edge Function: sot-finance-manager-notify
 * Sends notification email to customer when mandate is accepted.
 * Uses sot-system-mail-send for actual delivery.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  mandateId: string;
  managerId: string;
  notificationType?: 'mandate_accepted' | 'contract_available';
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

    // Get manager profile
    const { data: manager, error: managerError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', managerId)
      .single();

    if (managerError || !manager) {
      throw new Error(`Manager not found: ${managerError?.message}`);
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

    // Determine email content based on notification type
    let subject: string;
    let bodyHtml: string;

    if (notificationType === 'contract_available') {
      subject = 'Ihr Vertrag ist verfügbar';
      bodyHtml = `
        <p>Guten Tag ${applicant.first_name || 'Kunde'},</p>
        <p>Der Vertrag zu Ihrem Finanzierungsantrag (<strong>${request?.public_id}</strong>) steht nun in Ihrem Portal zur Verfügung.</p>
        <p><strong>Ihr Ansprechpartner:</strong><br/>
        ${manager.display_name || 'Finanzierungsmanager'}<br/>
        E-Mail: ${manager.email}</p>
        <p>Sie können den Vertrag und den Status Ihrer Anfrage jederzeit in Ihrem Portal unter "Finanzierung > Status" einsehen.</p>
        <p>Mit freundlichen Grüßen,<br/>Ihr Finanzierungsteam</p>
      `;
    } else {
      subject = 'Ihr Finanzierungsmanager wurde zugewiesen';
      bodyHtml = `
        <p>Guten Tag ${applicant.first_name || 'Kunde'},</p>
        <p>Ihr Finanzierungsantrag (<strong>${request?.public_id}</strong>) wurde einem Finanzierungsmanager zugewiesen.</p>
        <p><strong>Ihr Ansprechpartner:</strong><br/>
        ${manager.display_name || 'Finanzierungsmanager'}<br/>
        E-Mail: ${manager.email}</p>
        <p>Sie können den Status Ihrer Anfrage jederzeit in Ihrem Portal unter "Finanzierung > Status" einsehen.</p>
        <p>Mit freundlichen Grüßen,<br/>Ihr Finanzierungsteam</p>
      `;
    }

    // Send via sot-system-mail-send
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
          from_address: 'futureroom@systemofatown.com',
        }),
      });

      const mailResult = await mailResponse.json();
      console.log(`[sot-finance-manager-notify] Mail sent via sot-system-mail-send:`, mailResult);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification sent',
          mailResult,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (mailError) {
      // Fallback: log the email content if mail send fails
      console.error('[sot-finance-manager-notify] Mail send failed, logging content:', mailError);
      console.log(`To: ${applicant.email}, Subject: ${subject}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification logged (mail send fallback)',
          emailContent: { to: applicant.email, subject, bodyHtml },
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
