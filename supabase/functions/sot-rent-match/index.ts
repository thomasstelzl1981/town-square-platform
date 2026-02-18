/**
 * sot-rent-match — Auto-match bank_transactions to rent_payments
 * 
 * For each lease with auto_match_enabled + linked_bank_account_id:
 * 1. Load unmatched bank_transactions for that account
 * 2. Compare against expected warm rent (tolerance ±1 EUR)
 * 3. Create/update rent_payments entries
 * 4. Mark matched transactions with match_status = 'AUTO_MATCHED'
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Optional: scope to a specific tenant
    let tenantId: string | null = null;
    let accountId: string | null = null;
    try {
      const body = await req.json();
      tenantId = body.tenant_id || null;
      accountId = body.account_id || null;
    } catch { /* no body is fine */ }

    // 1. Load leases with auto-match enabled and linked bank account
    let leaseQuery = sb
      .from('leases')
      .select('id, tenant_id, unit_id, monthly_rent, rent_cold_eur, nk_advance_eur, heating_advance_eur, linked_bank_account_id, auto_match_enabled, tenant_contact_id, start_date')
      .eq('status', 'active')
      .eq('auto_match_enabled', true)
      .not('linked_bank_account_id', 'is', null);

    if (tenantId) {
      leaseQuery = leaseQuery.eq('tenant_id', tenantId);
    }
    if (accountId) {
      leaseQuery = leaseQuery.eq('linked_bank_account_id', accountId);
    }

    const { data: leases, error: leaseErr } = await leaseQuery;
    if (leaseErr) throw leaseErr;
    if (!leases || leases.length === 0) {
      return new Response(JSON.stringify({ matched: 0, checked: 0, message: 'Keine aktiven Mietverhältnisse mit Auto-Match gefunden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get contact names for purpose text matching
    const contactIds = [...new Set(leases.map(l => l.tenant_contact_id).filter(Boolean))];
    const { data: contacts } = await sb
      .from('contacts')
      .select('id, first_name, last_name, company')
      .in('id', contactIds);
    const contactMap = new Map((contacts || []).map(c => [c.id, c]));

    // Get unit info for purpose text matching
    const unitIds = [...new Set(leases.map(l => l.unit_id).filter(Boolean))];
    const { data: units } = await sb
      .from('units')
      .select('id, unit_code, name')
      .in('id', unitIds);
    const unitMap = new Map((units || []).map(u => [u.id, u]));

    let totalMatched = 0;
    let totalChecked = 0;

    for (const lease of leases) {
      const bankAccountId = lease.linked_bank_account_id;
      if (!bankAccountId) continue;

      // Calculate warm rent
      const warmmiete = (lease.rent_cold_eur && (lease.nk_advance_eur || lease.heating_advance_eur))
        ? (lease.rent_cold_eur || 0) + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0)
        : lease.monthly_rent;

      if (!warmmiete || warmmiete <= 0) continue;

      // 2. Load unmatched transactions for this bank account
      const { data: transactions, error: txErr } = await sb
        .from('bank_transactions')
        .select('*')
        .eq('account_ref', bankAccountId)
        .gt('amount_eur', 0) // only credits
        .or('match_status.is.null,match_status.eq.unmatched')
        .order('booking_date', { ascending: true });

      if (txErr) {
        console.error(`Error loading transactions for account ${bankAccountId}:`, txErr);
        continue;
      }
      if (!transactions || transactions.length === 0) continue;

      // Build matching context
      const contact = contactMap.get(lease.tenant_contact_id);
      const unit = unitMap.get(lease.unit_id);
      const searchTerms: string[] = [];
      if (contact) {
        if (contact.last_name) searchTerms.push(contact.last_name.toLowerCase());
        if (contact.company) searchTerms.push(contact.company.toLowerCase());
      }
      if (unit) {
        if (unit.unit_code) searchTerms.push(unit.unit_code.toLowerCase());
      }

      for (const tx of transactions) {
        totalChecked++;
        const txAmount = Number(tx.amount_eur);
        const amountDiff = Math.abs(txAmount - warmmiete);

        // Amount match: within ±1 EUR tolerance
        if (amountDiff > warmmiete * 0.5) continue; // skip if way off

        const isExactMatch = amountDiff <= 1;
        const isPartialMatch = !isExactMatch && txAmount > 0;

        // Purpose text matching (optional boost)
        const purpose = (tx.purpose_text || '').toLowerCase();
        const counterparty = (tx.counterparty || '').toLowerCase();
        const hasPurposeMatch = searchTerms.some(term =>
          purpose.includes(term) || counterparty.includes(term)
        );

        // Require either amount match or purpose match
        if (!isExactMatch && !hasPurposeMatch) continue;

        // Determine status
        const status = isExactMatch ? 'paid' : 'partial';
        const bookingDate = tx.booking_date;
        const monthStart = bookingDate.substring(0, 7) + '-01'; // YYYY-MM-01
        const monthEnd = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0)
          .toISOString().split('T')[0];

        // Check if rent_payment already exists for this lease + month
        const { data: existingPayment } = await sb
          .from('rent_payments')
          .select('id')
          .eq('lease_id', lease.id)
          .gte('due_date', monthStart)
          .lte('due_date', monthEnd)
          .maybeSingle();

        if (existingPayment) {
          // Update existing
          await sb
            .from('rent_payments')
            .update({
              amount: txAmount,
              paid_date: bookingDate,
              status,
              notes: `Auto-Match: ${tx.counterparty || ''} — ${tx.purpose_text || ''}`.substring(0, 200),
            })
            .eq('id', existingPayment.id);
        } else {
          // Create new
          await sb
            .from('rent_payments')
            .insert({
              lease_id: lease.id,
              tenant_id: lease.tenant_id,
              amount: txAmount,
              expected_amount: warmmiete,
              due_date: monthStart,
              paid_date: bookingDate,
              status,
              period_start: monthStart,
              period_end: monthEnd,
              notes: `Auto-Match: ${tx.counterparty || ''} — ${tx.purpose_text || ''}`.substring(0, 200),
            });
        }

        // Mark transaction as matched
        await sb
          .from('bank_transactions')
          .update({ match_status: 'AUTO_MATCHED' })
          .eq('id', tx.id);

        totalMatched++;
      }
    }

    return new Response(JSON.stringify({
      matched: totalMatched,
      checked: totalChecked,
      leases_processed: leases.length,
    }), {
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
