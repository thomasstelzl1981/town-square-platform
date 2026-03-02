/**
 * Hook: Tenancy Reporting & Export
 * Aggregates data for PDF/CSV export via ENG-TLC
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aggregateReportData } from '@/engines/tenancyLifecycle/engine';

export function useTenancyReport(propertyId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;

  const reportQuery = useQuery({
    queryKey: ['tenancy-report', tenantId, propertyId],
    queryFn: async () => {
      if (!tenantId) return null;

      // Fetch leases
      let leasesQ = supabase
        .from('leases')
        .select('id, status, rent_cold_eur, unit_id')
        .eq('tenant_id', tenantId);
      if (propertyId) {
        // Filter by property via units
        const { data: units } = await supabase
          .from('units')
          .select('id')
          .eq('property_id', propertyId);
        const unitIds = (units || []).map(u => u.id);
        if (unitIds.length > 0) {
          leasesQ = leasesQ.in('unit_id', unitIds);
        }
      }
      const { data: leases } = await leasesQ;

      // Count units
      let unitsQ = supabase.from('units').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
      if (propertyId) unitsQ = unitsQ.eq('property_id', propertyId);
      const { count: totalUnits } = await unitsQ;

      // Count open tasks
      const { count: openTasks } = await supabase
        .from('tenancy_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['open', 'in_progress']);

      // Count critical events (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: criticalEvents } = await supabase
        .from('tenancy_lifecycle_events')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('severity', 'critical')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const mappedLeases = (leases || []).map(l => ({
        status: l.status || 'unknown',
        rentColdEur: l.rent_cold_eur,
        areaSqm: null as number | null,
      }));

      return aggregateReportData(
        mappedLeases,
        totalUnits || 0,
        0, // arrears would need separate calculation
        openTasks || 0,
        criticalEvents || 0
      );
    },
    enabled: !!tenantId,
  });

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(';'),
      ...data.map(row => headers.map(h => String(row[h] ?? '')).join(';'))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    report: reportQuery.data,
    isLoading: reportQuery.isLoading,
    exportCSV,
  };
}
