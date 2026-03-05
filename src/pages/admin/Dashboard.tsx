/**
 * Admin Dashboard — Orchestrator
 * R-26: 491 → ~100 lines
 */
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DESIGN } from '@/config/designManifest';
import { AdminQuickActions } from '@/components/admin/dashboard';
import { AdminKPIGrid } from '@/components/admin/dashboard/AdminKPIGrid';
import { AdminSessionCard } from '@/components/admin/dashboard/AdminSessionCard';
import { PdfExportFooter } from '@/components/pdf';

interface Stats {
  organizations: number; profiles: number; memberships: number; delegations: number;
  orgsByType: Record<string, number>; membershipsByRole: Record<string, number>; activeDelegations: number;
}

export default function Dashboard() {
  const { profile, memberships, isPlatformAdmin, activeOrganization } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats>({ organizations: 0, profiles: 0, memberships: 0, delegations: 0, orgsByType: {}, membershipsByRole: {}, activeDelegations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [orgsRes, profilesRes, membershipsRes, delegationsRes, orgsDetailRes, membershipsDetailRes, activeDelegationsRes] = await Promise.all([
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('memberships').select('id', { count: 'exact', head: true }),
          supabase.from('org_delegations').select('id', { count: 'exact', head: true }),
          supabase.from('organizations').select('org_type'),
          supabase.from('memberships').select('role'),
          supabase.from('org_delegations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        ]);
        const orgsByType: Record<string, number> = {};
        (orgsDetailRes.data || []).forEach((o: any) => { orgsByType[o.org_type] = (orgsByType[o.org_type] || 0) + 1; });
        const membershipsByRole: Record<string, number> = {};
        (membershipsDetailRes.data || []).forEach((m: any) => { membershipsByRole[m.role] = (membershipsByRole[m.role] || 0) + 1; });
        setStats({ organizations: orgsRes.count || 0, profiles: profilesRes.count || 0, memberships: membershipsRes.count || 0, delegations: delegationsRes.count || 0, orgsByType, membershipsByRole, activeDelegations: activeDelegationsRes.count || 0 });
      } catch (e) { console.error('Failed to fetch stats:', e); }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className={DESIGN.SPACING.SECTION} ref={contentRef}>
      <div>
        <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Admin Dashboard</h2>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>Willkommen im System of a Town Admin Portal</p>
      </div>

      <AdminQuickActions />
      <AdminSessionCard profile={profile} memberships={memberships} isPlatformAdmin={isPlatformAdmin} activeOrganization={activeOrganization} />

      <div className={DESIGN.KPI_GRID.FULL}>
        <AdminKPIGrid stats={stats} loading={loading} />
      </div>

      <PdfExportFooter contentRef={contentRef} documentTitle="Admin Dashboard" subtitle="System of a Town – Übersicht" moduleName="Zone 1 Admin" />
    </div>
  );
}
