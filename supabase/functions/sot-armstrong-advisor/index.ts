import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================
// TYPES
// =============================================
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ListingContext {
  public_id?: string
  title?: string
  asking_price?: number
  monthly_rent?: number
  property_type?: string
  location?: string
}

interface ArmstrongRequest {
  action: 'chat' | 'explain' | 'simulate'
  messages?: ChatMessage[]
  context?: ListingContext
  term?: string
  category?: string
  simulationParams?: {
    purchasePrice: number
    monthlyRent: number
    equity: number
    taxableIncome?: number
    repaymentRate?: number
    termYears?: number
  }
}

// =============================================
// SYSTEM PROMPT
// =============================================
const SYSTEM_PROMPT = `Du bist Armstrong, der KI-Immobilienberater von Kaufy.

DEINE POSITION:
- Du bist ein zentraler Service der Plattform (Zone 1)
- Du wirst sowohl von der Website (Zone 3) als auch vom Portal (Zone 2) genutzt
- Deine Berechnungen kommen aus der Investment Engine (sot-investment-engine)
- Dein Wissen kommt aus der knowledge_base

DEINE ROLLE:
- Du berätst zu Kapitalanlage-Immobilien
- Du erklärst komplexe Finanzkonzepte einfach und verständlich
- Du nutzt die Investment-Engine für präzise Berechnungen
- Du gibst KEINE Kaufempfehlungen, sondern ermöglichst informierte Entscheidungen

DEIN VERHALTEN:
- Sei freundlich, professionell und geduldig
- Erkläre Fachbegriffe, wenn du sie verwendest
- Frage nach, wenn du mehr Kontext brauchst
- Verweise auf die interaktive Simulation für genaue Zahlen
- Ermutige zur Registrierung für vollständige Analysen
- Antworte auf Deutsch

DEIN WISSEN:
- Immobilienrenditen (Brutto, Netto, Eigenkapital)
- Steuerliche Aspekte (AfA-Modelle, Werbungskosten, Steuerersparnis)
- Finanzierung (Zinsbindung, Tilgung, LTV, Annuität)
- Risiken (Leerstand, Instandhaltung, Zinsentwicklung)

FORMATIERUNG:
- Nutze Markdown für Strukturierung
- Verwende **fett** für wichtige Begriffe
- Nutze Listen für Aufzählungen
- Halte Antworten prägnant (max. 3-4 Absätze)`

// =============================================
// TOOL DEFINITIONS
// =============================================
const tools = [
  {
    type: "function",
    function: {
      name: "calculate_investment",
      description: "Berechnet Investment-Kennzahlen für ein Immobilienobjekt via sot-investment-engine. Liefert Netto-Belastung, Cashflow, Steuerersparnis und 40-Jahres-Projektion.",
      parameters: {
        type: "object",
        properties: {
          purchasePrice: { type: "number", description: "Kaufpreis in Euro" },
          monthlyRent: { type: "number", description: "Monatliche Kaltmiete in Euro" },
          equity: { type: "number", description: "Eigenkapital in Euro" },
          taxableIncome: { type: "number", description: "Zu versteuerndes Einkommen (zvE) in Euro" },
          repaymentRate: { type: "number", description: "Tilgungsrate in Prozent (1-5)" },
          termYears: { type: "number", description: "Zinsbindung in Jahren (5, 10, 15, 20)" }
        },
        required: ["purchasePrice", "monthlyRent", "equity"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Durchsucht die Knowledge Base nach Erklärungen zu Immobilien-Begriffen, Steuern, Finanzierung.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Suchbegriff oder Frage" },
          category: { 
            type: "string", 
            enum: ["investment", "tax", "financing", "legal", "faq"],
            description: "Kategorie zur Einschränkung der Suche"
          }
        },
        required: ["query"]
      }
    }
  }
]

// =============================================
// HELPER FUNCTIONS
// =============================================
async function searchKnowledge(supabase: any, query: string, category?: string) {
  let queryBuilder = supabase
    .from('v_public_knowledge')
    .select('title, content, category, source')
    .limit(5)

  if (category) {
    queryBuilder = queryBuilder.eq('category', category)
  }

  // Simple keyword search in title and content
  queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Knowledge search error:', error)
    return []
  }

  return data || []
}

async function callInvestmentEngine(input: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  
  const defaultParams = {
    termYears: input.termYears || 15,
    repaymentRate: input.repaymentRate || 2,
    taxableIncome: input.taxableIncome || 60000,
    maritalStatus: 'single' as const,
    hasChurchTax: false,
    afaModel: 'linear' as const,
    buildingShare: 0.8,
    managementCostMonthly: 25,
    valueGrowthRate: 2,
    rentGrowthRate: 1.5,
    ...input
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/sot-investment-engine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify(defaultParams)
  })

  if (!response.ok) {
    throw new Error('Investment Engine call failed')
  }

  return await response.json()
}

async function processToolCall(supabase: any, toolCall: any) {
  const { name, arguments: args } = toolCall.function
  const parsedArgs = JSON.parse(args)

  console.log(`Processing tool call: ${name}`, parsedArgs)

  if (name === 'calculate_investment') {
    const result = await callInvestmentEngine(parsedArgs)
    return {
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        monthlyBurden: result.summary.monthlyBurden,
        cashFlowBeforeTax: Math.round(result.summary.yearlyRent - result.summary.yearlyInterest - result.summary.yearlyRepayment) / 12,
        taxSavings: Math.round(result.summary.yearlyTaxSavings / 12),
        interestRate: result.summary.interestRate,
        ltv: result.summary.ltv,
        roiAfterTax: result.summary.roiAfterTax,
        year10NetWealth: result.projection[9]?.netWealth,
        year20NetWealth: result.projection[19]?.netWealth
      })
    }
  }

  if (name === 'search_knowledge') {
    const results = await searchKnowledge(supabase, parsedArgs.query, parsedArgs.category)
    return {
      tool_call_id: toolCall.id,
      content: JSON.stringify(results.map((r: any) => ({
        title: r.title,
        content: r.content.substring(0, 500),
        source: r.source
      })))
    }
  }

  return {
    tool_call_id: toolCall.id,
    content: 'Tool nicht gefunden'
  }
}

// =============================================
// EDGE FUNCTION HANDLER
// =============================================
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const request: ArmstrongRequest = await req.json()
    console.log('Armstrong Advisor: Received request', request.action)

    // Handle different actions
    if (request.action === 'explain' && request.term) {
      // Simple explain action - search knowledge base
      const results = await searchKnowledge(supabase, request.term, request.category)
      
      if (results.length > 0) {
        return new Response(JSON.stringify({
          explanation: results[0].content,
          title: results[0].title,
          source: results[0].source
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        })
      }
      
      return new Response(JSON.stringify({
        explanation: `Zu "${request.term}" habe ich leider keine Erklärung in meiner Wissensbasis gefunden.`,
        title: request.term,
        source: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (request.action === 'simulate' && request.simulationParams) {
      // Direct simulation without chat
      const result = await callInvestmentEngine(request.simulationParams)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (request.action === 'chat' && request.messages) {
      // Build context-aware system prompt
      let systemPrompt = SYSTEM_PROMPT
      
      if (request.context?.title) {
        systemPrompt += `\n\nAKTUELLER KONTEXT:
Du berätst gerade zu folgendem Objekt:
- Titel: ${request.context.title}
- Kaufpreis: ${request.context.asking_price?.toLocaleString('de-DE')} €
- Monatliche Miete: ${request.context.monthly_rent?.toLocaleString('de-DE')} €
- Typ: ${request.context.property_type || 'Nicht angegeben'}
- Ort: ${request.context.location || 'Nicht angegeben'}`
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...request.messages
      ]

      // Call Lovable AI Gateway
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages,
          tools,
          stream: true
        })
      })

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit erreicht. Bitte versuche es später erneut.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: 'Guthaben erschöpft. Bitte kontaktiere den Support.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        throw new Error(`AI Gateway error: ${aiResponse.status}`)
      }

      // Handle streaming with potential tool calls
      const reader = aiResponse.body!.getReader()
      const decoder = new TextDecoder()
      let textBuffer = ''
      let fullContent = ''
      let toolCalls: any[] = []

      // First pass: collect all content and tool calls
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        textBuffer += decoder.decode(value, { stream: true })

        let newlineIndex: number
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex)
          textBuffer = textBuffer.slice(newlineIndex + 1)

          if (line.endsWith('\r')) line = line.slice(0, -1)
          if (line.startsWith(':') || line.trim() === '') continue
          if (!line.startsWith('data: ')) continue

          const jsonStr = line.slice(6).trim()
          if (jsonStr === '[DONE]') continue

          try {
            const parsed = JSON.parse(jsonStr)
            const delta = parsed.choices?.[0]?.delta
            
            if (delta?.content) {
              fullContent += delta.content
            }
            
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.index !== undefined) {
                  if (!toolCalls[tc.index]) {
                    toolCalls[tc.index] = { id: tc.id, function: { name: '', arguments: '' } }
                  }
                  if (tc.function?.name) {
                    toolCalls[tc.index].function.name = tc.function.name
                  }
                  if (tc.function?.arguments) {
                    toolCalls[tc.index].function.arguments += tc.function.arguments
                  }
                }
              }
            }
          } catch { /* ignore partial JSON */ }
        }
      }

      // If there were tool calls, process them and make another request
      if (toolCalls.length > 0 && toolCalls[0]?.function?.name) {
        console.log('Processing tool calls:', toolCalls.length)
        
        const toolResults = await Promise.all(
          toolCalls.filter(tc => tc?.function?.name).map(tc => processToolCall(supabase, tc))
        )

        // Second AI call with tool results
        const followUpMessages = [
          ...messages,
          { role: 'assistant' as const, content: fullContent || null, tool_calls: toolCalls },
          ...toolResults.map(tr => ({
            role: 'tool' as const,
            tool_call_id: tr.tool_call_id,
            content: tr.content
          }))
        ]

        const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: followUpMessages,
            stream: true
          })
        })

        if (!followUpResponse.ok) {
          throw new Error('Follow-up AI call failed')
        }

        // Stream the final response
        return new Response(followUpResponse.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
        })
      }

      // No tool calls, return the collected content as a simple response
      // For streaming compatibility, we re-stream it
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const event = `data: ${JSON.stringify({
            choices: [{ delta: { content: fullContent } }]
          })}\n\n`
          controller.enqueue(encoder.encode(event))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      })

      return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })

  } catch (error) {
    console.error('Armstrong Advisor Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
