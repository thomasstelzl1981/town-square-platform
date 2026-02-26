import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * System-E-Mail-Adresse für den zentralen Posteingang (Zone 1):
 * posteingang@inbound.systemofatown.com
 *
 * Die eingehende E-Mail enthält im Betreff den Empfänger (Tenant-ID oder Name)
 * und das Datum. Die PDFs werden extrahiert, als inbound_items gespeichert
 * und automatisch geroutet, falls eine passende Routing-Regel existiert.
 */
const SYSTEM_INBOX_LOCAL = "posteingang";
const SYSTEM_INBOX_DOMAIN = "inbound.systemofatown.com";
const ARMSTRONG_DOMAIN = "neilarmstrong.space";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── GET: return mailbox info for authenticated user ───
    if (req.method === "GET" && action === "mailbox") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return json({ error: "Missing authorization" }, 401);
      }

      const sbUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user },
        error: ue,
      } = await sbUser.auth.getUser();
      if (ue || !user) return json({ error: "Invalid user" }, 401);

      const { data: profile } = await sbUser
        .from("profiles")
        .select("active_tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.active_tenant_id) {
        return json({ error: "No active tenant" }, 400);
      }

      const sbAdmin = createClient(supabaseUrl, serviceKey);
      let { data: mailbox } = await sbAdmin
        .from("inbound_mailboxes")
        .select("*")
        .eq("tenant_id", profile.active_tenant_id)
        .eq("is_active", true)
        .maybeSingle();

      // Lazy provisioning: create mailbox using User-ID if none exists
      if (!mailbox) {
        const shortId = user.id.split("-")[0];
        const { data: newMailbox, error: createErr } = await sbAdmin
          .from("inbound_mailboxes")
          .insert({
            tenant_id: profile.active_tenant_id,
            address_local_part: shortId,
            address_domain: SYSTEM_INBOX_DOMAIN,
            provider: "resend",
            is_active: true,
          })
          .select("*")
          .single();

        if (createErr) {
          console.error("Mailbox provisioning failed:", createErr);
          return json({ error: "Could not create mailbox" }, 500);
        }
        mailbox = newMailbox;
        console.log(`Lazy-provisioned mailbox: ${shortId}@${SYSTEM_INBOX_DOMAIN} for tenant ${profile.active_tenant_id}`);
      }

      return json({
        address: `${mailbox.address_local_part}@${mailbox.address_domain}`,
        provider: mailbox.provider,
        is_active: mailbox.is_active,
      });
    }

    // ─── GET: return system inbox address ───
    if (req.method === "GET" && action === "system-inbox") {
      return json({
        address: `${SYSTEM_INBOX_LOCAL}@${SYSTEM_INBOX_DOMAIN}`,
        description: "Zentraler Posteingang für Zone 1 — eingehende Post wird als inbound_item erfasst und automatisch geroutet.",
      });
    }

    // ─── POST: webhook receiver (Resend inbound email) ───
    if (req.method === "POST") {
      const body = await req.json();

      const eventType = body.type;
      if (eventType !== "email.received") {
        console.log(`Ignoring event type: ${eventType}`);
        return json({ ok: true, skipped: true });
      }

      const emailData = body.data;
      if (!emailData) {
        return json({ error: "No email data" }, 400);
      }

      const sbAdmin = createClient(supabaseUrl, serviceKey);

      // Determine if this is for the SYSTEM inbox or a tenant mailbox
      const toAddresses: string[] = Array.isArray(emailData.to)
        ? emailData.to
        : [emailData.to].filter(Boolean);

      const isSystemInbox = toAddresses.some((addr) => {
        const clean = addr.toLowerCase().trim();
        return clean === `${SYSTEM_INBOX_LOCAL}@${SYSTEM_INBOX_DOMAIN}` ||
               clean.startsWith(`${SYSTEM_INBOX_LOCAL}@`);
      });

      // Check if this is an Armstrong assistant email (*.@neilarmstrong.space)
      const isArmstrongInbox = toAddresses.some((addr) => {
        const clean = addr.toLowerCase().trim();
        return clean.endsWith(`@${ARMSTRONG_DOMAIN}`);
      });

      if (isSystemInbox) {
        // ─── SYSTEM INBOX: Post für Zone 1 Posteingang ───
        return await handleSystemInbox(sbAdmin, emailData, toAddresses);
      }

      if (isArmstrongInbox) {
        // ─── ARMSTRONG ASSISTANT: E-Mail als KI-Auftrag verarbeiten ───
        return await handleArmstrongInbox(sbAdmin, emailData, toAddresses);
      }

      // ─── TENANT MAILBOX: Per-Tenant Inbox (bestehende Logik) ───
      return await handleTenantMailbox(sbAdmin, emailData, toAddresses);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("sot-inbound-receive error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

// ─── ARMSTRONG ASSISTANT HANDLER ───
// E-Mails an vorname.nachname@neilarmstrong.space werden als KI-Aufträge verarbeitet.
// Der Absender wird über profiles.armstrong_email identifiziert.

async function handleArmstrongInbox(
  sbAdmin: any,
  emailData: any,
  toAddresses: string[],
) {
  const fromEmail = typeof emailData.from === "string"
    ? emailData.from
    : emailData.from?.address || "unknown";
  const subject = emailData.subject || "";
  const bodyText = emailData.text || emailData.body_text || "";
  const bodyHtml = emailData.html || emailData.body_html || "";

  // Find the Armstrong recipient address
  const armstrongAddr = toAddresses.find((addr) =>
    addr.toLowerCase().trim().endsWith(`@${ARMSTRONG_DOMAIN}`)
  );

  if (!armstrongAddr) {
    console.warn("Armstrong inbox: No matching address found in:", toAddresses);
    return json({ error: "No Armstrong address found" }, 400);
  }

  const cleanArmstrongAddr = armstrongAddr.toLowerCase().trim();

  // Resolve user by armstrong_email
  const { data: profile } = await sbAdmin
    .from("profiles")
    .select("id, active_tenant_id, first_name, last_name, armstrong_email")
    .eq("armstrong_email", cleanArmstrongAddr)
    .maybeSingle();

  if (!profile) {
    console.warn(`Armstrong inbox: No user found for address ${cleanArmstrongAddr}`);
    return json({ error: "No user found for this Armstrong address" }, 404);
  }

  if (!profile.active_tenant_id) {
    console.warn(`Armstrong inbox: User ${profile.id} has no active tenant`);
    return json({ error: "User has no active tenant" }, 400);
  }

  // Extract attachment metadata
  const rawAttachments: any[] = emailData.attachments || [];
  const attachmentsMeta = rawAttachments.map((a: any) => ({
    filename: a.filename || a.name || "attachment",
    mime_type: a.content_type || a.mime_type || "application/octet-stream",
    size_bytes: a.size || a.content?.length || null,
  }));

  // Create Armstrong inbound task
  const { data: task, error: taskErr } = await sbAdmin
    .from("armstrong_inbound_tasks")
    .insert({
      user_id: profile.id,
      tenant_id: profile.active_tenant_id,
      from_email: fromEmail,
      to_email: cleanArmstrongAddr,
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      attachments_meta: attachmentsMeta,
      instruction: `${subject}\n\n${bodyText}`.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (taskErr) {
    console.error("Armstrong task insert error:", taskErr);
    return json({ error: "Failed to create Armstrong task" }, 500);
  }

  // Log to DSGVO ledger
  await logDataEvent(sbAdmin, {
    tenant_id: profile.active_tenant_id,
    zone: "Z2",
    event_type: "armstrong.inbound_task.created",
    direction: "ingress",
    source: "email",
    entity_type: "armstrong_inbound_task",
    payload: {
      task_id: task.id,
      from_email: fromEmail,
      subject_length: subject.length,
      attachment_count: attachmentsMeta.length,
    },
  });

  console.log(`Armstrong task created: ${task.id} for user ${profile.id} from ${fromEmail}`);
  return json({ ok: true, task_id: task.id });
}

// ─── SYSTEM INBOX HANDLER ───
// Eingehende Post wird als inbound_item gespeichert und automatisch geroutet.
// Der Betreff enthält den Empfänger (Tenant-ID oder Kurzform) und das Datum.
// Beispiel-Betreff: "D028BC99 | 10.02.2026 | Mietvertrag"

async function handleSystemInbox(
  sbAdmin: any,
  emailData: any,
  _toAddresses: string[],
) {
  const subject = emailData.subject || "";
  const fromEmail = typeof emailData.from === "string"
    ? emailData.from
    : emailData.from?.address || "unknown";
  const providerEmailId = emailData.id || emailData.email_id || crypto.randomUUID();

  // Parse subject for recipient identifier
  // Expected format: "TENANT_SHORT_ID | DATE | DESCRIPTION"
  // or just the tenant short ID anywhere in the subject
  const recipientInfo = parseRecipient(subject);

  // Resolve tenant from recipient identifier
  let resolvedTenantId: string | null = null;
  if (recipientInfo.tenantShortId) {
    const { data: orgs } = await sbAdmin
      .from("organizations")
      .select("id, name")
      .limit(500);

    if (orgs) {
      // Match by first 8 chars of UUID (case-insensitive)
      const match = orgs.find((o: any) =>
        o.id.toLowerCase().startsWith(recipientInfo.tenantShortId!.toLowerCase())
      );
      if (match) {
        resolvedTenantId = match.id;
      }
    }
  }

  // Process PDF attachments
  const rawAttachments: any[] = emailData.attachments || [];
  const pdfAttachments = rawAttachments.filter((a: any) => {
    const mime = a.content_type || a.mime_type || "";
    const name = a.filename || a.name || "";
    return mime.includes("pdf") || name.toLowerCase().endsWith(".pdf");
  });

  if (pdfAttachments.length === 0) {
    console.log("System inbox: No PDF attachments, creating metadata-only item");
  }

  // Create one inbound_item per PDF (or one metadata item if no PDFs)
  const items = pdfAttachments.length > 0 ? pdfAttachments : [null];
  const createdItemIds: string[] = [];

  for (const att of items) {
    const filename = att ? (att.filename || att.name || "dokument.pdf") : "Kein Anhang";
    let storagePath: string | null = null;
    let fileSize: number | null = null;

    // Upload PDF to storage if content available
    if (att?.content) {
      const binaryStr = atob(att.content);
      const fileBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        fileBytes[i] = binaryStr.charCodeAt(i);
      }
      fileSize = fileBytes.length;

      const now = new Date();
      const yyyy = now.getFullYear().toString();
      const mm = (now.getMonth() + 1).toString().padStart(2, "0");
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `system-inbox/${yyyy}/${mm}/${providerEmailId}/${safeName}`;

      const { error: uploadErr } = await sbAdmin.storage
        .from("tenant-documents")
        .upload(storagePath, fileBytes, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadErr) {
        console.error(`System inbox upload failed for ${filename}:`, uploadErr);
        storagePath = null;
      }
    }

    // Create inbound_item
    const { data: item, error: itemErr } = await sbAdmin
      .from("inbound_items")
      .insert({
        source: "postservice",
        external_id: providerEmailId,
        sender_info: { email: fromEmail, subject },
        recipient_info: {
          tenant_short_id: recipientInfo.tenantShortId,
          tenant_id: resolvedTenantId,
          parsed_date: recipientInfo.date,
          parsed_description: recipientInfo.description,
        },
        file_name: filename,
        file_path: storagePath,
        mime_type: att ? "application/pdf" : null,
        file_size_bytes: fileSize,
        status: "pending",
        assigned_tenant_id: resolvedTenantId,
        metadata: { system_inbox: true, provider_email_id: providerEmailId },
      })
      .select("id")
      .single();

    if (itemErr) {
      console.error("System inbox item insert error:", itemErr);
      continue;
    }

    createdItemIds.push(item.id);

    // Auto-route if tenant resolved and routing rule exists
    if (resolvedTenantId) {
      const { data: rules } = await sbAdmin
        .from("inbound_routing_rules")
        .select("*")
        .eq("target_tenant_id", resolvedTenantId)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(1);

      if (rules && rules.length > 0) {
        const rule = rules[0];
        await autoRouteToZone2(sbAdmin, item.id, resolvedTenantId, rule.mandate_id, storagePath, filename, fileSize);
        console.log(`Auto-routed item ${item.id} to tenant ${resolvedTenantId}`);
      }
    }
  }

  // DSGVO Ledger
  await logDataEvent(sbAdmin, {
    tenant_id: resolvedTenantId || undefined,
    zone: "EXTERN",
    event_type: "inbound.email.received",
    direction: "ingress",
    source: "resend",
    entity_type: "inbound_item",
    payload: {
      inbound_id: createdItemIds[0] || null,
      subject_length: (subject || "").length,
      attachment_count: pdfAttachments.length,
    },
  });

  console.log(`System inbox processed: ${createdItemIds.length} items from ${fromEmail}`);
  return json({ ok: true, items_created: createdItemIds.length, item_ids: createdItemIds });
}

// Auto-route: create document + document_link + mark as routed
async function autoRouteToZone2(
  sbAdmin: any,
  inboundItemId: string,
  targetTenantId: string,
  mandateId: string | null,
  filePath: string | null,
  fileName: string,
  fileSize: number | null,
) {
  const publicId = `post-${inboundItemId.slice(0, 8)}-${Date.now()}`;

  const { data: doc, error: docErr } = await sbAdmin
    .from("documents")
    .insert({
      tenant_id: targetTenantId,
      name: fileName || "Zugestellte Post",
      file_path: filePath || "",
      mime_type: "application/pdf",
      size_bytes: fileSize || 0,
      source: "postservice",
      public_id: publicId,
    })
    .select("id")
    .single();

  if (docErr) {
    console.error("Auto-route doc creation failed:", docErr);
    return;
  }

  // Create document_link
  await sbAdmin.from("document_links").insert({
    tenant_id: targetTenantId,
    document_id: doc.id,
    object_type: "postservice_delivery",
    object_id: inboundItemId,
    link_status: "linked",
  });

  // Mark inbound_item as routed
  const updatePayload: Record<string, unknown> = {
    status: "assigned",
    assigned_tenant_id: targetTenantId,
    routed_to_zone2_at: new Date().toISOString(),
  };
  if (mandateId) updatePayload.mandate_id = mandateId;

  await sbAdmin.from("inbound_items").update(updatePayload).eq("id", inboundItemId);
}

// Parse subject line for recipient info
// Expected: "D028BC99 | 10.02.2026 | Mietvertrag"
// Also handles: "D028BC99" alone, or "D028BC99 - 2026-02-10"
function parseRecipient(subject: string): {
  tenantShortId: string | null;
  date: string | null;
  description: string | null;
} {
  const result: { tenantShortId: string | null; date: string | null; description: string | null } = {
    tenantShortId: null,
    date: null,
    description: null,
  };

  // Try pipe-separated format first: "ID | DATE | DESC"
  const pipeParts = subject.split("|").map((s) => s.trim());
  if (pipeParts.length >= 1) {
    // First part: tenant short ID (8-char hex-like)
    const idCandidate = pipeParts[0].replace(/[^a-fA-F0-9]/g, "");
    if (idCandidate.length >= 8) {
      result.tenantShortId = idCandidate.slice(0, 8);
    }
    if (pipeParts.length >= 2) result.date = pipeParts[1];
    if (pipeParts.length >= 3) result.description = pipeParts.slice(2).join(" | ");
  }

  // Fallback: look for 8+ char hex pattern anywhere
  if (!result.tenantShortId) {
    const hexMatch = subject.match(/[a-fA-F0-9]{8,}/);
    if (hexMatch) {
      result.tenantShortId = hexMatch[0].slice(0, 8);
    }
  }

  return result;
}

// ─── TENANT MAILBOX HANDLER (existing logic) ───

async function handleTenantMailbox(
  sbAdmin: any,
  emailData: any,
  toAddresses: string[],
) {
  let matchedMailbox: any = null;
  for (const addr of toAddresses) {
    const cleanAddr = addr.toLowerCase().trim();
    const [localPart, domain] = cleanAddr.split("@");
    if (!localPart || !domain) continue;

    const { data } = await sbAdmin
      .from("inbound_mailboxes")
      .select("*")
      .eq("address_local_part", localPart)
      .eq("address_domain", domain)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      matchedMailbox = data;
      break;
    }
  }

  if (!matchedMailbox) {
    console.warn("No matching mailbox for:", toAddresses);
    return json({ error: "No matching mailbox" }, 404);
  }

  const tenantId = matchedMailbox.tenant_id;
  const providerEmailId =
    emailData.id || emailData.email_id || crypto.randomUUID();
  const fromEmail =
    typeof emailData.from === "string"
      ? emailData.from
      : emailData.from?.address || "unknown";
  const toEmail = toAddresses[0] || "";
  const subject = emailData.subject || "(Kein Betreff)";

  // Idempotency
  const { data: existing } = await sbAdmin
    .from("inbound_emails")
    .select("id")
    .eq("provider_email_id", providerEmailId)
    .maybeSingle();

  if (existing) {
    console.log(`Duplicate webhook for ${providerEmailId}, skipping`);
    return json({ ok: true, duplicate: true });
  }

  const rawAttachments: any[] = emailData.attachments || [];
  const attachmentMeta = rawAttachments.map((a: any) => ({
    filename: a.filename || a.name || "attachment",
    mime_type: a.content_type || a.mime_type || "application/octet-stream",
    size_bytes: a.size || a.content?.length || null,
    is_pdf:
      (a.content_type || a.mime_type || "").includes("pdf") ||
      (a.filename || a.name || "").toLowerCase().endsWith(".pdf"),
  }));

  const pdfCount = attachmentMeta.filter((a: any) => a.is_pdf).length;

  const { data: inboundEmail, error: emailErr } = await sbAdmin
    .from("inbound_emails")
    .insert({
      tenant_id: tenantId,
      mailbox_id: matchedMailbox.id,
      provider: "resend",
      provider_email_id: providerEmailId,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      received_at: emailData.created_at || new Date().toISOString(),
      attachment_count: attachmentMeta.length,
      pdf_count: pdfCount,
      status: pdfCount > 0 ? "processing" : "ready",
    })
    .select("id")
    .single();

  if (emailErr) {
    console.error("Insert inbound_email error:", emailErr);
    return json({ error: "DB insert failed" }, 500);
  }

  if (attachmentMeta.length > 0) {
    const attachRows = attachmentMeta.map((a: any) => ({
      inbound_email_id: inboundEmail.id,
      tenant_id: tenantId,
      filename: a.filename,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
      is_pdf: a.is_pdf,
    }));
    await sbAdmin.from("inbound_attachments").insert(attachRows);
  }

  if (pdfCount > 0) {
    try {
      await processPdfAttachments(sbAdmin, inboundEmail.id, tenantId, rawAttachments);
      await sbAdmin
        .from("inbound_emails")
        .update({ status: "ready" })
        .eq("id", inboundEmail.id);
    } catch (procErr) {
      console.error("PDF processing error:", procErr);
      await sbAdmin
        .from("inbound_emails")
        .update({
          status: "error",
          error_message: procErr instanceof Error ? procErr.message : "PDF processing failed",
        })
        .eq("id", inboundEmail.id);
    }
  }

  // ─── AUTO-TRIGGER: Contact Enrichment from Email Signature ───
  try {
    const { data: enrichSettings } = await sbAdmin
      .from('tenant_extraction_settings')
      .select('auto_enrich_contacts_email')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (enrichSettings?.auto_enrich_contacts_email) {
      const bodyText = emailData.text || emailData.body_text || emailData.html || "";
      const fromName = typeof emailData.from === "string"
        ? emailData.from
        : emailData.from?.name || emailData.from?.address || "";

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Call contact enrichment edge function via direct fetch
      const enrichUrl = `${supabaseUrl}/functions/v1/sot-contact-enrichment`;
      const enrichResponse = await fetch(enrichUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          source: "email",
          scope: "zone2_tenant",
          tenant_id: tenantId,
          data: {
            email: fromEmail,
            from_name: fromName,
            body_text: bodyText,
          },
        }),
      });

      const enrichResult = await enrichResponse.json();
      console.log(`[contact-enrichment] Result for ${fromEmail}:`, enrichResult);
    }
  } catch (enrichErr) {
    // Non-blocking: enrichment failure should not break email processing
    console.error("[contact-enrichment] Error (non-blocking):", enrichErr);
  }

  console.log(`Inbound email processed: ${inboundEmail.id} (${pdfCount} PDFs)`);
  return json({ ok: true, inbound_email_id: inboundEmail.id });
}

// ─── PDF Processing ───

async function processPdfAttachments(
  sbAdmin: any,
  inboundEmailId: string,
  tenantId: string,
  rawAttachments: any[],
) {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");

  for (const att of rawAttachments) {
    const filename = att.filename || att.name || "attachment";
    const mimeType = att.content_type || att.mime_type || "application/octet-stream";
    const isPdf = mimeType.includes("pdf") || filename.toLowerCase().endsWith(".pdf");
    if (!isPdf) continue;

    let fileBytes: Uint8Array;
    if (att.content) {
      const binaryStr = atob(att.content);
      fileBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        fileBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      console.warn(`No content for attachment ${filename}, skipping`);
      continue;
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${tenantId}/inbox/${yyyy}/${mm}/${inboundEmailId}/${safeName}`;

    const { error: uploadErr } = await sbAdmin.storage
      .from("tenant-documents")
      .upload(storagePath, fileBytes, { contentType: "application/pdf", upsert: false });

    if (uploadErr) {
      console.error(`Upload failed for ${filename}:`, uploadErr);
      continue;
    }

    const { data: doc, error: docErr } = await sbAdmin
      .from("documents")
      .insert({
        tenant_id: tenantId,
        name: filename,
        file_path: storagePath,
        mime_type: "application/pdf",
        size_bytes: fileBytes.length,
      })
      .select("id")
      .single();

    if (docErr) {
      console.error(`Document insert error for ${filename}:`, docErr);
      continue;
    }

    await sbAdmin.from("document_links").insert({
      tenant_id: tenantId,
      document_id: doc.id,
      object_type: "inbound_email",
      object_id: inboundEmailId,
      link_status: "linked",
    });

    await sbAdmin
      .from("inbound_attachments")
      .update({ storage_path: storagePath, document_id: doc.id })
      .eq("inbound_email_id", inboundEmailId)
      .eq("filename", filename);

    console.log(`PDF stored: ${storagePath} → doc ${doc.id}`);

    // ─── AUTO-TRIGGER: Document Parser + Chunks Pipeline ───
    await triggerDocumentExtraction(sbAdmin, doc.id, tenantId, storagePath, filename);
  }
}

/**
 * Auto-Trigger Pipeline: PDF → Credit-Preflight → Gemini Parser → document_chunks
 * 
 * 1. Credit-Preflight: Prüft ob Tenant genug Credits hat (1 Credit/PDF)
 * 2. Signed URL: Erstellt temporäre Download-URL für das PDF
 * 3. Gemini Parser: Sendet PDF an sot-document-parser (Lovable AI)
 * 4. Chunk Storage: Speichert extrahierten Text in document_chunks für TSVector-Suche
 * 5. Credit Deduct: Zieht 1 Credit ab
 */
async function triggerDocumentExtraction(
  sbAdmin: any,
  documentId: string,
  tenantId: string,
  storagePath: string,
  filename: string,
) {
  const EXTRACTION_CREDITS = 1;
  
  try {
    // 1. Credit Preflight
    const { data: preflight, error: preflightErr } = await sbAdmin.rpc("rpc_credit_preflight", {
      p_tenant_id: tenantId,
      p_required_credits: EXTRACTION_CREDITS,
      p_action_code: "doc_extraction",
    });

    if (preflightErr || !preflight?.allowed) {
      console.warn(`[auto-trigger] Credit preflight failed for tenant ${tenantId}: ${preflight?.message || preflightErr?.message}`);
      // Mark document as extraction_skipped (no credits)
      await sbAdmin.from("documents").update({ 
        metadata: { extraction_status: "skipped_no_credits", checked_at: new Date().toISOString() }
      }).eq("id", documentId);
      return;
    }

    // 2. Get signed URL for the PDF
    const { data: signedUrlData, error: signedUrlErr } = await sbAdmin.storage
      .from("tenant-documents")
      .createSignedUrl(storagePath, 600); // 10 min

    if (signedUrlErr || !signedUrlData?.signedUrl) {
      console.error(`[auto-trigger] Signed URL failed for ${storagePath}:`, signedUrlErr);
      return;
    }

    // 3. Download PDF content and convert to base64
    const pdfResponse = await fetch(signedUrlData.signedUrl);
    if (!pdfResponse.ok) {
      console.error(`[auto-trigger] PDF download failed: ${pdfResponse.status}`);
      return;
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);
    
    // Convert to base64
    let base64Content = "";
    const chunkSize = 8192;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.slice(i, i + chunkSize);
      base64Content += String.fromCharCode(...chunk);
    }
    base64Content = btoa(base64Content);

    // 4. Call document parser via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[auto-trigger] LOVABLE_API_KEY not configured, skipping extraction");
      return;
    }

    const systemPrompt = `Du bist ein spezialisierter Dokumenten-Parser für Immobilien- und Finanzdokumente.
Analysiere das Dokument und extrahiere ALLEN Text als durchsuchbaren Volltext.
Erkenne den Dokumententyp (Rechnung, Vertrag, Bescheid, Ausweis, Kontoauszug, Brief, etc.).

Antworte NUR mit validem JSON:
{
  "doc_type": "rechnung|vertrag|bescheid|ausweis|kontoauszug|brief|expose|sonstiges",
  "confidence": 0.0-1.0,
  "summary": "Kurzzusammenfassung in 1-2 Sätzen",
  "extracted_text": "Der komplette extrahierte Text des Dokuments, seitenweise getrennt mit ---PAGE_BREAK---",
  "key_data": {
    "datum": "falls erkannt",
    "betrag": "falls erkannt (Zahl in EUR)",
    "absender": "falls erkannt",
    "empfaenger": "falls erkannt",
    "aktenzeichen": "falls erkannt"
  }
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analysiere dieses Dokument: ${filename}` },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Content}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`[auto-trigger] AI Gateway error ${aiResponse.status}:`, errText);
      return;
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse AI response
    let parsed: { doc_type?: string; confidence?: number; summary?: string; extracted_text?: string; key_data?: Record<string, string> };
    try {
      let jsonStr = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      console.warn("[auto-trigger] AI response not valid JSON, using raw text");
      parsed = { extracted_text: aiContent, doc_type: "sonstiges", confidence: 0.3 };
    }

    // 5. Store chunks in document_chunks
    const fullText = parsed.extracted_text || aiContent;
    const pages = fullText.split(/---PAGE_BREAK---/i).filter((p: string) => p.trim().length > 0);

    for (let i = 0; i < pages.length; i++) {
      const pageText = pages[i].trim();
      if (pageText.length < 5) continue;

      // Split into ~1000 char chunks per page
      const chunks = splitIntoChunks(pageText, 1000);
      for (let j = 0; j < chunks.length; j++) {
        await sbAdmin.from("document_chunks").insert({
          document_id: documentId,
          tenant_id: tenantId,
          text: chunks[j],
          page_number: i + 1,
          chunk_index: j,
          metadata: {
            doc_type: parsed.doc_type,
            confidence: parsed.confidence,
            filename,
          },
        });
      }
    }

    // 6. Update document with extraction metadata
    await sbAdmin.from("documents").update({
      doc_type_hint: parsed.doc_type || "sonstiges",
      metadata: {
        extraction_status: "completed",
        extraction_confidence: parsed.confidence,
        extraction_summary: parsed.summary,
        extraction_key_data: parsed.key_data,
        extracted_at: new Date().toISOString(),
        pages_extracted: pages.length,
        model: "google/gemini-2.5-flash",
      },
    }).eq("id", documentId);

    // 7. Deduct credits
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: EXTRACTION_CREDITS,
      p_action_code: "doc_extraction",
      p_ref_type: "document",
      p_ref_id: documentId,
    });

    console.log(`[auto-trigger] ✅ Extracted ${pages.length} pages from ${filename} → ${documentId} (1 Credit deducted)`);
  } catch (err) {
    console.error(`[auto-trigger] Extraction failed for ${documentId}:`, err);
    await sbAdmin.from("documents").update({
      metadata: { extraction_status: "error", error: String(err), attempted_at: new Date().toISOString() },
    }).eq("id", documentId);
  }
}

/**
 * Split text into chunks of approximately maxLen characters,
 * breaking at sentence boundaries where possible.
 */
function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    
    // Try to break at sentence boundary
    let breakPoint = remaining.lastIndexOf(". ", maxLen);
    if (breakPoint < maxLen * 0.5) {
      breakPoint = remaining.lastIndexOf(" ", maxLen);
    }
    if (breakPoint < maxLen * 0.3) {
      breakPoint = maxLen;
    }
    
    chunks.push(remaining.slice(0, breakPoint + 1).trim());
    remaining = remaining.slice(breakPoint + 1).trim();
  }
  
  return chunks;
}

// ─── Helpers ───

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}