import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_BRAND_CONTEXTS = ["kaufy", "futureroom", "acquiary", "project"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      tenant_id,
      brand_context,
      project_id,
      budget_total_cents,
      start_date,
      end_date,
      regions,
      audience_preset,
      template_slots,
      personalization,
      creatives,
      partner_display_name,
      template_ids,
      campaign_name,
    } = body;

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate brand_context against known list
    const effectiveBrand = project_id ? "project" : (brand_context || "kaufy");
    if (!VALID_BRAND_CONTEXTS.includes(effectiveBrand)) {
      return new Response(JSON.stringify({ error: `Invalid brand_context: ${effectiveBrand}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate selected templates are approved (if template_ids provided)
    if (template_ids && Array.isArray(template_ids) && template_ids.length > 0) {
      const { data: templates } = await supabase
        .from("social_templates")
        .select("id, approved, campaign_defaults")
        .in("id", template_ids);
      
      const unapproved = (templates || []).filter((t: any) => !t.approved);
      if (unapproved.length > 0) {
        return new Response(JSON.stringify({ 
          error: "Einige Templates sind nicht freigegeben",
          unapproved_ids: unapproved.map((t: any) => t.id),
        }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate total credit cost from templates
      const totalCredits = (templates || []).reduce((sum: number, t: any) => {
        const defaults = t.campaign_defaults || {};
        return sum + (defaults.credit_cost || 0);
      }, 0);

      // Credit preflight check
      if (totalCredits > 0) {
        const { data: preflight, error: preflightError } = await supabase.functions.invoke(
          'sot-credit-preflight',
          { body: { tenant_id, credits_required: totalCredits, action_code: 'SOCIAL_CAMPAIGN' } }
        );
        if (preflightError || !preflight?.allowed) {
          return new Response(JSON.stringify({ 
            error: "Nicht genügend Credits",
            credits_required: totalCredits,
            credits_available: preflight?.balance || 0,
          }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Create mandate
    const mandateInsert: Record<string, any> = {
      tenant_id,
      partner_user_id: user.id,
      partner_display_name: partner_display_name || user.email,
      status: "submitted",
      brand_context: effectiveBrand,
      budget_total_cents: budget_total_cents || 0,
      start_date,
      end_date,
      regions: regions || [],
      audience_preset: audience_preset || {},
      template_slots: template_ids && template_ids.length > 0 
        ? { selected_template_ids: template_ids } 
        : (template_slots || {}),
      personalization: {
        ...(personalization || {}),
        campaign_name: campaign_name || '',
      },
      payment_status: "unpaid",
    };
    if (project_id) mandateInsert.project_id = project_id;

    const { data: mandate, error: mandateError } = await supabase
      .from("social_mandates")
      .insert(mandateInsert)
      .select()
      .single();

    if (mandateError) {
      console.error("Mandate insert error:", mandateError);
      return new Response(JSON.stringify({ error: mandateError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create creatives for each slot
    if (creatives && typeof creatives === "object") {
      const creativeInserts = Object.entries(creatives).map(([slotKey, creative]: [string, any]) => ({
        tenant_id,
        mandate_id: mandate.id,
        template_id: null,
        slot_key: slotKey,
        slideshow_outline: creative.slides || [],
        caption_text: creative.caption || "",
        cta_variant: creative.cta || "",
        status: "generated",
      }));

      if (creativeInserts.length > 0) {
        const { error: creativesError } = await supabase
          .from("social_creatives")
          .insert(creativeInserts);

        if (creativesError) {
          console.error("Creatives insert error:", creativesError);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mandate_id: mandate.id,
      status: mandate.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mandate-submit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
