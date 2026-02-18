import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EnrichmentPayload {
  source: 'email' | 'post';
  scope?: 'zone1_admin' | 'zone2_tenant';
  tenant_id: string | null;
  data: {
    email?: string;
    from_name?: string;
    body_text?: string;
    sender_info?: {
      name?: string;
      company?: string;
      street?: string;
      postal_code?: string;
      city?: string;
      phone?: string;
    };
  };
}

interface ExtractedContact {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone_mobile: string | null;
  phone: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
}

async function extractContactFromSignature(bodyText: string): Promise<ExtractedContact | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY is not configured");
    return null;
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte für das Extrahieren von Kontaktdaten aus E-Mail-Signaturen.
Analysiere den Text und extrahiere folgende Felder:
- first_name: Vorname
- last_name: Nachname  
- company: Firmenname
- phone_mobile: Mobilnummer (Format: +49...)
- phone: Festnetznummer (Format: +49...)
- street: Straße und Hausnummer
- postal_code: Postleitzahl
- city: Stadt
- email: E-Mail-Adresse

Antworte NUR mit einem JSON-Objekt. Felder ohne Wert als null.`
          },
          {
            role: "user",
            content: `Extrahiere Kontaktdaten aus diesem E-Mail-Text:\n\n${bodyText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contact",
              description: "Extrahiere Kontaktdaten aus der E-Mail-Signatur",
              parameters: {
                type: "object",
                properties: {
                  first_name: { type: "string", nullable: true },
                  last_name: { type: "string", nullable: true },
                  company: { type: "string", nullable: true },
                  phone_mobile: { type: "string", nullable: true },
                  phone: { type: "string", nullable: true },
                  street: { type: "string", nullable: true },
                  postal_code: { type: "string", nullable: true },
                  city: { type: "string", nullable: true },
                  email: { type: "string", nullable: true }
                },
                required: ["first_name", "last_name", "company", "phone_mobile", "phone", "street", "postal_code", "city", "email"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_contact" } }
      }),
    });

    if (!response.ok) {
      console.error("AI extraction failed:", response.status);
      return null;
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }

    return null;
  } catch (error) {
    console.error("Error extracting contact from signature:", error);
    return null;
  }
}

function extractContactFromSenderInfo(senderInfo: EnrichmentPayload['data']['sender_info']): ExtractedContact | null {
  if (!senderInfo) return null;

  let firstName = null;
  let lastName = null;

  if (senderInfo.name) {
    const nameParts = senderInfo.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 1) {
      lastName = nameParts[0];
    }
  }

  return {
    first_name: firstName,
    last_name: lastName,
    company: senderInfo.company || null,
    phone_mobile: null,
    phone: senderInfo.phone || null,
    street: senderInfo.street || null,
    postal_code: senderInfo.postal_code || null,
    city: senderInfo.city || null,
    email: null,
  };
}

function generatePublicId(firstName: string | null, lastName: string | null): string {
  const namePart = (lastName || firstName || 'UNKNOWN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SOT-K-${namePart}${randomSuffix}`;
}

/**
 * Check if tenant has an active contact_enrichment subscription
 * and still has credits left in the current billing month.
 * Returns { allowed: boolean, reason?: string }
 */
async function checkEnrichmentSubscription(
  supabase: any,
  tenantId: string,
): Promise<{ allowed: boolean; reason?: string; creditsUsedThisMonth?: number; creditsPerMonth?: number }> {
  // 1. Check for active subscription
  const { data: sub, error: subErr } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('service_code', 'contact_enrichment')
    .eq('is_active', true)
    .maybeSingle();

  if (subErr) {
    console.error("Subscription check error:", subErr);
    return { allowed: false, reason: "subscription_check_failed" };
  }

  if (!sub) {
    return { allowed: false, reason: "no_active_subscription" };
  }

  const creditsPerMonth = sub.credits_per_month || 20;

  // 2. Count credits used this month for contact_enrichment
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error: countErr } = await supabase
    .from('credit_ledger')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('action_code', 'contact_enrichment')
    .gte('created_at', monthStart)
    .lt('amount', 0); // Only deductions (negative amounts)

  if (countErr) {
    console.error("Credit count error:", countErr);
    return { allowed: false, reason: "credit_count_failed" };
  }

  const creditsUsed = count || 0;

  if (creditsUsed >= creditsPerMonth) {
    return { 
      allowed: false, 
      reason: "monthly_budget_exhausted", 
      creditsUsedThisMonth: creditsUsed, 
      creditsPerMonth 
    };
  }

  return { allowed: true, creditsUsedThisMonth: creditsUsed, creditsPerMonth };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EnrichmentPayload = await req.json();
    const { source, scope = 'zone2_tenant', tenant_id, data } = payload;

    console.log(`Contact enrichment triggered for source: ${source}, scope: ${scope}, tenant: ${tenant_id}`);

    // Validate: Zone 2 requires tenant_id, Zone 1 does not
    if (scope === 'zone2_tenant' && !tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required for zone2_tenant scope" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check subscription + monthly budget (for zone2_tenant)
    if (scope === 'zone2_tenant' && tenant_id) {
      const subscriptionCheck = await checkEnrichmentSubscription(supabase, tenant_id);
      
      if (!subscriptionCheck.allowed) {
        console.log(`Enrichment not allowed: ${subscriptionCheck.reason} (used: ${subscriptionCheck.creditsUsedThisMonth}/${subscriptionCheck.creditsPerMonth})`);
        return new Response(JSON.stringify({ 
          skipped: true, 
          reason: subscriptionCheck.reason,
          credits_used: subscriptionCheck.creditsUsedThisMonth,
          credits_limit: subscriptionCheck.creditsPerMonth,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also check legacy tenant_extraction_settings for channel-level toggle
      const { data: settings } = await supabase
        .from('tenant_extraction_settings')
        .select('auto_enrich_contacts_email, auto_enrich_contacts_post')
        .eq('tenant_id', tenant_id)
        .maybeSingle();

      const isEnabled = source === 'email' 
        ? settings?.auto_enrich_contacts_email 
        : settings?.auto_enrich_contacts_post;

      if (isEnabled === false) {
        console.log(`Auto-enrich is disabled for ${source} channel`);
        return new Response(JSON.stringify({ skipped: true, reason: `channel_disabled_${source}` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Extract contact data based on source
    let extractedContact: ExtractedContact | null = null;

    if (source === 'email' && data.body_text) {
      extractedContact = await extractContactFromSignature(data.body_text);
      
      if ((!extractedContact?.first_name || !extractedContact?.last_name) && data.from_name) {
        const nameParts = data.from_name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          extractedContact = {
            ...extractedContact,
            first_name: extractedContact?.first_name || nameParts[0],
            last_name: extractedContact?.last_name || nameParts.slice(1).join(' '),
          } as ExtractedContact;
        }
      }
      
      if (!extractedContact?.email && data.email) {
        extractedContact = {
          ...extractedContact,
          email: data.email,
        } as ExtractedContact;
      }
    } else if (source === 'post' && data.sender_info) {
      extractedContact = extractContactFromSenderInfo(data.sender_info);
    }

    if (!extractedContact) {
      console.log("No contact data could be extracted");
      return new Response(JSON.stringify({ skipped: true, reason: "No contact data extracted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Extracted contact:", extractedContact);

    // Search for existing contact by email
    let existingContact = null;
    if (extractedContact.email) {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('scope', scope)
        .eq('email', extractedContact.email);
      
      if (scope === 'zone2_tenant' && tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }
      
      const { data: found } = await query.maybeSingle();
      existingContact = found;
    }

    let result: { action: string; contact_id?: string; fields_updated?: string[] };

    if (existingContact) {
      const updateData: Record<string, string | null> = {};
      
      if (!existingContact.first_name && extractedContact.first_name) updateData.first_name = extractedContact.first_name;
      if (!existingContact.last_name && extractedContact.last_name) updateData.last_name = extractedContact.last_name;
      if (!existingContact.company && extractedContact.company) updateData.company = extractedContact.company;
      if (!existingContact.phone_mobile && extractedContact.phone_mobile) updateData.phone_mobile = extractedContact.phone_mobile;
      if (!existingContact.phone && extractedContact.phone) updateData.phone = extractedContact.phone;
      if (!existingContact.street && extractedContact.street) updateData.street = extractedContact.street;
      if (!existingContact.postal_code && extractedContact.postal_code) updateData.postal_code = extractedContact.postal_code;
      if (!existingContact.city && extractedContact.city) updateData.city = extractedContact.city;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', existingContact.id);

        if (updateError) {
          console.error("Error updating contact:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update contact" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { action: 'updated', contact_id: existingContact.id, fields_updated: Object.keys(updateData) };
      } else {
        result = { action: 'unchanged', contact_id: existingContact.id };
      }
    } else {
      if (!extractedContact.first_name && !extractedContact.last_name) {
        return new Response(JSON.stringify({ skipped: true, reason: "No name extracted" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newContact = {
        tenant_id: scope === 'zone1_admin' ? null : tenant_id,
        scope,
        first_name: extractedContact.first_name || 'Unbekannt',
        last_name: extractedContact.last_name || 'Unbekannt',
        email: extractedContact.email,
        company: extractedContact.company,
        phone_mobile: extractedContact.phone_mobile,
        phone: extractedContact.phone,
        street: extractedContact.street,
        postal_code: extractedContact.postal_code,
        city: extractedContact.city,
        category: 'Offen',
        public_id: generatePublicId(extractedContact.first_name, extractedContact.last_name),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('contacts')
        .insert([newContact])
        .select('id')
        .single();

      if (insertError) {
        console.error("Error creating contact:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create contact" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result = { action: 'created', contact_id: inserted.id };
    }

    // Deduct 1 credit for successful enrichment (zone2_tenant only)
    if (scope === 'zone2_tenant' && tenant_id && result.action !== 'unchanged') {
      try {
        await supabase.rpc("rpc_credit_deduct", {
          p_tenant_id: tenant_id,
          p_credits: 1,
          p_action_code: "contact_enrichment",
          p_ref_type: "contact",
          p_ref_id: result.contact_id || null,
        });
        console.log(`1 Credit deducted for contact_enrichment (tenant: ${tenant_id})`);
      } catch (creditErr) {
        console.error("Credit deduction failed (non-blocking):", creditErr);
      }
    }

    console.log(`Contact enrichment result:`, result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact enrichment error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
