/**
 * Hooks for PV Connectors CRUD and Realtime Measurements
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CONNECTOR_KEY = 'pv-connectors';
const MEASUREMENTS_KEY = 'pv-measurements';

export interface PvConnector {
  id: string;
  pv_plant_id: string;
  provider: string;
  status: string;
  config_json: Record<string, unknown> | null;
  last_sync_at: string | null;
  last_error: string | null;
  tenant_id: string | null;
  created_at: string;
}

export interface PvMeasurement {
  id: string;
  pv_plant_id: string;
  ts: string;
  current_power_w: number | null;
  energy_today_kwh: number | null;
  energy_month_kwh: number | null;
  source: string;
  tenant_id: string | null;
}

/** CRUD for connectors of a specific plant */
export function usePvConnectors(plantId: string | undefined) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const { data: connectors = [], isLoading } = useQuery({
    queryKey: [CONNECTOR_KEY, plantId],
    queryFn: async () => {
      if (!plantId) return [];
      const { data, error } = await supabase
        .from('pv_connectors')
        .select('*')
        .eq('pv_plant_id', plantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PvConnector[];
    },
    enabled: !!plantId,
  });

  const upsertConnector = useMutation({
    mutationFn: async (input: { provider: string; config_json: Record<string, unknown> }) => {
      if (!plantId || !tenantId) throw new Error('Missing plant or tenant');

      // Check if connector of this provider already exists
      const existing = connectors.find(c => c.provider === input.provider);
      if (existing) {
        const { data, error } = await supabase
          .from('pv_connectors')
          .update({ config_json: input.config_json as any, status: 'configured' })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as PvConnector;
      }

      const { data, error } = await supabase
        .from('pv_connectors')
        .insert({
          pv_plant_id: plantId,
          tenant_id: tenantId,
          provider: input.provider,
          config_json: input.config_json as any,
          status: 'configured',
        })
        .select()
        .single();
      if (error) throw error;
      return data as PvConnector;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONNECTOR_KEY, plantId] });
      toast.success('Connector gespeichert');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { connectors, isLoading, upsertConnector };
}

/** Latest measurements with realtime subscription */
export function usePvMeasurements(plantId: string | undefined) {
  const [latestMeasurement, setLatestMeasurement] = useState<PvMeasurement | null>(null);

  // Initial fetch — latest measurement
  const { data: initialData } = useQuery({
    queryKey: [MEASUREMENTS_KEY, 'latest', plantId],
    queryFn: async () => {
      if (!plantId) return null;
      const { data, error } = await supabase
        .from('pv_measurements')
        .select('*')
        .eq('pv_plant_id', plantId)
        .order('ts', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PvMeasurement | null;
    },
    enabled: !!plantId,
  });

  useEffect(() => {
    if (initialData) setLatestMeasurement(initialData);
  }, [initialData]);

  // Realtime subscription
  useEffect(() => {
    if (!plantId) return;

    const channel = supabase
      .channel(`pv-measurements-${plantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pv_measurements',
          filter: `pv_plant_id=eq.${plantId}`,
        },
        (payload) => {
          setLatestMeasurement(payload.new as PvMeasurement);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [plantId]);

  // Fetch last 24h for chart
  const { data: measurements24h = [] } = useQuery({
    queryKey: [MEASUREMENTS_KEY, '24h', plantId],
    queryFn: async () => {
      if (!plantId) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('pv_measurements')
        .select('*')
        .eq('pv_plant_id', plantId)
        .gte('ts', since)
        .order('ts', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as PvMeasurement[];
    },
    enabled: !!plantId,
    refetchInterval: 60000,
  });

  return { latestMeasurement, measurements24h };
}
