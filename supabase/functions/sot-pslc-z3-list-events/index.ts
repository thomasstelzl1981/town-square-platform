/**
 * sot-pslc-z3-list-events — Secure Z3 event listing proxy
 * Returns events only for cases belonging to the validated Z3 customer.
 * @wave A (Security)
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { validateZ3Session, createServiceClient } from '../_shared/z3SessionValidator.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json()
    const { session_token, case_id } = body

    if (!case_id) {
      return new Response(JSON.stringify({ error: 'case_id fehlt' }), { status: 400, headers: corsHeaders })
    }

    const session = await validateZ3Session(session_token)
    const supabase = createServiceClient()

    // Verify case belongs to this customer
    const { data: caseData } = await supabase
      .from('pet_service_cases')
      .select('id, z3_customer_id')
      .eq('id', case_id)
      .eq('z3_customer_id', session.customer_id)
      .maybeSingle()

    if (!caseData) {
      return new Response(JSON.stringify({ error: 'Fall nicht gefunden oder kein Zugriff' }), { status: 403, headers: corsHeaders })
    }

    const { data: events, error } = await supabase
      .from('pet_lifecycle_events')
      .select('*')
      .eq('case_id', case_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return new Response(JSON.stringify({ events: events || [] }), { headers: corsHeaders })
  } catch (err) {
    const status = err.message?.includes('Session') ? 401 : 500
    return new Response(JSON.stringify({ error: err.message }), { status, headers: corsHeaders })
  }
})
