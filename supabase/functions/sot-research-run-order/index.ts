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

    const { order_id } = await req.json()
    if (!order_id) throw new Error('order_id required')

    // Load & validate order
    const { data: order, error: orderError } = await supabase
      .from('research_orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.status !== 'queued') throw new Error(`Order status must be 'queued', got '${order.status}'`)
    if (!order.consent_confirmed) throw new Error('Consent not confirmed')
    if (!order.max_results || order.max_results < 1) throw new Error('max_results must be set')

    // Set to running
    await supabase
      .from('research_orders')
      .update({ status: 'running' })
      .eq('id', order_id)

    const providerPlan = (order.provider_plan_json as any) || {}
    let hasResults = false

    try {
      // 1. Firecrawl extraction (if enabled)
      if (providerPlan.firecrawl !== false) {
        const fcResponse = await fetch(`${supabaseUrl}/functions/v1/sot-research-firecrawl-extract`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            order_id,
            query_seeds: providerPlan.settings?.firecrawl?.query_seeds || [],
            target_domains: providerPlan.settings?.firecrawl?.target_domains || [],
            page_limit: providerPlan.settings?.firecrawl?.page_limit || 5,
          }),
        })

        // Pass through the auth header from the original request
        // But use service role for internal calls
        if (!fcResponse.ok) {
          const errText = await fcResponse.text()
          console.error(`Firecrawl extract failed: ${errText}`)
        } else {
          const fcData = await fcResponse.json()
          if (fcData.results_extracted > 0) hasResults = true
        }
      }

      // 2. Apollo (stub - feature flag)
      if (providerPlan.apollo === true) {
        console.log('Apollo provider enabled but not yet implemented (feature flag)')
      }

      // 3. Epify (stub - feature flag)
      if (providerPlan.epify === true) {
        console.log('Epify provider enabled but not yet implemented (feature flag)')
      }

      // 4. Reload final state
      const { data: updatedOrder } = await supabase
        .from('research_orders')
        .select('results_count, cost_spent')
        .eq('id', order_id)
        .single()

      const finalResultsCount = updatedOrder?.results_count || 0
      const needsReview = finalResultsCount > 0

      // Check if any results have low confidence
      const { data: lowConfidence } = await supabase
        .from('research_order_results')
        .select('id')
        .eq('order_id', order_id)
        .lt('confidence_score', 60)
        .limit(1)

      const finalStatus = !hasResults && finalResultsCount === 0
        ? 'failed'
        : lowConfidence?.length
          ? 'needs_review'
          : 'done'

      await supabase
        .from('research_orders')
        .update({ status: finalStatus })
        .eq('id', order_id)

      return new Response(JSON.stringify({
        success: true,
        status: finalStatus,
        results_count: finalResultsCount,
        cost_spent: updatedOrder?.cost_spent || 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (providerError) {
      // On provider error, set to failed
      await supabase
        .from('research_orders')
        .update({ status: 'failed' })
        .eq('id', order_id)

      throw providerError
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
