/**
 * Hook: CRUD for dsar_requests + deletion_requests
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
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
}

export interface DeletionRequest {
  id: string;
  tenant_id: string;
  user_id: string | null;
  requester_email: string;
  status: string;
  legal_hold_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  executed_at: string | null;
}

export function useDSARRequests() {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();

  const query = useQuery({
    queryKey: ['dsar-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dsar_requests' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DSARRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'closed') updates.closed_at = new Date().toISOString();
      if (notes !== undefined) updates.notes = notes;
      const { error } = await supabase.from('dsar_requests' as any).update(updates).eq('id', id);
      if (error) throw error;
      logEvent({ zone: 'Z1', eventType: status === 'closed' ? 'legal.dsar.closed' : 'legal.dsar.status_changed', direction: 'mutate', source: 'admin',
        payload: { new_status: status } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dsar-requests'] });
      toast.success('Status aktualisiert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return { requests: query.data || [], isLoading: query.isLoading, updateStatus };
}

export function useDeletionRequests() {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();

  const query = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deletion_requests' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DeletionRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'executed') updates.executed_at = new Date().toISOString();
      if (notes !== undefined) updates.notes = notes;
      const { error } = await supabase.from('deletion_requests' as any).update(updates).eq('id', id);
      if (error) throw error;
      logEvent({ zone: 'Z1', eventType: status === 'executed' ? 'legal.deletion.executed' : 'legal.deletion.status_changed', direction: 'mutate', source: 'admin',
        payload: { new_status: status } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deletion-requests'] });
      toast.success('Status aktualisiert');
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return { requests: query.data || [], isLoading: query.isLoading, updateStatus };
}
