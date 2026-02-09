import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
        const shortId = user.id.split("-")[0]; // first segment of UUID
        const { data: newMailbox, error: createErr } = await sbAdmin
          .from("inbound_mailboxes")
          .insert({
            tenant_id: profile.active_tenant_id,
            address_local_part: shortId,
            address_domain: "inbound.systemofatown.com",
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
        console.log(`Lazy-provisioned mailbox: ${shortId}@inbound.systemofatown.com for tenant ${profile.active_tenant_id}`);
      }

      return json({
        address: `${mailbox.address_local_part}@${mailbox.address_domain}`,
        provider: mailbox.provider,
        is_active: mailbox.is_active,
      });
    }

    // ─── POST: webhook receiver (Resend inbound email) ───
    if (req.method === "POST") {
      const body = await req.json();

      // Resend wraps events in { type, data }
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

      // Find matching mailbox from TO recipients
      const toAddresses: string[] = Array.isArray(emailData.to)
        ? emailData.to
        : [emailData.to].filter(Boolean);

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

      // Idempotency: skip if already processed
      const { data: existing } = await sbAdmin
        .from("inbound_emails")
        .select("id")
        .eq("provider_email_id", providerEmailId)
        .maybeSingle();

      if (existing) {
        console.log(`Duplicate webhook for ${providerEmailId}, skipping`);
        return json({ ok: true, duplicate: true });
      }

      // Parse attachments metadata
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

      // Insert inbound_email
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

      // Insert attachment metadata
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

      // Process PDFs: download from Resend & upload to Storage
      if (pdfCount > 0) {
        try {
          await processPdfAttachments(
            sbAdmin,
            inboundEmail.id,
            tenantId,
            rawAttachments,
          );

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
              error_message:
                procErr instanceof Error
                  ? procErr.message
                  : "PDF processing failed",
            })
            .eq("id", inboundEmail.id);
        }
      }

      console.log(
        `Inbound email processed: ${inboundEmail.id} (${pdfCount} PDFs)`,
      );
      return json({ ok: true, inbound_email_id: inboundEmail.id });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("sot-inbound-receive error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

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
    const mimeType =
      att.content_type || att.mime_type || "application/octet-stream";
    const isPdf =
      mimeType.includes("pdf") || filename.toLowerCase().endsWith(".pdf");

    if (!isPdf) continue;

    // Get the content - Resend may include base64 content inline
    let fileBytes: Uint8Array;

    if (att.content) {
      // Base64 content included in webhook
      const binaryStr = atob(att.content);
      fileBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        fileBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      // Skip if no content available (would need Resend API fetch)
      console.warn(`No content for attachment ${filename}, skipping`);
      continue;
    }

    // Upload to Storage
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${tenantId}/inbox/${yyyy}/${mm}/${inboundEmailId}/${safeName}`;

    const { error: uploadErr } = await sbAdmin.storage
      .from("tenant-documents")
      .upload(storagePath, fileBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) {
      console.error(`Upload failed for ${filename}:`, uploadErr);
      continue;
    }

    // Create documents record
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

    // Create document_links record
    await sbAdmin.from("document_links").insert({
      tenant_id: tenantId,
      document_id: doc.id,
      object_type: "inbound_email",
      object_id: inboundEmailId,
      link_status: "current",
    });

    // Update attachment record with storage_path + document_id
    await sbAdmin
      .from("inbound_attachments")
      .update({
        storage_path: storagePath,
        document_id: doc.id,
      })
      .eq("inbound_email_id", inboundEmailId)
      .eq("filename", filename);

    console.log(`PDF stored: ${storagePath} → doc ${doc.id}`);
  }
}

// ─── Helpers ───

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
