import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScopeRequest {
  service_case_id: string;
  action: 'analyze_and_generate' | 'estimate_costs' | 'generate_description' | 'generate_from_description';
  document_ids?: string[];
  line_items?: LineItem[];
  category?: string;
  property_address?: string;
  unit_info?: string;
  location?: string;
  description?: string;
  area_sqm?: number;
}

interface LineItem {
  id: string;
  position: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
}

interface Room {
  name: string;
  area_sqm: number;
  doors: number;
  windows: number;
  fixtures?: string[];
}

interface RoomAnalysis {
  rooms: Room[];
  total_area_sqm: number;
  total_doors: number;
  total_windows: number;
  condition_notes?: string[];
  recommendations?: string[];
}

// Category-specific templates for LV generation
const CATEGORY_TEMPLATES: Record<string, { positions: string[], typical_scope: string }> = {
  sanitaer: {
    typical_scope: 'Sanitärsanierung (Bad/WC)',
    positions: [
      'Demontage Sanitärobjekte',
      'Demontage Altfliesen Wand',
      'Demontage Altfliesen Boden',
      'Rohinstallation Wasser/Abwasser',
      'Elektroinstallation anpassen',
      'Abdichtung nach DIN 18534',
      'Wandfliesen liefern & verlegen',
      'Bodenfliesen liefern & verlegen',
      'WC inkl. Vorwand + Montage',
      'Waschtisch inkl. Armatur + Montage',
      'Dusche/Badewanne inkl. Armatur',
      'Malerarbeiten Decke',
      'Silikonfugen + Abschlussarbeiten',
    ],
  },
  elektro: {
    typical_scope: 'Elektroinstallation',
    positions: [
      'Demontage Altinstallation',
      'Leitungsverlegung Unterputz',
      'Steckdosen setzen',
      'Lichtschalter setzen',
      'Deckenauslässe',
      'Unterverteilung anpassen',
      'Prüfung nach DIN VDE',
    ],
  },
  maler: {
    typical_scope: 'Maler- und Tapezierarbeiten',
    positions: [
      'Untergrund vorbereiten',
      'Spachteln und Schleifen',
      'Grundierung',
      'Tapeten entfernen',
      'Tapezieren',
      'Streichen Wände',
      'Streichen Decke',
      'Lackieren Türen',
      'Lackieren Fenster',
    ],
  },
};

// Cost estimation ranges per category (cents per m² or position)
const COST_RANGES: Record<string, { min: number, mid: number, max: number }> = {
  sanitaer: { min: 800_00, mid: 1200_00, max: 2000_00 }, // per m² bathroom
  elektro: { min: 40_00, mid: 60_00, max: 100_00 }, // per m² living space
  maler: { min: 15_00, mid: 25_00, max: 45_00 }, // per m² wall/ceiling
  default: { min: 50_00, mid: 80_00, max: 150_00 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const request: ScopeRequest = await req.json();
    const { service_case_id, action, document_ids, line_items, category, property_address, unit_info, location, description, area_sqm } = request;
    
    if (!service_case_id) {
      return new Response(
        JSON.stringify({ error: 'service_case_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get service case details
    const { data: serviceCase, error: caseError } = await supabase
      .from('service_cases')
      .select('*')
      .eq('id', service_case_id)
      .single();
    
    if (caseError || !serviceCase) {
      return new Response(
        JSON.stringify({ error: 'Service case not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const caseCategory = category || serviceCase.category || 'sonstige';
    
    // Handle different actions
    if (action === 'analyze_and_generate') {
      // Analyze documents and generate LV
      console.log('Analyzing documents for service case:', service_case_id);
      
      // Get document contents if AI is available
      let aiAnalysis: { room_analysis?: RoomAnalysis, line_items?: LineItem[], scope_description?: string } | null = null;
      
      if (lovableApiKey && document_ids && document_ids.length > 0) {
        // Fetch document metadata
        const { data: documents } = await supabase
          .from('documents')
          .select('id, name, mime_type, file_path, doc_type')
          .in('id', document_ids);
        
        // Prepare context for AI
        const docContext = documents?.map(d => `${d.name} (${d.doc_type || 'unbekannt'})`).join(', ') || 'keine Dokumente';
        
        const systemPrompt = `Du bist ein Experte für Sanierungsausschreibungen in Deutschland.
Du analysierst Wohnungs-/Haussanierungen (Innensanierung) und erstellst strukturierte Leistungsverzeichnisse.

WICHTIG: Du erstellst NUR Innensanierungen (Wohnung/Haus), KEINE kompletten Gebäudesanierungen (Fassade, Dachstuhl).

Antworte immer im JSON-Format.`;

        const userPrompt = `Erstelle ein Leistungsverzeichnis für folgende Sanierung:

Kategorie: ${caseCategory}
Objekt: ${property_address || 'unbekannt'}
Einheit: ${unit_info || 'Gesamtes Objekt'}
Verfügbare Dokumente: ${docContext}

Basierend auf der Kategorie "${caseCategory}" und typischen Sanierungsarbeiten, erstelle:

1. Eine Raumanalyse (geschätzt basierend auf typischer Wohnung falls keine Grundrisse verfügbar)
2. Ein strukturiertes Leistungsverzeichnis mit Positionen
3. Eine Freitext-Beschreibung für die Ausschreibung

Antworte im JSON-Format:
{
  "room_analysis": {
    "rooms": [{"name": "Bad", "area_sqm": 4.5, "doors": 1, "windows": 1, "fixtures": ["Badewanne", "WC"]}],
    "total_area_sqm": 70,
    "total_doors": 6,
    "total_windows": 4,
    "condition_notes": ["🔴 Bad: Fliesen veraltet"],
    "recommendations": ["Komplettsanierung empfohlen"]
  },
  "line_items": [
    {"id": "1", "position": "1.1", "description": "Demontage Sanitärobjekte", "quantity": 1, "unit": "psch"}
  ],
  "scope_description": "Komplettsanierung des Bades..."
}`;

        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              response_format: { type: 'json_object' },
            }),
          });
          
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              aiAnalysis = JSON.parse(content);
            }
          }
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
        }
      }
      
      // Fallback: Generate template-based LV if AI didn't work
      if (!aiAnalysis?.line_items) {
        const template = CATEGORY_TEMPLATES[caseCategory] || CATEGORY_TEMPLATES.sanitaer;
        aiAnalysis = {
          room_analysis: {
            rooms: [{ name: 'Raum', area_sqm: 20, doors: 1, windows: 1 }],
            total_area_sqm: 20,
            total_doors: 1,
            total_windows: 1,
            condition_notes: [],
            recommendations: ['Detaillierte Analyse vor Ort empfohlen'],
          },
          line_items: template.positions.map((desc, i) => ({
            id: crypto.randomUUID(),
            position: `${Math.floor(i / 5) + 1}.${(i % 5) + 1}`,
            description: desc,
            quantity: 1,
            unit: 'psch',
            isAiGenerated: true,
          })),
          scope_description: `${template.typical_scope} in ${property_address || 'dem Objekt'}. Detaillierte Abstimmung vor Ort erforderlich.`,
        };
      }
      
      // Add IDs and AI flag to line items
      const lineItemsWithIds = (aiAnalysis.line_items || []).map((item, i) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        position: item.position || `${Math.floor(i / 5) + 1}.${(i % 5) + 1}`,
        isAiGenerated: true,
      }));
      
      return new Response(
        JSON.stringify({
          success: true,
          room_analysis: aiAnalysis.room_analysis,
          line_items: lineItemsWithIds,
          scope_description: aiAnalysis.scope_description,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'estimate_costs') {
      // Estimate costs based on line items
      console.log('Estimating costs for service case:', service_case_id);
      
      if (!line_items || line_items.length === 0) {
        return new Response(
          JSON.stringify({ error: 'line_items required for cost estimation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const costRange = COST_RANGES[caseCategory] || COST_RANGES.default;
      
      // Calculate based on number of positions and category
      const positionCount = line_items.length;
      const baseMultiplier = positionCount * 500; // Base per position in cents
      
      // Use AI for better estimation if available
      let estimates = {
        min: costRange.min * (positionCount / 3),
        mid: costRange.mid * (positionCount / 3),
        max: costRange.max * (positionCount / 3),
      };
      
      if (lovableApiKey) {
        const positionsText = line_items.map(li => 
          `${li.position}: ${li.description} (${li.quantity} ${li.unit})`
        ).join('\n');
        
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { 
                  role: 'system', 
                  content: 'Du bist ein Kostenexperte für Sanierungen in Deutschland. Schätze realistische Kosten basierend auf aktuellen Marktpreisen.' 
                },
                { 
                  role: 'user', 
                  content: `Schätze die Kosten für folgende Sanierungsarbeiten in ${location || 'Deutschland'}:

${positionsText}

Antworte NUR mit JSON:
{"min": 500000, "mid": 750000, "max": 1200000}

Die Werte sind in Cent. min = günstige Ausführung, mid = Standard, max = Premium.` 
                },
              ],
              response_format: { type: 'json_object' },
            }),
          });
          
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              estimates = {
                min: parsed.min || estimates.min,
                mid: parsed.mid || estimates.mid,
                max: parsed.max || estimates.max,
              };
            }
          }
        } catch (aiError) {
          console.error('AI cost estimation failed:', aiError);
        }
      }
      
      // Round to nearest 100€
      const roundTo = 100_00; // 100€ in cents
      estimates.min = Math.round(estimates.min / roundTo) * roundTo;
      estimates.mid = Math.round(estimates.mid / roundTo) * roundTo;
      estimates.max = Math.round(estimates.max / roundTo) * roundTo;
      
      return new Response(
        JSON.stringify({
          success: true,
          cost_estimate_min: estimates.min,
          cost_estimate_mid: estimates.mid,
          cost_estimate_max: estimates.max,
          data_source: `Marktdaten ${new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'generate_from_description') {
      // Generate LV + description + cost estimate from free-text description
      console.log('Generating from description for service case:', service_case_id);
      
      const freeText = description || serviceCase.description || '';
      if (!freeText.trim()) {
        return new Response(
          JSON.stringify({ error: 'Keine Beschreibung vorhanden' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      let result: { room_analysis?: RoomAnalysis; line_items?: LineItem[]; scope_description?: string; cost_estimate_min?: number; cost_estimate_mid?: number; cost_estimate_max?: number } = {};
      
      if (lovableApiKey) {
        const systemPrompt = `Du bist ein Experte für Sanierungsausschreibungen in Deutschland (Innensanierung).
Du erstellst aus Freitextbeschreibungen strukturierte Leistungsverzeichnisse mit realistischen Kostenschätzungen.
Antworte IMMER im JSON-Format.`;

        const areaHint = area_sqm ? `\nFläche: ca. ${area_sqm} m²` : '';
        const userPrompt = `Erstelle aus folgender Freitextbeschreibung ein strukturiertes Leistungsverzeichnis für eine Innensanierung:

Beschreibung: "${freeText}"
Kategorie: ${caseCategory}
Objekt: ${property_address || 'unbekannt'}
Einheit: ${unit_info || 'Gesamtes Objekt'}${areaHint}

Erstelle:
1. Eine Raumanalyse (geschätzt aus der Beschreibung)
2. Ein detailliertes Leistungsverzeichnis mit nummerierten Positionen, Mengen und Einheiten
3. Eine professionelle Ausschreibungsbeschreibung (max 200 Wörter)
4. Eine Kostenschätzung in Cent (min/mid/max)

JSON-Format:
{
  "room_analysis": {
    "rooms": [{"name": "Bad", "area_sqm": 6, "doors": 1, "windows": 1, "fixtures": ["Dusche"]}],
    "total_area_sqm": 6,
    "total_doors": 1,
    "total_windows": 1,
    "condition_notes": ["Fliesen veraltet"],
    "recommendations": ["Komplettsanierung empfohlen"]
  },
  "line_items": [
    {"id": "1", "position": "1.1", "description": "Demontage Sanitärobjekte", "quantity": 1, "unit": "psch"}
  ],
  "scope_description": "Professionelle Beschreibung...",
  "cost_estimate_min": 500000,
  "cost_estimate_mid": 800000,
  "cost_estimate_max": 1200000
}`;

        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              response_format: { type: 'json_object' },
            }),
          });
          
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            if (content) {
              result = JSON.parse(content);
            }
          } else {
            console.error('AI response not ok:', aiResponse.status);
          }
        } catch (aiError) {
          console.error('AI generation from description failed:', aiError);
        }
      }
      
      // Fallback: template-based
      if (!result.line_items || result.line_items.length === 0) {
        const template = CATEGORY_TEMPLATES[caseCategory] || CATEGORY_TEMPLATES.sanitaer;
        const costRange = COST_RANGES[caseCategory] || COST_RANGES.default;
        result = {
          line_items: template.positions.map((desc, i) => ({
            id: crypto.randomUUID(),
            position: `${Math.floor(i / 5) + 1}.${(i % 5) + 1}`,
            description: desc,
            quantity: 1,
            unit: 'psch',
          })),
          scope_description: `${template.typical_scope} in ${property_address || 'dem Objekt'}. Basierend auf: ${freeText}`,
          cost_estimate_min: costRange.min * 3,
          cost_estimate_mid: costRange.mid * 3,
          cost_estimate_max: costRange.max * 3,
        };
      }
      
      // Ensure IDs
      const lineItemsWithIds = (result.line_items || []).map((item, i) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        position: item.position || `${Math.floor(i / 5) + 1}.${(i % 5) + 1}`,
        isAiGenerated: true,
      }));
      
      // Round costs
      const roundTo = 100_00;
      const costMin = result.cost_estimate_min ? Math.round(result.cost_estimate_min / roundTo) * roundTo : null;
      const costMid = result.cost_estimate_mid ? Math.round(result.cost_estimate_mid / roundTo) * roundTo : null;
      const costMax = result.cost_estimate_max ? Math.round(result.cost_estimate_max / roundTo) * roundTo : null;
      
      return new Response(
        JSON.stringify({
          success: true,
          room_analysis: result.room_analysis,
          line_items: lineItemsWithIds,
          scope_description: result.scope_description,
          cost_estimate_min: costMin,
          cost_estimate_mid: costMid,
          cost_estimate_max: costMax,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'generate_description') {
      // Generate scope description from line items
      if (!line_items || line_items.length === 0) {
        return new Response(
          JSON.stringify({ error: 'line_items required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const positionsText = line_items.map(li => `- ${li.description}`).join('\n');
      let description = `Sanierungsarbeiten im Bereich ${caseCategory} für ${property_address || 'das Objekt'}:\n\n${positionsText}`;
      
      if (lovableApiKey) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { 
                  role: 'system', 
                  content: 'Du erstellst professionelle Leistungsbeschreibungen für Handwerkerausschreibungen.' 
                },
                { 
                  role: 'user', 
                  content: `Erstelle eine professionelle Leistungsbeschreibung für eine Ausschreibung:

Kategorie: ${caseCategory}
Objekt: ${property_address || 'unbekannt'}
Einheit: ${unit_info || 'Gesamtes Objekt'}

Positionen:
${positionsText}

Schreibe eine klare, professionelle Beschreibung für die Ausschreibungs-E-Mail (max. 300 Wörter).` 
                },
              ],
            }),
          });
          
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            description = aiData.choices?.[0]?.message?.content || description;
          }
        } catch (aiError) {
          console.error('AI description generation failed:', aiError);
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, scope_description: description }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in sot-renovation-scope-ai:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
