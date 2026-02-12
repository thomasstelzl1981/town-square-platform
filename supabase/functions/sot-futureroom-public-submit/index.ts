import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
    // Find or create a "website" org
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
        .insert({ name: 'FutureRoom Website', type: 'platform' })
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
        status: 'submitted_to_zone1',
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
      // Non-fatal: the request was still created
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
