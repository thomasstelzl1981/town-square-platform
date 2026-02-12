import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DOCUMENT_CHECKLIST = [
  'Gehaltsabrechnungen der letzten 3 Monate',
  'Letzter Einkommensteuerbescheid',
  'Ausgefüllte Selbstauskunft (wird Ihnen separat zugesandt)',
  'Kontoauszüge der letzten 3 Monate',
  'Personalausweis/Reisepass (Kopie)',
  'Nachweis Eigenkapital (Depotauszug, Kontoauszug)',
  'Kaufvertragsentwurf (sofern vorhanden)',
  'Grundbuchauszug (sofern vorhanden)',
  'Exposé / Objektunterlagen',
];

function buildConfirmationEmailHtml(params: {
  firstName: string;
  publicId: string;
  objectAddress: string;
  purchasePrice: number;
  loanAmount: number;
  monthlyRate: number;
}) {
  const fmt = (v: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
  const checklistHtml = DOCUMENT_CHECKLIST.map(d => `<li style="margin-bottom:6px;">${d}</li>`).join('');

  return `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a8a6e 0%, #3ecfa5 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Ihre Finanzierungsanfrage</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Vorgangsnummer: ${params.publicId}</p>
  </div>
  
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
    <p>Hallo ${params.firstName},</p>
    
    <p>vielen Dank für Ihre Finanzierungsanfrage! Wir haben Ihre Daten erhalten und beginnen umgehend mit der Vorprüfung.</p>
    
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-weight: 600;">Ihre Eckdaten:</p>
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 4px 0; color: #6b7280;">Objekt:</td><td style="padding: 4px 0; font-weight: 500;">${params.objectAddress}</td></tr>
        <tr><td style="padding: 4px 0; color: #6b7280;">Kaufpreis:</td><td style="padding: 4px 0; font-weight: 500;">${fmt(params.purchasePrice)}</td></tr>
        <tr><td style="padding: 4px 0; color: #6b7280;">Darlehen:</td><td style="padding: 4px 0; font-weight: 500;">${fmt(params.loanAmount)}</td></tr>
        <tr><td style="padding: 4px 0; color: #6b7280;">Monatliche Rate:</td><td style="padding: 4px 0; font-weight: 500;">${fmt(params.monthlyRate)}</td></tr>
      </table>
    </div>
    
    <h3 style="margin: 24px 0 12px; font-size: 16px;">📎 Benötigte Unterlagen</h3>
    <p style="font-size: 14px; color: #6b7280;">Damit wir Ihre Finanzierung zügig bearbeiten können, benötigen wir folgende Dokumente:</p>
    <ol style="font-size: 14px; padding-left: 20px;">
      ${checklistHtml}
    </ol>
    
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; font-size: 14px;">📩 So senden Sie uns Ihre Unterlagen:</p>
      <p style="margin: 8px 0 0; font-size: 14px;">
        Bitte senden Sie die Dokumente als PDF oder Foto per E-Mail an:<br>
        <a href="mailto:finanzierung@futureroom.com?subject=Unterlagen ${params.publicId}" style="color: #1a8a6e; font-weight: 600;">finanzierung@futureroom.com</a><br>
        <span style="color: #6b7280; font-size: 13px;">Bitte geben Sie Ihre Vorgangsnummer <strong>${params.publicId}</strong> im Betreff an.</span>
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
      Ihr persönlicher Finanzierungsmanager wird sich nach Prüfung Ihrer Unterlagen bei Ihnen melden.
    </p>
    
    <p style="margin-top: 24px;">
      Mit freundlichen Grüßen,<br>
      <strong>Ihr FutureRoom Team</strong>
    </p>
  </div>
  
  <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 16px;">
    FutureRoom — Digitale Finanzierungsorchestrierung<br>
    Diese E-Mail wurde automatisch versendet. Bei Fragen antworten Sie direkt auf diese E-Mail.
  </p>
</body>
</html>`;
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
    const { contact, object, request, calculation, household, source, userId } = body;

    if (!contact?.email || !contact?.firstName) {
      return new Response(
        JSON.stringify({ error: 'Name und E-Mail sind erforderlich.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine source
    const requestSource = source || 'zone3_quick';

    // We need a tenant_id. Use the platform default tenant for website submissions.
    let tenantId: string;
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'FutureRoom Website')
      .maybeSingle();

    if (existingOrg) {
      tenantId = existingOrg.id;
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: 'FutureRoom Website', org_type: 'internal', slug: 'futureroom-website' })
        .select('id')
        .single();
      if (orgError) throw orgError;
      tenantId = newOrg.id;
    }

    // Generate public_id
    const publicId = `SOT-F-${Date.now().toString(36).toUpperCase()}`;

    // Create finance_request
    const { data: fr, error: frError } = await supabase
      .from('finance_requests')
      .insert({
        tenant_id: tenantId,
        status: 'submitted',
        source: requestSource,
        public_id: publicId,
        created_by: userId || null,
        purchase_price: request?.purchasePrice || null,
        equity_amount: request?.equityAmount || null,
        loan_amount_requested: request?.loanAmount || null,
        modernization_costs: request?.modernizationCosts || null,
        purpose: request?.purpose || null,
        max_monthly_rate: request?.maxMonthlyRate || null,
        fixed_rate_period_years: request?.fixedRatePeriod || null,
        repayment_rate_percent: request?.repaymentRate || null,
        object_type: object?.type || null,
        object_address: object?.address || null,
        object_living_area_sqm: object?.livingArea || null,
        object_construction_year: object?.constructionYear || null,
        object_location_quality: object?.locationQuality || null,
        contact_first_name: contact.firstName,
        contact_last_name: contact.lastName || null,
        contact_email: contact.email,
        contact_phone: contact.phone || null,
        applicant_snapshot: {
          contact,
          object,
          request,
          calculation,
          household,
          submitted_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (frError) throw frError;

    // Create finance_mandate
    const { error: fmError } = await supabase
      .from('finance_mandates')
      .insert({
        tenant_id: tenantId,
        finance_request_id: fr.id,
        status: 'new',
        source: requestSource,
        public_id: publicId,
      });

    if (fmError) {
      console.error('Mandate creation error:', fmError);
    }

    // ── Step 2: Create Lead in Zone 1 Pool ──────────────────────────────
    try {
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          tenant_id: tenantId,
          source: 'kaufy_website',
          status: 'new',
          interest_type: 'finanzierung',
          zone1_pool: true,
          notes: `Finanzierungsanfrage ${publicId} aus ${requestSource}. Objekt: ${object?.address || 'k.A.'}. Kaufpreis: ${request?.purchasePrice || 'k.A.'}€. Kontakt: ${contact.firstName} ${contact.lastName || ''} (${contact.email}).`,
        });
      if (leadError) {
        console.error('Lead creation error:', leadError);
      } else {
        console.log(`Lead created in Zone 1 pool for ${publicId}`);
      }
    } catch (e) {
      console.error('Lead creation failed:', e);
    }

    // ── Step 3: Create Storage Data Room ─────────────────────────────────
    const dataRoomPath = `${tenantId}/MOD_11/${fr.id}/.keep.pdf`;
    try {
      const keepContent = new TextEncoder().encode(
        `Datenraum für Finanzierungsanfrage ${publicId}\nErstellt: ${new Date().toISOString()}`
      );
      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(dataRoomPath, keepContent, {
          contentType: 'application/pdf',
          upsert: false,
        });
      if (uploadError) {
        console.error('Data room creation error:', uploadError);
      } else {
        console.log(`Data room created at ${dataRoomPath}`);
      }
    } catch (e) {
      console.error('Data room creation failed:', e);
    }

    // ── Step 4: Send Confirmation Email ──────────────────────────────────
    try {
      const emailHtml = buildConfirmationEmailHtml({
        firstName: contact.firstName,
        publicId,
        objectAddress: object?.address || 'Nicht angegeben',
        purchasePrice: request?.purchasePrice || 0,
        loanAmount: request?.loanAmount || 0,
        monthlyRate: calculation?.monthlyRate || 0,
      });

      const mailResponse = await fetch(`${supabaseUrl}/functions/v1/sot-system-mail-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: contact.email,
          subject: `Ihre Finanzierungsanfrage ${publicId} — Nächste Schritte`,
          html: emailHtml,
          context: 'futureroom_kaufy_confirmation',
          from_override: 'finanzierung@futureroom.com',
        }),
      });

      const mailResult = await mailResponse.json();
      if (mailResult.success) {
        console.log(`Confirmation email sent to ${contact.email}`);
      } else {
        console.error('Email send failed:', mailResult);
      }
    } catch (e) {
      console.error('Email send failed:', e);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicId,
        requestId: fr.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
