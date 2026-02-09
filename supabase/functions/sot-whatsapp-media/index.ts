/**
 * SOT-WHATSAPP-MEDIA — Download Media from Meta and store in DMS
 * 
 * Called internally by sot-whatsapp-webhook when inbound media arrives.
 * Downloads the media from Meta's API and stores it in the DMS tree
 * under "WhatsApp Eingang / YYYY-MM-DD / filename".
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wa_media_id, tenant_id, message_id, mime_type, file_name } = await req.json();

    if (!wa_media_id || !tenant_id || !message_id) {
      return new Response(
        JSON.stringify({ error: "wa_media_id, tenant_id, and message_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "WHATSAPP_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get media URL from Meta
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/v21.0/${wa_media_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!mediaInfoResponse.ok) {
      console.error("[WhatsApp Media] Failed to get media URL:", await mediaInfoResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to get media info from Meta" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mediaInfo = await mediaInfoResponse.json();
    const mediaUrl = mediaInfo.url;

    if (!mediaUrl) {
      return new Response(
        JSON.stringify({ error: "No media URL in Meta response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Download the media file
    const mediaResponse = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mediaResponse.ok) {
      console.error("[WhatsApp Media] Failed to download media");
      return new Response(
        JSON.stringify({ error: "Failed to download media from Meta" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mediaBlob = await mediaResponse.blob();
    const fileSize = mediaBlob.size;

    // Step 3: Find or create DMS folder "WhatsApp Eingang / YYYY-MM-DD"
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Find or create root "WhatsApp Eingang" node
    let { data: inboxNode } = await supabase
      .from("storage_nodes")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("name", "WhatsApp Eingang")
      .eq("node_type", "folder")
      .is("parent_id", null)
      .maybeSingle();

    if (!inboxNode) {
      const { data: created } = await supabase
        .from("storage_nodes")
        .insert({
          tenant_id: tenant_id,
          name: "WhatsApp Eingang",
          node_type: "folder",
          parent_id: null,
          module_code: "MOD-02",
        })
        .select("id")
        .single();
      inboxNode = created;
    }

    if (!inboxNode) {
      return new Response(
        JSON.stringify({ error: "Failed to create DMS inbox folder" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create date subfolder
    let { data: dateNode } = await supabase
      .from("storage_nodes")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("name", today)
      .eq("parent_id", inboxNode.id)
      .eq("node_type", "folder")
      .maybeSingle();

    if (!dateNode) {
      const { data: created } = await supabase
        .from("storage_nodes")
        .insert({
          tenant_id: tenant_id,
          name: today,
          node_type: "folder",
          parent_id: inboxNode.id,
          module_code: "MOD-02",
        })
        .select("id")
        .single();
      dateNode = created;
    }

    if (!dateNode) {
      return new Response(
        JSON.stringify({ error: "Failed to create date folder" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Upload to Supabase Storage
    const storagePath = `whatsapp/${tenant_id}/${today}/${file_name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, mediaBlob, {
        contentType: mime_type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[WhatsApp Media] Storage upload failed:", uploadError);
    }

    // Step 5: Create file node in DMS
    const { data: fileNode } = await supabase
      .from("storage_nodes")
      .insert({
        tenant_id: tenant_id,
        name: file_name,
        node_type: "file",
        parent_id: dateNode.id,
        module_code: "MOD-02",
        mime_type: mime_type,
        size_bytes: fileSize,
        storage_path: storagePath,
      })
      .select("id")
      .single();

    // Step 6: Create whatsapp_attachment record
    await supabase.from("whatsapp_attachments").insert({
      tenant_id: tenant_id,
      message_id: message_id,
      file_name: file_name,
      mime_type: mime_type,
      size_bytes: fileSize,
      storage_node_id: fileNode?.id ?? null,
      wa_media_id: wa_media_id,
    });

    // Update media_count on message
    await supabase
      .from("whatsapp_messages")
      .update({ media_count: 1 })
      .eq("id", message_id);

    console.log("[WhatsApp Media] Successfully stored:", file_name, "in DMS node:", fileNode?.id);

    return new Response(
      JSON.stringify({
        success: true,
        storage_node_id: fileNode?.id,
        storage_path: storagePath,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WhatsApp Media] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
