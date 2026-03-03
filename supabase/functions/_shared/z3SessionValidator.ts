/**
 * Z3 Session Validator — Shared helper for PSLC edge functions
 * Validates a Z3 session token and returns the customer_id.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface Z3ValidatedSession {
  customer_id: string;
  tenant_id: string;
}

/**
 * Validate a Z3 session token and return the customer_id + tenant_id.
 * Throws if invalid.
 */
export async function validateZ3Session(sessionToken: string | null | undefined): Promise<Z3ValidatedSession> {
  if (!sessionToken) {
    throw new Error('Session-Token fehlt');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: session, error } = await supabase
    .from('pet_z3_sessions')
    .select('customer_id, tenant_id, expires_at')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (error || !session) {
    throw new Error('Ungültige oder abgelaufene Session');
  }

  // Check expiry if set
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    throw new Error('Session abgelaufen');
  }

  return {
    customer_id: session.customer_id,
    tenant_id: session.tenant_id || 'a0000000-0000-4000-a000-000000000001',
  };
}

/**
 * Create a service-role Supabase client for secure DB operations.
 */
export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}
