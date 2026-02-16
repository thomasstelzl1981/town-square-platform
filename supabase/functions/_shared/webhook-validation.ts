/**
 * Webhook signature validation utilities
 * 
 * Provides HMAC-SHA256 signature verification for inbound webhooks
 * to prevent spoofing and ensure authenticity.
 */

/**
 * Verify webhook signature using HMAC-SHA256
 * 
 * @param payload - Raw request body as string
 * @param signature - Signature from request header
 * @param secret - Webhook secret from environment
 * @returns true if signature is valid, false otherwise
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false
  }
  
  // Create HMAC using Web Crypto API (Deno compatible)
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  )
  
  // Convert to hex string
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSignature)
}

/**
 * Timing-safe string comparison
 * 
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Extract and verify webhook signature from request
 * 
 * @param req - The incoming request
 * @param rawBody - Raw request body as string
 * @param secretEnvVar - Name of environment variable containing secret
 * @returns true if signature is valid
 */
export async function verifyRequestSignature(
  req: Request,
  rawBody: string,
  secretEnvVar: string
): Promise<boolean> {
  const signature = req.headers.get('x-webhook-signature')
  const secret = Deno.env.get(secretEnvVar)
  
  if (!secret) {
    console.error(`Missing webhook secret: ${secretEnvVar}`)
    return false
  }
  
  return verifyWebhookSignature(rawBody, signature, secret)
}
