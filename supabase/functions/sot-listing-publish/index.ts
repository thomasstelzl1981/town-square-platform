import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Required fields for publishing
const REQUIRED_FIELDS = [
  "title",
  "asking_price",
  "description",
];

interface ListingCreate {
  property_id: string;
  title: string;
  description?: string;
  asking_price?: number;
  commission_rate?: number;
}

interface ReadinessResult {
  ready: boolean;
  missing: string[];
  warnings: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_tenant_id) {
      return new Response(
        JSON.stringify({ error: "No active tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = profile.active_tenant_id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const action = body.action || "create";

    // CREATE Listing from Property
    if (action === "create") {
      const data: ListingCreate = body.data;

      if (!data.property_id || !data.title) {
        return new Response(
          JSON.stringify({ error: "property_id and title are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify property ownership
      const { data: property } = await supabaseUser
        .from("properties")
        .select("id, address, city")
        .eq("id", data.property_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!property) {
        return new Response(
          JSON.stringify({ error: "Property not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for existing active listing
      const { data: existingListing } = await supabaseAdmin
        .from("listings")
        .select("id")
        .eq("property_id", data.property_id)
        .eq("tenant_id", tenantId)
        .in("status", ["draft", "internal_review", "active"])
        .maybeSingle();

      if (existingListing) {
        return new Response(
          JSON.stringify({ error: "Property already has an active listing", existing_id: existingListing.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: listing, error: listingError } = await supabaseAdmin
        .from("listings")
        .insert({
          tenant_id: tenantId,
          property_id: data.property_id,
          title: data.title,
          description: data.description,
          asking_price: data.asking_price,
          commission_rate: data.commission_rate || 3.0,
          status: "draft",
          created_by: user.id,
        })
        .select("id, public_id, title, status")
        .single();

      if (listingError) {
        console.error("Listing create error:", listingError);
        return new Response(
          JSON.stringify({ error: "Failed to create listing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create activity record
      await supabaseAdmin.from("listing_activities").insert({
        tenant_id: tenantId,
        listing_id: listing.id,
        activity_type: "listing.created",
        description: `Inserat "${listing.title}" erstellt`,
        performed_by: user.id,
      });

      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "listing.created",
        payload: { listing_id: listing.id, property_id: data.property_id },
      });

      console.log(`Listing created: ${listing.id}`);

      return new Response(
        JSON.stringify({
          listing_id: listing.id,
          public_id: listing.public_id,
          status: listing.status,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // READINESS CHECK before publish
    if (action === "check_readiness") {
      const { listing_id } = body;

      const { data: listing } = await supabaseUser
        .from("listings")
        .select("*, properties(*)")
        .eq("id", listing_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!listing) {
        return new Response(
          JSON.stringify({ error: "Listing not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result: ReadinessResult = {
        ready: true,
        missing: [],
        warnings: [],
      };

      // Check required fields
      if (!listing.title) result.missing.push("title");
      if (!listing.asking_price) result.missing.push("asking_price");
      if (!listing.description) result.missing.push("description");

      // Check property data
      if (!listing.properties?.total_area_sqm) result.warnings.push("property.total_area_sqm");
      if (!listing.properties?.year_built) result.warnings.push("property.year_built");

      result.ready = result.missing.length === 0;

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUBLISH Listing (activate)
    if (action === "publish") {
      const { listing_id, partner_visibility = "none", channel = "kaufy" } = body;

      // Fetch listing
      const { data: listing } = await supabaseUser
        .from("listings")
        .select("*")
        .eq("id", listing_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!listing) {
        return new Response(
          JSON.stringify({ error: "Listing not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check readiness
      const missing: string[] = [];
      if (!listing.title) missing.push("title");
      if (!listing.asking_price) missing.push("asking_price");
      if (!listing.description) missing.push("description");

      if (missing.length > 0) {
        return new Response(
          JSON.stringify({ error: "Listing not ready", missing }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update listing status to active
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("listings")
        .update({
          status: "active",
          partner_visibility: partner_visibility,
          published_at: new Date().toISOString(),
        })
        .eq("id", listing_id)
        .select("id, public_id, status, partner_visibility")
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to publish listing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create or update publication record
      await supabaseAdmin
        .from("listing_publications")
        .upsert({
          tenant_id: tenantId,
          listing_id: listing_id,
          channel: channel,
          status: "active",
          published_at: new Date().toISOString(),
        }, { onConflict: 'listing_id,channel' });

      // If partner_visibility is set, update property flag and create partner publication
      if (partner_visibility !== "none") {
        await supabaseAdmin
          .from("properties")
          .update({ is_public_listing: true })
          .eq("id", listing.property_id);

        // Create partner network publication
        await supabaseAdmin
          .from("listing_publications")
          .upsert({
            tenant_id: tenantId,
            listing_id: listing_id,
            channel: "partner_network",
            status: "active",
            published_at: new Date().toISOString(),
          }, { onConflict: 'listing_id,channel' });
      }

      // Create activity record
      await supabaseAdmin.from("listing_activities").insert({
        tenant_id: tenantId,
        listing_id: listing_id,
        activity_type: "listing.published",
        description: `Auf ${channel} veröffentlicht${partner_visibility !== 'none' ? ' + Partner-Netzwerk' : ''}`,
        performed_by: user.id,
        metadata: { channel, partner_visibility },
      });

      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "listing.published",
        payload: { listing_id, partner_visibility, channel },
      });

      console.log(`Listing published: ${listing_id} on ${channel} with visibility: ${partner_visibility}`);

      return new Response(
        JSON.stringify({
          listing_id: updated.id,
          status: updated.status,
          partner_visibility: updated.partner_visibility,
          published_at: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UNPUBLISH (deactivate)
    if (action === "unpublish") {
      const { listing_id } = body;

      const { data: updated, error } = await supabaseAdmin
        .from("listings")
        .update({ status: "withdrawn", partner_visibility: "none", withdrawn_at: new Date().toISOString() })
        .eq("id", listing_id)
        .eq("tenant_id", tenantId)
        .select("id, status")
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to unpublish" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update all publications to paused
      await supabaseAdmin
        .from("listing_publications")
        .update({ status: "paused", removed_at: new Date().toISOString() })
        .eq("listing_id", listing_id)
        .eq("tenant_id", tenantId);

      // Create activity record
      await supabaseAdmin.from("listing_activities").insert({
        tenant_id: tenantId,
        listing_id: listing_id,
        activity_type: "listing.unpublished",
        description: "Inserat deaktiviert",
        performed_by: user.id,
      });

      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "listing.unpublished",
        payload: { listing_id },
      });

      return new Response(
        JSON.stringify({ listing_id: updated.id, status: updated.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // LIST all listings
    if (action === "list") {
      const { data: listings } = await supabaseUser
        .from("listings")
        .select(`
          id, public_id, title, asking_price, status, partner_visibility,
          created_at, updated_at, published_at,
          properties (id, public_id, address, city)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      return new Response(
        JSON.stringify({ listings, count: listings?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET single listing with publications
    if (action === "get") {
      const { listing_id } = body;

      const { data: listing } = await supabaseUser
        .from("listings")
        .select(`
          *,
          properties (*),
          listing_publications (*),
          listing_partner_terms (*)
        `)
        .eq("id", listing_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!listing) {
        return new Response(
          JSON.stringify({ error: "Listing not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ listing }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CREATE INQUIRY (for Zone 3 lead capture)
    if (action === "create_inquiry") {
      const { listing_public_id, contact_name, contact_email, contact_phone, message, utm_source, utm_medium, utm_campaign } = body;

      // Find listing by public_id
      const { data: listing } = await supabaseAdmin
        .from("listings")
        .select("id, tenant_id, title")
        .eq("public_id", listing_public_id)
        .eq("status", "active")
        .maybeSingle();

      if (!listing) {
        return new Response(
          JSON.stringify({ error: "Listing not found or not active" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create inquiry
      const { data: inquiry, error: inquiryError } = await supabaseAdmin
        .from("listing_inquiries")
        .insert({
          tenant_id: listing.tenant_id,
          listing_id: listing.id,
          source: "website",
          status: "new",
          contact_name,
          contact_email,
          contact_phone,
          message,
          utm_source,
          utm_medium,
          utm_campaign,
        })
        .select("id")
        .single();

      if (inquiryError) {
        console.error("Inquiry create error:", inquiryError);
        return new Response(
          JSON.stringify({ error: "Failed to create inquiry" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create activity
      await supabaseAdmin.from("listing_activities").insert({
        tenant_id: listing.tenant_id,
        listing_id: listing.id,
        activity_type: "inquiry.created",
        description: `Neue Anfrage von ${contact_name || contact_email}`,
        metadata: { inquiry_id: inquiry.id, source: "website" },
      });

      console.log(`Inquiry created: ${inquiry.id} for listing ${listing.id}`);

      return new Response(
        JSON.stringify({ success: true, inquiry_id: inquiry.id }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUBLIC LISTINGS (for Zone 3 - no auth required)
    if (action === "public_list") {
      const { limit = 12, offset = 0, city, min_price, max_price } = body;

      let query = supabaseAdmin
        .from("v_public_listings")
        .select("*")
        .range(offset, offset + limit - 1);

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }
      if (min_price) {
        query = query.gte("asking_price", min_price);
      }
      if (max_price) {
        query = query.lte("asking_price", max_price);
      }

      const { data: listings, error } = await query;

      if (error) {
        console.error("Public list error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch listings" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ listings, count: listings?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: create, check_readiness, publish, unpublish, list, get, create_inquiry, public_list" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Listing publish error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
