/**
 * usePetServiceCases — Central CRUD hook for pet_service_cases + pet_lifecycle_events
 * 
 * Wave A: Z3 flows use Edge Function proxies (no direct DB access)
 * Wave B: Idempotency + event_source on all events
 * Wave C: service_id, platform_fee_pct, pricing_snapshot fields
 * 
 * @see src/engines/plc/spec.ts
 * @see src/engines/plc/engine.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import {
  type PLCPhase,
  type PLCEventType,
  type PLCServiceType,
  type PLCCase,
  type PLCComputedState,
  PLC_EVENT_PHASE_MAP,
} from '@/engines/plc/spec';
import { computePLCState, isValidPLCTransition } from '@/engines/plc/engine';

// ─── Types ────────────────────────────────────────────────────

export interface CreateCaseInput {
  provider_id: string;
  service_type: PLCServiceType;
  service_id?: string | null;
  pet_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_notes?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  total_price_cents?: number;
  tenant_id: string;
  /** For Zone 3 customers (non-Supabase-auth) */
  z3_customer_id?: string | null;
}

export interface TransitionInput {
  case_id: string;
  event_type: PLCEventType;
  event_source?: string;
  actor_type?: 'customer' | 'provider' | 'admin' | 'system';
  payload?: Record<string, unknown>;
  provider_notes?: string | null;
}

export interface CaseWithComputed extends PLCCase {
  computed: PLCComputedState;
}

// ─── Query Keys ───────────────────────────────────────────────

const CASE_KEYS = {
  all: ['pet-service-cases'] as const,
  forProvider: (providerId: string) => [...CASE_KEYS.all, 'provider', providerId] as const,
  forCustomer: (userId: string) => [...CASE_KEYS.all, 'customer', userId] as const,
  forZ3Customer: (z3Id: string) => [...CASE_KEYS.all, 'z3customer', z3Id] as const,
  single: (caseId: string) => [...CASE_KEYS.all, 'single', caseId] as const,
  events: (caseId: string) => [...CASE_KEYS.all, 'events', caseId] as const,
};

// ─── Row → PLCCase Mapper ─────────────────────────────────────

function rowToCase(row: Record<string, unknown>): PLCCase {
  return {
    id: row.id as string,
    customer_user_id: row.customer_user_id as string | null,
    customer_email: row.customer_email as string | null,
    customer_name: row.customer_name as string | null,
    provider_id: row.provider_id as string,
    service_type: row.service_type as PLCServiceType,
    service_id: (row.service_id as string | null) ?? null,
    pet_id: row.pet_id as string | null,
    pet_customer_id: (row.pet_customer_id as string | null) ?? null,
    current_phase: row.current_phase as PLCPhase,
    phase_entered_at: row.phase_entered_at as string,
    total_price_cents: row.total_price_cents as number,
    deposit_cents: row.deposit_cents as number,
    deposit_paid_at: row.deposit_paid_at as string | null,
    platform_fee_pct: (row.platform_fee_pct as number) ?? 7.5,
    pricing_snapshot_at: (row.pricing_snapshot_at as string) ?? row.created_at as string,
    pricing_snapshot: (row.pricing_snapshot as Record<string, unknown> | null) ?? null,
    stripe_payment_intent_id: row.stripe_payment_intent_id as string | null,
    stripe_checkout_session_id: row.stripe_checkout_session_id as string | null,
    scheduled_start: row.scheduled_start as string | null,
    scheduled_end: row.scheduled_end as string | null,
    provider_notes: row.provider_notes as string | null,
    customer_notes: row.customer_notes as string | null,
    tenant_id: row.tenant_id as string,
    created_at: row.created_at as string,
    closed_at: row.closed_at as string | null,
  };
}

function enrichWithComputed(plcCase: PLCCase): CaseWithComputed {
  return {
    ...plcCase,
    computed: computePLCState(plcCase),
  };
}

// ─── Queries ──────────────────────────────────────────────────

/**
 * Load all cases for a given provider.
 */
export function useCasesForProvider(providerId: string | null | undefined) {
  return useQuery({
    queryKey: CASE_KEYS.forProvider(providerId ?? ''),
    enabled: !!providerId,
    queryFn: async (): Promise<CaseWithComputed[]> => {
      const { data, error } = await supabase
        .from('pet_service_cases')
        .select('*')
        .eq('provider_id', providerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((r) => enrichWithComputed(rowToCase(r)));
    },
  });
}

/**
 * Load all cases for the current customer (auth.uid()).
 */
export function useCasesForCustomer(userId: string | null | undefined) {
  return useQuery({
    queryKey: CASE_KEYS.forCustomer(userId ?? ''),
    enabled: !!userId,
    queryFn: async (): Promise<CaseWithComputed[]> => {
      const { data, error } = await supabase
        .from('pet_service_cases')
        .select('*')
        .eq('customer_user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((r) => enrichWithComputed(rowToCase(r)));
    },
  });
}

/**
 * Load all cases for a Zone 3 customer via Edge Function proxy.
 * NO direct DB access for Z3 (P0 security fix).
 */
export function useCasesForZ3Customer(z3CustomerId: string | null | undefined, sessionToken: string | null | undefined) {
  return useQuery({
    queryKey: CASE_KEYS.forZ3Customer(z3CustomerId ?? ''),
    enabled: !!z3CustomerId && !!sessionToken,
    queryFn: async (): Promise<CaseWithComputed[]> => {
      const { data, error } = await supabase.functions.invoke('sot-pslc-z3-list-cases', {
        body: { session_token: sessionToken },
      });

      if (error) throw error;
      const cases = data?.cases ?? [];
      return cases.map((r: Record<string, unknown>) => enrichWithComputed(rowToCase(r)));
    },
  });
}

/**
 * Load a single case by ID.
 */
export function useCase(caseId: string | null | undefined) {
  return useQuery({
    queryKey: CASE_KEYS.single(caseId ?? ''),
    enabled: !!caseId,
    queryFn: async (): Promise<CaseWithComputed | null> => {
      const { data, error } = await supabase
        .from('pet_service_cases')
        .select('*')
        .eq('id', caseId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return enrichWithComputed(rowToCase(data));
    },
  });
}

/**
 * Load lifecycle events for a case.
 */
export function useCaseEvents(caseId: string | null | undefined) {
  return useQuery({
    queryKey: CASE_KEYS.events(caseId ?? ''),
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_lifecycle_events')
        .select('*')
        .eq('case_id', caseId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────

/**
 * Create a new pet service case (for authenticated Z2 users only).
 * Z3 uses Edge Function proxy (sot-pslc-z3-create-case).
 */
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCaseInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht angemeldet');

      const now = new Date().toISOString();
      const initialPhase: PLCPhase = 'provider_selected';

      // 1. Insert case
      const { data: newCase, error: caseError } = await supabase
        .from('pet_service_cases')
        .insert({
          customer_user_id: user.id,
          customer_email: input.customer_email ?? null,
          customer_name: input.customer_name ?? null,
          provider_id: input.provider_id,
          service_type: input.service_type,
          service_id: input.service_id ?? null,
          pet_id: input.pet_id ?? null,
          current_phase: initialPhase,
          phase_entered_at: now,
          total_price_cents: input.total_price_cents ?? 0,
          deposit_cents: 0,
          platform_fee_pct: 7.5,
          pricing_snapshot_at: now,
          scheduled_start: input.scheduled_start ?? null,
          scheduled_end: input.scheduled_end ?? null,
          customer_notes: input.customer_notes ?? null,
          tenant_id: input.tenant_id,
        } as any)
        .select()
        .single();

      if (caseError) throw caseError;

      // 2. Log initial event with idempotency
      const idempotencyKey = `${newCase.id}:provider.selected:initial`;
      const { error: eventError } = await supabase
        .from('pet_lifecycle_events')
        .insert([{
          case_id: newCase.id,
          event_type: 'provider.selected' as string,
          phase_before: null as string | null,
          phase_after: initialPhase as string,
          actor_id: user.id,
          actor_type: 'customer' as string,
          event_source: 'ui:z2_mod05' as string,
          idempotency_key: idempotencyKey,
          correlation_key: newCase.id,
          payload: {
            service_type: input.service_type,
            service_id: input.service_id,
            scheduled_start: input.scheduled_start,
            scheduled_end: input.scheduled_end,
          } as unknown as Json,
        }]);

      if (eventError) {
        console.error('Event logging failed:', eventError);
      }

      return enrichWithComputed(rowToCase(newCase));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASE_KEYS.all });
      toast.success('Buchungsanfrage erstellt');
    },
    onError: (error) => {
      console.error('Create case failed:', error);
      toast.error('Buchungsanfrage fehlgeschlagen');
    },
  });
}

/**
 * Create a Z3 case via Edge Function proxy (secure).
 */
export function useCreateZ3Case() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      session_token: string;
      provider_id: string;
      service_id?: string | null;
      scheduled_start?: string | null;
      scheduled_end?: string | null;
      pet_id?: string | null;
      customer_notes?: string | null;
    }) => {
      const { data, error } = await supabase.functions.invoke('sot-pslc-z3-create-case', {
        body: input,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASE_KEYS.all });
      toast.success('Buchungsanfrage erstellt');
    },
    onError: (error: Error) => {
      console.error('Z3 create case failed:', error);
      toast.error(error.message || 'Buchungsanfrage fehlgeschlagen');
    },
  });
}

/**
 * Transition a case to the next phase by logging a PLC event.
 * Validates the transition via ENG-PLC engine before executing.
 * Uses idempotency keys to prevent duplicate events.
 */
export function useTransitionCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransitionInput) => {
      // 1. Load current case
      const { data: currentCase, error: loadErr } = await supabase
        .from('pet_service_cases')
        .select('*')
        .eq('id', input.case_id)
        .single();

      if (loadErr || !currentCase) throw new Error('Fall nicht gefunden');

      const fromPhase = currentCase.current_phase as PLCPhase;
      const targetPhase = PLC_EVENT_PHASE_MAP[input.event_type];

      // 2. Validate transition
      if (targetPhase && !isValidPLCTransition(fromPhase, targetPhase)) {
        throw new Error(
          `Ungültiger Übergang: ${fromPhase} → ${targetPhase}. Aktion nicht erlaubt.`
        );
      }

      // 3. Get actor
      const { data: { user } } = await supabase.auth.getUser();
      const actorId = user?.id ?? null;
      const actorType = input.actor_type ?? 'system';
      const eventSource = input.event_source ?? 'ui:z2_mod22';

      const now = new Date().toISOString();

      // 4. Generate idempotency key (deterministic per transition)
      const idempotencyKey = `${input.case_id}:${input.event_type}:${targetPhase ?? fromPhase}`;

      // 5. Log event (DB unique constraint handles idempotency)
      const { error: eventErr } = await supabase
        .from('pet_lifecycle_events')
        .insert([{
          case_id: input.case_id,
          event_type: input.event_type as string,
          phase_before: fromPhase as string,
          phase_after: (targetPhase ?? fromPhase) as string,
          actor_id: actorId,
          actor_type: actorType as string,
          event_source: eventSource as string,
          idempotency_key: idempotencyKey,
          correlation_key: input.case_id,
          payload: (input.payload ?? {}) as unknown as Json,
        }]);

      if (eventErr) {
        // Handle idempotency duplicate as success (no-op)
        if (eventErr.code === '23505' && eventErr.message?.includes('idempotency')) {
          return { case_id: input.case_id, new_phase: targetPhase ?? fromPhase, idempotent_skip: true };
        }
        throw eventErr;
      }

      // 6. Update case phase if this is a phase-changing event
      if (targetPhase) {
        const updatePayload: Record<string, unknown> = {
          current_phase: targetPhase,
          phase_entered_at: now,
        };

        if (targetPhase === 'closed_completed' || targetPhase === 'closed_cancelled') {
          updatePayload.closed_at = now;
        }

        if (input.provider_notes !== undefined) {
          updatePayload.provider_notes = input.provider_notes;
        }

        const { error: updateErr } = await supabase
          .from('pet_service_cases')
          .update(updatePayload)
          .eq('id', input.case_id);

        if (updateErr) throw updateErr;
      }

      return { case_id: input.case_id, new_phase: targetPhase ?? fromPhase };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: CASE_KEYS.all });
      if (!(result as any).idempotent_skip) {
        toast.success('Status aktualisiert');
      }
    },
    onError: (error: Error) => {
      console.error('Transition failed:', error);
      toast.error(error.message || 'Status-Änderung fehlgeschlagen');
    },
  });
}
