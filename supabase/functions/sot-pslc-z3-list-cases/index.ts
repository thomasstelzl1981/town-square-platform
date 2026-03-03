/**
 * sot-pslc-z3-list-cases — Secure Z3 case listing proxy
 * Returns only cases belonging to the validated Z3 customer.
 * @wave A (Security)
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { validateZ3Session, createServiceClient } from '../_shared/z3SessionValidator.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json()
    const { session_token } = body

    const session = await validateZ3Session(session_token)
    const supabase = createServiceClient()

    const { data: cases, error } = await supabase
      .from('pet_service_cases')
      .select('*')
      .eq('z3_customer_id', session.customer_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return new Response(JSON.stringify({ cases: cases || [] }), { headers: corsHeaders })
  } catch (err) {
    const status = err.message?.includes('Session') ? 401 : 500
    return new Response(JSON.stringify({ error: err.message }), { status, headers: corsHeaders })
  }
})
