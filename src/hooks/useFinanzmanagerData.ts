/**
 * useFinanzmanagerData — Zentraler Hook für MOD-11 SSOT-Tabellen
 * CRUD für: insurance_contracts, vorsorge_contracts, user_subscriptions, bank_account_meta
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useInsuranceContracts() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['insurance_contracts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('insurance_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

export function useInsuranceContractMutations() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();
  const key = ['insurance_contracts', activeTenantId];

  const create = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const row = {
        tenant_id: activeTenantId,
        user_id: user.id,
        category: values.category as any,
        insurer: values.insurer || null,
        policy_no: values.policy_no || null,
        policyholder: values.policyholder || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        cancellation_deadline: values.cancellation_deadline || null,
        premium: values.premium ? Number(values.premium) : null,
        payment_interval: values.payment_interval as any || 'monatlich',
        status: (values.status as any) || 'aktiv',
        details: values.details || {},
        notes: values.notes || null,
      };
      const { data, error } = await supabase.from('insurance_contracts').insert(row).select('id, insurer, category').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Versicherung angelegt'); },
    onError: () => toast.error('Fehler beim Anlegen'),
  });

  const update = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { id, created_at, updated_at, ...rest } = values;
      const { error } = await supabase.from('insurance_contracts').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Versicherung aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('insurance_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Versicherung gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  return { create, update, remove };
}

export function useVorsorgeContracts() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['vorsorge_contracts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('vorsorge_contracts')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

export function useVorsorgeContractMutations() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();
  const key = ['vorsorge_contracts', activeTenantId];

  const create = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const row = {
        tenant_id: activeTenantId,
        user_id: user.id,
        person_id: values.person_id || null,
        provider: values.provider || null,
        contract_no: values.contract_no || null,
        contract_type: values.contract_type || null,
        start_date: values.start_date || null,
        premium: values.premium ? Number(values.premium) : null,
        payment_interval: values.payment_interval as any || 'monatlich',
        status: values.status || 'aktiv',
        notes: values.notes || null,
        category: values.category || 'vorsorge',
        current_balance: values.current_balance ? Number(values.current_balance) : null,
        balance_date: values.balance_date || null,
      };
      const { error } = await supabase.from('vorsorge_contracts').insert(row);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Vorsorgevertrag angelegt'); },
    onError: () => toast.error('Fehler beim Anlegen'),
  });

  const update = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { id, created_at, updated_at, ...rest } = values;
      const { error } = await supabase.from('vorsorge_contracts').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Vorsorgevertrag aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vorsorge_contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Vorsorgevertrag gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  return { create, update, remove };
}

export function useUserSubscriptions() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['user_subscriptions', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

export function useUserSubscriptionMutations() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();
  const key = ['user_subscriptions', activeTenantId];

  const create = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const row = {
        tenant_id: activeTenantId,
        user_id: user.id,
        custom_name: values.custom_name || null,
        merchant: values.merchant || null,
        category: values.category as any || 'other',
        frequency: values.frequency || 'monatlich',
        amount: values.amount ? Number(values.amount) : null,
        status: values.status || 'aktiv',
        auto_renew: values.auto_renew ?? true,
        notes: values.notes || null,
      };
      const { error } = await supabase.from('user_subscriptions').insert(row);
      if (error) throw error;
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Abonnement angelegt'); },
    onError: () => toast.error('Fehler beim Anlegen'),
  });

  const update = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { id, created_at, updated_at, ...rest } = values;
      const { error } = await supabase.from('user_subscriptions').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Abonnement aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Abonnement gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });

  return { create, update, remove };
}

export function useBankAccountMeta() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['bank_account_meta', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('bank_account_meta')
        .select('*')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });
}

export function useBankAccountMetaMutations() {
  const { activeTenantId, user } = useAuth();
  const qc = useQueryClient();
  const key = ['bank_account_meta', activeTenantId];

  const upsert = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!activeTenantId || !user?.id) throw new Error('No tenant/user');
      const row = {
        account_id: values.account_id,
        tenant_id: activeTenantId,
        user_id: user.id,
        custom_name: values.custom_name || null,
        category: values.category as any || 'privat',
        org_unit: values.org_unit || null,
      };
      const { error } = await supabase.from('bank_account_meta').upsert(row, { onConflict: 'account_id' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Konto-Meta gespeichert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });

  return { upsert };
}
