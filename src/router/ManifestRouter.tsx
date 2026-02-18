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
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';
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

// Zone 1: Admin Portal Components (all lazy-loaded — admin-only, behind auth gates)
import { AdminLayout } from '@/components/admin/AdminLayout';
const Dashboard = React.lazy(() => import('@/pages/admin/Dashboard'));
const Organizations = React.lazy(() => import('@/pages/admin/Organizations'));
const OrganizationDetail = React.lazy(() => import('@/pages/admin/OrganizationDetail'));
const Users = React.lazy(() => import('@/pages/admin/Users'));
const Delegations = React.lazy(() => import('@/pages/admin/Delegations'));
const Support = React.lazy(() => import('@/pages/admin/Support'));
// MasterContacts removed (orphaned)
const RolesManagement = React.lazy(() => import('@/pages/admin/RolesManagement'));
const TileCatalog = React.lazy(() => import('@/pages/admin/TileCatalog'));
const Integrations = React.lazy(() => import('@/pages/admin/Integrations'));
// CommunicationHub removed (orphaned, demo-only)
const Oversight = React.lazy(() => import('@/pages/admin/Oversight'));
const AuditHub = React.lazy(() => import('@/pages/admin/audit/AuditHub'));
// KI Office — Consolidated 3 pages
const AdminRecherche = React.lazy(() => import('@/pages/admin/ki-office/AdminRecherche'));
const AdminKontaktbuch = React.lazy(() => import('@/pages/admin/ki-office/AdminKontaktbuch'));
const AdminEmailAgent = React.lazy(() => import('@/pages/admin/ki-office/AdminEmailAgent'));

const Agreements = React.lazy(() => import('@/pages/admin/Agreements'));
const PartnerVerification = React.lazy(() => import('@/pages/admin/PartnerVerification'));
const MasterTemplates = React.lazy(() => import('@/pages/admin/MasterTemplates'));
const MasterTemplatesImmobilienakte = React.lazy(() => import('@/pages/admin/MasterTemplatesImmobilienakte'));
const MasterTemplatesSelbstauskunft = React.lazy(() => import('@/pages/admin/MasterTemplatesSelbstauskunft'));
const MasterTemplatesProjektakte = React.lazy(() => import('@/pages/admin/MasterTemplatesProjektakte'));
const MasterTemplatesFahrzeugakte = React.lazy(() => import('@/pages/admin/MasterTemplatesFahrzeugakte'));
const MasterTemplatesPhotovoltaikakte = React.lazy(() => import('@/pages/admin/MasterTemplatesPhotovoltaikakte'));
const MasterTemplatesFinanzierungsakte = React.lazy(() => import('@/pages/admin/MasterTemplatesFinanzierungsakte'));
const AdminFutureRoomLayout = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomLayout'));
const AdminStubPage = React.lazy(() => import('@/pages/admin/stub').then(m => ({ default: m.AdminStubPage })));
const SalesDesk = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.SalesDesk })));
const FinanceDesk = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.FinanceDesk })));
const Acquiary = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.Acquiary })));
const LeadDeskComponent = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.LeadDesk })));
const ProjektDeskComponent = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.ProjektDesk })));

// Zone 2: User Portal Layout & Dashboard
import { PortalLayout } from '@/components/portal/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';

// Zone 2: Module Page Components (Lazy loaded)
// These handle the "How It Works" landing and tile routing internally

// Zone 2: Dynamic Route Components
const PropertyDetailPage = React.lazy(() => import('@/pages/portal/immobilien/PropertyDetailPage'));
const RentalExposeDetail = React.lazy(() => import('@/pages/portal/immobilien/RentalExposeDetail'));
const ExposeDetail = React.lazy(() => import('@/pages/portal/verkauf/ExposeDetail'));
const AnfrageDetailPage = React.lazy(() => import('@/pages/portal/finanzierung/AnfrageDetailPage'));
const FMFallDetail = React.lazy(() => import('@/pages/portal/finanzierungsmanager/FMFallDetail'));

// Zone 2: Module Pages (with internal routing)
const StammdatenPage = React.lazy(() => import('@/pages/portal/StammdatenPage'));
const OfficePage = React.lazy(() => import('@/pages/portal/OfficePage'));
const DMSPage = React.lazy(() => import('@/pages/portal/DMSPage'));
const ImmobilienPage = React.lazy(() => import('@/pages/portal/ImmobilienPage'));
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
const ArmstrongInfoPage = React.lazy(() => import('@/pages/portal/ArmstrongInfoPage'));

// Zone 3: Kaufy2026 Website (lazy loaded)
const Kaufy2026Layout = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Layout'));
const Kaufy2026Home = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Home'));
const Kaufy2026Expose = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Expose'));
const Kaufy2026Vermieter = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Vermieter'));
const Kaufy2026Verkaeufer = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Verkaeufer'));
const Kaufy2026Vertrieb = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Vertrieb'));


// Zone 3: FutureRoom Website (lazy loaded)
const FutureRoomLayout = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomLayout'));
const FutureRoomHome = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomHome'));
const FutureRoomBonitat = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomBonitat'));
const FutureRoomKarriere = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomKarriere'));
const FutureRoomFAQ = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomFAQ'));
const FutureRoomLogin = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomLogin'));
const FutureRoomAkte = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomAkte'));
// FutureRoomAuthGuard now handled by FutureRoomAkteGuarded (AUD-008)

// Zone 3: System of a Town Website (lazy loaded)
const SotLayout = React.lazy(() => import('@/pages/zone3/sot/SotLayout'));
const SotHome = React.lazy(() => import('@/pages/zone3/sot/SotHome'));
const SotPlattform = React.lazy(() => import('@/pages/zone3/sot/SotPlattform'));
const SotIntelligenz = React.lazy(() => import('@/pages/zone3/sot/SotIntelligenz'));
const SotModule = React.lazy(() => import('@/pages/zone3/sot/SotModule'));
const SotPreise = React.lazy(() => import('@/pages/zone3/sot/SotPreise'));
const SotDemo = React.lazy(() => import('@/pages/zone3/sot/SotDemo'));
const SotKarriere = React.lazy(() => import('@/pages/zone3/sot/SotKarriere'));
const SotFAQ = React.lazy(() => import('@/pages/zone3/sot/SotFAQ'));

// Zone 3: ACQUIARY Website (lazy loaded)
const AcquiaryLayout = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryLayout'));
const AcquiaryHome = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryHome'));
const AcquiaryMethodik = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryMethodik'));
const AcquiaryNetzwerk = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryNetzwerk'));
const AcquiaryKarriere = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryKarriere'));
const AcquiaryObjekt = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryObjekt'));

// Zone 3: Lennox & Friends Pet Service (lazy loaded)
const LennoxLayout = React.lazy(() => import('@/pages/zone3/lennox/LennoxLayout'));
const LennoxStartseite = React.lazy(() => import('@/pages/zone3/lennox/LennoxStartseite'));
const LennoxPartnerProfil = React.lazy(() => import('@/pages/zone3/lennox/LennoxPartnerProfil'));
const LennoxShop = React.lazy(() => import('@/pages/zone3/lennox/LennoxShop'));
const LennoxPartnerWerden = React.lazy(() => import('@/pages/zone3/lennox/LennoxPartnerWerden'));
const LennoxAuth = React.lazy(() => import('@/pages/zone3/lennox/LennoxAuth'));
const LennoxMeinBereich = React.lazy(() => import('@/pages/zone3/lennox/LennoxMeinBereich'));


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

// Armstrong Console Components (Zone 1 Governance — lazy loaded)
const ArmstrongDashboard = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongDashboard })));
const ArmstrongActions = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongActions })));
const ArmstrongLogs = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongLogs })));
const ArmstrongKnowledge = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongKnowledge })));
const ArmstrongBilling = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongBilling })));
const ArmstrongPolicies = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongPolicies })));
const ArmstrongTestHarness = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.ArmstrongTestHarness })));
const ArmstrongIntegrations = React.lazy(() => import('@/pages/admin/armstrong/ArmstrongIntegrations'));
const ArmstrongEngines = React.lazy(() => import('@/pages/admin/armstrong/ArmstrongEngines'));
const ArmstrongGoldenPaths = React.lazy(() => import('@/pages/admin/armstrong/ArmstrongGoldenPaths'));
const PlatformCostMonitor = React.lazy(() => import('@/pages/admin/armstrong').then(m => ({ default: m.PlatformCostMonitor })));

const adminComponentMap: Record<string, React.ComponentType> = {
  Dashboard,
  Organizations,
  OrganizationDetail,
  Users,
  Delegations,
  // MasterContacts removed
  MasterTemplates,
  MasterTemplatesImmobilienakte,
  MasterTemplatesSelbstauskunft,
  MasterTemplatesProjektakte,
  MasterTemplatesFahrzeugakte,
  MasterTemplatesPhotovoltaikakte,
  MasterTemplatesFinanzierungsakte,
  TileCatalog,
  Integrations,
  // CommunicationHub removed
  Oversight,
  AuditHub,
  // KI Office — Consolidated 3 pages
  AdminRecherche,
  AdminKontaktbuch,
  AdminEmailAgent,
  
  Agreements,
  PartnerVerification,
  RolesManagement,
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
  ArmstrongEngines,
  ArmstrongGoldenPaths,
  PlatformCostMonitor,
  // Social Media removed (100% demo data, no DB)
  // Landing Pages — consolidated into WebHostingDashboard
  // Fortbildung Management
  AdminFortbildung: React.lazy(() => import('@/pages/admin/AdminFortbildung')),
  // Website Hosting (MOD-05 Zone 1)
  WebHostingDashboard: React.lazy(() => import('@/pages/admin/website-hosting/WebHostingDashboard')),
  // New Desks
  LeadDeskDashboard: LeadDeskComponent,
  ProjektDeskDashboard: ProjektDeskComponent,
  PetDeskRouter: React.lazy(() => import('@/pages/admin/desks/PetmanagerDesk')),
  FinanceDeskDashboard: FinanceDesk,
  // WebHosting sub-routes removed (all pointed to same component)
};

// Zone 1 Desk Components with internal routing (FutureRoom uses explicit nested routes)
const adminDeskMap: Record<string, React.ComponentType> = {
  'sales-desk': SalesDesk,
  'finance-desk': FinanceDesk,
  acquiary: Acquiary,
  'projekt-desk': ProjektDeskComponent,
  'pet-desk': React.lazy(() => import('@/pages/admin/desks/PetmanagerDesk')) as unknown as React.ComponentType,
};

// Zone 1 FutureRoom Sub-Pages (lazy loaded for explicit nested routes)
const FutureRoomInbox = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomInbox'));
const FutureRoomZuweisung = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomZuweisung'));
const FutureRoomManagers = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomManagers'));
const FutureRoomBanks = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomBanks'));
const FutureRoomMonitoring = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomMonitoring'));
const FutureRoomTemplates = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomTemplates'));
const FutureRoomWebLeads = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomWebLeads'));
const FutureRoomContracts = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomContracts'));

// =============================================================================
// Component Map for Zone 2 Module Pages (with internal routing)
// =============================================================================
// PortalDashboard is imported statically (line 94) — used directly in portalModulePageMap to avoid duplicate import warning

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
  provisionen: LeadsPage,
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
// Component Map for Zone 3 Kaufy2026
// =============================================================================
const kaufy2026ComponentMap: Record<string, React.ComponentType> = {
  Kaufy2026Home,
  Kaufy2026Expose,
  Kaufy2026Vermieter,
  Kaufy2026Verkaeufer,
  Kaufy2026Vertrieb,
};


// =============================================================================
// Component Map for Zone 3 FutureRoom
// =============================================================================
const futureroomComponentMap: Record<string, React.ComponentType> = {
  FutureRoomHome,
  FutureRoomBonitat,
  FutureRoomKarriere,
  FutureRoomFAQ,
  FutureRoomLogin,
  FutureRoomAkte: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomAkteGuarded')),
};

// =============================================================================
// Component Map for Zone 3 SoT
// =============================================================================
const sotComponentMap: Record<string, React.ComponentType> = {
  SotHome,
  SotPlattform,
  SotIntelligenz,
  SotModule: React.lazy(() => import('@/pages/zone3/sot/SotModule')),
  SotPreise,
  SotDemo,
  SotKarriere,
  SotFAQ,
};

// =============================================================================
// Component Map for Zone 3 ACQUIARY
// =============================================================================
const acquiaryComponentMap: Record<string, React.ComponentType> = {
  AcquiaryHome,
  AcquiaryMethodik,
  AcquiaryNetzwerk,
  AcquiaryKarriere,
  AcquiaryObjekt,
};

// =============================================================================
// Layout Map for Zone 3
// =============================================================================
const zone3LayoutMap: Record<string, React.ComponentType<{ children?: React.ReactNode }>> = {
  Kaufy2026Layout,
  FutureRoomLayout,
  SotLayout,
  AcquiaryLayout,
  LennoxLayout,
};

const zone3ComponentMaps: Record<string, Record<string, React.ComponentType>> = {
  kaufy: kaufy2026ComponentMap,
  futureroom: futureroomComponentMap,
  sot: sotComponentMap,
  acquiary: acquiaryComponentMap,
  lennox: {
    LennoxStartseite,
    LennoxPartnerProfil,
    LennoxShop,
    LennoxPartnerWerden,
    LennoxAuth,
    LennoxMeinBereich,
  },
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
        <Route path="futureroom" element={<React.Suspense fallback={<LoadingFallback />}><AdminFutureRoomLayout /></React.Suspense>}>
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
          <Route path="vorlagen" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomTemplates />
            </React.Suspense>
          } />
          <Route path="website-leads" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomWebLeads />
            </React.Suspense>
          } />
          <Route path="contracts" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <FutureRoomContracts />
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
          if (['futureroom', 'sales-desk', 'finance-desk', 'acquiary', 'projekt-desk'].some(desk => route.path.startsWith(desk))) {
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

        {/* Armstrong Info Page (internal) */}
        <Route path="armstrong" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <ArmstrongInfoPage />
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

        {/* Legacy redirect: /portal/leads → /portal/provisionen */}
        <Route path="leads/*" element={<Navigate to="/portal/provisionen" replace />} />
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
          <Route key={siteKey} path={site.base} element={
            <React.Suspense fallback={<LoadingFallback />}>
              <Layout />
            </React.Suspense>
          }>
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
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <Component />
                    </React.Suspense>
                  }
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
