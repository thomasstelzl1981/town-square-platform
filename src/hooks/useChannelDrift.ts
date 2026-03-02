/**
 * useChannelDrift — Hook for Zone 1 Sales Desk to detect publication drift
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeChannelDrift, countDriftedChannels } from '@/engines/slc/engine';
import type { ChannelProjection } from '@/engines/slc/spec';

export function useChannelDrift() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-desk-channel-drift'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_publications')
        .select('listing_id, channel, expected_hash, last_synced_hash, last_synced_at, status')
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
  });

  const projections = computeChannelDrift(
    (data || []).map(p => ({
      listing_id: p.listing_id,
      channel: p.channel,
      expected_hash: p.expected_hash ?? null,
      last_synced_hash: p.last_synced_hash ?? null,
    }))
  );

  const driftedCount = countDriftedChannels(projections);
  const driftedItems = projections.filter(p => p.is_drifted);

  return { projections, driftedCount, driftedItems, isLoading };
}
