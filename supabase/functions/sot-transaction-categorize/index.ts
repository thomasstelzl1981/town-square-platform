/**
 * sot-transaction-categorize — Bulk-categorize bank transactions
 *
 * Part of Engine 17: Konto-Matching Engine (ENG-KONTOMATCH)
 * SSOT: src/engines/kontoMatch/spec.ts
 *
 * Reads unmatched transactions from v_all_transactions,
 * applies rule-based matching per owner_type context,
 * writes match_category + match_confidence back to source tables.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Mirrored from src/engines/kontoMatch/spec.ts (SSOT) ─────

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
  // Property rules
  { ruleCode: 'PROP_HAUSGELD', category: 'HAUSGELD', ownerTypes: ['property'], direction: 'debit', patterns: ['hausgeld', 'weg', 'hausverwaltung', 'wohnungseigentümer'] },
  { ruleCode: 'PROP_GRUNDSTEUER', category: 'GRUNDSTEUER', ownerTypes: ['property'], direction: 'debit', patterns: ['grundsteuer', 'finanzamt'] },
  { ruleCode: 'PROP_VERSICHERUNG', category: 'VERSICHERUNG', ownerTypes: ['property'], direction: 'debit', patterns: ['versicherung', 'gebäudeversicherung', 'wohngebäude'] },
  { ruleCode: 'PROP_INSTANDHALTUNG', category: 'INSTANDHALTUNG', ownerTypes: ['property'], direction: 'debit', patterns: ['reparatur', 'sanierung', 'handwerker', 'instandhaltung', 'wartung'] },
  // PV rules
  { ruleCode: 'PV_EINSPEISUNG', category: 'EINSPEISEVERGUETUNG', ownerTypes: ['pv_plant'], direction: 'credit', patterns: ['einspeisevergütung', 'einspeisung', 'netzbetreiber', 'eeg'] },
  { ruleCode: 'PV_WARTUNG', category: 'WARTUNG', ownerTypes: ['pv_plant'], direction: 'debit', patterns: ['wartung', 'service', 'solar', 'photovoltaik', 'pv'] },
  { ruleCode: 'PV_PACHT', category: 'PACHT', ownerTypes: ['pv_plant'], direction: 'debit', patterns: ['pacht', 'dachmiete', 'dachpacht', 'flächenmiete'] },
  { ruleCode: 'PV_VERSICHERUNG', category: 'VERSICHERUNG', ownerTypes: ['pv_plant'], direction: 'debit', patterns: ['versicherung'] },
  // Shared
  { ruleCode: 'SHARED_DARLEHEN', category: 'DARLEHEN', ownerTypes: ['property', 'pv_plant'], direction: 'debit', patterns: ['darlehen', 'tilgung', 'annuität', 'kreditrate', 'zins und tilgung'] },
  // Person
  { ruleCode: 'PERSON_GEHALT', category: 'GEHALT', ownerTypes: ['person'], direction: 'credit', patterns: ['gehalt', 'lohn', 'bezüge', 'entgelt'] },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Matching Logic ───────────────────────────────────────────

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

    // Count how many patterns match for confidence
    const matchCount = rule.patterns.filter((p) => haystack.includes(p)).length;
    const confidence = Math.min(0.95, 0.7 + matchCount * 0.08);

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { category: rule.category, confidence, ruleCode: rule.ruleCode };
    }
  }

  return bestMatch && bestMatch.confidence >= MATCH_TOLERANCES.minConfidence ? bestMatch : null;
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
    try {
      const body = await req.json();
      tenantId = body.tenant_id || null;
      accountRef = body.account_ref || null;
      dryRun = body.dry_run === true;
    } catch { /* no body */ }

    // 1. Load unmatched transactions via unified view
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
        JSON.stringify({ categorized: 0, checked: 0, message: 'Keine ungematchten Transaktionen gefunden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 2. Categorize each transaction
    const results: Array<{ id: string; source: string; category: string; confidence: number; ruleCode: string }> = [];

    for (const tx of transactions) {
      const match = categorize(
        Number(tx.amount),
        tx.purpose || '',
        tx.counterparty || '',
        tx.owner_type as OwnerType | null,
        DEFAULT_MATCH_RULES,
      );

      if (match) {
        results.push({
          id: tx.id,
          source: tx.source,
          category: match.category,
          confidence: match.confidence,
          ruleCode: match.ruleCode,
        });
      }
    }

    // 3. Write back to source tables (unless dry_run)
    if (!dryRun) {
      const csvUpdates = results.filter((r) => r.source === 'csv');
      const finapiUpdates = results.filter((r) => r.source === 'finapi');

      // Batch update CSV transactions
      for (const u of csvUpdates) {
        await sb
          .from('bank_transactions')
          .update({
            match_category: u.category,
            match_confidence: u.confidence,
            match_rule_code: u.ruleCode,
            match_status: 'CATEGORIZED',
          })
          .eq('id', u.id);
      }

      // Batch update FinAPI transactions
      for (const u of finapiUpdates) {
        await sb
          .from('finapi_transactions')
          .update({
            match_category: u.category,
            match_rule_code: u.ruleCode,
            match_status: 'CATEGORIZED',
          })
          .eq('id', u.id);
      }
    }

    return new Response(
      JSON.stringify({
        categorized: results.length,
        checked: transactions.length,
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
