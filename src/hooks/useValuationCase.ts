/**
 * useValuationCase — Orchestrates calls to sot-valuation-engine Edge Function
 * Handles preflight, run (with SSE stage progress), and result fetching.
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  ValuationStageId,
  ValuationStageStatus,
  PreflightOutput,
  ValuationCaseStatus,
} from '@/engines/valuation/spec';

export interface StageProgress {
  stageId: ValuationStageId;
  status: ValuationStageStatus;
  message?: string;
  durationMs?: number;
}

export interface ValuationCaseState {
  caseId: string | null;
  status: ValuationCaseStatus | 'idle' | 'preflight';
  preflight: PreflightOutput | null;
  stages: StageProgress[];
  currentStage: ValuationStageId;
  error: string | null;
  resultData: any | null;
}

const INITIAL_STATE: ValuationCaseState = {
  caseId: null,
  status: 'idle',
  preflight: null,
  stages: [],
  currentStage: 0,
  error: null,
  resultData: null,
};

export function useValuationCase() {
  const { activeOrganization, user } = useAuth();
  const [state, setState] = useState<ValuationCaseState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
    setIsLoading(false);
  }, []);

  /** Step 1: Preflight — check credits & sources */
  const runPreflight = useCallback(async (params: {
    propertyId?: string;
    offerId?: string;
    sourceUrls?: string[];
    sourceContext: 'MOD_04' | 'ACQUIARY_TOOLS' | 'MOD_13_INBOX';
  }) => {
    if (!activeOrganization || !user) {
      toast.error('Nicht angemeldet');
      return null;
    }
    setIsLoading(true);
    setState(s => ({ ...s, status: 'preflight', error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('sot-valuation-engine', {
        body: {
          action: 'preflight',
          tenantId: activeOrganization.id,
          userId: user.id,
          ...params,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Preflight fehlgeschlagen');

      const preflight = data.preflight as PreflightOutput;
      setState(s => ({ ...s, preflight, status: 'idle' }));
      setIsLoading(false);
      return preflight;
    } catch (e: any) {
      const msg = e?.message || 'Preflight-Fehler';
      setState(s => ({ ...s, error: msg, status: 'idle' }));
      toast.error(msg);
      setIsLoading(false);
      return null;
    }
  }, [activeOrganization, user]);

  /** Step 2: Run full pipeline */
  const runValuation = useCallback(async (params: {
    propertyId?: string;
    offerId?: string;
    sourceUrls?: string[];
    sourceContext: 'MOD_04' | 'ACQUIARY_TOOLS' | 'MOD_13_INBOX';
  }) => {
    if (!activeOrganization || !user) {
      toast.error('Nicht angemeldet');
      return null;
    }
    setIsLoading(true);
    setState(s => ({
      ...s,
      status: 'running',
      error: null,
      stages: [],
      currentStage: 0,
      resultData: null,
    }));

    abortRef.current = new AbortController();

    try {
      const { data, error } = await supabase.functions.invoke('sot-valuation-engine', {
        body: {
          action: 'run',
          tenantId: activeOrganization.id,
          userId: user.id,
          ...params,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Bewertung fehlgeschlagen');

      const caseId = data.caseId as string;

      // Update stages from response
      const stageTimings = data.stageTimings || {};
      const stages: StageProgress[] = Object.entries(stageTimings).map(([k, v]) => ({
        stageId: parseInt(k) as ValuationStageId,
        status: 'done' as ValuationStageStatus,
        durationMs: v as number,
      }));

      setState(s => ({
        ...s,
        caseId,
        status: data.status || 'final',
        stages,
        currentStage: 5,
      }));

      // Auto-fetch results
      await fetchResult(caseId);
      setIsLoading(false);
      return caseId;
    } catch (e: any) {
      const msg = e?.message || 'Bewertung fehlgeschlagen';
      setState(s => ({ ...s, error: msg, status: 'failed' }));
      toast.error(msg);
      setIsLoading(false);
      return null;
    }
  }, [activeOrganization, user]);

  /** Step 3: Fetch results for existing case */
  const fetchResult = useCallback(async (caseId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sot-valuation-engine', {
        body: { action: 'get', caseId },
      });
      if (error) throw new Error(error.message);
      setState(s => ({ ...s, resultData: data, caseId }));
      return data;
    } catch (e: any) {
      console.error('fetchResult error:', e);
      return null;
    }
  }, []);

  return {
    state,
    isLoading,
    runPreflight,
    runValuation,
    fetchResult,
    reset,
  };
}
