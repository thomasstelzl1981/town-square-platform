/**
 * Edge Function: sot-finance-manager-notify
 * Sends notification email to customer when mandate is accepted
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mandateId, managerId } = await req.json() as NotifyRequest;

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

    // Log the notification (in production, send actual email via Resend/SendGrid)
    console.log('=== Finance Manager Notification ===');
    console.log(`To: ${applicant.email}`);
    console.log(`Subject: Ihr Finanzierungsmanager wurde zugewiesen`);
    console.log(`Manager: ${manager.display_name || manager.email}`);
    console.log(`Request: ${request?.public_id}`);

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, just log and return success
    
    // Example email content:
    const emailContent = {
      to: applicant.email,
      subject: 'Ihr Finanzierungsmanager wurde zugewiesen',
      body: `
        Guten Tag ${applicant.first_name || 'Kunde'},

        Ihr Finanzierungsantrag (${request?.public_id}) wurde einem Finanzierungsmanager zugewiesen.

        Ihr Ansprechpartner:
        ${manager.display_name || 'Finanzierungsmanager'}
        E-Mail: ${manager.email}

        Sie können den Status Ihrer Anfrage jederzeit in Ihrem Portal unter "Finanzierung > Status" einsehen.

        Mit freundlichen Grüßen,
        Ihr Finanzierungsteam
      `,
    };

    console.log('Email content:', emailContent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification logged (email integration pending)',
        emailContent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-finance-manager-notify:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
