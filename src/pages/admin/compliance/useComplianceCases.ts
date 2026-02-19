/**
 * Hook: CRUD for dsar_requests + deletion_requests
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DSARRequest {
  id: string;
  tenant_id: string;
  user_id: string | null;
  requester_email: string;
  requester_name: string | null;
  request_type: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Phase 1 fields
  request_channel: string;
  request_received_at: string | null;
  identity_status: string;
  identity_method: string | null;
  identity_notes: string | null;
  scope_mode: string;
  scope_notes: string | null;
  response_status: string;
  response_sent_at: string | null;
  response_channel: string | null;
  assigned_to: string | null;
  internal_notes: string | null;
}

export interface DeletionRequest {
  id: string;
  tenant_id: string;
  user_id: string | null;
  requester_email: string;
  requester_name: string | null;
  status: string;
  legal_hold_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  executed_at: string | null;
  // Phase 1 fields
  request_channel: string;
  request_received_at: string | null;
  due_date: string | null;
  identity_status: string;
  identity_method: string | null;
  identity_notes: string | null;
  scope_mode: string;
  scope_notes: string | null;
  retention_notes: string | null;
  erasure_summary: string | null;
  response_status: string;
  response_sent_at: string | null;
  response_channel: string | null;
  response_type: string | null;
  assigned_to: string | null;
  internal_notes: string | null;
}

export function useDSARRequests() {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();
  const { activeTenantId } = useAuth();

  const query = useQuery({
    queryKey: ['dsar-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dsar_requests' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DSARRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (params: Record<string, any>) => {
      const { id, ...updates } = params;
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      
      const { error } = await supabase.from('dsar_requests' as any).update(payload).eq('id', id);
      if (error) throw error;

      // Ledger events
      if (updates.identity_status === 'VERIFIED') {
        logEvent({ zone: 'Z1', eventType: 'legal.dsar.identity_verified', direction: 'mutate', source: 'admin',
          payload: { method: updates.identity_method, dsar_id: id } });
      } else if (updates.identity_status === 'FAILED') {
        logEvent({ zone: 'Z1', eventType: 'legal.dsar.identity_failed', direction: 'mutate', source: 'admin',
          payload: { method: updates.identity_method, dsar_id: id, reason: updates.identity_notes || '' } });
      }
      if (updates.response_status === 'SENT') {
        logEvent({ zone: 'Z1', eventType: 'legal.dsar.response_sent', direction: 'mutate', source: 'admin',
          payload: { dsar_id: id, channel: updates.response_channel || '' } });
      }
      if (updates.status === 'CLOSED') {
        logEvent({ zone: 'Z1', eventType: 'legal.dsar.closed', direction: 'mutate', source: 'admin',
          payload: { resolution: 'completed' } });
      }
      if (updates.status === 'REJECTED') {
        logEvent({ zone: 'Z1', eventType: 'legal.dsar.rejected', direction: 'mutate', source: 'admin',
          payload: { dsar_id: id, reason: updates.identity_notes || 'identity_failed' } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dsar-requests'] });
      toast.success('DSAR-Anfrage aktualisiert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  const createRequest = useMutation({
    mutationFn: async (params: {
      requester_email: string;
      requester_name?: string | null;
      request_channel: string;
      request_received_at: string;
      due_date: string;
      status: string;
      request_type: string;
    }) => {
      if (!activeTenantId) throw new Error('Kein Tenant aktiv');
      const { error } = await supabase.from('dsar_requests' as any).insert({
        tenant_id: activeTenantId,
        requester_email: params.requester_email,
        requester_name: params.requester_name || null,
        request_channel: params.request_channel,
        request_received_at: params.request_received_at,
        due_date: params.due_date,
        status: params.status,
        request_type: params.request_type,
      } as any);
      if (error) throw error;
      logEvent({ zone: 'Z1', eventType: 'legal.dsar.created', direction: 'mutate', source: 'admin',
        payload: { request_type: params.request_type, requester_email_hash: '***' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dsar-requests'] });
      toast.success('DSAR-Anfrage angelegt');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return { requests: query.data || [], isLoading: query.isLoading, updateStatus, createRequest };
}

export function useDeletionRequests() {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();
  const { activeTenantId } = useAuth();

  const query = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deletion_requests' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DeletionRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (params: Record<string, any>) => {
      const { id, ...updates } = params;
      const payload: any = { ...updates, updated_at: new Date().toISOString() };

      const { error } = await supabase.from('deletion_requests' as any).update(payload).eq('id', id);
      if (error) throw error;

      // Ledger events
      if (updates.identity_status === 'VERIFIED') {
        logEvent({ zone: 'Z1', eventType: 'legal.deletion.identity_verified', direction: 'mutate', source: 'admin',
          payload: { method: updates.identity_method, deletion_id: id } });
      } else if (updates.identity_status === 'FAILED') {
        logEvent({ zone: 'Z1', eventType: 'legal.deletion.identity_failed', direction: 'mutate', source: 'admin',
          payload: { method: updates.identity_method, deletion_id: id, reason: updates.identity_notes || '' } });
      }
      if (updates.legal_hold_reason && updates.status === 'HOLD_LEGAL') {
        logEvent({ zone: 'Z1', eventType: 'legal.deletion.legal_hold_applied', direction: 'mutate', source: 'admin',
          payload: { deletion_id: id, reason: updates.legal_hold_reason } });
      }
      if (updates.response_status === 'SENT') {
        logEvent({ zone: 'Z1', eventType: 'legal.deletion.response_sent', direction: 'mutate', source: 'admin',
          payload: { deletion_id: id, channel: updates.response_channel || '', response_type: updates.response_type || '' } });
      }
      if (updates.status === 'CLOSED') {
        logEvent({ zone: 'Z1', eventType: 'legal.deletion.closed', direction: 'mutate', source: 'admin',
          payload: { deletion_id: id, resolution: 'completed' } });
      }
      if (updates.status === 'REJECTED') {
        logEvent({ zone: 'Z1', eventType: 'legal.deletion.rejected', direction: 'mutate', source: 'admin',
          payload: { deletion_id: id, reason: updates.identity_notes || 'identity_failed' } });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deletion-requests'] });
      toast.success('Löschantrag aktualisiert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  const createRequest = useMutation({
    mutationFn: async (params: {
      requester_email: string;
      requester_name?: string | null;
      request_channel: string;
      request_received_at: string;
      due_date: string;
    }) => {
      if (!activeTenantId) throw new Error('Kein Tenant aktiv');
      const { error } = await supabase.from('deletion_requests' as any).insert({
        tenant_id: activeTenantId,
        requester_email: params.requester_email,
        requester_name: params.requester_name || null,
        request_channel: params.request_channel,
        request_received_at: params.request_received_at,
        due_date: params.due_date,
        status: 'NEW',
      } as any);
      if (error) throw error;
      logEvent({ zone: 'Z1', eventType: 'legal.deletion.created', direction: 'mutate', source: 'admin',
        payload: { requester_email_hash: '***' } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deletion-requests'] });
      toast.success('Löschantrag angelegt');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return { requests: query.data || [], isLoading: query.isLoading, updateStatus, createRequest };
}
