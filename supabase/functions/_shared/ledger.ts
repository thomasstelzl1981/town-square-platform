/**
 * Shared Data Event Ledger helper for Edge Functions.
 * Writes directly to data_event_ledger via Service Role (bypasses RLS).
 * Fire-and-forget: never blocks business logic.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface LedgerEvent {
  tenant_id?: string;
  zone: "Z1" | "Z2" | "Z3" | "EXTERN";
  actor_user_id?: string;
  actor_role?: string;
  event_type: string;
  direction: "ingress" | "egress" | "mutate" | "delete";
  source: string;
  entity_type?: string;
  entity_id?: string;
  payload?: Record<string, unknown>;
  ip_hash?: string;
  user_agent_hash?: string;
}

/**
 * Hash a string (IP or User-Agent) using SHA-256 for pseudonymization.
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

/**
 * Log a data event to the ledger. Fire-and-forget.
 * Uses Service Role client — bypasses RLS.
 * Optionally hashes IP and User-Agent from request.
 */
export async function logDataEvent(
  supabaseAdmin: SupabaseClient,
  event: LedgerEvent,
  req?: Request
): Promise<void> {
  try {
    let ip_hash = event.ip_hash;
    let user_agent_hash = event.user_agent_hash;

    if (req && !ip_hash) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") || null;
      if (ip) ip_hash = await hashString(ip);
    }

    if (req && !user_agent_hash) {
      const ua = req.headers.get("user-agent");
      if (ua) user_agent_hash = await hashString(ua);
    }

    await supabaseAdmin.from("data_event_ledger").insert({
      tenant_id: event.tenant_id || null,
      zone: event.zone,
      actor_user_id: event.actor_user_id || null,
      actor_role: event.actor_role || null,
      event_type: event.event_type,
      direction: event.direction,
      source: event.source,
      entity_type: event.entity_type || null,
      entity_id: event.entity_id || null,
      payload: event.payload || {},
      ip_hash: ip_hash || null,
      user_agent_hash: user_agent_hash || null,
    });
  } catch (err) {
    console.warn("[LEDGER] Failed to log event:", err);
  }
}
