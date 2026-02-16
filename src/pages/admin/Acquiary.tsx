/**
 * Acquiary — Zone 1 Governance + Intake for Acquisition Mandates
 * 
 * SoT for acq_mandates after submission until assignment to akquise_manager
 * Analog to FutureRoom.tsx pattern
 * 
 * Sub-Items (7):
 * - Inbox: New submissions (status: submitted_to_zone1)
 * - Assignments: Assignment workstation
 * - Mandates: All mandates overview
 * - Objekteingang: ALL offers across all mandates (NEW!)
 * - Audit: Event timeline
 * - Needs Routing: Inbound messages without clear assignment
 * - Monitoring: KPIs and status tracking
 */
import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Inbox, FileText, AlertTriangle, Activity, Loader2, Package, Users } from 'lucide-react';
import { useAcqMandatesInbox, useAcqMandates } from '@/hooks/useAcqMandate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DESIGN } from '@/config/designManifest';

// Lazy load sub-pages
const AcquiaryInbox = React.lazy(() => import('./acquiary/AcquiaryInbox'));
const AcquiaryAssignments = React.lazy(() => import('./acquiary/AcquiaryAssignments'));
const AcquiaryMandates = React.lazy(() => import('./acquiary/AcquiaryMandates'));
const AcquiaryDatenbank = React.lazy(() => import('./acquiary/AcquiaryDatenbank'));
const AcquiaryKontakte = React.lazy(() => import('./acquiary/AcquiaryKontakte'));
const AcquiaryNeedsRouting = React.lazy(() => import('./acquiary/AcquiaryNeedsRouting'));
const AcquiaryMonitor = React.lazy(() => import('./acquiary/AcquiaryMonitor'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export default function AcquiaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: inboxMandates } = useAcqMandatesInbox();
  const { data: allMandates } = useAcqMandates();

  // Count all offers for badge
  const { data: offerCount = 0 } = useQuery({
    queryKey: ['acq-offers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('acq_offers')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const newMandates = inboxMandates?.length || 0;
  const assignedNotAccepted = allMandates?.filter(m => m.status === 'assigned').length || 0;
  const { data: needsRoutingCount = 0 } = useQuery({
    queryKey: ['acq-needs-routing-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('acq_inbound_messages')
        .select('id', { count: 'exact', head: true })
        .eq('needs_routing', true)
        .is('routed_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/kontakte')) return 'kontakte';
    if (path.includes('/datenbank')) return 'datenbank';
    if (path.includes('/mandates')) return 'mandates';
    if (path.includes('/needs-routing')) return 'needs-routing';
    if (path.includes('/monitor')) return 'monitor';
    if (path.includes('/inbox')) return 'inbox';
    return 'inbox';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'inbox': navigate('/admin/acquiary/inbox'); break;
      case 'kontakte': navigate('/admin/acquiary/kontakte'); break;
      case 'datenbank': navigate('/admin/acquiary/datenbank'); break;
      case 'mandates': navigate('/admin/acquiary/mandates'); break;
      case 'needs-routing': navigate('/admin/acquiary/needs-routing'); break;
      case 'monitor': navigate('/admin/acquiary/monitor'); break;
    }
  };

  return (
    <div className={`${DESIGN.CONTAINER.PADDING} ${DESIGN.SPACING.SECTION}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Acquiary</h1>
          <p className={DESIGN.TYPOGRAPHY.MUTED}>
            Zentrale Governance für Akquise-Mandate — SoT nach Einreichung bis Zuweisung
          </p>
        </div>
        <div className="flex gap-2">
          {newMandates > 0 && (
            <Badge variant="destructive" className="text-sm">
              {newMandates} neue Mandate
            </Badge>
          )}
          {assignedNotAccepted > 0 && (
            <Badge variant="secondary" className="text-sm">
              {assignedNotAccepted} zugewiesen
            </Badge>
          )}
          {needsRoutingCount > 0 && (
            <Badge variant="outline" className="text-sm border-destructive/50 text-destructive">
              {needsRoutingCount} Routing offen
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs — 6 Items */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {newMandates > 0 && (
              <Badge variant="secondary" className="ml-1">{newMandates}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="kontakte" className="gap-2">
            <Users className="h-4 w-4" />
            Kontakte
          </TabsTrigger>
          <TabsTrigger value="datenbank" className="gap-2">
            <Package className="h-4 w-4" />
            Datenbank
            {offerCount > 0 && (
              <Badge variant="secondary" className="ml-1">{offerCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mandates" className="gap-2">
            <FileText className="h-4 w-4" />
            Mandate
            <Badge variant="outline" className="ml-1">{allMandates?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="needs-routing" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Routing
            {needsRoutingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{needsRoutingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<Navigate to="inbox" replace />} />
          <Route path="inbox" element={<AcquiaryInbox />} />
          <Route path="kontakte" element={<AcquiaryKontakte />} />
          <Route path="datenbank" element={<AcquiaryDatenbank />} />
          <Route path="mandates" element={<AcquiaryMandates />} />
          <Route path="needs-routing" element={<AcquiaryNeedsRouting />} />
          <Route path="monitor" element={<AcquiaryMonitor />} />
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}
