/**
 * sot-transaction-categorize — Bulk-categorize bank transactions
 *
 * Part of Engine 17: Konto-Matching Engine (ENG-KONTOMATCH)
 * SSOT: src/engines/kontoMatch/spec.ts
 *
 * Pipeline:
 * 1. Rule-based matching (patterns + owner_type)
 * 2. AI fallback (Lovable AI / Gemini Flash) for unmatched transactions
 * 3. Write results back to source tables
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Mirrored from src/engines/kontoMatch/spec.ts (SSOT) ─────

const VALID_CATEGORIES = [
  'MIETE', 'HAUSGELD', 'GRUNDSTEUER', 'VERSICHERUNG', 'DARLEHEN',
  'INSTANDHALTUNG', 'EINSPEISEVERGUETUNG', 'WARTUNG', 'PACHT',
  'GEHALT', 'SONSTIG_EINGANG', 'SONSTIG_AUSGANG',
] as const;

const MATCH_TOLERANCES = {
  rentAmountEur: 1,
  loanAmountEur: 0.5,
  pvFeedInEur: 5,
  minConfidence: 0.75,
} as const;

type TransactionDirection = 'credit' | 'debit';
type OwnerType = 'person' | 'property' | 'pv_plant';

interface MatchRule {
  ruleCode: string;
  category: string;
  ownerTypes: OwnerType[];
  direction: TransactionDirection;
  patterns: string[];
  requireAllPatterns?: boolean;
  amountRange?: { min?: number; max?: number };
}

const DEFAULT_MATCH_RULES: MatchRule[] = [
  { ruleCode: 'PROP_HAUSGELD', category: 'HAUSGELD', ownerTypes: ['property'], direction: 'debit', patterns: ['hausgeld', 'weg', 'hausverwaltung', 'wohnungseigentümer'] },
  { ruleCode: 'PROP_GRUNDSTEUER', category: 'GRUNDSTEUER', ownerTypes: ['property'], direction: 'debit', patterns: ['grundsteuer', 'finanzamt'] },
  { ruleCode: 'PROP_VERSICHERUNG', category: 'VERSICHERUNG', ownerTypes: ['property'], direction: 'debit', patterns: ['versicherung', 'gebäudeversicherung', 'wohngebäude'] },
  { ruleCode: 'PROP_INSTANDHALTUNG', category: 'INSTANDHALTUNG', ownerTypes: ['property'], direction: 'debit', patterns: ['reparatur', 'sanierung', 'handwerker', 'instandhaltung', 'wartung'] },
  { ruleCode: 'PV_EINSPEISUNG', category: 'EINSPEISEVERGUETUNG', ownerTypes: ['pv_plant'], direction: 'credit', patterns: ['einspeisevergütung', 'einspeisung', 'netzbetreiber', 'eeg'] },
  { ruleCode: 'PV_WARTUNG', category: 'WARTUNG', ownerTypes: ['pv_plant'], direction: 'debit', patterns: ['wartung', 'service', 'solar', 'photovoltaik', 'pv'] },
  { ruleCode: 'PV_PACHT', category: 'PACHT', ownerTypes: ['pv_plant'], direction: 'debit', patterns: ['pacht', 'dachmiete', 'dachpacht', 'flächenmiete'] },
  { ruleCode: 'PV_VERSICHERUNG', category: 'VERSICHERUNG', ownerTypes: ['pv_plant'], direction: 'debit', patterns: ['versicherung'] },
  { ruleCode: 'SHARED_DARLEHEN', category: 'DARLEHEN', ownerTypes: ['property', 'pv_plant'], direction: 'debit', patterns: ['darlehen', 'tilgung', 'annuität', 'kreditrate', 'zins und tilgung'] },
  { ruleCode: 'PERSON_GEHALT', category: 'GEHALT', ownerTypes: ['person'], direction: 'credit', patterns: ['gehalt', 'lohn', 'bezüge', 'entgelt'] },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Rule-Based Matching ──────────────────────────────────────

interface MatchResult {
  category: string;
  confidence: number;
  ruleCode: string;
}

function categorize(
  amount: number,
  purpose: string,
  counterparty: string,
  ownerType: OwnerType | null,
  rules: MatchRule[],
): MatchResult | null {
  const direction: TransactionDirection = amount >= 0 ? 'credit' : 'debit';
  const haystack = `${purpose} ${counterparty}`.toLowerCase();
  const ot = ownerType || 'person';

  let bestMatch: MatchResult | null = null;

  for (const rule of rules) {
    if (rule.direction !== direction) continue;
    if (!rule.ownerTypes.includes(ot)) continue;

    const absAmount = Math.abs(amount);
    if (rule.amountRange) {
      if (rule.amountRange.min !== undefined && absAmount < rule.amountRange.min) continue;
      if (rule.amountRange.max !== undefined && absAmount > rule.amountRange.max) continue;
    }

    const matched = rule.requireAllPatterns
      ? rule.patterns.every((p) => haystack.includes(p))
      : rule.patterns.some((p) => haystack.includes(p));

    if (!matched) continue;

    const matchCount = rule.patterns.filter((p) => haystack.includes(p)).length;
    const confidence = Math.min(0.95, 0.7 + matchCount * 0.08);

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { category: rule.category, confidence, ruleCode: rule.ruleCode };
    }
  }

  return bestMatch && bestMatch.confidence >= MATCH_TOLERANCES.minConfidence ? bestMatch : null;
}

// ─── AI Fallback (Lovable AI / Gemini Flash) ──────────────────

interface TxForAI {
  id: string;
  amount: number;
  purpose: string;
  counterparty: string;
  ownerType: string;
  source: string;
}

async function categorizeWithAI(
  transactions: TxForAI[],
): Promise<Map<string, MatchResult>> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY || transactions.length === 0) return new Map();

  // Batch up to 20 transactions per AI call
  const batches: TxForAI[][] = [];
  for (let i = 0; i < transactions.length; i += 20) {
    batches.push(transactions.slice(i, i + 20));
  }

  const allResults = new Map<string, MatchResult>();

  for (const batch of batches) {
    const txList = batch.map((tx, i) =>
      `${i + 1}. ID=${tx.id} | Betrag=${tx.amount}€ | Zweck="${tx.purpose}" | Empfänger="${tx.counterparty}" | Kontotyp=${tx.ownerType}`
    ).join('\n');

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Du bist ein Spezialist für die Kategorisierung von Kontobewegungen im Immobilien- und PV-Anlagen-Bereich.

Kategorisiere jede Transaktion in GENAU EINE der folgenden Kategorien:
${VALID_CATEGORIES.join(', ')}

Kontotyp-Kontext:
- "property" = Immobilien-Konto (Hausgeld, Grundsteuer, Versicherung, Darlehen, Instandhaltung)
- "pv_plant" = PV-Anlagen-Konto (Einspeisevergütung, Wartung, Pacht, Darlehen)
- "person" = Privatkonto (Gehalt, Sonstiges)

Wenn unklar: SONSTIG_EINGANG (positiver Betrag) oder SONSTIG_AUSGANG (negativer Betrag).`,
            },
            {
              role: 'user',
              content: `Kategorisiere diese Transaktionen:\n${txList}`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'categorize_transactions',
                description: 'Kategorisiert Banktransaktionen',
                parameters: {
                  type: 'object',
                  properties: {
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', description: 'Transaction ID' },
                          category: { type: 'string', enum: [...VALID_CATEGORIES] },
                          confidence: { type: 'number', description: '0.0 to 1.0' },
                        },
                        required: ['id', 'category', 'confidence'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['results'],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'categorize_transactions' } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        console.error(`AI gateway error: ${status}`);
        if (status === 429 || status === 402) continue; // skip batch, don't fail
        continue;
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) continue;

      const parsed = JSON.parse(toolCall.function.arguments);
      for (const r of parsed.results || []) {
        if (VALID_CATEGORIES.includes(r.category) && r.confidence >= 0.6) {
          allResults.set(r.id, {
            category: r.category,
            confidence: Math.min(r.confidence, 0.85), // cap AI confidence below rule-based
            ruleCode: 'AI_FALLBACK',
          });
        }
      }
    } catch (err) {
      console.error('AI categorization batch error:', err);
      continue;
    }
  }

  return allResults;
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let tenantId: string | null = null;
    let accountRef: string | null = null;
    let dryRun = false;
    let skipAI = false;
    try {
      const body = await req.json();
      tenantId = body.tenant_id || null;
      accountRef = body.account_ref || null;
      dryRun = body.dry_run === true;
      skipAI = body.skip_ai === true;
    } catch { /* no body */ }

    // 1. Load unmatched transactions
    let query = sb
      .from('v_all_transactions')
      .select('id, tenant_id, account_ref, booking_date, amount, purpose, counterparty, source, owner_type, owner_id, match_status')
      .or('match_status.is.null,match_status.eq.unmatched,match_status.eq.UNMATCHED')
      .is('match_category', null)
      .order('booking_date', { ascending: true })
      .limit(500);

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (accountRef) query = query.eq('account_ref', accountRef);

    const { data: transactions, error: txErr } = await query;
    if (txErr) throw txErr;

    if (!transactions?.length) {
      return new Response(
        JSON.stringify({ categorized: 0, checked: 0, ai_categorized: 0, message: 'Keine ungematchten Transaktionen gefunden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Rule-based categorization
    const results: Array<{ id: string; source: string; category: string; confidence: number; ruleCode: string }> = [];
    const unmatchedForAI: TxForAI[] = [];

    for (const tx of transactions) {
      const match = categorize(
        Number(tx.amount),
        tx.purpose || '',
        tx.counterparty || '',
        tx.owner_type as OwnerType | null,
        DEFAULT_MATCH_RULES,
      );

      if (match) {
        results.push({ id: tx.id, source: tx.source, category: match.category, confidence: match.confidence, ruleCode: match.ruleCode });
      } else if (!skipAI) {
        unmatchedForAI.push({
          id: tx.id,
          amount: Number(tx.amount),
          purpose: tx.purpose || '',
          counterparty: tx.counterparty || '',
          ownerType: tx.owner_type || 'person',
          source: tx.source,
        });
      }
    }

    // 3. AI fallback for unmatched
    let aiCategorized = 0;
    if (unmatchedForAI.length > 0) {
      const aiResults = await categorizeWithAI(unmatchedForAI);
      for (const tx of unmatchedForAI) {
        const aiMatch = aiResults.get(tx.id);
        if (aiMatch) {
          results.push({ id: tx.id, source: tx.source, ...aiMatch });
          aiCategorized++;
        }
      }
    }

    // 4. Write back (unless dry_run)
    if (!dryRun) {
      const csvUpdates = results.filter((r) => r.source === 'csv');
      const finapiUpdates = results.filter((r) => r.source === 'finapi');

      for (const u of csvUpdates) {
        await sb
          .from('bank_transactions')
          .update({
            match_category: u.category,
            match_confidence: u.confidence,
            match_rule_code: u.ruleCode,
            match_status: u.ruleCode === 'AI_FALLBACK' ? 'AI_SUGGESTED' : 'CATEGORIZED',
          })
          .eq('id', u.id);
      }

      for (const u of finapiUpdates) {
        await sb
          .from('finapi_transactions')
          .update({
            match_category: u.category,
            match_rule_code: u.ruleCode,
            match_status: u.ruleCode === 'AI_FALLBACK' ? 'AI_SUGGESTED' : 'CATEGORIZED',
          })
          .eq('id', u.id);
      }
    }

    return new Response(
      JSON.stringify({
        categorized: results.length,
        rule_based: results.length - aiCategorized,
        ai_categorized: aiCategorized,
        checked: transactions.length,
        unmatched: transactions.length - results.length,
        dry_run: dryRun,
        results: dryRun ? results : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('sot-transaction-categorize error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
