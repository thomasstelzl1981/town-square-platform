/**
 * sot-manager-activate — Edge Function
 * 
 * Called by Zone 1 Admin when approving a manager application.
 * Steps:
 * 1. Create auth user (supabase.auth.admin.createUser)
 * 2. handle_new_user() trigger creates client tenant + 14 base modules
 * 3. Upgrade org_type to 'partner'
 * 4. Set membership role to requested manager role
 * 5. Activate manager tiles
 * 6. Update application status to 'approved'
 * 7. Send password-reset email so manager can set credentials
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Role → extra tile codes mapping
const ROLE_EXTRA_TILES: Record<string, string[]> = {
  sales_partner: ['MOD-09', 'MOD-10'],
  finance_manager: ['MOD-11'],
  akquise_manager: ['MOD-12'],
  project_manager: ['MOD-13'],
  pet_manager: ['MOD-22', 'MOD-10'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is platform_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check platform_admin role
    const { data: roleCheck } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', caller.id)
      .eq('role', 'platform_admin')
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Forbidden: platform_admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: 'application_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch application
    const { data: app, error: appErr } = await supabaseAdmin
      .from('manager_applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (appErr || !app) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (app.status === 'approved') {
      return new Response(JSON.stringify({ error: 'Already approved' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const applicantEmail = (app as any).applicant_email;
    const applicantName = (app as any).applicant_name || 'Manager';
    const requestedRole = app.requested_role;

    if (!applicantEmail) {
      return new Response(JSON.stringify({ error: 'No applicant email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Create auth user with temporary password
    const tempPassword = crypto.randomUUID().slice(0, 16) + 'A1!';
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: applicantEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: applicantName,
        source: 'manager_application',
        source_brand: (app as any).source_brand,
      },
    });

    if (createErr) {
      return new Response(JSON.stringify({ error: `User creation failed: ${createErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = newUser.user.id;

    // Wait for handle_new_user() trigger to create tenant
    await new Promise(r => setTimeout(r, 2000));

    // Step 2: Find the tenant created by handle_new_user()
    const { data: membership } = await supabaseAdmin
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership?.tenant_id) {
      return new Response(JSON.stringify({ error: 'Tenant not created by trigger' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = membership.tenant_id;

    // Step 3: Upgrade org_type to partner
    await supabaseAdmin
      .from('organizations')
      .update({ org_type: 'partner' })
      .eq('id', tenantId);

    // Step 4: Set membership role
    await supabaseAdmin
      .from('memberships')
      .update({ role: requestedRole })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    // Step 5: Activate manager tiles
    const extraTiles = ROLE_EXTRA_TILES[requestedRole] || [];
    for (const tileCode of extraTiles) {
      await supabaseAdmin.from('tenant_tile_activation').upsert(
        { tenant_id: tenantId, tile_code: tileCode, status: 'active' },
        { onConflict: 'tenant_id,tile_code' }
      );
    }

    // Step 6: Update application
    await supabaseAdmin
      .from('manager_applications')
      .update({
        status: 'approved',
        tenant_id: tenantId,
        user_id: userId,
        reviewed_by: caller.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    // Step 7: Send password reset email
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: applicantEmail,
    });

    return new Response(JSON.stringify({
      success: true,
      user_id: userId,
      tenant_id: tenantId,
      role: requestedRole,
      tiles_activated: extraTiles,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('sot-manager-activate error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
