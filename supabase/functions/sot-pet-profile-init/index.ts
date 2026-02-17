import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { userId, email, firstName, lastName } = await req.json()

    if (!userId || !email || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('pet_z1_customers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ customer_id: existing.id, status: 'exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get or use default tenant — use the "internal" org as Lennox franchise tenant
    const { data: internalOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'internal')
      .maybeSingle()

    const tenantId = internalOrg?.id

    if (!tenantId) {
      // Fallback: use first org
      const { data: anyOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!anyOrg) {
        return new Response(JSON.stringify({ error: 'No tenant found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const finalTenantId = tenantId || (await supabase.from('organizations').select('id').limit(1).single()).data?.id

    const { data: customer, error } = await supabase
      .from('pet_z1_customers')
      .insert({
        user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        source: 'website',
        status: 'new',
        tenant_id: finalTenantId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ customer_id: customer.id, status: 'created' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
