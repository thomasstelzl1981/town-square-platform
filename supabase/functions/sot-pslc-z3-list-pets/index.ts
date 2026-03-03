/**
 * sot-pslc-z3-list-pets — Secure Z3 pet listing from SSOT `pets` table
 * Returns only pets belonging to the validated Z3 customer.
 * @wave E (Hundeakte SSOT)
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

    const { data: pets, error } = await supabase
      .from('pets')
      .select('*')
      .eq('z3_owner_id', session.customer_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return new Response(JSON.stringify({ pets: pets || [] }), { headers: corsHeaders })
  } catch (err) {
    const status = err.message?.includes('Session') ? 401 : 500
    return new Response(JSON.stringify({ error: err.message }), { status, headers: corsHeaders })
  }
})
