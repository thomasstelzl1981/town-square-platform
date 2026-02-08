import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EnrichmentPayload {
  source: 'email' | 'post';
  tenant_id: string;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EnrichmentPayload = await req.json();
    const { source, tenant_id, data } = payload;

    console.log(`Contact enrichment triggered for source: ${source}, tenant: ${tenant_id}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if enrichment is enabled for this channel
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_extraction_settings')
      .select('auto_enrich_contacts_email, auto_enrich_contacts_post')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isEnabled = source === 'email' 
      ? settings?.auto_enrich_contacts_email 
      : settings?.auto_enrich_contacts_post;

    if (!isEnabled) {
      console.log(`Auto-enrich is disabled for ${source}`);
      return new Response(JSON.stringify({ skipped: true, reason: `Auto-enrich disabled for ${source}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract contact data based on source
    let extractedContact: ExtractedContact | null = null;

    if (source === 'email' && data.body_text) {
      extractedContact = await extractContactFromSignature(data.body_text);
      
      // Use from_name as fallback for name extraction
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
      
      // Use email from header if not extracted
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
      const { data: found } = await supabase
        .from('contacts')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('email', extractedContact.email)
        .maybeSingle();
      existingContact = found;
    }

    if (existingContact) {
      // Update only NULL fields
      const updateData: Record<string, string | null> = {};
      
      if (!existingContact.first_name && extractedContact.first_name) {
        updateData.first_name = extractedContact.first_name;
      }
      if (!existingContact.last_name && extractedContact.last_name) {
        updateData.last_name = extractedContact.last_name;
      }
      if (!existingContact.company && extractedContact.company) {
        updateData.company = extractedContact.company;
      }
      if (!existingContact.phone_mobile && extractedContact.phone_mobile) {
        updateData.phone_mobile = extractedContact.phone_mobile;
      }
      if (!existingContact.phone && extractedContact.phone) {
        updateData.phone = extractedContact.phone;
      }
      if (!existingContact.street && extractedContact.street) {
        updateData.street = extractedContact.street;
      }
      if (!existingContact.postal_code && extractedContact.postal_code) {
        updateData.postal_code = extractedContact.postal_code;
      }
      if (!existingContact.city && extractedContact.city) {
        updateData.city = extractedContact.city;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', existingContact.id);

        if (updateError) {
          console.error("Error updating contact:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update contact" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Updated contact ${existingContact.id} with fields:`, Object.keys(updateData));
        return new Response(JSON.stringify({ 
          action: 'updated', 
          contact_id: existingContact.id,
          fields_updated: Object.keys(updateData)
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        console.log("No fields to update for existing contact");
        return new Response(JSON.stringify({ action: 'unchanged', contact_id: existingContact.id }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Create new contact with category "Offen"
      if (!extractedContact.first_name && !extractedContact.last_name) {
        console.log("Cannot create contact without name");
        return new Response(JSON.stringify({ skipped: true, reason: "No name extracted" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newContact = {
        tenant_id,
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
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Created new contact ${inserted.id} with category 'Offen'`);
      return new Response(JSON.stringify({ 
        action: 'created', 
        contact_id: inserted.id,
        category: 'Offen'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Contact enrichment error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
