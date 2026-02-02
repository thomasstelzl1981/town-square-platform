/**
 * MANIFEST ROUTER — Route generation from SSOT manifest
 * 
 * This component generates all Routes from the manifest.
 * App.tsx should only define special routes and delegate everything else here.
 * 
 * NO ROUTE EXISTS UNLESS DECLARED IN routesManifest.ts
 */

import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';

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
import Billing from '@/pages/admin/Billing';
import Agreements from '@/pages/admin/Agreements';
import Inbox from '@/pages/admin/Inbox';
import LeadPool from '@/pages/admin/LeadPool';
import PartnerVerification from '@/pages/admin/PartnerVerification';
import CommissionApproval from '@/pages/admin/CommissionApproval';
import MasterTemplates from '@/pages/admin/MasterTemplates';
import FutureRoom from '@/pages/admin/FutureRoom';
import { AdminStubPage } from '@/pages/admin/stub';
import { SalesDesk, FinanceDesk, Acquiary, Agents } from '@/pages/admin/desks';

// Zone 2: User Portal Layout & Dashboard
import { PortalLayout } from '@/components/portal/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';

// Zone 2: Module Pages (existing)
import StammdatenPage from '@/pages/portal/StammdatenPage';
import OfficePage from '@/pages/portal/OfficePage';
import DMSPage from '@/pages/portal/DMSPage';
import ImmobilienPage from '@/pages/portal/ImmobilienPage';
import MSVPage from '@/pages/portal/MSVPage';
import VerkaufPage from '@/pages/portal/VerkaufPage';
import FinanzierungPage from '@/pages/portal/FinanzierungPage';
import FinanzierungsmanagerPage from '@/pages/portal/FinanzierungsmanagerPage';
import InvestmentsPage from '@/pages/portal/InvestmentsPage';
import VertriebspartnerPage from '@/pages/portal/VertriebspartnerPage';
import LeadsPage from '@/pages/portal/LeadsPage';

// Zone 2: NEW Module Pages (MOD-12 to MOD-20)
import AkquiseManagerPage from '@/pages/portal/AkquiseManagerPage';
import ProjektePage from '@/pages/portal/ProjektePage';
import CommunicationProPage from '@/pages/portal/CommunicationProPage';
import FortbildungPage from '@/pages/portal/FortbildungPage';
import ServicesPage from '@/pages/portal/ServicesPage';
import CarsPage from '@/pages/portal/CarsPage';
import FinanzanalysePage from '@/pages/portal/FinanzanalysePage';
import PhotovoltaikPage from '@/pages/portal/PhotovoltaikPage';
import MietyPortalPage from '@/pages/portal/MietyPortalPage';

// Zone 2: Dynamic Route Components
import PropertyDetail from '@/pages/portfolio/PropertyDetail';
import PropertyForm from '@/pages/portfolio/PropertyForm';
import ExposeVorlage from '@/pages/portfolio/ExposeVorlage';
import RentalExposeDetail from '@/pages/portal/msv/RentalExposeDetail';
import { ExposeDetail } from '@/pages/portal/verkauf';

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
import KaufyImmobilien from '@/pages/zone3/kaufy/KaufyImmobilien';
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
// Component Map for Zone 1
// =============================================================================
const adminComponentMap: Record<string, React.ComponentType> = {
  Dashboard,
  Organizations,
  OrganizationDetail,
  Users,
  Delegations,
  MasterContacts,
  MasterTemplates,
  TileCatalog,
  Integrations,
  CommunicationHub,
  Oversight,
  AuditLog,
  Billing,
  Agreements,
  Inbox,
  LeadPool,
  PartnerVerification,
  CommissionApproval,
  FutureRoom,
  FutureRoomBanks: React.lazy(() => import('@/pages/admin/futureroom/FutureRoomBanks')),
  FutureRoomManagers: React.lazy(() => import('@/pages/admin/futureroom/FutureRoomManagers')),
  Support,
};

// Zone 1 Desk Components with internal routing
const adminDeskMap: Record<string, React.ComponentType> = {
  'sales-desk': SalesDesk,
  'finance-desk': FinanceDesk,
  acquiary: Acquiary,
  agents: Agents,
};

// =============================================================================
// Component Map for Zone 2 Module Pages
// =============================================================================
const portalModulePageMap: Record<string, React.ComponentType> = {
  // Existing modules (MOD-01 to MOD-11)
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
  // NEW modules (MOD-12 to MOD-20)
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
const portalDynamicComponentMap: Record<string, React.ComponentType> = {
  PropertyForm,
  PropertyDetail,
  ExposeVorlage,
  RentalExposeDetail,
  ExposeDetail,
  // MOD-07 Finanzierung Dynamic
  AnfrageDetailPage: React.lazy(() => import('@/pages/portal/finanzierung/AnfrageDetailPage')),
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
  KaufyImmobilien,
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
// MANIFEST ROUTER COMPONENT
// =============================================================================
export function ManifestRouter() {
  return (
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
        {/* Admin Desk Routes with internal sub-routing */}
        {Object.entries(adminDeskMap).map(([deskPath, DeskComponent]) => (
          <Route
            key={deskPath}
            path={`${deskPath}/*`}
            element={
              <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Laden...</div>}>
                <DeskComponent />
              </React.Suspense>
            }
          />
        ))}
        
        {/* Standard Admin Routes */}
        {zone1Admin.routes?.map((route) => {
          // Skip desk routes (handled above)
          if (['sales-desk', 'finance-desk', 'acquiary', 'agents'].some(desk => route.path.startsWith(desk))) {
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
                <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Laden...</div>}>
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
        {/* Dashboard */}
        <Route index element={<PortalDashboard />} />

        {/* Module Routes */}
        {Object.entries(zone2Portal.modules || {}).map(([code, module]) => {
          const ModulePage = portalModulePageMap[module.base];
          if (!ModulePage) {
            console.warn(`Missing module page for: ${module.base}`);
            return null;
          }

          return (
            <Route key={code} path={`${module.base}/*`} element={<ModulePage />} />
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
  );
}

export default ManifestRouter;
