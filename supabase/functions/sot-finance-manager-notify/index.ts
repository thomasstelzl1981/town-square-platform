/**
 * Edge Function: sot-finance-manager-notify
 * 
 * FLC W1: Sends TWO emails on mandate acceptance:
 * 1) CUSTOMER_INTRO — personalized intro of assigned manager to customer
 * 2) MANAGER_CONFIRM — confirmation + commission terms to manager
 * 
 * Both sends are idempotent (via finance_lifecycle_events).
 * Retry-safe: duplicate calls won't produce duplicate emails.
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

/** Write FLC event with idempotency (inline for Edge Function context) */
async function writeFLCEvent(
  supabase: any,
  params: {
    finance_request_id: string;
    finance_mandate_id?: string | null;
    event_type: string;
    event_source: string;
    idempotency_key: string;
    correlation_key?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('finance_lifecycle_events')
      .insert({
        finance_request_id: params.finance_request_id,
        finance_mandate_id: params.finance_mandate_id || null,
        event_type: params.event_type,
        actor_type: 'system',
        event_source: params.event_source,
        idempotency_key: params.idempotency_key,
        correlation_key: params.correlation_key || null,
        metadata: params.metadata || {},
      });
    if (error) {
      if (error.code === '23505') {
        // Already exists (idempotent) — means email was already sent
        return false; // signal: don't re-send
      }
      console.error(`[FLC] Event write failed (${params.event_type}):`, error.message);
      return true; // error but still allow send attempt
    }
    return true; // new event, proceed with send
  } catch (e) {
    console.error(`[FLC] Event write exception:`, e);
    return true;
  }
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

    // Get FULL manager profile
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
    const financeRequestId = request?.id;
    const publicId = request?.public_id || mandateId;

    const managerFullName = [manager.first_name, manager.last_name].filter(Boolean).join(' ') || manager.display_name || 'Finanzierungsmanager';
    const managerPhone = manager.phone_mobile || manager.phone_landline || '—';
    const managerCompany = manager.letterhead_company_line || '';

    const results: { customerEmail?: any; managerEmail?: any } = {};

    // ── FLC Event: MANAGER_ACCEPTED ─────────────────────────────
    if (financeRequestId) {
      await writeFLCEvent(supabase, {
        finance_request_id: financeRequestId,
        finance_mandate_id: mandateId,
        event_type: 'manager.accepted',
        event_source: 'edge_fn:sot-finance-manager-notify',
        idempotency_key: `manager_accepted:${mandateId}:${managerId}`,
        correlation_key: publicId,
        metadata: { manager_id: managerId, manager_name: managerFullName },
      });
    }

    // ══════════════════════════════════════════════════════════════
    // EMAIL 1: CUSTOMER INTRO
    // ══════════════════════════════════════════════════════════════
    if (applicant?.email && financeRequestId) {
      // Idempotency check via FLC event
      const shouldSendCustomer = await writeFLCEvent(supabase, {
        finance_request_id: financeRequestId,
        finance_mandate_id: mandateId,
        event_type: 'email.customer_intro_sent',
        event_source: 'edge_fn:sot-finance-manager-notify',
        idempotency_key: `email_customer_intro:${financeRequestId}`,
        correlation_key: publicId,
        metadata: { to: applicant.email, manager_name: managerFullName },
      });

      if (shouldSendCustomer) {
        const templateVars: Record<string, string> = {
          customer_name: applicant.first_name || 'Kunde',
          manager_name: managerFullName,
          manager_phone: managerPhone,
          manager_email: managerFromEmail,
          manager_company: managerCompany,
          public_id: publicId,
        };

        let subject: string;
        let bodyHtml: string;

        if (notificationType === 'contract_available') {
          subject = `Ihr Vertrag ist verfügbar — ${publicId}`;
          bodyHtml = `
            <p>Guten Tag ${applicant.first_name || 'Kunde'},</p>
            <p>Der Vertrag zu Ihrem Finanzierungsantrag (<strong>${publicId}</strong>) steht nun in Ihrem Portal zur Verfügung.</p>
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
            console.warn('[sot-finance-manager-notify] No DB template found, using fallback');
            subject = `Ihr Finanzierungsmanager stellt sich vor — ${publicId}`;
            bodyHtml = `
              <p>Guten Tag ${applicant.first_name || 'Kunde'},</p>
              <p>mein Name ist <strong>${managerFullName}</strong>, ich bin Ihr zugewiesener Finanzierungsmanager für Ihren Antrag <strong>${publicId}</strong>.</p>
              <p><strong>Meine Kontaktdaten:</strong><br/>
              Telefon: ${managerPhone}<br/>
              E-Mail: ${managerFromEmail}<br/>
              ${managerCompany}</p>
              <p>Ich melde mich umgehend bei Ihnen, sobald ich Ihre Anfrage prüfen konnte. Melden Sie sich gerne jederzeit bei mir!</p>
              <p>Mit freundlichen Grüßen,<br/>${managerFullName}</p>
            `;
          }
        }

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

          results.customerEmail = await mailResponse.json();
          console.log(`[sot-finance-manager-notify] Customer email sent to=${applicant.email}`);
        } catch (mailError) {
          console.error('[sot-finance-manager-notify] Customer email failed:', mailError);
          results.customerEmail = { success: false, error: String(mailError) };
        }
      } else {
        console.log('[sot-finance-manager-notify] Customer email already sent (idempotent skip)');
        results.customerEmail = { success: true, skipped: true, reason: 'idempotent' };
      }
    }

    // ══════════════════════════════════════════════════════════════
    // EMAIL 2: MANAGER CONFIRMATION (NEW in FLC W1)
    // ══════════════════════════════════════════════════════════════
    if (manager.email && financeRequestId && notificationType === 'mandate_accepted') {
      const shouldSendManager = await writeFLCEvent(supabase, {
        finance_request_id: financeRequestId,
        finance_mandate_id: mandateId,
        event_type: 'email.manager_confirm_sent',
        event_source: 'edge_fn:sot-finance-manager-notify',
        idempotency_key: `email_manager_confirm:${mandateId}`,
        correlation_key: publicId,
        metadata: { to: manager.email, manager_name: managerFullName },
      });

      if (shouldSendManager) {
        const customerName = [applicant?.first_name, applicant?.last_name].filter(Boolean).join(' ') || 'Kunde';
        const managerSubject = `Finanzierungsmandat angenommen — ${publicId}`;
        const managerBodyHtml = `
          <p>Hallo ${manager.first_name || managerFullName},</p>
          <p>Sie haben das Finanzierungsmandat <strong>${publicId}</strong> erfolgreich angenommen.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-weight: 600;">Mandatsdetails:</p>
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 4px 0; color: #6b7280;">Kunde:</td><td style="padding: 4px 0; font-weight: 500;">${customerName}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b7280;">Vorgangsnummer:</td><td style="padding: 4px 0; font-weight: 500;">${publicId}</td></tr>
              <tr><td style="padding: 4px 0; color: #6b7280;">Plattformanteil:</td><td style="padding: 4px 0; font-weight: 500;">25%</td></tr>
            </table>
          </div>
          
          <p>Der Kunde wurde soeben per E-Mail über Ihre Zuweisung informiert und erwartet Ihre Kontaktaufnahme.</p>
          <p>Sie finden alle Unterlagen und den Datenraum in Ihrem Finanzierungsmanager-Portal.</p>
          <p>Viel Erfolg!</p>
          <p>Mit freundlichen Grüßen,<br/><strong>System of a Town — Plattform</strong></p>
        `;

        try {
          const mailResponse = await fetch(`${supabaseUrl}/functions/v1/sot-system-mail-send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              to: manager.email,
              subject: managerSubject,
              html: managerBodyHtml,
              context: 'finance_manager_confirmation',
            }),
          });

          results.managerEmail = await mailResponse.json();
          console.log(`[sot-finance-manager-notify] Manager email sent to=${manager.email}`);
        } catch (mailError) {
          console.error('[sot-finance-manager-notify] Manager email failed:', mailError);
          results.managerEmail = { success: false, error: String(mailError) };
        }
      } else {
        console.log('[sot-finance-manager-notify] Manager email already sent (idempotent skip)');
        results.managerEmail = { success: true, skipped: true, reason: 'idempotent' };
      }
    }

    // ── FLC Event: COMMISSION_TERMS_ACCEPTED ─────────────────────
    if (financeRequestId && notificationType === 'mandate_accepted') {
      await writeFLCEvent(supabase, {
        finance_request_id: financeRequestId,
        finance_mandate_id: mandateId,
        event_type: 'commission.terms_accepted',
        event_source: 'edge_fn:sot-finance-manager-notify',
        idempotency_key: `commission_terms:${mandateId}`,
        correlation_key: publicId,
        metadata: { platform_share_pct: 25 },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications processed',
        results,
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
