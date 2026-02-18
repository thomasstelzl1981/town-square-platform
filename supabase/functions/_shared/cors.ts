/**
 * Shared CORS configuration for Supabase Edge Functions
 * 
 * This replaces the insecure 'Access-Control-Allow-Origin: *' pattern
 * with origin validation against an allowlist.
 */

const ALLOWED_ORIGINS = [
  'https://kaufy.io',
  'https://www.kaufy.io',
  'https://miety.de',
  'https://www.miety.de',
  'https://futureroom.de',
  'https://www.futureroom.de',
  'https://systemofatown.com',
  'https://www.systemofatown.com',
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
]

/**
 * Check if origin matches a Lovable preview/published domain
 */
function isLovableOrigin(origin: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/.test(origin)
    || /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.app$/.test(origin)
    || /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin)
}

/**
 * Get CORS headers for edge function response
 * 
 * @param req - The incoming request
 * @returns Headers object with validated origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  
  // Check if origin is in allowlist
  const allowedOrigin = origin && (ALLOWED_ORIGINS.includes(origin) || isLovableOrigin(origin))
    ? origin 
    : ALLOWED_ORIGINS[0] // Default to first production origin
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  }
}

/**
 * Handle CORS preflight request
 * 
 * @param req - The incoming request
 * @returns Response for OPTIONS request
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response('ok', {
    headers: getCorsHeaders(req),
  })
}
