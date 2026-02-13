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

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured. Please add it as a secret.')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const { order_id, query_seeds, target_domains, page_limit = 5 } = await req.json()
    if (!order_id) throw new Error('order_id required')

    // Load order
    const { data: order, error: orderError } = await supabase
      .from('research_orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.status !== 'running') throw new Error('Order is not in running state')

    // Determine search queries from intent + ICP
    const icp = order.icp_json as any || {}
    const queries = query_seeds?.length ? query_seeds : buildSearchQueries(order.intent_text, icp)
    const domains = target_domains?.length ? target_domains : (icp.domain ? [icp.domain] : [])

    let totalResults = 0
    const maxResults = order.max_results || 25
    const costCap = Number(order.cost_cap) || 999

    for (const query of queries) {
      if (totalResults >= maxResults) break

      // Check cost cap
      const { data: billingData } = await supabase
        .from('research_billing_log')
        .select('cost')
        .eq('order_id', order_id)

      const totalCost = billingData?.reduce((sum: number, b: any) => sum + Number(b.cost), 0) || 0
      if (totalCost >= costCap) {
        console.log(`Cost cap reached: ${totalCost} >= ${costCap}`)
        break
      }

      // Firecrawl search
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${query} ${icp.region || ''} ${icp.branche || ''} Kontakt Impressum Team`.trim(),
          limit: Math.min(page_limit, maxResults - totalResults),
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          }
        }),
      })

      if (!searchResponse.ok) {
        const errText = await searchResponse.text()
        console.error(`Firecrawl search error [${searchResponse.status}]: ${errText}`)
        
        // Log billing even for failed calls
        await supabase.from('research_billing_log').insert({
          order_id,
          tenant_id: order.tenant_id,
          provider: 'firecrawl',
          units: 1,
          cost: 0.01,
        })
        continue
      }

      const searchData = await searchResponse.json()
      const pages = searchData.data || []

      // Log billing
      await supabase.from('research_billing_log').insert({
        order_id,
        tenant_id: order.tenant_id,
        provider: 'firecrawl',
        units: pages.length,
        cost: pages.length * 0.01, // ~$0.01 per page
      })

      // Extract contacts from pages using simple heuristics
      for (const page of pages) {
        if (totalResults >= maxResults) break

        const contacts = extractContactsFromMarkdown(page.markdown || '', page.url || '')
        
        for (const contact of contacts) {
          if (totalResults >= maxResults) break

          // Dedupe check within this order
          if (contact.email) {
            const { data: existing } = await supabase
              .from('research_order_results')
              .select('id')
              .eq('order_id', order_id)
              .eq('email', contact.email)
              .limit(1)

            if (existing?.length) continue
          }

          await supabase.from('research_order_results').insert({
            order_id,
            tenant_id: order.tenant_id,
            entity_type: 'person',
            full_name: contact.name || null,
            first_name: contact.firstName || null,
            last_name: contact.lastName || null,
            role: contact.role || null,
            company_name: contact.company || null,
            domain: new URL(page.url || 'https://unknown').hostname,
            location: icp.region || null,
            email: contact.email || null,
            phone: contact.phone || null,
            source_provider: 'firecrawl',
            source_refs_json: { url: page.url, title: page.title },
            confidence_score: calculateConfidence(contact),
            raw_json: { page_title: page.title, page_url: page.url },
            status: 'candidate',
          })

          totalResults++
        }
      }
    }

    // Update order results count and cost
    const { data: allBilling } = await supabase
      .from('research_billing_log')
      .select('cost')
      .eq('order_id', order_id)

    const totalSpent = allBilling?.reduce((sum: number, b: any) => sum + Number(b.cost), 0) || 0

    await supabase
      .from('research_orders')
      .update({
        results_count: totalResults,
        cost_spent: totalSpent,
      })
      .eq('id', order_id)

    return new Response(JSON.stringify({
      success: true,
      results_extracted: totalResults,
      cost_spent: totalSpent,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildSearchQueries(intent: string, icp: any): string[] {
  const queries: string[] = []
  if (intent) queries.push(intent)
  if (icp.keywords?.length) {
    queries.push(icp.keywords.join(' '))
  }
  if (icp.branche && icp.region) {
    queries.push(`${icp.branche} ${icp.region} ${icp.role || 'Geschäftsführer'}`)
  }
  return queries.length ? queries : [intent || 'Unternehmen Kontakte']
}

function extractContactsFromMarkdown(md: string, url: string): any[] {
  const contacts: any[] = []

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = [...new Set(md.match(emailRegex) || [])]
    .filter(e => !e.includes('example.com') && !e.includes('noreply') && !e.includes('webmaster'))

  // Extract phone numbers (German format)
  const phoneRegex = /(?:\+49|0049|0)\s*[\d\s\-\/().]{8,15}/g
  const phones = [...new Set(md.match(phoneRegex) || [])]

  // Extract names near emails (simple heuristic)
  for (const email of emails.slice(0, 5)) {
    const emailIndex = md.indexOf(email)
    const context = md.substring(Math.max(0, emailIndex - 200), emailIndex + 50)
    
    // Try to find a name pattern near the email
    const nameMatch = context.match(/(?:^|\n|\|)\s*([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/m)
    const roleMatch = context.match(/(?:Geschäftsführ|CEO|CTO|CFO|Manager|Leiter|Director|Head of|VP|Inhaber|Partner)[a-zäöüß]*/i)

    const nameParts = nameMatch ? nameMatch[1].trim().split(/\s+/) : []
    
    contacts.push({
      name: nameMatch ? nameMatch[1].trim() : null,
      firstName: nameParts[0] || null,
      lastName: nameParts.slice(1).join(' ') || null,
      email,
      phone: phones[0] || null,
      role: roleMatch ? roleMatch[0] : null,
      company: extractCompanyFromUrl(url),
    })
  }

  // If no emails found but phones exist
  if (!emails.length && phones.length) {
    contacts.push({
      name: null,
      firstName: null,
      lastName: null,
      email: null,
      phone: phones[0],
      role: null,
      company: extractCompanyFromUrl(url),
    })
  }

  return contacts
}

function extractCompanyFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    const parts = hostname.split('.')
    return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : null
  } catch {
    return null
  }
}

function calculateConfidence(contact: any): number {
  let score = 20 // base
  if (contact.email) score += 30
  if (contact.name) score += 20
  if (contact.phone) score += 15
  if (contact.role) score += 15
  return Math.min(score, 100)
}
