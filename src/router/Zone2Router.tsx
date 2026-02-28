/**
 * ZONE 2 ROUTER — User Portal Routes
 * 
 * Extracted from ManifestRouter.tsx for code-splitting.
 * Only loaded when visiting /portal/* paths.
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { zone2Portal } from '@/manifests/routesManifest';
import { PortalLayout } from '@/components/portal/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';

// =============================================================================
// Loading Fallback
// =============================================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// =============================================================================
// Zone 2: Module Page Components (Lazy loaded)
// =============================================================================
const StammdatenPage = React.lazy(() => import('@/pages/portal/StammdatenPage'));
const OfficePage = React.lazy(() => import('@/pages/portal/OfficePage'));
const DMSPage = React.lazy(() => import('@/pages/portal/DMSPage'));
const ImmobilienPage = React.lazy(() => import('@/pages/portal/ImmobilienPage'));
const VerkaufPage = React.lazy(() => import('@/pages/portal/VerkaufPage'));
const FinanzierungPage = React.lazy(() => import('@/pages/portal/FinanzierungPage'));
const FinanzierungsmanagerPage = React.lazy(() => import('@/pages/portal/FinanzierungsmanagerPage'));
const InvestmentsPage = React.lazy(() => import('@/pages/portal/InvestmentsPage'));
const VertriebspartnerPage = React.lazy(() => import('@/pages/portal/VertriebspartnerPage'));
const LeadManagerPage = React.lazy(() => import('@/pages/portal/LeadManagerPage'));
const AkquiseManagerPage = React.lazy(() => import('@/pages/portal/AkquiseManagerPage'));
const ProjektePage = React.lazy(() => import('@/pages/portal/ProjektePage'));
const CommunicationProPage = React.lazy(() => import('@/pages/portal/CommunicationProPage'));
const FortbildungPage = React.lazy(() => import('@/pages/portal/FortbildungPage'));
const ServicesPage = React.lazy(() => import('@/pages/portal/ServicesPage'));
const CarsPage = React.lazy(() => import('@/pages/portal/CarsPage'));
const FinanzanalysePage = React.lazy(() => import('@/pages/portal/FinanzanalysePage'));
const PhotovoltaikPage = React.lazy(() => import('@/pages/portal/PhotovoltaikPage'));
const MietyPortalPage = React.lazy(() => import('@/pages/portal/MietyPortalPage'));
const AreaOverviewPage = React.lazy(() => import('@/pages/portal/AreaOverviewPage'));
const ArmstrongInfoPage = React.lazy(() => import('@/pages/portal/ArmstrongInfoPage'));
const RepairSortContainersPage = React.lazy(() => import('@/pages/portal/RepairSortContainersPage'));

// =============================================================================
// Module Page Map
// =============================================================================
const portalModulePageMap: Record<string, React.LazyExoticComponent<React.ComponentType> | React.ComponentType> = {
  dashboard: PortalDashboard,
  stammdaten: StammdatenPage,
  office: OfficePage,
  dms: DMSPage,
  immobilien: ImmobilienPage,
  verkauf: VerkaufPage,
  finanzierung: FinanzierungPage,
  finanzierungsmanager: FinanzierungsmanagerPage,
  investments: InvestmentsPage,
  vertriebspartner: VertriebspartnerPage,
  'lead-manager': LeadManagerPage,
  'akquise-manager': AkquiseManagerPage,
  projekte: ProjektePage,
  'communication-pro': CommunicationProPage,
  fortbildung: FortbildungPage,
  services: ServicesPage,
  cars: CarsPage,
  finanzanalyse: FinanzanalysePage,
  photovoltaik: PhotovoltaikPage,
  miety: MietyPortalPage,
  pets: React.lazy(() => import('@/pages/portal/PetsPage')),
  petmanager: React.lazy(() => import('@/pages/portal/PetManagerPage')),
  'ki-browser': React.lazy(() => import('@/pages/portal/KiBrowserPage')),
};

// =============================================================================
// ZONE 2 ROUTER
// =============================================================================
export default function Zone2Router() {
  return (
    <Routes>
      <Route path="/" element={<PortalLayout />}>
        {/* Portal Index shows Dashboard */}
        <Route index element={<PortalDashboard />} />

        {/* Area Overview Pages */}
        <Route path="area/:areaKey" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <AreaOverviewPage />
          </React.Suspense>
        } />

        {/* Armstrong Info Page */}
        <Route path="armstrong" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <ArmstrongInfoPage />
          </React.Suspense>
        } />

        {/* Module Routes */}
        {Object.entries(zone2Portal.modules || {}).map(([code, module]) => {
          const ModulePage = portalModulePageMap[module.base];
          if (!ModulePage) {
            console.warn(`Missing module page for: ${module.base}`);
            return null;
          }

          return (
            <Route 
              key={code} 
              path={`${module.base}/*`}
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <ModulePage />
                </React.Suspense>
              } 
            />
          );
        })}

        {/* Repair page */}
        <Route path="repair-sort-containers" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <RepairSortContainersPage />
          </React.Suspense>
        } />

        {/* Legacy redirects handled by legacyRoutes in routesManifest.ts (leads→lead-manager, provisionen→lead-manager) */}
      </Route>
    </Routes>
  );
}
