import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const { action, order_id, ...params } = await req.json()

    switch (action) {
      case 'suggest_filters': {
        const { intent_text } = params
        const aiResponse = await callLovableAI({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Du bist ein B2B-Lead-Research-Experte. Analysiere den Suchintent und erstelle ein strukturiertes ICP-Profil als JSON.
Output Format: {"branche": "...", "region": "...", "role": "...", "keywords": ["..."], "domain": ""}`
            },
            { role: 'user', content: `Suchintent: ${intent_text}` }
          ]
        })
        return jsonResponse({ icp_json: parseJsonFromAI(aiResponse) })
      }

      case 'optimize_plan': {
        const { intent_text, icp_json } = params
        const aiResponse = await callLovableAI({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Du bist ein Research-Stratege. Empfehle den optimalen Provider-Mix für die Kontaktrecherche.
Verfügbare Provider: firecrawl (Web Crawl), epify (Enrichment), apollo (People Search).
Output Format: {"firecrawl": true/false, "epify": true/false, "apollo": true/false, "reasoning": "...", "estimated_cost_per_contact": 0.xx}`
            },
            { role: 'user', content: `Intent: ${intent_text}\nICP: ${JSON.stringify(icp_json)}` }
          ]
        })
        return jsonResponse({ provider_plan: parseJsonFromAI(aiResponse) })
      }

      case 'score_results': {
        if (!order_id) throw new Error('order_id required')
        const { data: results } = await supabase
          .from('research_order_results')
          .select('id, full_name, company_name, role, email, phone, domain, location')
          .eq('order_id', order_id)
          .eq('status', 'candidate')
          .limit(50)

        if (!results?.length) return jsonResponse({ scored: [] })

        const aiResponse = await callLovableAI({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Bewerte diese Kontakte auf einer Skala von 0-100 (Confidence Score).
Kriterien: Vollständigkeit (Email, Telefon vorhanden), Plausibilität (Name+Firma+Rolle passen zusammen), Red Flags (generische Emails, fehlende Daten).
Output: JSON Array mit [{id, confidence_score, red_flags: []}]`
            },
            { role: 'user', content: JSON.stringify(results) }
          ]
        })

        const scored = parseJsonFromAI(aiResponse)
        if (Array.isArray(scored)) {
          for (const s of scored) {
            await supabase
              .from('research_order_results')
              .update({ confidence_score: s.confidence_score })
              .eq('id', s.id)
          }
        }
        return jsonResponse({ scored })
      }

      case 'summarize': {
        if (!order_id) throw new Error('order_id required')
        const { data: order } = await supabase
          .from('research_orders')
          .select('*')
          .eq('id', order_id)
          .single()

        const { data: results } = await supabase
          .from('research_order_results')
          .select('full_name, company_name, role, email, confidence_score, status')
          .eq('order_id', order_id)
          .limit(100)

        const aiResponse = await callLovableAI({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Erstelle eine Zusammenfassung des Recherche-Auftrags auf Deutsch (Markdown).
Struktur: ## Zusammenfassung, ### Statistiken (Treffer, Confidence-Verteilung), ### Top-Kontakte, ### Empfohlene nächste Schritte (z.B. Serien-Email, manuelle Nachrecherche)`
            },
            {
              role: 'user',
              content: `Auftrag: ${JSON.stringify(order)}\nErgebnisse: ${JSON.stringify(results)}`
            }
          ]
        })

        await supabase
          .from('research_orders')
          .update({ ai_summary_md: aiResponse })
          .eq('id', order_id)

        return jsonResponse({ summary_md: aiResponse })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Lovable AI Gateway — single clean call, no recursion, no fallbacks.
 */
async function callLovableAI(payload: {
  model: string
  messages: { role: string; content: string }[]
}): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      stream: false,
    }),
  })

  if (response.status === 429) {
    throw new Error('AI rate limit exceeded. Please try again later.')
  }
  if (response.status === 402) {
    throw new Error('AI credits exhausted. Please add funds to your workspace.')
  }
  if (!response.ok) {
    const errText = await response.text()
    console.error('Lovable AI Gateway error:', response.status, errText)
    throw new Error(`AI Gateway error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

function parseJsonFromAI(text: string): any {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim())
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
