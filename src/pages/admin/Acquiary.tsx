/**
 * Acquiary — Zone 1 Governance + Intake for Acquisition Mandates
 * 
 * SoT for acq_mandates after submission until assignment to akquise_manager
 * Analog to FutureRoom.tsx pattern
 * 
 * Sub-Items (5):
 * - Inbox: New submissions (status: submitted_to_zone1)
 * - Assignments: Assignment workstation
 * - Mandates: All mandates overview
 * - Audit: Event timeline
 * - Needs Routing: Inbound messages without clear assignment
 */
import * as React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Inbox, Link2, FileText, ClipboardList, AlertTriangle, Loader2 } from 'lucide-react';
import { useAcqMandatesInbox, useAcqMandates } from '@/hooks/useAcqMandate';

// Lazy load sub-pages
const AcquiaryInbox = React.lazy(() => import('./acquiary/AcquiaryInbox'));
const AcquiaryAssignments = React.lazy(() => import('./acquiary/AcquiaryAssignments'));
const AcquiaryMandates = React.lazy(() => import('./acquiary/AcquiaryMandates'));
const AcquiaryAudit = React.lazy(() => import('./acquiary/AcquiaryAudit'));
const AcquiaryNeedsRouting = React.lazy(() => import('./acquiary/AcquiaryNeedsRouting'));

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

  const newMandates = inboxMandates?.length || 0;
  const assignedNotAccepted = allMandates?.filter(m => m.status === 'assigned').length || 0;
  // TODO: Replace with actual inbound needs_routing query
  const needsRoutingCount = 0;

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/assignments')) return 'assignments';
    if (path.includes('/mandates')) return 'mandates';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/needs-routing')) return 'needs-routing';
    if (path.includes('/inbox')) return 'inbox';
    return 'inbox';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'inbox':
        navigate('/admin/acquiary/inbox');
        break;
      case 'assignments':
        navigate('/admin/acquiary/assignments');
        break;
      case 'mandates':
        navigate('/admin/acquiary/mandates');
        break;
      case 'audit':
        navigate('/admin/acquiary/audit');
        break;
      case 'needs-routing':
        navigate('/admin/acquiary/needs-routing');
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Acquiary</h1>
          <p className="text-muted-foreground">
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
            <Badge variant="outline" className="text-sm border-orange-500 text-orange-600">
              {needsRoutingCount} Routing offen
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation Tabs — 5 Items */}
      <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox
            {newMandates > 0 && (
              <Badge variant="secondary" className="ml-1">{newMandates}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Link2 className="h-4 w-4" />
            Zuweisung
            {assignedNotAccepted > 0 && (
              <Badge variant="outline" className="ml-1">{assignedNotAccepted}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mandates" className="gap-2">
            <FileText className="h-4 w-4" />
            Mandate
            <Badge variant="outline" className="ml-1">{allMandates?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="needs-routing" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Routing
            {needsRoutingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{needsRoutingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Route Content */}
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route index element={<Navigate to="inbox" replace />} />
          <Route path="inbox" element={<AcquiaryInbox />} />
          <Route path="assignments" element={<AcquiaryAssignments />} />
          <Route path="mandates" element={<AcquiaryMandates />} />
          <Route path="audit" element={<AcquiaryAudit />} />
          <Route path="needs-routing" element={<AcquiaryNeedsRouting />} />
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}
