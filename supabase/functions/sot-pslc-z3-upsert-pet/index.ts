/**
 * sot-pslc-z3-upsert-pet — Secure Z3 pet CRUD via SSOT `pets` table
 * Creates/updates pets with z3_owner_id linkage.
 * @wave E (Hundeakte SSOT)
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { validateZ3Session, createServiceClient } from '../_shared/z3SessionValidator.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json()
    const { session_token, action, pet_id, pet_data } = body

    const session = await validateZ3Session(session_token)
    const supabase = createServiceClient()

    // DELETE action
    if (action === 'delete' && pet_id) {
      // Verify ownership
      const { data: existing } = await supabase
        .from('pets')
        .select('id')
        .eq('id', pet_id)
        .eq('z3_owner_id', session.customer_id)
        .maybeSingle()

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Tier nicht gefunden' }), { status: 404, headers: corsHeaders })
      }

      const { error } = await supabase.from('pets').delete().eq('id', pet_id)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
    }

    // CREATE or UPDATE
    if (!pet_data?.name) {
      return new Response(JSON.stringify({ error: 'Name erforderlich' }), { status: 400, headers: corsHeaders })
    }

    const payload: Record<string, unknown> = {
      name: pet_data.name,
      species: pet_data.species || 'dog',
      breed: pet_data.breed || null,
      gender: pet_data.gender || 'unknown',
      birth_date: pet_data.birth_date || null,
      weight_kg: pet_data.weight_kg || null,
      chip_number: pet_data.chip_number || null,
      neutered: pet_data.neutered || false,
      vet_name: pet_data.vet_name || null,
      allergies: pet_data.allergies?.length ? pet_data.allergies : null,
      notes: pet_data.notes || null,
    }

    if (pet_id) {
      // UPDATE — verify ownership
      const { data: existing } = await supabase
        .from('pets')
        .select('id')
        .eq('id', pet_id)
        .eq('z3_owner_id', session.customer_id)
        .maybeSingle()

      if (!existing) {
        return new Response(JSON.stringify({ error: 'Tier nicht gefunden' }), { status: 404, headers: corsHeaders })
      }

      const { data: updated, error } = await supabase
        .from('pets')
        .update(payload)
        .eq('id', pet_id)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ pet: updated }), { headers: corsHeaders })
    } else {
      // CREATE
      payload.z3_owner_id = session.customer_id
      payload.tenant_id = session.tenant_id
      payload.status = 'active'

      const { data: created, error } = await supabase
        .from('pets')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ pet: created }), { headers: corsHeaders })
    }
  } catch (err) {
    console.error('sot-pslc-z3-upsert-pet error:', err)
    const status = err.message?.includes('Session') ? 401 : 500
    return new Response(JSON.stringify({ error: err.message }), { status, headers: corsHeaders })
  }
})
