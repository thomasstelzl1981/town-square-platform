/**
 * sot-pslc-z3-upload-photo — Secure photo upload proxy for Z3 customers
 * Validates Z3 session, verifies pet ownership, uploads to pet-photos bucket.
 * @wave F (Foto-Upload SSOT)
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { validateZ3Session, createServiceClient } from '../_shared/z3SessionValidator.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const formData = await req.formData()
    const sessionToken = formData.get('session_token') as string | null
    const petId = formData.get('pet_id') as string | null
    const photoType = formData.get('photo_type') as string | null // 'profile' or 'gallery'
    const file = formData.get('file') as File | null

    if (!petId || !file) {
      return new Response(JSON.stringify({ error: 'pet_id und file sind erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const session = await validateZ3Session(sessionToken)
    const supabase = createServiceClient()

    // Verify pet ownership
    const { data: pet } = await supabase
      .from('pets')
      .select('id, tenant_id')
      .eq('id', petId)
      .eq('z3_owner_id', session.customer_id)
      .maybeSingle()

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Tier nicht gefunden' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tenantId = pet.tenant_id
    const isProfile = photoType === 'profile'
    const fileName = isProfile
      ? 'profile.jpg'
      : `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const storagePath = isProfile
      ? `${tenantId}/${petId}/${fileName}`
      : `${tenantId}/${petId}/gallery/${fileName}`

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('pet-photos')
      .upload(storagePath, arrayBuffer, {
        upsert: isProfile,
        contentType: file.type || 'image/jpeg',
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pet-photos')
      .getPublicUrl(storagePath)

    const publicUrl = isProfile
      ? `${urlData.publicUrl}?t=${Date.now()}`
      : urlData.publicUrl

    // If profile photo, update the pet record
    if (isProfile) {
      await supabase.from('pets').update({ photo_url: publicUrl }).eq('id', petId)
    }

    return new Response(JSON.stringify({ url: publicUrl, type: photoType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('sot-pslc-z3-upload-photo error:', err)
    const status = (err as Error).message?.includes('Session') ? 401 : 500
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})