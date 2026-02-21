/**
 * sot-ki-browser — Edge Function for MOD-21 KI-Browser
 *
 * Phase 1 MVP: fetch-based research with guardrail engine,
 * credit preflight, and ledger integration.
 *
 * Actions:
 *   create_session  — Start a new browser research session
 *   close_session   — End session (normal/cancel)
 *   fetch_url       — Fetch URL content (text extraction)
 *   extract_content — Extract text/links/tables from fetched content
 *   summarize       — AI-powered summary with citations
 *   get_session     — Get session state + timeline
 *   propose_step    — Propose a step (guardrail classification)
 *   approve_step    — Approve a proposed step
 *   reject_step     — Reject a proposed step
 *   execute_step    — Execute an approved step
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Guardrail Engine ───────────────────────────────────────────────

interface GuardrailResult {
  risk_level: "safe_auto" | "confirm_needed" | "blocked";
  blocked_reason?: string;
}

const DENY_DOMAIN_PATTERNS = [
  /\.bank\.de$/i, /\.sparkasse\.de$/i, /\.volksbank\.de$/i,
  /paypal\.com$/i, /stripe\.com$/i, /klarna\.com$/i,
  /\.binance\./i, /\.coinbase\./i, /\.kraken\./i,
];

const DENY_IP_PATTERNS = [
  /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^metadata\.google\.internal$/i, /^169\.254\.169\.254$/,
];

const ALLOW_DOMAIN_PATTERNS = [
  /^docs\./i, /^wiki\./i, /^developer\./i, /^api\./i,
  /github\.com$/i, /stackoverflow\.com$/i,
  /\.gov\.de$/i, /\.bund\.de$/i, /gesetze-im-internet\.de$/i,
  /immobilienscout24\.de$/i, /immowelt\.de$/i,
];

const BLOCKED_INPUT_PATTERNS = [
  /password/i, /passwd/i, /pwd/i, /otp/i,
  /token/i, /secret/i, /pin/i, /captcha/i,
];

const BLOCKED_BUTTON_PATTERNS = [
  /delete/i, /loeschen/i, /löschen/i, /remove/i, /entfernen/i,
  /bezahlen/i, /pay/i, /checkout/i, /confirm.?payment/i,
];

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isDomainBlocked(domain: string): string | null {
  for (const pattern of DENY_DOMAIN_PATTERNS) {
    if (pattern.test(domain)) return `Domain blocked: ${domain} matches deny pattern`;
  }
  for (const pattern of DENY_IP_PATTERNS) {
    if (pattern.test(domain)) return `IP blocked: ${domain} matches local/metadata IP range`;
  }
  return null;
}

function isDomainTrusted(domain: string): boolean {
  return ALLOW_DOMAIN_PATTERNS.some((p) => p.test(domain));
}

function classifyStep(kind: string, payload: Record<string, unknown>): GuardrailResult {
  switch (kind) {
    case "open_url": {
      const url = String(payload.url || "");
      const domain = extractDomain(url);
      const blockReason = isDomainBlocked(domain);
      if (blockReason) return { risk_level: "blocked", blocked_reason: blockReason };
      if (isDomainTrusted(domain)) return { risk_level: "safe_auto" };
      return { risk_level: "confirm_needed" };
    }

    case "scroll":
    case "screenshot":
    case "end_session":
      return { risk_level: "safe_auto" };

    case "search":
    case "click":
    case "extract":
    case "summarize":
      return { risk_level: "confirm_needed" };

    case "type": {
      const target = String(payload.target_selector || payload.field_name || "");
      for (const pattern of BLOCKED_INPUT_PATTERNS) {
        if (pattern.test(target)) {
          return { risk_level: "blocked", blocked_reason: `Typing into sensitive field: ${target}` };
        }
      }
      return { risk_level: "confirm_needed" };
    }

    default:
      return { risk_level: "confirm_needed" };
  }
}

// ─── Credit costs per action ────────────────────────────────────────

const ACTION_CREDITS: Record<string, number> = {
  create_session: 0,
  close_session: 0,
  fetch_url: 0,
  extract_content: 1,
  summarize: 1,
  propose_step: 0,
  approve_step: 0,
  reject_step: 0,
  execute_step: 0, // cost depends on step kind
  get_session: 0,
};

const STEP_KIND_CREDITS: Record<string, number> = {
  search: 1,
  extract: 1,
  summarize: 1,
  open_url: 0,
  scroll: 0,
  screenshot: 0,
  click: 0,
  type: 0,
};

// ─── HTML to Text Extraction ────────────────────────────────────────

function htmlToText(html: string): string {
  let text = html;
  // Remove script/style
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br\s*\/?)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Clean whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function extractLinks(html: string, baseUrl: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push({ href: absoluteUrl, text: text || absoluteUrl });
      } catch {
        links.push({ href, text: text || href });
      }
    }
  }
  return links.slice(0, 200);
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractMetaDescription(html: string): string {
  const match = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  return match ? match[1].trim() : "";
}

// ─── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // ─── Auth ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Invalid user" }, 401);

    const userId = claimsData.claims.sub as string;

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);

    const tenantId = profile.active_tenant_id;
    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // ─── Parse body ───
    const body = await req.json();
    const { action } = body;

    if (!action) return json({ error: "Missing action parameter" }, 400);

    // ─── Credit Preflight (for metered actions) ───
    const requiredCredits = ACTION_CREDITS[action] ?? 0;
    if (requiredCredits > 0) {
      const { data: preflight, error: pfError } = await sbAdmin.rpc("rpc_credit_preflight", {
        p_tenant_id: tenantId,
        p_required_credits: requiredCredits,
        p_action_code: `ki_browser.${action}`,
      });

      if (pfError) {
        console.error("Credit preflight error:", pfError);
        return json({ error: "Credit check failed" }, 500);
      }

      if (preflight && !preflight.allowed) {
        return json({
          error: "Insufficient credits",
          required: requiredCredits,
          available: preflight.available_credits,
        }, 402);
      }
    }

    // ─── Action Router ───
    switch (action) {
      case "create_session":
        return await handleCreateSession(sbAdmin, tenantId, userId, body, req);

      case "close_session":
        return await handleCloseSession(sbAdmin, tenantId, userId, body, req);

      case "get_session":
        return await handleGetSession(sbAdmin, tenantId, body);

      case "fetch_url":
        return await handleFetchUrl(sbAdmin, tenantId, userId, body, req);

      case "extract_content":
        return await handleExtractContent(sbAdmin, tenantId, userId, body, req);

      case "summarize":
        return await handleSummarize(sbAdmin, tenantId, userId, body, req);

      case "propose_step":
        return await handleProposeStep(sbAdmin, tenantId, userId, body, req);

      case "approve_step":
        return await handleApproveStep(sbAdmin, tenantId, userId, body, req);

      case "reject_step":
        return await handleRejectStep(sbAdmin, tenantId, userId, body, req);

      case "execute_step":
        return await handleExecuteStep(sbAdmin, tenantId, userId, body, req);

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("sot-ki-browser error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

// ─── Action Handlers ────────────────────────────────────────────────

async function handleCreateSession(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { purpose, policy_profile_id } = body;

  // Load policy
  let policyId = policy_profile_id as string | null;
  if (!policyId) {
    const { data: defaultPolicy } = await sbAdmin
      .from("ki_browser_policies")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    policyId = defaultPolicy?.id || null;
  }

  let maxSteps = 50;
  let ttlMinutes = 30;
  if (policyId) {
    const { data: policy } = await sbAdmin
      .from("ki_browser_policies")
      .select("json_rules")
      .eq("id", policyId)
      .maybeSingle();
    if (policy?.json_rules) {
      const rules = policy.json_rules as Record<string, unknown>;
      maxSteps = (rules.max_steps as number) || 50;
      ttlMinutes = (rules.ttl_minutes as number) || 30;
    }
  }

  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

  const { data: session, error } = await sbAdmin
    .from("ki_browser_sessions")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      policy_profile_id: policyId,
      purpose: (purpose as string) || null,
      status: "active",
      step_count: 0,
      max_steps: maxSteps,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Create session error:", error);
    return json({ error: "Failed to create session" }, 500);
  }

  // Ledger
  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.session.created",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_session",
    entity_id: session.id,
    payload: { purpose: purpose || null },
  }, req);

  return json({
    session_id: session.id,
    status: session.status,
    max_steps: session.max_steps,
    expires_at: session.expires_at,
    policy_profile_id: policyId,
  });
}

async function handleCloseSession(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { session_id, reason } = body;
  if (!session_id) return json({ error: "Missing session_id" }, 400);

  const { data: session } = await sbAdmin
    .from("ki_browser_sessions")
    .select("id, tenant_id, status")
    .eq("id", session_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session) return json({ error: "Session not found" }, 404);
  if (session.status !== "active") return json({ error: "Session already closed" }, 400);

  const { error } = await sbAdmin
    .from("ki_browser_sessions")
    .update({ status: "completed" })
    .eq("id", session_id);

  if (error) return json({ error: "Failed to close session" }, 500);

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.session.closed",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_session",
    entity_id: session_id as string,
    payload: { reason: reason || "user_closed" },
  }, req);

  return json({ ok: true, session_id });
}

async function handleGetSession(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  body: Record<string, unknown>
) {
  const { session_id } = body;
  if (!session_id) return json({ error: "Missing session_id" }, 400);

  const { data: session } = await sbAdmin
    .from("ki_browser_sessions")
    .select("*")
    .eq("id", session_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session) return json({ error: "Session not found" }, 404);

  // Check TTL
  if (session.status === "active" && new Date(session.expires_at) < new Date()) {
    await sbAdmin
      .from("ki_browser_sessions")
      .update({ status: "expired" })
      .eq("id", session_id);
    session.status = "expired";
  }

  const { data: steps } = await sbAdmin
    .from("ki_browser_steps")
    .select("id, step_number, kind, status, risk_level, url_after, duration_ms, created_at, rationale")
    .eq("session_id", session_id)
    .order("step_number", { ascending: true });

  return json({
    session,
    steps: steps || [],
  });
}

async function handleFetchUrl(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { session_id, url } = body;
  if (!session_id || !url) return json({ error: "Missing session_id or url" }, 400);

  // Validate session
  const sessionCheck = await validateSession(sbAdmin, session_id as string, tenantId);
  if (sessionCheck.error) return json({ error: sessionCheck.error }, sessionCheck.status);

  // Guardrail check
  const guardrail = classifyStep("open_url", { url });
  if (guardrail.risk_level === "blocked") {
    logDataEvent(sbAdmin, {
      tenant_id: tenantId,
      zone: "Z2",
      actor_user_id: userId,
      event_type: "ki_browser.policy.violation.blocked",
      direction: "mutate",
      source: "sot-ki-browser",
      entity_type: "ki_browser_session",
      entity_id: session_id as string,
      payload: { url, blocked_reason: guardrail.blocked_reason, domain: extractDomain(url as string) },
    }, req);
    return json({ error: guardrail.blocked_reason, risk_level: "blocked" }, 403);
  }

  // Fetch
  const targetUrl = String(url);
  const startMs = Date.now();
  let fetchResponse: Response;
  try {
    fetchResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SoT-KI-Browser/1.0; Research-Agent)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
  } catch (fetchErr) {
    return json({
      error: "Failed to fetch URL",
      detail: fetchErr instanceof Error ? fetchErr.message : "Network error",
    }, 502);
  }

  const durationMs = Date.now() - startMs;
  const html = await fetchResponse.text();
  const text = htmlToText(html);
  const links = extractLinks(html, targetUrl);
  const title = extractTitle(html);
  const description = extractMetaDescription(html);

  // Truncate text to max_extract_size_kb (500kb default)
  const maxSizeBytes = 500 * 1024;
  const truncatedText = text.length > maxSizeBytes ? text.substring(0, maxSizeBytes) : text;

  // Record step
  const stepNumber = (sessionCheck.session!.step_count || 0) + 1;
  const { data: step } = await sbAdmin
    .from("ki_browser_steps")
    .insert({
      session_id: session_id as string,
      step_number: stepNumber,
      kind: "open_url",
      status: "executed",
      risk_level: guardrail.risk_level,
      payload_json: { url: targetUrl },
      result_json: {
        status_code: fetchResponse.status,
        title,
        description,
        text_length: truncatedText.length,
        links_count: links.length,
      },
      proposed_by: "user",
      url_before: null,
      url_after: targetUrl,
      duration_ms: durationMs,
    })
    .select("id")
    .single();

  // Increment step count
  await sbAdmin
    .from("ki_browser_sessions")
    .update({ step_count: stepNumber })
    .eq("id", session_id as string);

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.step.executed",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_step",
    entity_id: step?.id,
    payload: { step_kind: "open_url", url: targetUrl, risk_level: guardrail.risk_level },
  }, req);

  return json({
    step_id: step?.id,
    step_number: stepNumber,
    url: targetUrl,
    title,
    description,
    text: truncatedText,
    links: links.slice(0, 50),
    status_code: fetchResponse.status,
    duration_ms: durationMs,
    risk_level: guardrail.risk_level,
  });
}

async function handleExtractContent(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { session_id, content, mode } = body;
  if (!session_id || !content) return json({ error: "Missing session_id or content" }, 400);

  const sessionCheck = await validateSession(sbAdmin, session_id as string, tenantId);
  if (sessionCheck.error) return json({ error: sessionCheck.error }, sessionCheck.status);

  const extractMode = (mode as string) || "text";
  let result: Record<string, unknown> = {};

  if (extractMode === "text") {
    result = { text: String(content).substring(0, 500 * 1024) };
  } else if (extractMode === "links") {
    result = { links: Array.isArray(content) ? content : [] };
  } else if (extractMode === "tables") {
    result = { tables: Array.isArray(content) ? content : [] };
  }

  // Store artifact
  const { data: artifact } = await sbAdmin
    .from("ki_browser_artifacts")
    .insert({
      session_id: session_id as string,
      artifact_type: `extract_${extractMode}`,
      meta_json: {
        mode: extractMode,
        content_length: JSON.stringify(result).length,
        extracted_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single();

  // Record step
  const stepNumber = (sessionCheck.session!.step_count || 0) + 1;
  await sbAdmin.from("ki_browser_steps").insert({
    session_id: session_id as string,
    step_number: stepNumber,
    kind: "extract",
    status: "executed",
    risk_level: "confirm_needed",
    payload_json: { mode: extractMode },
    result_json: { artifact_id: artifact?.id, content_length: JSON.stringify(result).length },
    proposed_by: "user",
  });

  await sbAdmin
    .from("ki_browser_sessions")
    .update({ step_count: stepNumber })
    .eq("id", session_id as string);

  // Deduct credits
  await sbAdmin.rpc("rpc_credit_deduct", {
    p_tenant_id: tenantId,
    p_credits: 1,
    p_action_code: "ki_browser.extract_content",
    p_ref_type: "ki_browser_artifact",
    p_ref_id: artifact?.id || null,
  });

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.extract.created",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_artifact",
    entity_id: artifact?.id,
    payload: { artifact_type: `extract_${extractMode}`, session_id },
  }, req);

  return json({
    artifact_id: artifact?.id,
    mode: extractMode,
    result,
  });
}

async function handleSummarize(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { session_id, content, format } = body;
  if (!session_id || !content) return json({ error: "Missing session_id or content" }, 400);

  const sessionCheck = await validateSession(sbAdmin, session_id as string, tenantId);
  if (sessionCheck.error) return json({ error: sessionCheck.error }, sessionCheck.status);

  const outputFormat = (format as string) || "report";
  const textContent = String(content).substring(0, 100000);

  // Call Lovable AI Gateway (Gemini Flash for speed)
  const aiGatewayUrl = Deno.env.get("AI_GATEWAY_URL") || `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-gateway`;
  
  const systemPrompt = outputFormat === "facts_with_citations"
    ? "Du bist ein Fakten-Extraktor. Extrahiere die wichtigsten Fakten als nummerierte Liste mit Quellenangaben. Format: 1. [Fakt] — Quelle: [URL/Titel]"
    : outputFormat === "table"
    ? "Du bist ein Daten-Strukturierer. Fasse den Inhalt als Markdown-Tabelle zusammen mit den Spalten: Thema | Detail | Quelle."
    : "Du bist ein Recherche-Assistent. Erstelle einen strukturierten Bericht mit Überschriften, Kernaussagen und Quellenangaben im Markdown-Format.";

  let summaryText = "";
  try {
    const aiResponse = await fetch(aiGatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Fasse den folgenden Text zusammen:\n\n${textContent}` },
        ],
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      summaryText = aiData.choices?.[0]?.message?.content || aiData.content || "Zusammenfassung konnte nicht erstellt werden.";
    } else {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      summaryText = `Zusammenfassung fehlgeschlagen (AI Gateway Status ${aiResponse.status}).`;
    }
  } catch (aiErr) {
    console.error("AI Gateway call failed:", aiErr);
    summaryText = "Zusammenfassung konnte nicht erstellt werden (AI nicht erreichbar).";
  }

  // Store artifact
  const { data: artifact } = await sbAdmin
    .from("ki_browser_artifacts")
    .insert({
      session_id: session_id as string,
      artifact_type: "report",
      meta_json: {
        format: outputFormat,
        input_length: textContent.length,
        output_length: summaryText.length,
        summarized_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single();

  // Record step
  const stepNumber = (sessionCheck.session!.step_count || 0) + 1;
  await sbAdmin.from("ki_browser_steps").insert({
    session_id: session_id as string,
    step_number: stepNumber,
    kind: "summarize",
    status: "executed",
    risk_level: "confirm_needed",
    payload_json: { format: outputFormat },
    result_json: { artifact_id: artifact?.id, output_length: summaryText.length },
    proposed_by: "user",
  });

  await sbAdmin
    .from("ki_browser_sessions")
    .update({ step_count: stepNumber })
    .eq("id", session_id as string);

  // Deduct credits
  await sbAdmin.rpc("rpc_credit_deduct", {
    p_tenant_id: tenantId,
    p_credits: 1,
    p_action_code: "ki_browser.summarize",
    p_ref_type: "ki_browser_artifact",
    p_ref_id: artifact?.id || null,
  });

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.extract.created",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_artifact",
    entity_id: artifact?.id,
    payload: { artifact_type: "report", format: outputFormat, session_id },
  }, req);

  return json({
    artifact_id: artifact?.id,
    format: outputFormat,
    summary: summaryText,
  });
}

async function handleProposeStep(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { session_id, step_kind, payload, rationale } = body;
  if (!session_id || !step_kind) return json({ error: "Missing session_id or step_kind" }, 400);

  const sessionCheck = await validateSession(sbAdmin, session_id as string, tenantId);
  if (sessionCheck.error) return json({ error: sessionCheck.error }, sessionCheck.status);

  const guardrail = classifyStep(step_kind as string, (payload as Record<string, unknown>) || {});

  if (guardrail.risk_level === "blocked") {
    logDataEvent(sbAdmin, {
      tenant_id: tenantId,
      zone: "Z2",
      actor_user_id: userId,
      event_type: "ki_browser.policy.violation.blocked",
      direction: "mutate",
      source: "sot-ki-browser",
      entity_type: "ki_browser_session",
      entity_id: session_id as string,
      payload: { step_kind, blocked_reason: guardrail.blocked_reason },
    }, req);

    return json({
      risk_level: "blocked",
      blocked_reason: guardrail.blocked_reason,
      requires_approval: false,
    }, 403);
  }

  const stepNumber = (sessionCheck.session!.step_count || 0) + 1;
  const status = guardrail.risk_level === "safe_auto" ? "approved" : "proposed";

  const { data: step, error } = await sbAdmin
    .from("ki_browser_steps")
    .insert({
      session_id: session_id as string,
      step_number: stepNumber,
      kind: step_kind as string,
      status,
      risk_level: guardrail.risk_level,
      payload_json: (payload as Record<string, unknown>) || {},
      rationale: (rationale as string) || null,
      proposed_by: "armstrong",
    })
    .select("id")
    .single();

  if (error) return json({ error: "Failed to create step" }, 500);

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.step.proposed",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_step",
    entity_id: step?.id,
    payload: { step_kind, risk_level: guardrail.risk_level },
  }, req);

  return json({
    step_id: step?.id,
    step_number: stepNumber,
    risk_level: guardrail.risk_level,
    requires_approval: guardrail.risk_level === "confirm_needed",
    status,
  });
}

async function handleApproveStep(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { step_id } = body;
  if (!step_id) return json({ error: "Missing step_id" }, 400);

  const { data: step } = await sbAdmin
    .from("ki_browser_steps")
    .select("id, session_id, status, kind")
    .eq("id", step_id)
    .maybeSingle();

  if (!step) return json({ error: "Step not found" }, 404);
  if (step.status !== "proposed") return json({ error: `Step not in proposed state (current: ${step.status})` }, 400);

  // Verify session belongs to tenant
  const { data: session } = await sbAdmin
    .from("ki_browser_sessions")
    .select("tenant_id")
    .eq("id", step.session_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session) return json({ error: "Session not found" }, 404);

  await sbAdmin
    .from("ki_browser_steps")
    .update({ status: "approved", approved_by: userId })
    .eq("id", step_id);

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.step.approved",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_step",
    entity_id: step_id as string,
    payload: { step_kind: step.kind },
  }, req);

  return json({ ok: true, step_id });
}

async function handleRejectStep(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { step_id, reason } = body;
  if (!step_id) return json({ error: "Missing step_id" }, 400);

  const { data: step } = await sbAdmin
    .from("ki_browser_steps")
    .select("id, session_id, status, kind")
    .eq("id", step_id)
    .maybeSingle();

  if (!step) return json({ error: "Step not found" }, 404);
  if (step.status !== "proposed") return json({ error: `Step not in proposed state` }, 400);

  const { data: session } = await sbAdmin
    .from("ki_browser_sessions")
    .select("tenant_id")
    .eq("id", step.session_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session) return json({ error: "Session not found" }, 404);

  await sbAdmin
    .from("ki_browser_steps")
    .update({ status: "rejected", blocked_reason: (reason as string) || "User rejected" })
    .eq("id", step_id);

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.step.rejected",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_step",
    entity_id: step_id as string,
    payload: { step_kind: step.kind, reason },
  }, req);

  return json({ ok: true, step_id });
}

async function handleExecuteStep(
  sbAdmin: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string,
  body: Record<string, unknown>,
  req: Request
) {
  const { step_id } = body;
  if (!step_id) return json({ error: "Missing step_id" }, 400);

  const { data: step } = await sbAdmin
    .from("ki_browser_steps")
    .select("*")
    .eq("id", step_id)
    .maybeSingle();

  if (!step) return json({ error: "Step not found" }, 404);
  if (step.status !== "approved") return json({ error: `Step must be approved first (current: ${step.status})` }, 400);

  const { data: session } = await sbAdmin
    .from("ki_browser_sessions")
    .select("tenant_id, step_count")
    .eq("id", step.session_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session) return json({ error: "Session not found" }, 404);

  // Credit check for step kind
  const stepCredits = STEP_KIND_CREDITS[step.kind] || 0;
  if (stepCredits > 0) {
    const { data: pf } = await sbAdmin.rpc("rpc_credit_preflight", {
      p_tenant_id: tenantId,
      p_required_credits: stepCredits,
      p_action_code: `ki_browser.step.${step.kind}`,
    });
    if (pf && !pf.allowed) {
      return json({ error: "Insufficient credits for step execution", required: stepCredits }, 402);
    }
  }

  // Execute based on kind (Phase 1: only open_url supported as real execution)
  const startMs = Date.now();
  let result: Record<string, unknown> = {};
  let newUrl: string | null = null;

  if (step.kind === "open_url") {
    const url = (step.payload_json as Record<string, unknown>)?.url as string;
    if (url) {
      try {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SoT-KI-Browser/1.0; Research-Agent)",
            "Accept": "text/html,application/xhtml+xml,*/*",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });
        const html = await resp.text();
        const text = htmlToText(html);
        result = {
          status_code: resp.status,
          title: extractTitle(html),
          text: text.substring(0, 500 * 1024),
          links_count: extractLinks(html, url).length,
        };
        newUrl = url;
      } catch (e) {
        result = { error: e instanceof Error ? e.message : "Fetch failed" };
      }
    }
  } else if (step.kind === "search") {
    result = { info: "Search execution requires Phase 2 (external browser API)" };
  } else {
    result = { info: `Step kind '${step.kind}' requires Phase 2 for full execution` };
  }

  const durationMs = Date.now() - startMs;

  await sbAdmin
    .from("ki_browser_steps")
    .update({
      status: "executed",
      result_json: result,
      url_after: newUrl,
      duration_ms: durationMs,
    })
    .eq("id", step_id);

  // Update session step count
  await sbAdmin
    .from("ki_browser_sessions")
    .update({ step_count: (session.step_count || 0) + 1 })
    .eq("id", step.session_id);

  // Deduct credits if needed
  if (stepCredits > 0) {
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: stepCredits,
      p_action_code: `ki_browser.step.${step.kind}`,
      p_ref_type: "ki_browser_step",
      p_ref_id: step_id,
    });
  }

  logDataEvent(sbAdmin, {
    tenant_id: tenantId,
    zone: "Z2",
    actor_user_id: userId,
    event_type: "ki_browser.step.executed",
    direction: "mutate",
    source: "sot-ki-browser",
    entity_type: "ki_browser_step",
    entity_id: step_id as string,
    payload: { step_kind: step.kind, risk_level: step.risk_level, duration_ms: durationMs },
  }, req);

  return json({
    step_id,
    status: "executed",
    result,
    url_after: newUrl,
    duration_ms: durationMs,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────

async function validateSession(
  sbAdmin: ReturnType<typeof createClient>,
  sessionId: string,
  tenantId: string
): Promise<{ error?: string; status: number; session?: Record<string, unknown> }> {
  const { data: session } = await sbAdmin
    .from("ki_browser_sessions")
    .select("id, tenant_id, status, step_count, max_steps, expires_at")
    .eq("id", sessionId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session) return { error: "Session not found", status: 404 };

  if (session.status !== "active") {
    return { error: `Session is ${session.status}`, status: 400 };
  }

  if (new Date(session.expires_at as string) < new Date()) {
    await sbAdmin.from("ki_browser_sessions").update({ status: "expired" }).eq("id", sessionId);
    return { error: "Session expired", status: 400 };
  }

  if ((session.step_count as number) >= (session.max_steps as number)) {
    return { error: "Max steps reached", status: 400 };
  }

  return { status: 200, session: session as Record<string, unknown> };
}
