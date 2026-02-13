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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const { order_id, result_ids, duplicate_policy = 'skip' } = await req.json()
    if (!order_id) throw new Error('order_id required')
    if (!result_ids?.length) throw new Error('result_ids required (at least 1)')

    // Load results to import
    const { data: results, error: resultsError } = await supabase
      .from('research_order_results')
      .select('*')
      .eq('order_id', order_id)
      .in('id', result_ids)
      .in('status', ['candidate', 'accepted'])

    if (resultsError) throw new Error(`Failed to load results: ${resultsError.message}`)
    if (!results?.length) throw new Error('No importable results found')

    const tenantId = results[0].tenant_id
    const imported: { result_id: string; contact_id: string; action: string }[] = []

    for (const result of results) {
      // 1. Dedupe matching: email > phone > name+company+city
      let existingContact: any = null
      let matchMethod = ''

      if (result.email) {
        const { data } = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', result.email)
          .limit(1)
        if (data?.length) {
          existingContact = data[0]
          matchMethod = 'email'
        }
      }

      if (!existingContact && result.phone) {
        const { data } = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('phone', result.phone)
          .limit(1)
        if (data?.length) {
          existingContact = data[0]
          matchMethod = 'phone'
        }
      }

      if (!existingContact && result.full_name && result.company_name) {
        const { data } = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .ilike('display_name', result.full_name)
          .ilike('company', result.company_name)
          .limit(1)
        if (data?.length) {
          existingContact = data[0]
          matchMethod = 'name+company'
        }
      }

      let contactId: string
      let action: string

      if (existingContact) {
        if (duplicate_policy === 'update') {
          // Update existing contact
          const updateData: any = {}
          if (result.email) updateData.email = result.email
          if (result.phone) updateData.phone = result.phone
          if (result.role) updateData.position = result.role
          if (result.linkedin_url) updateData.linkedin_url = result.linkedin_url
          if (result.location) updateData.city = result.location

          await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', existingContact.id)

          contactId = existingContact.id
          action = `updated (matched by ${matchMethod})`
        } else {
          // Skip
          contactId = existingContact.id
          action = `skipped (duplicate by ${matchMethod})`
        }
      } else {
        // Create new contact
        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert({
            tenant_id: tenantId,
            display_name: result.full_name || `${result.first_name || ''} ${result.last_name || ''}`.trim() || 'Unbekannt',
            first_name: result.first_name,
            last_name: result.last_name,
            email: result.email,
            phone: result.phone,
            company: result.company_name,
            position: result.role,
            city: result.location,
            linkedin_url: result.linkedin_url,
            source: 'research',
            category: 'prospect',
          })
          .select('id')
          .single()

        if (insertError) {
          console.error(`Failed to insert contact for result ${result.id}: ${insertError.message}`)
          continue
        }

        contactId = newContact.id
        action = 'created'
      }

      // Mark result as imported
      await supabase
        .from('research_order_results')
        .update({
          status: 'imported',
          imported_contact_id: contactId,
        })
        .eq('id', result.id)

      imported.push({ result_id: result.id, contact_id: contactId, action })
    }

    return new Response(JSON.stringify({
      success: true,
      imported_count: imported.filter(i => i.action !== 'skipped').length,
      skipped_count: imported.filter(i => i.action.startsWith('skipped')).length,
      details: imported,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
