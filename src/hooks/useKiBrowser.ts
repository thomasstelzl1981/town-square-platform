/**
 * useKiBrowser — Hook for MOD-21 KI-Browser edge function calls
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KiBrowserSession {
  id: string;
  status: string;
  purpose: string | null;
  step_count: number;
  max_steps: number;
  expires_at: string;
  created_at: string;
}

export interface KiBrowserStep {
  id: string;
  step_number: number;
  kind: string;
  status: string;
  risk_level: string;
  url_after: string | null;
  duration_ms: number | null;
  created_at: string;
  rationale: string | null;
  blocked_reason?: string | null;
}

export interface FetchResult {
  title: string;
  description: string;
  text_content: string;
  links: Array<{ href: string; text: string }>;
  artifact_id: string;
}

export interface ExtractResult {
  text: string;
  links: Array<{ href: string; text: string }>;
  artifact_id: string;
}

export interface SummarizeResult {
  summary: string;
  artifact_id: string;
}

async function callKiBrowser<T = unknown>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('sot-ki-browser', {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message || 'Edge function error');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function useKiBrowser() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<KiBrowserSession | null>(null);
  const [steps, setSteps] = useState<KiBrowserStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedContent, setFetchedContent] = useState<FetchResult | null>(null);

  const startSession = useCallback(async (purpose?: string) => {
    setLoading(true);
    try {
      const result = await callKiBrowser<{ session_id: string; status: string; max_steps: number; expires_at: string }>('create_session', { purpose });
      setSessionId(result.session_id);
      setSession({
        id: result.session_id,
        status: result.status,
        purpose: purpose || null,
        step_count: 0,
        max_steps: result.max_steps,
        expires_at: result.expires_at,
        created_at: new Date().toISOString(),
      });
      setSteps([]);
      setFetchedContent(null);
      toast.success('Session gestartet');
      return result.session_id;
    } catch (e: any) {
      toast.error(`Session-Fehler: ${e.message}`);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const closeSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await callKiBrowser('close_session', { session_id: sessionId });
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
      toast.success('Session beendet');
    } catch (e: any) {
      toast.error(`Fehler: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchUrl = useCallback(async (url: string) => {
    if (!sessionId) return null;
    setLoading(true);
    try {
      const result = await callKiBrowser<FetchResult>('fetch_url', { session_id: sessionId, url });
      setFetchedContent(result);
      await refreshSession();
      return result;
    } catch (e: any) {
      toast.error(`Fetch-Fehler: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const extractContent = useCallback(async (artifactId: string, selectors?: string[]) => {
    if (!sessionId) return null;
    setLoading(true);
    try {
      const result = await callKiBrowser<ExtractResult>('extract_content', {
        session_id: sessionId,
        artifact_id: artifactId,
        selectors,
      });
      await refreshSession();
      return result;
    } catch (e: any) {
      toast.error(`Extract-Fehler: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const summarize = useCallback(async (artifactId: string, focus?: string) => {
    if (!sessionId) return null;
    setLoading(true);
    try {
      const result = await callKiBrowser<SummarizeResult>('summarize', {
        session_id: sessionId,
        artifact_id: artifactId,
        focus,
      });
      await refreshSession();
      return result;
    } catch (e: any) {
      toast.error(`Zusammenfassung-Fehler: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const proposeStep = useCallback(async (kind: string, payload: Record<string, unknown>) => {
    if (!sessionId) return null;
    setLoading(true);
    try {
      const result = await callKiBrowser<KiBrowserStep>('propose_step', {
        session_id: sessionId,
        kind,
        payload,
      });
      await refreshSession();
      return result;
    } catch (e: any) {
      toast.error(`Step-Fehler: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const approveStep = useCallback(async (stepId: string) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await callKiBrowser('approve_step', { session_id: sessionId, step_id: stepId });
      await refreshSession();
      toast.success('Schritt genehmigt');
    } catch (e: any) {
      toast.error(`Fehler: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const rejectStep = useCallback(async (stepId: string, reason?: string) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await callKiBrowser('reject_step', { session_id: sessionId, step_id: stepId, reason });
      await refreshSession();
      toast.info('Schritt abgelehnt');
    } catch (e: any) {
      toast.error(`Fehler: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const executeStep = useCallback(async (stepId: string) => {
    if (!sessionId) return null;
    setLoading(true);
    try {
      const result = await callKiBrowser('execute_step', { session_id: sessionId, step_id: stepId });
      await refreshSession();
      return result;
    } catch (e: any) {
      toast.error(`Ausführungsfehler: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const result = await callKiBrowser<{ session: KiBrowserSession; steps: KiBrowserStep[] }>('get_session', { session_id: sessionId });
      setSession(result.session);
      setSteps(result.steps);
    } catch {
      // silent
    }
  }, [sessionId]);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setSession(null);
    setSteps([]);
    setFetchedContent(null);
  }, []);

  return {
    sessionId,
    session,
    steps,
    loading,
    fetchedContent,
    startSession,
    closeSession,
    fetchUrl,
    extractContent,
    summarize,
    proposeStep,
    approveStep,
    rejectStep,
    executeStep,
    refreshSession,
    resetSession,
  };
}
