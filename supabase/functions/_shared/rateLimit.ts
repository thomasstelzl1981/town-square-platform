/**
 * Shared Rate-Limiting Middleware for Edge Functions.
 * Tenant-scoped, function-scoped rate limiting using DB counter.
 * 
 * Usage in any Edge Function:
 *   import { checkRateLimit } from "../_shared/rateLimit.ts";
 *   const rl = await checkRateLimit(supabaseAdmin, { tenantId, functionName: "sot-xyz", maxPerMinute: 30 });
 *   if (!rl.allowed) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitOptions {
  tenantId: string;
  userId?: string;
  functionName: string;
  /** Max requests per window. Default: 60 */
  maxPerWindow?: number;
  /** Window size in seconds. Default: 60 (1 minute) */
  windowSeconds?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  currentCount: number;
}

/**
 * Check rate limit for a tenant+function combination.
 * Uses the rate_limit_counters table (auto-created if missing).
 * Returns { allowed, remaining, resetAt, currentCount }.
 */
export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const {
    tenantId,
    userId,
    functionName,
    maxPerWindow = 60,
    windowSeconds = 60,
  } = options;

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const key = userId ? `${tenantId}:${userId}:${functionName}` : `${tenantId}:${functionName}`;

  try {
    // Count recent calls within window
    const { count, error } = await supabaseAdmin
      .from("rate_limit_counters")
      .select("*", { count: "exact", head: true })
      .eq("counter_key", key)
      .gte("created_at", windowStart.toISOString());

    if (error) {
      // Table might not exist yet — fail open (allow request, log warning)
      console.warn("[RATE_LIMIT] Counter query failed (fail-open):", error.message);
      return { allowed: true, remaining: maxPerWindow, resetAt: new Date(now.getTime() + windowSeconds * 1000).toISOString(), currentCount: 0 };
    }

    const currentCount = count ?? 0;
    const allowed = currentCount < maxPerWindow;
    const remaining = Math.max(0, maxPerWindow - currentCount - (allowed ? 1 : 0));
    const resetAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();

    if (allowed) {
      // Record this request
      await supabaseAdmin.from("rate_limit_counters").insert({
        counter_key: key,
        tenant_id: tenantId,
        user_id: userId || null,
        function_name: functionName,
      });
    }

    return { allowed, remaining, resetAt, currentCount };
  } catch (err) {
    // Fail open — never block business logic due to rate-limit infra issues
    console.warn("[RATE_LIMIT] Exception (fail-open):", err);
    return { allowed: true, remaining: maxPerWindow, resetAt: new Date(now.getTime() + windowSeconds * 1000).toISOString(), currentCount: 0 };
  }
}

/**
 * Build standard 429 response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt,
    "Retry-After": "60",
  };
}
