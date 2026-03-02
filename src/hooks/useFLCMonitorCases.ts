/**
 * useFLCMonitorCases — Hook for Finance Desk FLC integration
 * 
 * Loads finance_requests + mandates + cases + latest events,
 * then computes FLC state client-side for display.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeFLCState, findPhaseEnteredAt, determineFLCPhase } from '@/engines/flc/engine';
import type { FLCCaseSnapshot, FLCComputedState } from '@/engines/flc/spec';

export interface FLCMonitorCase {
  requestId: string;
  publicId: string | null;
  source: string | null;
  contactName: string;
  contactEmail: string | null;
  managerName: string | null;
  managerId: string | null;
  submittedAt: string | null;
  computed: FLCComputedState;
  events: Array<{
    id: string;
    event_type: string;
    phase: string | null;
    actor_type: string | null;
    event_source: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
}

export function useFLCMonitorCases() {
  const [cases, setCases] = useState<FLCMonitorCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch open finance_requests with related data
      const { data: requests, error: reqErr } = await supabase
        .from('finance_requests' as any)
        .select(`
          id, status, public_id, source, submitted_at,
          contact_first_name, contact_last_name, contact_email, contact_phone,
          finance_mandates (
            id, status, assigned_manager_id, delegated_at, accepted_at
          ),
          future_room_cases (
            id, status, first_action_at, submission_channel, submission_status,
            submitted_to_bank_at, bank_response
          ),
          applicant_profiles (
            completion_score, schufa_consent, data_correct_confirmed
          )
        `)
        .not('status', 'in', '("completed","cancelled","rejected","closed")')
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (reqErr) throw reqErr;
      if (!requests || requests.length === 0) {
        setCases([]);
        return;
      }

      // Fetch finance_packages for SUBMISSION_GATE (A4 fix)
      const requestIds = (requests as any[]).map((r: any) => r.id);
      
      let packagesMap: Record<string, string> = {};
      const { data: packages } = await supabase
        .from('finance_packages' as any)
        .select('finance_request_id, status')
        .in('finance_request_id', requestIds);
      
      if (packages) {
        for (const p of packages as any[]) {
          packagesMap[p.finance_request_id] = p.status;
        }
      }

      // Fetch events for all request IDs
      // Events already have requestIds from above
      const { data: allEvents } = await supabase
        .from('finance_lifecycle_events' as any)
        .select('id, finance_request_id, event_type, phase, actor_type, event_source, metadata, created_at')
        .in('finance_request_id', requestIds)
        .order('created_at', { ascending: false })
        .limit(1000);

      // Fetch commissions for mandates
      const mandateIds = (requests as any[])
        .map((r: any) => {
          const m = Array.isArray(r.finance_mandates) ? r.finance_mandates[0] : r.finance_mandates;
          return m?.id;
        })
        .filter(Boolean);

      let commissionsMap: Record<string, any> = {};
      if (mandateIds.length > 0) {
        const { data: commissions } = await supabase
          .from('commissions' as any)
          .select('reference_id, status, platform_share_pct')
          .in('reference_id', mandateIds)
          .eq('reference_type', 'finance_mandate');
        
        if (commissions) {
          for (const c of commissions as any[]) {
            commissionsMap[c.reference_id] = c;
          }
        }
      }

      // Fetch manager profiles
      const managerIds = (requests as any[])
        .map((r: any) => {
          const m = Array.isArray(r.finance_mandates) ? r.finance_mandates[0] : r.finance_mandates;
          return m?.assigned_manager_id;
        })
        .filter(Boolean);

      let managersMap: Record<string, string> = {};
      if (managerIds.length > 0) {
        const { data: managers } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name')
          .in('id', [...new Set(managerIds)]);
        
        if (managers) {
          for (const m of managers) {
            managersMap[m.id] = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.display_name || '—';
          }
        }
      }

      // Build monitor cases
      const eventsMap = new Map<string, any[]>();
      if (allEvents) {
        for (const evt of allEvents as any[]) {
          const list = eventsMap.get(evt.finance_request_id) || [];
          list.push(evt);
          eventsMap.set(evt.finance_request_id, list);
        }
      }

      const monitorCases: FLCMonitorCase[] = (requests as any[]).map((r: any) => {
        const mandate = Array.isArray(r.finance_mandates) ? r.finance_mandates[0] : r.finance_mandates;
        const frc = Array.isArray(r.future_room_cases) ? r.future_room_cases[0] : r.future_room_cases;
        const applicant = Array.isArray(r.applicant_profiles) ? r.applicant_profiles[0] : r.applicant_profiles;
        const comm = mandate ? commissionsMap[mandate.id] : null;
        const events = eventsMap.get(r.id) || [];

        // Build snapshot
        const snapshot: FLCCaseSnapshot = {
          request_id: r.id,
          request_status: r.status,
          request_source: r.source,
          public_id: r.public_id,
          submitted_at: r.submitted_at,
          contact_email: r.contact_email,
          contact_phone: r.contact_phone,
          contact_first_name: r.contact_first_name,
          contact_last_name: r.contact_last_name,
          mandate_id: mandate?.id || null,
          mandate_status: mandate?.status || null,
          assigned_manager_id: mandate?.assigned_manager_id || null,
          delegated_at: mandate?.delegated_at || null,
          accepted_at: mandate?.accepted_at || null,
          case_id: frc?.id || null,
          case_status: frc?.status || null,
          first_action_at: frc?.first_action_at || null,
          submission_channel: frc?.submission_channel || null,
          submission_status: frc?.submission_status || null,
          submitted_to_bank_at: frc?.submitted_to_bank_at || null,
          bank_response: frc?.bank_response || null,
          completion_score: applicant?.completion_score ?? null,
          schufa_consent: applicant?.schufa_consent ?? null,
          data_correct_confirmed: applicant?.data_correct_confirmed ?? null,
          package_status: packagesMap[r.id] || null,
          commission_status: comm?.status || null,
          platform_share_pct: comm?.platform_share_pct ?? null,
          // Fix #2: Compute phase_entered_at from events
          phase_entered_at: null, // Will be set below
          last_event_type: events[0]?.event_type || null,
          last_event_at: events[0]?.created_at || null,
        };

        // Compute phase first to find phase_entered_at
        const currentPhase = determineFLCPhase(snapshot);
        snapshot.phase_entered_at = findPhaseEnteredAt(events, currentPhase, r.submitted_at);

        const computed = computeFLCState(snapshot);

        return {
          requestId: r.id,
          publicId: r.public_id,
          source: r.source,
          contactName: [r.contact_first_name, r.contact_last_name].filter(Boolean).join(' ') || '—',
          contactEmail: r.contact_email,
          managerName: mandate?.assigned_manager_id ? managersMap[mandate.assigned_manager_id] || null : null,
          managerId: mandate?.assigned_manager_id || null,
          submittedAt: r.submitted_at,
          computed,
          events,
        };
      });

      setCases(monitorCases);
    } catch (err) {
      console.error('[useFLCMonitorCases] Error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const stuckCases = cases.filter(c => c.computed.isStuck);
  const breachCases = cases.filter(c => c.computed.isSLABreach);

  return { cases, stuckCases, breachCases, loading, error, refetch: fetchCases };
}
