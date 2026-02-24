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
      // ═══════════════════════════════════════════════════════════
      // Category-aware execution: check if order has strategy mode
      // ═══════════════════════════════════════════════════════════
      const useStrategyMode = providerPlan.strategy_mode === true

      if (useStrategyMode) {
        // Strategy-ledger-based execution
        hasResults = await executeStrategyMode(supabase, supabaseUrl, supabaseKey, order, order_id)
      } else {
        // Legacy mode: provider-based execution (backward compatible)

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
      }

      // 4. Reload final state
      const { data: updatedOrder } = await supabase
        .from('research_orders')
        .select('results_count, cost_spent')
        .eq('id', order_id)
        .single()

      const finalResultsCount = updatedOrder?.results_count || 0

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
        execution_mode: useStrategyMode ? 'strategy' : 'legacy',
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

// ═══════════════════════════════════════════════════════════════════
// Strategy-mode: category-aware step-by-step execution
// ═══════════════════════════════════════════════════════════════════

async function executeStrategyMode(
  supabase: any,
  supabaseUrl: string,
  supabaseKey: string,
  order: any,
  orderId: string
): Promise<boolean> {
  const providerPlan = (order.provider_plan_json as any) || {}
  const categoryCode = providerPlan.category_code || order.category_code
  const tenantId = order.tenant_id

  if (!categoryCode) {
    console.error('Strategy mode requires category_code in provider_plan_json')
    return false
  }

  let hasResults = false
  const maxContacts = order.max_results || 25

  // 1. Get contacts for this order that need strategy execution
  const { data: orderResults } = await supabase
    .from('research_order_results')
    .select('id, contact_id, raw_data')
    .eq('order_id', orderId)
    .limit(maxContacts)

  const contactIds: string[] = (orderResults || [])
    .map((r: any) => r.contact_id)
    .filter(Boolean)

  // If no pre-existing contacts, resolve strategy for new discovery first
  if (contactIds.length === 0) {
    console.log(`Strategy mode: no contacts yet, running initial discovery for ${categoryCode}`)

    // Call strategy-resolver to get the pipeline
    const resolverResp = await fetch(`${supabaseUrl}/functions/v1/sot-research-strategy-resolver`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        contact_id: 'discovery', // placeholder
        category_code: categoryCode,
        tenant_id: tenantId,
      }),
    })

    if (resolverResp.ok) {
      const strategy = await resolverResp.json()
      const firstStep = strategy.next_step

      if (firstStep && (firstStep.provider === 'google_places' || firstStep.provider === 'apify_portal')) {
        // Run initial discovery via sot-research-engine
        const engineResp = await fetch(`${supabaseUrl}/functions/v1/sot-research-engine`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            intent: firstStep.provider === 'apify_portal' ? 'search_portals' : 'search_contacts',
            query: providerPlan.query || order.query || categoryCode,
            location: providerPlan.location || order.location,
            max_results: maxContacts,
            portal_config: firstStep.config?.portals
              ? { portal: firstStep.config.portals[0], search_type: 'brokers' }
              : undefined,
          }),
        })

        if (engineResp.ok) {
          const engineData = await engineResp.json()
          if (engineData.results?.length > 0) {
            hasResults = true
            console.log(`Strategy discovery found ${engineData.results.length} contacts`)
          }
        }
      }
    }

    return hasResults
  }

  // 2. For existing contacts: execute next pending steps
  let stepsExecuted = 0
  const maxStepsPerRun = 50 // budget guard

  for (const contactId of contactIds) {
    if (stepsExecuted >= maxStepsPerRun) break

    // Get ledger for this contact
    const { data: ledger } = await supabase
      .from('contact_strategy_ledger')
      .select('*')
      .eq('contact_id', contactId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!ledger) continue

    const pending = (ledger.steps_pending as any[]) || []
    if (pending.length === 0) continue

    const nextStep = pending[0]

    // Get contact data for context
    const { data: contact } = await supabase
      .from('contacts')
      .select('company_name, first_name, last_name, email, phone, website_url, city')
      .eq('id', contactId)
      .single()

    // Execute via strategy_step intent
    const stepResp = await fetch(`${supabaseUrl}/functions/v1/sot-research-engine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        intent: 'strategy_step',
        contact_id: contactId,
        tenant_id: tenantId,
        step_id: nextStep.step,
        ledger_id: ledger.id,
        contact_data: contact || {},
        location: contact?.city || providerPlan.location,
      }),
    })

    if (stepResp.ok) {
      const stepResult = await stepResp.json()
      if (stepResult.success && stepResult.results_count > 0) {
        hasResults = true
      }
      stepsExecuted++
    }
  }

  console.log(`Strategy mode completed: ${stepsExecuted} steps executed for ${contactIds.length} contacts`)
  return hasResults
}
