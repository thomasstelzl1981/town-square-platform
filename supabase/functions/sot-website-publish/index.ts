/**
 * sot-website-publish — Publishes a website (creates version snapshot)
 * Validates hosting contract (Credits-based, no Stripe).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { website_id } = await req.json();
    if (!website_id) throw new Error("website_id required");

    // Check hosting contract — must be active with confirmed responsibility
    const { data: contract } = await supabase
      .from("hosting_contracts")
      .select("status, content_responsibility_confirmed")
      .eq("website_id", website_id)
      .single();

    if (!contract || contract.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Kein aktiver Hosting-Vertrag. Bitte aktivieren Sie zuerst das Hosting." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contract.content_responsibility_confirmed) {
      return new Response(
        JSON.stringify({ error: "Bitte bestätigen Sie die Inhaltsverantwortung." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current website + pages + sections
    const { data: website } = await supabase
      .from("tenant_websites")
      .select("id, tenant_id, name, slug, branding_json, seo_json")
      .eq("id", website_id)
      .single();

    if (!website) throw new Error("Website not found");

    const { data: pages } = await supabase
      .from("website_pages")
      .select("id, slug, title, sort_order")
      .eq("website_id", website_id)
      .order("sort_order");

    const pagesWithSections = [];
    for (const page of pages || []) {
      const { data: sections } = await supabase
        .from("website_sections")
        .select("id, section_type, sort_order, content_json, design_json, is_visible")
        .eq("page_id", page.id)
        .order("sort_order");
      pagesWithSections.push({ ...page, sections: sections || [] });
    }

    // Get next version number
    const { count } = await supabase
      .from("website_versions")
      .select("*", { count: "exact", head: true })
      .eq("website_id", website_id);

    const versionNumber = (count || 0) + 1;

    const snapshot = {
      pages: pagesWithSections,
      branding: website.branding_json,
      seo: website.seo_json,
    };

    // Create version snapshot
    const { error: insertError } = await supabase
      .from("website_versions")
      .insert({
        website_id,
        tenant_id: website.tenant_id,
        snapshot_json: snapshot,
        version_number: versionNumber,
        published_by: user.id,
      });

    if (insertError) throw insertError;

    // Update website status
    await supabase
      .from("tenant_websites")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", website_id);

    console.log(`Website ${website.slug} published as v${versionNumber}`);

    return new Response(
      JSON.stringify({ success: true, version: versionNumber, slug: website.slug }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Publish error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
