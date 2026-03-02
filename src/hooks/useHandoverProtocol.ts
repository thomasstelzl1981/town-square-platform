/**
 * useHandoverProtocol — CRUD for tenancy_handover_protocols
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { HandoverProtocolType, HandoverRoom, HandoverKeyItem, HandoverMeterReading } from '@/engines/tenancyLifecycle/spec';

export interface HandoverProtocol {
  id: string;
  tenant_id: string;
  lease_id: string;
  unit_id: string;
  protocol_type: string;
  protocol_date: string;
  inspector_name: string | null;
  tenant_name: string | null;
  status: string;
  rooms: HandoverRoom[];
  meter_readings: HandoverMeterReading[];
  key_handover: HandoverKeyItem[];
  general_notes: string | null;
  photos: string[];
  signed_at: string | null;
  created_at: string;
}

export function useHandoverProtocol(leaseId?: string) {
  const { session } = useAuth();
  const [protocols, setProtocols] = useState<HandoverProtocol[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProtocols = useCallback(async () => {
    if (!session?.user || !leaseId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tenancy_handover_protocols')
        .select('*')
        .eq('lease_id', leaseId)
        .order('created_at', { ascending: false });
      setProtocols((data as unknown as HandoverProtocol[]) || []);
    } finally {
      setLoading(false);
    }
  }, [session?.user, leaseId]);

  const createProtocol = useCallback(async (input: {
    tenantId: string;
    leaseId: string;
    unitId: string;
    type: HandoverProtocolType;
    inspectorName?: string;
    tenantName?: string;
  }) => {
    const { data, error } = await supabase
      .from('tenancy_handover_protocols')
      .insert({
        tenant_id: input.tenantId,
        lease_id: input.leaseId,
        unit_id: input.unitId,
        protocol_type: input.type,
        inspector_name: input.inspectorName || null,
        tenant_name: input.tenantName || null,
      })
      .select()
      .single();
    if (!error) fetchProtocols();
    return { data, error };
  }, [fetchProtocols]);

  const updateProtocol = useCallback(async (id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase
      .from('tenancy_handover_protocols')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchProtocols();
    return { error };
  }, [fetchProtocols]);

  return { protocols, loading, fetchProtocols, createProtocol, updateProtocol };
}
