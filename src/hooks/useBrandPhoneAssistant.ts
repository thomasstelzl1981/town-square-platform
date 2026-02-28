import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { PhoneAssistantConfig, CallSession } from '@/hooks/usePhoneAssistant';

/**
 * Zone 1 hook: manages a phone assistant scoped by brand_key instead of user_id.
 */
export function useBrandPhoneAssistant(brandKey: string) {
  const qc = useQueryClient();
  const [localConfig, setLocalConfig] = useState<Partial<PhoneAssistantConfig> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const ASSISTANT_KEY = ['brand-phone-assistant', brandKey];
  const CALLS_KEY = ['brand-phone-calls', brandKey];

  // Reset local config when brand changes
  useEffect(() => {
    setLocalConfig(null);
  }, [brandKey]);

  /* ── Fetch or auto-create brand assistant ── */
  const { data: assistant, isLoading } = useQuery({
    queryKey: ASSISTANT_KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('commpro_phone_assistants')
        .select('*') as any)
        .eq('brand_key', brandKey)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as unknown as PhoneAssistantConfig & { brand_key: string };

      // Auto-create brand assistant with premium tier
      const { data: created, error: createErr } = await supabase
        .from('commpro_phone_assistants')
        .insert({
          user_id: user.id,
          brand_key: brandKey,
          tier: 'premium',
          display_name: brandKey.charAt(0).toUpperCase() + brandKey.slice(1) + ' Telefonassistent',
        } as any)
        .select()
        .single();

      if (createErr) throw createErr;
      return created as unknown as PhoneAssistantConfig & { brand_key: string };
    },
    enabled: !!brandKey,
  });

  useEffect(() => {
    if (assistant && !localConfig) {
      setLocalConfig(assistant);
    }
  }, [assistant, localConfig]);

  /* ── Autosave with debounce ── */
  const persistUpdate = useCallback(async (updates: Partial<PhoneAssistantConfig>) => {
    if (!assistant?.id) return;
    setSaveStatus('saving');
    const { error } = await supabase
      .from('commpro_phone_assistants')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', assistant.id);

    if (error) {
      toast({ title: 'Fehler beim Speichern', variant: 'destructive' });
    } else {
      setSaveStatus('saved');
      qc.invalidateQueries({ queryKey: ASSISTANT_KEY });
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [assistant?.id, qc, ASSISTANT_KEY]);

  const updateConfig = useCallback((updates: Partial<PhoneAssistantConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persistUpdate(updates), 500);
  }, [persistUpdate]);

  /* ── Call Sessions for this brand's assistant ── */
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: CALLS_KEY,
    queryFn: async () => {
      if (!assistant?.id) return [];
      const { data, error } = await supabase
        .from('commpro_phone_call_sessions')
        .select('*')
        .eq('assistant_id', assistant.id)
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CallSession[];
    },
    enabled: !!assistant?.id,
  });

  /* ── Purchase / Release with brand_key ── */
  const purchaseNumber = useMutation({
    mutationFn: async (countryCode?: string) => {
      const { data, error } = await supabase.functions.invoke('sot-phone-provision', {
        body: { action: 'purchase', country_code: countryCode || 'DE', brand_key: brandKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'Nummer gekauft', description: data.phone_number });
      refetchAssistant();
    },
    onError: (err: any) => {
      toast({ title: 'Fehler beim Nummernkauf', description: err.message, variant: 'destructive' });
    },
  });

  const releaseNumber = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-phone-provision', {
        body: { action: 'release', brand_key: brandKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Nummer freigegeben' });
      refetchAssistant();
    },
    onError: (err: any) => {
      toast({ title: 'Fehler beim Freigeben', description: err.message, variant: 'destructive' });
    },
  });

  const config = (localConfig ?? assistant) as (PhoneAssistantConfig & { brand_key?: string }) | undefined;

  const refetchAssistant = useCallback(() => {
    setLocalConfig(null);
    qc.invalidateQueries({ queryKey: ASSISTANT_KEY });
    qc.invalidateQueries({ queryKey: CALLS_KEY });
  }, [qc, ASSISTANT_KEY, CALLS_KEY]);

  return {
    config,
    isLoading,
    saveStatus,
    updateConfig,
    calls,
    callsLoading,
    purchaseNumber,
    releaseNumber,
    refetchAssistant,
  };
}
