/**
 * MANIFEST ROUTER — Route generation from SSOT manifest
 * 
 * This component generates all Routes from the manifest.
 * App.tsx should only define special routes and delegate everything else here.
 * 
 * P0 FIX: Now generates EXPLICIT child routes for:
 * - Module tiles (path: "<tile.path>")
 * - Dynamic routes (path: "<dynamic.path>")
 * - Index redirects (to default tile)
 * 
 * NO ROUTE EXISTS UNLESS DECLARED IN routesManifest.ts
 */

import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { PathNormalizer } from './PathNormalizer';

// =============================================================================
// LEGACY REDIRECT COMPONENT — Preserves dynamic parameters
// =============================================================================
function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const location = useLocation();
  
  // Replace all param placeholders with actual values
  let redirectPath = to;
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      redirectPath = redirectPath.replace(`:${key}`, value);
    }
  });
  
  // Handle wildcard params (e.g., /portfolio/:id/* → keep extra path segments)
  if (params['*']) {
    redirectPath = redirectPath.endsWith('/') 
      ? `${redirectPath}${params['*']}`
      : `${redirectPath}/${params['*']}`;
  }
  
  // Preserve query string and hash
  const fullPath = `${redirectPath}${location.search}${location.hash}`;
  
  return <Navigate to={fullPath} replace />;
}

// Manifests
import {
  zone1Admin,
  zone2Portal,
  zone3Websites,
  legacyRoutes,
  type ModuleDefinition,
} from '@/manifests/routesManifest';

// Zone 1: Admin Portal Components
import { AdminLayout } from '@/components/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Organizations from '@/pages/admin/Organizations';
import OrganizationDetail from '@/pages/admin/OrganizationDetail';
import Users from '@/pages/admin/Users';
import Delegations from '@/pages/admin/Delegations';
import Support from '@/pages/admin/Support';
import MasterContacts from '@/pages/admin/MasterContacts';
import TileCatalog from '@/pages/admin/TileCatalog';
import Integrations from '@/pages/admin/Integrations';
import CommunicationHub from '@/pages/admin/CommunicationHub';
import Oversight from '@/pages/admin/Oversight';
import AuditLog from '@/pages/admin/AuditLog';
import AdminKiOfficeEmail from '@/pages/admin/ki-office/AdminKiOfficeEmail';
import AdminKiOfficeKontakte from '@/pages/admin/ki-office/AdminKiOfficeKontakte';
import AdminKiOfficeDashboard from '@/pages/admin/ki-office/AdminKiOfficeDashboard';
import AdminKiOfficeSequenzen from '@/pages/admin/ki-office/AdminKiOfficeSequenzen';
import AdminKiOfficeTemplates from '@/pages/admin/ki-office/AdminKiOfficeTemplates';
import AdminKiOfficeRecherche from '@/pages/admin/ki-office/AdminKiOfficeRecherche';

import Agreements from '@/pages/admin/Agreements';
import Inbox from '@/pages/admin/Inbox';
import LeadPool from '@/pages/admin/LeadPool';
import PartnerVerification from '@/pages/admin/PartnerVerification';
import CommissionApproval from '@/pages/admin/CommissionApproval';
import MasterTemplates from '@/pages/admin/MasterTemplates';
import MasterTemplatesImmobilienakte from '@/pages/admin/MasterTemplatesImmobilienakte';
import MasterTemplatesSelbstauskunft from '@/pages/admin/MasterTemplatesSelbstauskunft';
import MasterTemplatesProjektakte from '@/pages/admin/MasterTemplatesProjektakte';
import AdminFutureRoomLayout from '@/pages/admin/futureroom/FutureRoomLayout';
import { AdminStubPage } from '@/pages/admin/stub';
import { SalesDesk, FinanceDesk, Acquiary, Agents } from '@/pages/admin/desks';

// Zone 2: User Portal Layout & Dashboard
import { PortalLayout } from '@/components/portal/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';

// Zone 2: Module Page Components (Lazy loaded)
// These handle the "How It Works" landing and tile routing internally

// Zone 2: Dynamic Route Components
const PropertyDetailPage = React.lazy(() => import('@/pages/portal/immobilien/PropertyDetailPage'));
const RentalExposeDetail = React.lazy(() => import('@/pages/portal/msv/RentalExposeDetail'));
const ExposeDetail = React.lazy(() => import('@/pages/portal/verkauf/ExposeDetail'));
const AnfrageDetailPage = React.lazy(() => import('@/pages/portal/finanzierung/AnfrageDetailPage'));
const FMFallDetail = React.lazy(() => import('@/pages/portal/finanzierungsmanager/FMFallDetail'));

// Zone 2: Module Pages (with internal routing)
const StammdatenPage = React.lazy(() => import('@/pages/portal/StammdatenPage'));
const OfficePage = React.lazy(() => import('@/pages/portal/OfficePage'));
const DMSPage = React.lazy(() => import('@/pages/portal/DMSPage'));
const ImmobilienPage = React.lazy(() => import('@/pages/portal/ImmobilienPage'));
const MSVPage = React.lazy(() => import('@/pages/portal/MSVPage'));
const VerkaufPage = React.lazy(() => import('@/pages/portal/VerkaufPage'));
const FinanzierungPage = React.lazy(() => import('@/pages/portal/FinanzierungPage'));
const FinanzierungsmanagerPage = React.lazy(() => import('@/pages/portal/FinanzierungsmanagerPage'));
const InvestmentsPage = React.lazy(() => import('@/pages/portal/InvestmentsPage'));
const VertriebspartnerPage = React.lazy(() => import('@/pages/portal/VertriebspartnerPage'));
const LeadsPage = React.lazy(() => import('@/pages/portal/LeadsPage'));
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

// Zone 3: Kaufy Website
import KaufyLayout from '@/pages/zone3/kaufy/KaufyLayout';
import KaufyHome from '@/pages/zone3/kaufy/KaufyHome';
import KaufyVermieter from '@/pages/zone3/kaufy/KaufyVermieter';
import KaufyVerkaeufer from '@/pages/zone3/kaufy/KaufyVerkaeufer';
import KaufyVertrieb from '@/pages/zone3/kaufy/KaufyVertrieb';
import KaufyBeratung from '@/pages/zone3/kaufy/KaufyBeratung';
import KaufyMeety from '@/pages/zone3/kaufy/KaufyMeety';
import KaufyModule from '@/pages/zone3/kaufy/KaufyModule';
import KaufyModuleDetail from '@/pages/zone3/kaufy/KaufyModuleDetail';

import KaufyExpose from '@/pages/zone3/kaufy/KaufyExpose';
import KaufyBerater from '@/pages/zone3/kaufy/KaufyBerater';
import KaufyAnbieter from '@/pages/zone3/kaufy/KaufyAnbieter';
import KaufyFAQ from '@/pages/zone3/kaufy/KaufyFAQ';

// Zone 3: Miety Website
import MietyLayout from '@/pages/zone3/miety/MietyLayout';
import MietyHome from '@/pages/zone3/miety/MietyHome';
import MietyLeistungen from '@/pages/zone3/miety/MietyLeistungen';
import MietyVermieter from '@/pages/zone3/miety/MietyVermieter';
import MietyApp from '@/pages/zone3/miety/MietyApp';
import MietyPreise from '@/pages/zone3/miety/MietyPreise';
import MietySoFunktioniert from '@/pages/zone3/miety/MietySoFunktioniert';
import MietyKontakt from '@/pages/zone3/miety/MietyKontakt';
import MietyRegistrieren from '@/pages/zone3/miety/MietyRegistrieren';
import MietyInvite from '@/pages/zone3/miety/MietyInvite';

// Zone 3: FutureRoom Website
import FutureRoomLayout from '@/pages/zone3/futureroom/FutureRoomLayout';
import FutureRoomHome from '@/pages/zone3/futureroom/FutureRoomHome';
import FutureRoomBonitat from '@/pages/zone3/futureroom/FutureRoomBonitat';
import FutureRoomKarriere from '@/pages/zone3/futureroom/FutureRoomKarriere';
import FutureRoomFAQ from '@/pages/zone3/futureroom/FutureRoomFAQ';

// Zone 3: System of a Town Website
import SotLayout from '@/pages/zone3/sot/SotLayout';
import SotHome from '@/pages/zone3/sot/SotHome';
import SotProdukt from '@/pages/zone3/sot/SotProdukt';
import SotModule from '@/pages/zone3/sot/SotModule';
import SotModuleDetail from '@/pages/zone3/sot/SotModuleDetail';
import SotUseCases from '@/pages/zone3/sot/SotUseCases';
import SotPreise from '@/pages/zone3/sot/SotPreise';
import SotFAQ from '@/pages/zone3/sot/SotFAQ';

// 404
import NotFound from '@/pages/NotFound';

// =============================================================================
// Loading Fallback
// =============================================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// =============================================================================
// Component Map for Zone 1
// =============================================================================

// Armstrong Console Components (Zone 1 Governance)
import {
  ArmstrongDashboard,
  ArmstrongActions,
  ArmstrongLogs,
  ArmstrongKnowledge,
  ArmstrongBilling,
  ArmstrongPolicies,
  ArmstrongTestHarness,
} from '@/pages/admin/armstrong';
import ArmstrongIntegrations from '@/pages/admin/armstrong/ArmstrongIntegrations';

const adminComponentMap: Record<string, React.ComponentType> = {
  Dashboard,
  Organizations,
  OrganizationDetail,
  Users,
  Delegations,
  MasterContacts,
  MasterTemplates,
  MasterTemplatesImmobilienakte,
  MasterTemplatesSelbstauskunft,
  MasterTemplatesProjektakte,
  TileCatalog,
  Integrations,
  CommunicationHub,
  Oversight,
  AuditLog,
  AdminKiOfficeEmail,
  AdminKiOfficeKontakte,
  AdminKiOfficeDashboard,
  AdminKiOfficeSequenzen,
  AdminKiOfficeTemplates,
  AdminKiOfficeRecherche,
  
  Agreements,
  Inbox,
  LeadPool,
  PartnerVerification,
  CommissionApproval,
  AdminFutureRoomLayout,
  FutureRoomBanks: React.lazy(() => import('@/pages/admin/futureroom/FutureRoomBanks')),
  FutureRoomManagers: React.lazy(() => import('@/pages/admin/futureroom/FutureRoomManagers')),
  Support,
  
  // Armstrong Console (Zone 1 Governance Suite)
  ArmstrongDashboard,
  ArmstrongActions,
  ArmstrongLogs,
  ArmstrongKnowledge,
  ArmstrongBilling,
  ArmstrongPolicies,
  ArmstrongTestHarness,
  ArmstrongIntegrations,
};

// Zone 1 Desk Components with internal routing (FutureRoom uses explicit nested routes)
const adminDeskMap: Record<string, React.ComponentType> = {
  'sales-desk': SalesDesk,
  'finance-desk': FinanceDesk,
  acquiary: Acquiary,
  agents: Agents,
};

// Zone 1 FutureRoom Sub-Pages (lazy loaded for explicit nested routes)
const FutureRoomInbox = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomInbox'));
const FutureRoomZuweisung = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomZuweisung'));
const FutureRoomManagers = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomManagers'));
const FutureRoomBanks = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomBanks'));
const FutureRoomMonitoring = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomMonitoring'));

// =============================================================================
// Component Map for Zone 2 Module Pages (with internal routing)
// =============================================================================
const portalModulePageMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  stammdaten: StammdatenPage,
  office: OfficePage,
  dms: DMSPage,
  immobilien: ImmobilienPage,
  msv: MSVPage,
  verkauf: VerkaufPage,
  finanzierung: FinanzierungPage,
  finanzierungsmanager: FinanzierungsmanagerPage,
  investments: InvestmentsPage,
  vertriebspartner: VertriebspartnerPage,
  leads: LeadsPage,
  'akquise-manager': AkquiseManagerPage,
  projekte: ProjektePage,
  'communication-pro': CommunicationProPage,
  fortbildung: FortbildungPage,
  services: ServicesPage,
  cars: CarsPage,
  finanzanalyse: FinanzanalysePage,
  photovoltaik: PhotovoltaikPage,
  miety: MietyPortalPage,
};

// =============================================================================
// Component Map for Zone 2 Dynamic Routes
// =============================================================================
const portalDynamicComponentMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  PropertyDetail: PropertyDetailPage,
  PropertyDetailPage: PropertyDetailPage,
  CreatePropertyRedirect: React.lazy(() => import('@/pages/portal/immobilien/CreatePropertyRedirect')),
  RentalExposeDetail: RentalExposeDetail,
  ExposeDetail: ExposeDetail,
  AnfrageDetailPage: AnfrageDetailPage,
  FMFallDetail: FMFallDetail,
};

// =============================================================================
// Component Map for Zone 3 Kaufy
// =============================================================================
const kaufyComponentMap: Record<string, React.ComponentType> = {
  KaufyHome,
  KaufyVermieter,
  KaufyVerkaeufer,
  KaufyVertrieb,
  KaufyBeratung,
  KaufyMeety,
  KaufyModule,
  KaufyModuleDetail,
  KaufyExpose,
  KaufyBerater,
  KaufyAnbieter,
  KaufyFAQ,
};

// =============================================================================
// Component Map for Zone 3 Miety
// =============================================================================
const mietyComponentMap: Record<string, React.ComponentType> = {
  MietyHome,
  MietyLeistungen,
  MietyVermieter,
  MietyApp,
  MietyPreise,
  MietySoFunktioniert,
  MietyKontakt,
  MietyRegistrieren,
  MietyInvite,
};

// =============================================================================
// Component Map for Zone 3 FutureRoom
// =============================================================================
const futureroomComponentMap: Record<string, React.ComponentType> = {
  FutureRoomHome,
  FutureRoomBonitat,
  FutureRoomKarriere,
  FutureRoomFAQ,
};

// =============================================================================
// Component Map for Zone 3 SoT
// =============================================================================
const sotComponentMap: Record<string, React.ComponentType> = {
  SotHome,
  SotProdukt,
  SotModule,
  SotModuleDetail,
  SotUseCases,
  SotPreise,
  SotFAQ,
};

// =============================================================================
// Layout Map for Zone 3
// =============================================================================
const zone3LayoutMap: Record<string, React.ComponentType<{ children?: React.ReactNode }>> = {
  KaufyLayout,
  MietyLayout,
  FutureRoomLayout,
  SotLayout,
};

const zone3ComponentMaps: Record<string, Record<string, React.ComponentType>> = {
  kaufy: kaufyComponentMap,
  miety: mietyComponentMap,
  futureroom: futureroomComponentMap,
  sot: sotComponentMap,
};

// =============================================================================
// Helper: Get default tile path for a module
// =============================================================================
function getDefaultTilePath(module: ModuleDefinition): string {
  const defaultTile = module.tiles.find(t => t.default === true);
  return defaultTile?.path || module.tiles[0]?.path || '';
}

// =============================================================================
// MANIFEST ROUTER COMPONENT
// =============================================================================
export function ManifestRouter() {
  return (
    <PathNormalizer>
    <Routes>
      {/* ================================================================== */}
      {/* LEGACY REDIRECTS — Parameters preserved via LegacyRedirect component */}
      {/* ================================================================== */}
      {legacyRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<LegacyRedirect to={route.redirect_to} />}
        />
      ))}

      {/* ================================================================== */}
      {/* ZONE 1: ADMIN PORTAL */}
      {/* ================================================================== */}
      <Route path={zone1Admin.base} element={<AdminLayout />}>
        {/* ============================================================== */}
        {/* FUTUREROOM — Explicit Nested Routes (not desk pattern) */}
        {/* This prevents the flash→redirect→404 issue with mixed-case URLs */}
        {/* ============================================================== */}
        <Route path="futureroom" element={<AdminFutureRoomLayout />}>
          <Route index element={<Navigate to="inbox" replace />} />
          <Route path="inbox" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomInbox />
            </React.Suspense>
          } />
          <Route path="zuweisung" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomZuweisung />
            </React.Suspense>
          } />
          <Route path="finanzierungsmanager" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomManagers />
            </React.Suspense>
          } />
          <Route path="bankkontakte" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomBanks />
            </React.Suspense>
          } />
          <Route path="monitoring" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomMonitoring />
            </React.Suspense>
          } />
          {/* Catch-all for FutureRoom — redirect to inbox */}
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Route>

        {/* Admin Desk Routes with internal sub-routing (except FutureRoom) */}
        {Object.entries(adminDeskMap).map(([deskPath, DeskComponent]) => (
          <Route
            key={deskPath}
            path={`${deskPath}/*`}
            element={
              <React.Suspense fallback={<LoadingFallback />}>
                <DeskComponent />
              </React.Suspense>
            }
          />
        ))}
        
        {/* Standard Admin Routes */}
        {zone1Admin.routes?.map((route) => {
          // Skip desk routes (handled above)
          if (['futureroom', 'sales-desk', 'finance-desk', 'acquiary', 'agents'].some(desk => route.path.startsWith(desk))) {
            return null;
          }
          
          const Component = adminComponentMap[route.component];
          if (!Component) {
            console.warn(`Missing admin component: ${route.component}`);
            return null;
          }
          return (
            <Route
              key={route.path || 'index'}
              index={route.path === ''}
              path={route.path || undefined}
              element={
                <React.Suspense fallback={<LoadingFallback />}>
                  <Component />
                </React.Suspense>
              }
            />
          );
        })}
      </Route>

      {/* ================================================================== */}
      {/* ZONE 2: USER PORTAL */}
      {/* ================================================================== */}
      <Route path={zone2Portal.base} element={<PortalLayout />}>
        {/* Portal Index shows Dashboard */}
        <Route index element={<PortalDashboard />} />

        {/* Area Overview Pages */}
        <Route path="area/:areaKey" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <AreaOverviewPage />
          </React.Suspense>
        } />

        {/* Module Routes - Each module gets direct routing to ModulePage */}
        {/* ModulePage handles all internal routing via nested <Routes> */}
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
      </Route>

      {/* ================================================================== */}
      {/* ZONE 3: WEBSITES */}
      {/* ================================================================== */}
      {Object.entries(zone3Websites).map(([siteKey, site]) => {
        const Layout = zone3LayoutMap[site.layout];
        const componentMap = zone3ComponentMaps[siteKey];

        if (!Layout) {
          console.warn(`Missing layout: ${site.layout}`);
          return null;
        }

        return (
          <Route key={siteKey} path={site.base} element={<Layout />}>
            {site.routes.map((route) => {
              const Component = componentMap?.[route.component];
              if (!Component) {
                console.warn(`Missing component: ${route.component} for ${siteKey}`);
                return null;
              }
              return (
                <Route
                  key={route.path || 'index'}
                  index={route.path === ''}
                  path={route.path || undefined}
                  element={<Component />}
                />
              );
            })}
          </Route>
        );
      })}

      {/* ================================================================== */}
      {/* 404 FALLBACK */}
      {/* ================================================================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </PathNormalizer>
  );
}

export default ManifestRouter;
