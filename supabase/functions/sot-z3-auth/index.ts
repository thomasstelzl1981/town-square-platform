/**
 * sot-z3-auth — Eigenständiges Auth-System für Zone 3 (Lennox & Friends)
 * Komplett getrennt von supabase.auth / Portal-Sessions.
 * 
 * Actions: signup, login, logout, validate
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

const PBKDF2_ITERATIONS = 100_000

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  )
  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('')
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts[0] !== 'pbkdf2' || parts.length !== 4) return false
  const iterations = parseInt(parts[1])
  const salt = new Uint8Array(parts[2].match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial, 256
  )
  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === parts[3]
}

function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const { action, ...payload } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── SIGNUP ──
    if (action === 'signup') {
      const { email, password, firstName, lastName } = payload
      if (!email || !password || !firstName) {
        return new Response(JSON.stringify({ error: 'Felder fehlen' }), { status: 400, headers: corsHeaders })
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('pet_z1_customers')
        .select('id, password_hash')
        .eq('email', email.toLowerCase().trim())
        .not('password_hash', 'is', null)
        .maybeSingle()

      if (existing) {
        return new Response(JSON.stringify({ error: 'E-Mail bereits registriert' }), { status: 409, headers: corsHeaders })
      }

      const salt = crypto.getRandomValues(new Uint8Array(16))
      const passwordHash = await hashPassword(password, salt)

      // Check if there's an existing Z1 customer without password (created by admin)
      const { data: existingNoPassword } = await supabase
        .from('pet_z1_customers')
        .select('id, tenant_id')
        .eq('email', email.toLowerCase().trim())
        .is('password_hash', null)
        .maybeSingle()

      let customerId: string
      let tenantId: string = 'a0000000-0000-4000-a000-000000000001'

      if (existingNoPassword) {
        // Update existing record with password
        await supabase
          .from('pet_z1_customers')
          .update({ password_hash: passwordHash, first_name: firstName, last_name: lastName || '' })
          .eq('id', existingNoPassword.id)
        customerId = existingNoPassword.id
        tenantId = existingNoPassword.tenant_id || tenantId
      } else {
        // Create new customer
        const { data: newCustomer, error: insertErr } = await supabase
          .from('pet_z1_customers')
          .insert({
            tenant_id: tenantId,
            email: email.toLowerCase().trim(),
            first_name: firstName,
            last_name: lastName || '',
            password_hash: passwordHash,
            source: 'website',
            status: 'new',
          })
          .select('id')
          .single()

        if (insertErr) {
          console.error('Signup insert error:', insertErr)
          return new Response(JSON.stringify({ error: 'Registrierung fehlgeschlagen', detail: insertErr.message }), { status: 500, headers: corsHeaders })
        }
        customerId = newCustomer.id
      }

      // Create session
      const sessionToken = generateSessionToken()
      const { error: sessionErr } = await supabase.from('pet_z3_sessions').insert({
        customer_id: customerId,
        session_token: sessionToken,
        tenant_id: tenantId,
      })
      if (sessionErr) {
        console.error('Signup session insert error:', sessionErr)
        return new Response(JSON.stringify({ error: 'Session konnte nicht erstellt werden', detail: sessionErr.message }), { status: 500, headers: corsHeaders })
      }

      // Return customer data
      const { data: customer } = await supabase
        .from('pet_z1_customers')
        .select('id, first_name, last_name, email, phone, address, city, postal_code')
        .eq('id', customerId)
        .single()

      return new Response(JSON.stringify({ session_token: sessionToken, customer }), { headers: corsHeaders })
    }

    // ── LOGIN ──
    if (action === 'login') {
      const { email, password } = payload
      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'E-Mail und Passwort erforderlich' }), { status: 400, headers: corsHeaders })
      }

      const { data: customer } = await supabase
        .from('pet_z1_customers')
        .select('id, first_name, last_name, email, phone, address, city, postal_code, password_hash, status, tenant_id')
        .eq('email', email.toLowerCase().trim())
        .not('password_hash', 'is', null)
        .maybeSingle()

      if (!customer || !customer.password_hash) {
        return new Response(JSON.stringify({ error: 'E-Mail oder Passwort falsch' }), { status: 401, headers: corsHeaders })
      }

      if (customer.status === 'blocked') {
        return new Response(JSON.stringify({ error: 'Account gesperrt' }), { status: 403, headers: corsHeaders })
      }

      const valid = await verifyPassword(password, customer.password_hash)
      if (!valid) {
        return new Response(JSON.stringify({ error: 'E-Mail oder Passwort falsch' }), { status: 401, headers: corsHeaders })
      }

      // Create session
      const sessionToken = generateSessionToken()
      const { error: sessionErr } = await supabase.from('pet_z3_sessions').insert({
        customer_id: customer.id,
        session_token: sessionToken,
        tenant_id: customer.tenant_id,
      })
      if (sessionErr) {
        console.error('Login session insert error:', sessionErr)
        return new Response(JSON.stringify({ error: 'Session konnte nicht erstellt werden', detail: sessionErr.message }), { status: 500, headers: corsHeaders })
      }

      const { password_hash: _, status: __, tenant_id: ___, ...safeCustomer } = customer
      return new Response(JSON.stringify({ session_token: sessionToken, customer: safeCustomer }), { headers: corsHeaders })
    }

    // ── LOGOUT ──
    if (action === 'logout') {
      const { session_token } = payload
      if (session_token) {
        await supabase.from('pet_z3_sessions').delete().eq('session_token', session_token)
      }
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // ── VALIDATE ──
    if (action === 'validate') {
      const { session_token } = payload
      if (!session_token) {
        return new Response(JSON.stringify({ valid: false }), { headers: corsHeaders })
      }

      const { data: session } = await supabase
        .from('pet_z3_sessions')
        .select('customer_id, expires_at')
        .eq('session_token', session_token)
        .maybeSingle()

      if (!session || new Date(session.expires_at) < new Date()) {
        // Clean up expired
        if (session) await supabase.from('pet_z3_sessions').delete().eq('session_token', session_token)
        return new Response(JSON.stringify({ valid: false }), { headers: corsHeaders })
      }

      const { data: customer } = await supabase
        .from('pet_z1_customers')
        .select('id, first_name, last_name, email, phone, address, city, postal_code, status')
        .eq('id', session.customer_id)
        .maybeSingle()

      if (!customer || customer.status === 'blocked') {
        return new Response(JSON.stringify({ valid: false }), { headers: corsHeaders })
      }

      const { status: _, ...safeCustomer } = customer
      return new Response(JSON.stringify({ valid: true, customer: safeCustomer }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })
  } catch (e) {
    const corsHeaders = getCorsHeaders(req)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
  }
})
