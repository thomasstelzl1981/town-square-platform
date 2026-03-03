/**
 * usePetServiceCases — Central CRUD hook for pet_service_cases + pet_lifecycle_events
 * 
 * Encapsulates all case operations and integrates with ENG-PLC engine
 * for phase validation, computed state, and event logging.
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
  PLC_VALID_TRANSITIONS,
} from '@/engines/plc/spec';
import { computePLCState, isValidPLCTransition } from '@/engines/plc/engine';

// ─── Types ────────────────────────────────────────────────────

export interface CreateCaseInput {
  provider_id: string;
  service_type: PLCServiceType;
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
    pet_id: row.pet_id as string | null,
    current_phase: row.current_phase as PLCPhase,
    phase_entered_at: row.phase_entered_at as string,
    total_price_cents: row.total_price_cents as number,
    deposit_cents: row.deposit_cents as number,
    deposit_paid_at: row.deposit_paid_at as string | null,
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
 * Load all cases for a Zone 3 customer (by z3_customer_id).
 */
export function useCasesForZ3Customer(z3CustomerId: string | null | undefined) {
  return useQuery({
    queryKey: CASE_KEYS.forZ3Customer(z3CustomerId ?? ''),
    enabled: !!z3CustomerId,
    queryFn: async (): Promise<CaseWithComputed[]> => {
      const { data, error } = await (supabase
        .from('pet_service_cases') as any)
        .select('*')
        .eq('z3_customer_id', z3CustomerId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map((r) => enrichWithComputed(rowToCase(r)));
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
 * Create a new pet service case.
 * Starts at phase `provider_selected` (Stripe deposit skipped for now).
 * Also logs the initial `provider.selected` event.
 */
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCaseInput) => {
      const isZ3 = !!input.z3_customer_id;
      let actorId: string | null = null;

      if (!isZ3) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Nicht angemeldet');
        actorId = user.id;
      } else {
        actorId = input.z3_customer_id!;
      }

      const initialPhase: PLCPhase = 'provider_selected';

      // 1. Insert case
      const { data: newCase, error: caseError } = await supabase
        .from('pet_service_cases')
        .insert({
          customer_user_id: isZ3 ? null : actorId,
          z3_customer_id: isZ3 ? input.z3_customer_id : null,
          customer_email: input.customer_email ?? null,
          customer_name: input.customer_name ?? null,
          provider_id: input.provider_id,
          service_type: input.service_type,
          pet_id: input.pet_id ?? null,
          current_phase: initialPhase,
          phase_entered_at: new Date().toISOString(),
          total_price_cents: input.total_price_cents ?? 0,
          deposit_cents: 0,
          scheduled_start: input.scheduled_start ?? null,
          scheduled_end: input.scheduled_end ?? null,
          customer_notes: input.customer_notes ?? null,
          tenant_id: input.tenant_id,
        } as any)
        .select()
        .single();

      if (caseError) throw caseError;

      // 2. Log initial event
      const { error: eventError } = await supabase
        .from('pet_lifecycle_events')
        .insert([{
          case_id: newCase.id,
          event_type: 'provider.selected' as string,
          phase_before: null as string | null,
          phase_after: initialPhase as string,
          actor_id: actorId,
          actor_type: 'customer' as string,
          payload: {
            service_type: input.service_type,
            scheduled_start: input.scheduled_start,
            scheduled_end: input.scheduled_end,
            z3: isZ3,
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
 * Transition a case to the next phase by logging a PLC event.
 * Validates the transition via ENG-PLC engine before executing.
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

      const now = new Date().toISOString();

      // 4. Log event
      const { error: eventErr } = await supabase
        .from('pet_lifecycle_events')
        .insert([{
          case_id: input.case_id,
          event_type: input.event_type as string,
          phase_before: fromPhase as string,
          phase_after: (targetPhase ?? fromPhase) as string,
          actor_id: actorId,
          actor_type: actorType as string,
          payload: (input.payload ?? {}) as unknown as Json,
        }]);

      if (eventErr) throw eventErr;

      // 5. Update case phase if this is a phase-changing event
      if (targetPhase) {
        const updatePayload: Record<string, unknown> = {
          current_phase: targetPhase,
          phase_entered_at: now,
        };

        // Set closed_at for terminal phases
        if (targetPhase === 'closed_completed' || targetPhase === 'closed_cancelled') {
          updatePayload.closed_at = now;
        }

        // Append provider notes if provided
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
      toast.success('Status aktualisiert');
    },
    onError: (error: Error) => {
      console.error('Transition failed:', error);
      toast.error(error.message || 'Status-Änderung fehlgeschlagen');
    },
  });
}
