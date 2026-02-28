import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/* ── Types ── */
export interface PhoneAssistantConfig {
  id: string;
  user_id: string;
  display_name: string;
  is_enabled: boolean;
  voice_provider: string | null;
  voice_preset_key: string;
  voice_settings: { stability: number; clarity: number; speed: number };
  first_message: string;
  behavior_prompt: string;
  rules: {
    ask_clarify_once: boolean;
    collect_name: boolean;
    confirm_callback_number: boolean;
    collect_reason: boolean;
    collect_urgency: boolean;
    collect_preferred_times: boolean;
    max_call_seconds: number;
  };
  documentation: {
    email_enabled: boolean;
    email_target: string;
    portal_log_enabled: boolean;
    auto_summary: boolean;
    extract_tasks: boolean;
    retention_days: number;
  };
  forwarding_number_e164: string | null;
  binding_status: string;
  twilio_number_sid: string | null;
  twilio_phone_number_e164: string | null;
  armstrong_inbound_email: string | null;
  tier: 'standard' | 'premium';
  created_at: string;
  updated_at: string;
}

export interface CallSession {
  id: string;
  user_id: string;
  assistant_id: string;
  direction: string;
  from_number_e164: string;
  to_number_e164: string | null;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  status: string;
  transcript_text: string | null;
  summary_text: string | null;
  action_items: Array<{ title: string; priority?: string; due?: string }>;
  match: { matched_type: string; matched_id: string | null; match_type: string };
  created_at: string;
}

const ASSISTANT_KEY = ['phone-assistant'];
const CALLS_KEY = ['phone-call-sessions'];

export function usePhoneAssistant() {
  const qc = useQueryClient();
  const [localConfig, setLocalConfig] = useState<Partial<PhoneAssistantConfig> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  /* ── Fetch or auto-create assistant ── */
  const { data: assistant, isLoading } = useQuery({
    queryKey: ASSISTANT_KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('commpro_phone_assistants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as unknown as PhoneAssistantConfig;

      // Auto-create default
      const { data: created, error: createErr } = await supabase
        .from('commpro_phone_assistants')
        .insert({ user_id: user.id } as any)
        .select()
        .single();

      if (createErr) throw createErr;
      return created as unknown as PhoneAssistantConfig;
    },
  });

  // Sync local state when assistant loads
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
  }, [assistant?.id, qc]);

  const updateConfig = useCallback((updates: Partial<PhoneAssistantConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persistUpdate(updates), 500);
  }, [persistUpdate]);

  /* ── Call Sessions ── */
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: CALLS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commpro_phone_call_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CallSession[];
    },
    enabled: !!assistant,
  });

  const createTestEvent = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !assistant) throw new Error('Missing context');

      const randomPhone = `+4917${Math.floor(10000000 + Math.random() * 89999999)}`;
      const now = new Date();
      const duration = 45 + Math.floor(Math.random() * 90);

      const { error } = await supabase.from('commpro_phone_call_sessions').insert({
        user_id: user.id,
        assistant_id: assistant.id,
        direction: 'inbound',
        from_number_e164: randomPhone,
        started_at: new Date(now.getTime() - duration * 1000).toISOString(),
        ended_at: now.toISOString(),
        duration_sec: duration,
        status: 'test',
        transcript_text: `Anrufer: Guten Tag, ich hätte eine Frage zu meiner letzten Rechnung.\nAssistent: Natürlich, ich notiere Ihr Anliegen. Können Sie mir Ihren Namen nennen?\nAnrufer: Müller, Thomas Müller.\nAssistent: Vielen Dank, Herr Müller. Worum geht es genau?\nAnrufer: Ich habe eine doppelte Abbuchung auf meiner Rechnung vom Januar.\nAssistent: Verstanden. Ich leite das weiter. Unter welcher Nummer sind Sie erreichbar?\nAnrufer: ${randomPhone}\nAssistent: Perfekt. Sie werden zeitnah zurückgerufen. Gibt es einen bevorzugten Zeitraum?\nAnrufer: Am besten vormittags.\nAssistent: Notiert. Vielen Dank für Ihren Anruf, Herr Müller.`,
        summary_text: '• Anrufer Thomas Müller meldet doppelte Abbuchung auf Januar-Rechnung\n• Rückruf gewünscht, bevorzugt vormittags\n• Kontaktnummer bestätigt',
        action_items: [
          { title: 'Rechnungsprüfung Januar — doppelte Abbuchung klären', priority: 'hoch' },
          { title: 'Rückruf an Herrn Müller (vormittags)', priority: 'mittel' },
          { title: 'Gutschrift prüfen falls bestätigt', priority: 'niedrig' },
        ],
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CALLS_KEY });
      toast({ title: 'Test-Eintrag erstellt' });
    },
    onError: () => toast({ title: 'Fehler beim Erstellen', variant: 'destructive' }),
  });

  const deleteTestEvents = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('commpro_phone_call_sessions')
        .delete()
        .eq('status', 'test');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CALLS_KEY });
      toast({ title: 'Testdaten gelöscht' });
    },
    onError: () => toast({ title: 'Fehler beim Löschen', variant: 'destructive' }),
  });

  const config = (localConfig ?? assistant) as PhoneAssistantConfig | undefined;

  const refetchAssistant = useCallback(() => {
    setLocalConfig(null);
    qc.invalidateQueries({ queryKey: ASSISTANT_KEY });
  }, [qc]);

  return {
    config,
    isLoading,
    saveStatus,
    updateConfig,
    calls,
    callsLoading,
    createTestEvent,
    deleteTestEvents,
    refetchAssistant,
  };
}
