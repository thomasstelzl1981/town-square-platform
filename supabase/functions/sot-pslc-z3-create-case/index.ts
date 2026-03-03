/**
 * sot-pslc-z3-create-case — Secure Z3 case creation proxy
 * 
 * Validates Z3 session, computes pricing from pet_services SSOT,
 * and creates case + initial event with service_role.
 * 
 * @wave A (Security) + C (Pricing)
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { validateZ3Session, createServiceClient } from '../_shared/z3SessionValidator.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json()
    const {
      session_token,
      provider_id,
      service_id,
      scheduled_start,
      scheduled_end,
      pet_id,
      customer_notes,
    } = body

    // 1. Validate Z3 session
    const session = await validateZ3Session(session_token)
    const supabase = createServiceClient()

    // 2. Validate provider exists
    const { data: provider, error: provErr } = await supabase
      .from('pet_providers')
      .select('id, tenant_id, company_name')
      .eq('id', provider_id)
      .single()

    if (provErr || !provider) {
      return new Response(JSON.stringify({ error: 'Anbieter nicht gefunden' }), { status: 404, headers: corsHeaders })
    }

    // 3. Look up service for pricing (if service_id provided)
    let totalPriceCents = 0
    let serviceData: Record<string, unknown> | null = null

    if (service_id) {
      const { data: service } = await supabase
        .from('pet_services')
        .select('id, title, price_cents, price_type, category, provider_id')
        .eq('id', service_id)
        .eq('provider_id', provider_id)
        .eq('is_active', true)
        .single()

      if (service) {
        serviceData = service
        // Compute price: price_cents × days (minimum 1 day)
        let days = 1
        if (scheduled_start && scheduled_end) {
          const start = new Date(scheduled_start)
          const end = new Date(scheduled_end)
          days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        }
        totalPriceCents = (service.price_cents || 0) * days
      }
    }

    // 4. Get customer info for display
    const { data: customer } = await supabase
      .from('pet_z1_customers')
      .select('first_name, last_name, email')
      .eq('id', session.customer_id)
      .single()

    const customerName = customer
      ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
      : null

    const now = new Date().toISOString()
    const platformFeePct = 7.5

    // 5. Create the case
    const { data: newCase, error: caseErr } = await supabase
      .from('pet_service_cases')
      .insert({
        customer_user_id: null,
        z3_customer_id: session.customer_id,
        customer_email: customer?.email || null,
        customer_name: customerName,
        provider_id: provider_id,
        service_type: serviceData?.category || 'pension',
        service_id: service_id || null,
        pet_id: pet_id || null,
        current_phase: 'provider_selected',
        phase_entered_at: now,
        total_price_cents: totalPriceCents,
        deposit_cents: 0,
        platform_fee_pct: platformFeePct,
        pricing_snapshot_at: now,
        pricing_snapshot: serviceData ? {
          service_id: serviceData.id,
          price_cents: serviceData.price_cents,
          price_type: serviceData.price_type,
          category: serviceData.category,
          title: serviceData.title,
          computed_days: scheduled_start && scheduled_end
            ? Math.max(1, Math.ceil((new Date(scheduled_end).getTime() - new Date(scheduled_start).getTime()) / (1000 * 60 * 60 * 24)))
            : 1,
          computed_total: totalPriceCents,
        } : null,
        scheduled_start: scheduled_start || null,
        scheduled_end: scheduled_end || null,
        customer_notes: customer_notes || null,
        tenant_id: provider.tenant_id,
      })
      .select()
      .single()

    if (caseErr) {
      console.error('Case creation error:', caseErr)
      return new Response(JSON.stringify({ error: 'Buchung konnte nicht erstellt werden', detail: caseErr.message }), { status: 500, headers: corsHeaders })
    }

    // 6. Log initial event with idempotency
    const idempotencyKey = `${newCase.id}:provider.selected:initial`
    const { error: eventErr } = await supabase
      .from('pet_lifecycle_events')
      .insert({
        case_id: newCase.id,
        event_type: 'provider.selected',
        phase_before: null,
        phase_after: 'provider_selected',
        actor_id: session.customer_id,
        actor_type: 'customer',
        event_source: 'edge_fn:z3',
        idempotency_key: idempotencyKey,
        correlation_key: newCase.id,
        payload: {
          service_id,
          service_title: serviceData?.title || null,
          total_price_cents: totalPriceCents,
          scheduled_start,
          scheduled_end,
          z3: true,
        },
      })

    if (eventErr) {
      console.error('Event logging failed:', eventErr)
    }

    return new Response(JSON.stringify({
      case_id: newCase.id,
      total_price_cents: totalPriceCents,
      platform_fee_pct: platformFeePct,
      provider_name: provider.company_name,
      phase: 'provider_selected',
    }), { headers: corsHeaders })

  } catch (err) {
    console.error('sot-pslc-z3-create-case error:', err)
    const status = err.message?.includes('Session') ? 401 : 500
    return new Response(JSON.stringify({ error: err.message || 'Interner Fehler' }), { status, headers: corsHeaders })
  }
})
