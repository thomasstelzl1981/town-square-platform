/**
 * useContractCreation — Batch-insert detected contracts into target tables.
 * Handles: user_subscriptions, insurance_contracts, miety_contracts
 * Note: miety_contracts requires a home_id. If no homeId is provided,
 * the contract cannot be inserted as an energy contract.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DetectedContract } from '@/engines/kontoMatch/spec';

interface CreationResult {
  created: number;
  skipped: number;
  errors: string[];
}

export function useContractCreation() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (contracts: DetectedContract[]): Promise<CreationResult> => {
      if (!activeTenantId || !user?.id) throw new Error('Nicht angemeldet');

      const selected = contracts.filter(c => c.selected);
      const result: CreationResult = { created: 0, skipped: 0, errors: [] };

      for (const contract of selected) {
        try {
          // Validate: miety_contracts needs homeId
          if (contract.targetTable === 'miety_contracts' && !contract.homeId) {
            result.errors.push(`${contract.counterparty}: Kein Zuhause zugeordnet`);
            continue;
          }

          const isDuplicate = await checkDuplicate(contract, activeTenantId);
          if (isDuplicate) {
            result.skipped++;
            continue;
          }
          await insertContract(contract, activeTenantId, user.id);
          result.created++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          result.errors.push(`${contract.counterparty}: ${msg}`);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['user_subscriptions'] });
      qc.invalidateQueries({ queryKey: ['insurance_contracts'] });
      qc.invalidateQueries({ queryKey: ['miety-contracts'] });

      if (result.created > 0) {
        toast.success(`${result.created} Verträge angelegt`);
      }
      if (result.skipped > 0) {
        toast.info(`${result.skipped} Duplikate übersprungen`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} Fehler: ${result.errors[0]}`);
      }
    },
    onError: (err: Error) => {
      toast.error(`Fehler: ${err.message}`);
    },
  });
}

async function checkDuplicate(
  contract: DetectedContract,
  tenantId: string,
): Promise<boolean> {
  const counterpartyLower = contract.counterparty.toLowerCase();

  switch (contract.targetTable) {
    case 'user_subscriptions': {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('merchant', `%${counterpartyLower}%`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }
    case 'insurance_contracts': {
      const { data } = await supabase
        .from('insurance_contracts')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('insurer', `%${counterpartyLower}%`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }
    case 'miety_contracts': {
      const { data } = await supabase
        .from('miety_contracts')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('provider_name', `%${counterpartyLower}%`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }
    default:
      return false;
  }
}

async function insertContract(
  contract: DetectedContract,
  tenantId: string,
  userId: string,
): Promise<void> {
  if (contract.targetTable === 'insurance_contracts') {
    const premium = contract.frequency === 'monatlich'
      ? contract.amount
      : contract.frequency === 'quartalsweise'
        ? Math.round((contract.amount / 3) * 100) / 100
        : Math.round((contract.amount / 12) * 100) / 100;

    const { error } = await supabase.from('insurance_contracts').insert({
      tenant_id: tenantId,
      user_id: userId,
      insurer: contract.counterparty,
      category: mapToInsuranceCategory(contract) as 'sonstige',
      premium,
      payment_interval: contract.frequency === 'monatlich'
        ? 'monatlich' as const
        : contract.frequency === 'quartalsweise'
          ? 'vierteljaehrlich' as const
          : 'jaehrlich' as const,
      status: 'aktiv' as const,
    });
    if (error) throw error;
  } else if (contract.targetTable === 'miety_contracts') {
    // Energy contracts → miety_contracts (requires homeId)
    const monthlyCost = contract.frequency === 'monatlich'
      ? contract.amount
      : contract.frequency === 'quartalsweise'
        ? Math.round((contract.amount / 3) * 100) / 100
        : Math.round((contract.amount / 12) * 100) / 100;

    const { error } = await supabase.from('miety_contracts').insert({
      tenant_id: tenantId,
      home_id: contract.homeId!,
      category: mapToMietyCategory(contract),
      provider_name: contract.counterparty,
      monthly_cost: monthlyCost,
      start_date: contract.pattern.firstSeen,
    });
    if (error) throw error;
  } else {
    // user_subscriptions
    const { error } = await supabase.from('user_subscriptions').insert({
      tenant_id: tenantId,
      user_id: userId,
      merchant: contract.counterparty,
      category: mapToSubscriptionCategory(contract),
      frequency: contract.frequency,
      amount: contract.amount,
      status: 'active',
    });
    if (error) throw error;
  }
}

function mapToSubscriptionCategory(contract: DetectedContract) {
  const h = contract.counterparty.toLowerCase();
  if (['netflix', 'disney', 'amazon prime', 'sky', 'dazn', 'youtube'].some(p => h.includes(p))) return 'streaming_video' as const;
  if (['spotify', 'apple music', 'deezer', 'tidal'].some(p => h.includes(p))) return 'streaming_music' as const;
  if (['microsoft', 'adobe', 'google', 'dropbox'].some(p => h.includes(p))) return 'software_saas' as const;
  if (['fitx', 'mcfit', 'gym', 'urban sports', 'fitness'].some(p => h.includes(p))) return 'fitness' as const;
  if (['zeit', 'spiegel', 'faz', 'handelsblatt'].some(p => h.includes(p))) return 'news_media' as const;
  if (['telekom', 'vodafone', 'o2', 'telefonica'].some(p => h.includes(p))) return 'telecom_mobile' as const;
  if (['internet', 'glasfaser', 'kabel', '1und1', '1&1'].some(p => h.includes(p))) return 'internet' as const;
  return 'other' as const;
}

function mapToInsuranceCategory(contract: DetectedContract) {
  const h = contract.counterparty.toLowerCase();
  if (h.includes('haftpflicht')) return 'haftpflicht';
  if (h.includes('hausrat')) return 'hausrat';
  if (h.includes('rechtsschutz')) return 'rechtsschutz';
  if (h.includes('kfz')) return 'kfz';
  if (h.includes('berufsunfaehigkeit') || h.includes('berufsunfähigkeit')) return 'berufsunfaehigkeit';
  if (h.includes('unfall')) return 'unfall';
  if (h.includes('wohngebäude') || h.includes('wohngebaeude')) return 'wohngebaeude';
  return 'sonstige';
}

function mapToMietyCategory(contract: DetectedContract) {
  const h = contract.counterparty.toLowerCase();
  if (['strom', 'eon', 'vattenfall', 'enbw', 'swm'].some(p => h.includes(p))) return 'strom';
  if (['gas', 'fernwaerme', 'fernwärme'].some(p => h.includes(p))) return 'gas';
  if (['wasser'].some(p => h.includes(p))) return 'wasser';
  if (['internet', 'glasfaser', 'kabel', 'unitymedia'].some(p => h.includes(p))) return 'internet';
  return 'strom'; // Default for energy providers
}
