/**
 * FutureRoomLayout — Zone 1 Governance + Intake for Finance Requests
 * 
 * This is a LAYOUT component that renders:
 * - Header with badges
 * - Tab navigation
 * - <Outlet /> for child routes
 * 
 * SoT for finance_requests after submission until assignment to finance_manager
 * 
 * Sub-Items (5):
 * - Inbox: New submissions (status: submitted_to_zone1)
 * - Zuweisung: Assignment workstation
 * - Finanzierungsmanager: Manager pool
 * - Bankkontakte: Bank directory (master data)
 * - Monitoring: KPIs and aging
 */
import * as React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Inbox, Link2, Users, Building2, BarChart3, Globe, FileText, Layout } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { useFinanceMandates, useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function FutureRoomLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: mandates } = useFinanceMandates();
  const { data: banks } = useFinanceBankContacts();

  const newMandates = mandates?.filter(m => m.status === 'submitted_to_zone1' || m.status === 'new').length || 0;
  const assignedNotAccepted = mandates?.filter(m => m.status === 'assigned').length || 0;

  // Count website leads
  const { data: webLeads } = useQuery({
    queryKey: ['futureroom-web-leads-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('finance_requests')
        .select('*', { count: 'exact', head: true })
        .in('source', ['zone3_quick', 'zone3_website']);
      if (error) throw error;
      return count || 0;
    },
  });

  // Determine active tab from route (case-insensitive)
  const getActiveTab = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/website-leads')) return 'website-leads';
    if (path.includes('/zuweisung')) return 'zuweisung';
    if (path.includes('/finanzierungsmanager')) return 'finanzierungsmanager';
    if (path.includes('/bankkontakte')) return 'bankkontakte';
    if (path.includes('/contracts')) return 'contracts';
    if (path.includes('/monitoring')) return 'monitoring';
    if (path.includes('/vorlagen')) return 'vorlagen';
    return 'inbox';
  };

  const handleTabChange = (value: string) => {
    // Always use lowercase absolute paths
    navigate(`/admin/futureroom/${value}`);
  };

  return (
    <div className={`${DESIGN.CONTAINER.PADDING} ${DESIGN.SPACING.SECTION}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Future Room</h1>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>
            Zentrale Governance für Finanzierungsanfragen — SoT nach Einreichung bis Zuweisung
          </p>
        </div>
        <div className="flex gap-2">
          {newMandates > 0 && (
            <Badge variant="destructive" className="text-sm">
              {newMandates} neue Anfragen
            </Badge>
          )}
          {assignedNotAccepted > 0 && (
            <Badge variant="secondary" className="text-sm">
              {assignedNotAccepted} zugewiesen
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs — 8 Items */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="inbox" className="gap-1.5 text-xs">
            <Inbox className="h-4 w-4" />
            Inbox
            {newMandates > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">{newMandates}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="website-leads" className="gap-1.5 text-xs">
            <Globe className="h-4 w-4" />
            Web-Leads
            {(webLeads ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1">{webLeads}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="zuweisung" className="gap-1.5 text-xs">
            <Link2 className="h-4 w-4" />
            Zuweisung
          </TabsTrigger>
          <TabsTrigger value="finanzierungsmanager" className="gap-1.5 text-xs">
            <Users className="h-4 w-4" />
            Manager
          </TabsTrigger>
          <TabsTrigger value="bankkontakte" className="gap-1.5 text-xs">
            <Building2 className="h-4 w-4" />
            Banken
            <Badge variant="outline" className="ml-1 text-[10px] px-1">{banks?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-1.5 text-xs">
            <FileText className="h-4 w-4" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-1.5 text-xs">
            <BarChart3 className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="vorlagen" className="gap-1.5 text-xs">
            <Layout className="h-4 w-4" />
            Vorlagen
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Child Route Content via Outlet */}
      <React.Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <Outlet />
      </React.Suspense>
    </div>
  );
}
