/**
 * useMeterReadings — CRUD for tenancy_meter_readings
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MeterType, MeterReadingType } from '@/engines/tenancyLifecycle/spec';

export interface MeterReading {
  id: string;
  tenant_id: string;
  unit_id: string;
  lease_id: string | null;
  meter_type: string;
  meter_number: string | null;
  reading_value: number;
  reading_date: string;
  reading_type: string;
  photo_path: string | null;
  notes: string | null;
  created_at: string;
}

export function useMeterReadings(unitId?: string) {
  const { session } = useAuth();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReadings = useCallback(async () => {
    if (!session?.user || !unitId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tenancy_meter_readings')
        .select('*')
        .eq('unit_id', unitId)
        .order('reading_date', { ascending: false })
        .limit(100);
      setReadings((data as unknown as MeterReading[]) || []);
    } finally {
      setLoading(false);
    }
  }, [session?.user, unitId]);

  const addReading = useCallback(async (input: {
    tenantId: string;
    unitId: string;
    leaseId?: string;
    meterType: MeterType;
    meterNumber?: string;
    value: number;
    readingDate?: string;
    readingType?: MeterReadingType;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('tenancy_meter_readings')
      .insert({
        tenant_id: input.tenantId,
        unit_id: input.unitId,
        lease_id: input.leaseId || null,
        meter_type: input.meterType,
        meter_number: input.meterNumber || null,
        reading_value: input.value,
        reading_date: input.readingDate || new Date().toISOString().split('T')[0],
        reading_type: input.readingType || 'regular',
        notes: input.notes || null,
        created_by: session?.user?.id,
      })
      .select()
      .single();
    if (!error) fetchReadings();
    return { data, error };
  }, [session?.user?.id, fetchReadings]);

  return { readings, loading, fetchReadings, addReading };
}
