/**
 * sot-project-landing-lead — Secure lead capture for Zone 3 project landing pages
 * 
 * Accepts { slug, name, email, phone?, message? }
 * Validates slug → finds landing_page → resolves tenant_id → inserts lead
 * No auth required (public endpoint for anonymous visitors)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { slug, name, email, phone, message } = await req.json()

    // Validate required fields
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ error: 'slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Name is required (min 2 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Resolve slug → landing_page → project → tenant_id
    const { data: lp, error: lpErr } = await supabase
      .from('landing_pages')
      .select('id, project_id, organization_id')
      .eq('slug', slug.trim())
      .in('status', ['draft', 'preview', 'active'])
      .maybeSingle()

    if (lpErr || !lp?.project_id) {
      return new Response(JSON.stringify({ error: 'Landing page not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: project } = await supabase
      .from('dev_projects')
      .select('id, name, tenant_id')
      .eq('id', lp.project_id)
      .maybeSingle()

    const tenantId = project?.tenant_id || lp.organization_id
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Cannot resolve tenant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build notes
    const notes = [
      `[Projekt-Landing: ${project?.name || slug}]`,
      `Name: ${name.trim()}`,
      `E-Mail: ${email.trim()}`,
      phone ? `Telefon: ${phone.trim()}` : '',
      message ? `Nachricht: ${message.trim()}` : '',
    ].filter(Boolean).join('\n')

    // Insert lead
    const { error: insertErr } = await supabase.from('leads').insert({
      source: `project_landing_${slug}`,
      notes,
      status: 'new',
      tenant_id: tenantId,
      interest_type: 'kaufinteresse',
      zone1_pool: true,
    })

    if (insertErr) {
      console.error('[sot-project-landing-lead] Insert error:', insertErr)
      return new Response(JSON.stringify({ error: 'Failed to save lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[sot-project-landing-lead] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
