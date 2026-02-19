/**
 * sot-rent-match — Auto-match bank_transactions to rent_payments
 *
 * Part of Engine 17: Konto-Matching Engine (ENG-KONTOMATCH)
 * SSOT: src/engines/kontoMatch/spec.ts
 *
 * For each lease with auto_match_enabled + linked_bank_account_id:
 * 1. Load unmatched bank_transactions for that account
 * 2. Compare against expected warm rent (tolerance from spec)
 * 3. Create/update rent_payments entries
 * 4. Mark matched transactions with match_status = 'AUTO_MATCHED'
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Mirrored from src/engines/kontoMatch/spec.ts (SSOT) ─────
const MATCH_TOLERANCES = { rentAmountEur: 1 } as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Pure matching logic (mirrors engine.ts matchRentPayment) ─

interface LeaseCtx {
  warmRent: number;
  searchTerms: string[];
}

interface RentMatch {
  matched: boolean;
  status: 'paid' | 'partial' | 'overpaid';
  confidence: number;
}

function matchRent(
  amount: number,
  purpose: string,
  counterparty: string,
  lease: LeaseCtx,
): RentMatch {
  if (amount <= 0) return { matched: false, status: 'partial', confidence: 0 };

  const diff = Math.abs(amount - lease.warmRent);
  if (diff > lease.warmRent * 0.5) return { matched: false, status: 'partial', confidence: 0 };

  const isExact = diff <= MATCH_TOLERANCES.rentAmountEur;
  const haystack = `${purpose} ${counterparty}`.toLowerCase();
  const hasPurpose = lease.searchTerms.some((t) => haystack.includes(t));

  if (!isExact && !hasPurpose) return { matched: false, status: 'partial', confidence: 0 };

  const status = isExact ? 'paid' : amount > lease.warmRent ? 'overpaid' : 'partial';
  let confidence = isExact ? 0.95 : 0.7;
  if (hasPurpose) confidence = Math.min(1, confidence + 0.1);

  return { matched: true, status, confidence };
}

// ─── Helpers ──────────────────────────────────────────────────

function computeWarmRent(lease: any): number {
  if (lease.rent_cold_eur && (lease.nk_advance_eur || lease.heating_advance_eur)) {
    return (lease.rent_cold_eur || 0) + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0);
  }
  return lease.monthly_rent || 0;
}

function monthBounds(bookingDate: string) {
  const monthStart = bookingDate.substring(0, 7) + '-01';
  const d = new Date(monthStart);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  return { monthStart, monthEnd };
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let tenantId: string | null = null;
    let accountId: string | null = null;
    try {
      const body = await req.json();
      tenantId = body.tenant_id || null;
      accountId = body.account_id || null;
    } catch { /* no body */ }

    // 1. Load auto-match leases
    let q = sb
      .from('leases')
      .select('id, tenant_id, unit_id, monthly_rent, rent_cold_eur, nk_advance_eur, heating_advance_eur, linked_bank_account_id, tenant_contact_id, start_date')
      .eq('status', 'active')
      .eq('auto_match_enabled', true)
      .not('linked_bank_account_id', 'is', null);
    if (tenantId) q = q.eq('tenant_id', tenantId);
    if (accountId) q = q.eq('linked_bank_account_id', accountId);

    const { data: leases, error: leaseErr } = await q;
    if (leaseErr) throw leaseErr;
    if (!leases?.length) {
      return new Response(JSON.stringify({ matched: 0, checked: 0, message: 'Keine aktiven Mietverhältnisse mit Auto-Match gefunden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Batch-load contacts + units
    const contactIds = [...new Set(leases.map((l) => l.tenant_contact_id).filter(Boolean))];
    const unitIds = [...new Set(leases.map((l) => l.unit_id).filter(Boolean))];
    const [{ data: contacts }, { data: units }] = await Promise.all([
      sb.from('contacts').select('id, first_name, last_name, company').in('id', contactIds),
      sb.from('units').select('id, unit_code, name').in('id', unitIds),
    ]);
    const contactMap = new Map((contacts || []).map((c) => [c.id, c]));
    const unitMap = new Map((units || []).map((u) => [u.id, u]));

    let totalMatched = 0;
    let totalChecked = 0;

    for (const lease of leases) {
      const warmRent = computeWarmRent(lease);
      if (!warmRent || warmRent <= 0) continue;

      // Build search terms
      const contact = contactMap.get(lease.tenant_contact_id);
      const unit = unitMap.get(lease.unit_id);
      const searchTerms: string[] = [];
      if (contact?.last_name) searchTerms.push(contact.last_name.toLowerCase());
      if (contact?.company) searchTerms.push(contact.company.toLowerCase());
      if (unit?.unit_code) searchTerms.push(unit.unit_code.toLowerCase());

      // 2. Load unmatched transactions
      const { data: transactions, error: txErr } = await sb
        .from('bank_transactions')
        .select('*')
        .eq('account_ref', lease.linked_bank_account_id)
        .gt('amount_eur', 0)
        .or('match_status.is.null,match_status.eq.unmatched')
        .order('booking_date', { ascending: true });

      if (txErr) { console.error(`TX error for ${lease.linked_bank_account_id}:`, txErr); continue; }
      if (!transactions?.length) continue;

      for (const tx of transactions) {
        totalChecked++;
        const result = matchRent(
          Number(tx.amount_eur),
          tx.purpose_text || '',
          tx.counterparty || '',
          { warmRent, searchTerms },
        );
        if (!result.matched) continue;

        const { monthStart, monthEnd } = monthBounds(tx.booking_date);
        const notes = `Auto-Match: ${tx.counterparty || ''} — ${tx.purpose_text || ''}`.substring(0, 200);

        // Upsert rent_payment
        const { data: existing } = await sb
          .from('rent_payments')
          .select('id')
          .eq('lease_id', lease.id)
          .gte('due_date', monthStart)
          .lte('due_date', monthEnd)
          .maybeSingle();

        if (existing) {
          await sb.from('rent_payments').update({
            amount: Number(tx.amount_eur),
            paid_date: tx.booking_date,
            status: result.status === 'overpaid' ? 'paid' : result.status,
            notes,
          }).eq('id', existing.id);
        } else {
          await sb.from('rent_payments').insert({
            lease_id: lease.id,
            tenant_id: lease.tenant_id,
            amount: Number(tx.amount_eur),
            expected_amount: warmRent,
            due_date: monthStart,
            paid_date: tx.booking_date,
            status: result.status === 'overpaid' ? 'paid' : result.status,
            period_start: monthStart,
            period_end: monthEnd,
            notes,
          });
        }

        await sb.from('bank_transactions').update({ match_status: 'AUTO_MATCHED' }).eq('id', tx.id);
        totalMatched++;
      }
    }

    return new Response(JSON.stringify({ matched: totalMatched, checked: totalChecked, leases_processed: leases.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sot-rent-match error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
