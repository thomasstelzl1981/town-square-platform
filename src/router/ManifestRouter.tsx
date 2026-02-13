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
const MasterContacts = React.lazy(() => import('@/pages/admin/MasterContacts'));
const RolesManagement = React.lazy(() => import('@/pages/admin/RolesManagement'));
const TileCatalog = React.lazy(() => import('@/pages/admin/TileCatalog'));
const Integrations = React.lazy(() => import('@/pages/admin/Integrations'));
const CommunicationHub = React.lazy(() => import('@/pages/admin/CommunicationHub'));
const Oversight = React.lazy(() => import('@/pages/admin/Oversight'));
const AuditLog = React.lazy(() => import('@/pages/admin/AuditLog'));
const AuditHub = React.lazy(() => import('@/pages/admin/audit/AuditHub'));
const AdminKiOfficeEmail = React.lazy(() => import('@/pages/admin/ki-office/AdminKiOfficeEmail'));
const AdminKiOfficeKontakte = React.lazy(() => import('@/pages/admin/ki-office/AdminKiOfficeKontakte'));
const AdminKiOfficeDashboard = React.lazy(() => import('@/pages/admin/ki-office/AdminKiOfficeDashboard'));
const AdminKiOfficeSequenzen = React.lazy(() => import('@/pages/admin/ki-office/AdminKiOfficeSequenzen'));
const AdminKiOfficeTemplates = React.lazy(() => import('@/pages/admin/ki-office/AdminKiOfficeTemplates'));
const AdminKiOfficeRecherche = React.lazy(() => import('@/pages/admin/ki-office/AdminKiOfficeRecherche'));

const Agreements = React.lazy(() => import('@/pages/admin/Agreements'));
const Inbox = React.lazy(() => import('@/pages/admin/Inbox'));
const LeadPool = React.lazy(() => import('@/pages/admin/LeadPool'));
const PartnerVerification = React.lazy(() => import('@/pages/admin/PartnerVerification'));
const CommissionApproval = React.lazy(() => import('@/pages/admin/CommissionApproval'));
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
const Agents = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.Agents })));

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

// Zone 3: Kaufy2026 Website (lazy loaded)
const Kaufy2026Layout = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Layout'));
const Kaufy2026Home = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Home'));
const Kaufy2026Expose = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Expose'));
const Kaufy2026Vermieter = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Vermieter'));
const Kaufy2026Verkaeufer = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Verkaeufer'));
const Kaufy2026Vertrieb = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Vertrieb'));

// Zone 3: Miety Website (lazy loaded)
const MietyLayout = React.lazy(() => import('@/pages/zone3/miety/MietyLayout'));
const MietyHome = React.lazy(() => import('@/pages/zone3/miety/MietyHome'));
const MietyLeistungen = React.lazy(() => import('@/pages/zone3/miety/MietyLeistungen'));
const MietyVermieter = React.lazy(() => import('@/pages/zone3/miety/MietyVermieter'));
const MietyApp = React.lazy(() => import('@/pages/zone3/miety/MietyApp'));
const MietyPreise = React.lazy(() => import('@/pages/zone3/miety/MietyPreise'));
const MietySoFunktioniert = React.lazy(() => import('@/pages/zone3/miety/MietySoFunktioniert'));
const MietyKontakt = React.lazy(() => import('@/pages/zone3/miety/MietyKontakt'));
const MietyRegistrieren = React.lazy(() => import('@/pages/zone3/miety/MietyRegistrieren'));
const MietyInvite = React.lazy(() => import('@/pages/zone3/miety/MietyInvite'));

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
const SotProdukt = React.lazy(() => import('@/pages/zone3/sot/SotProdukt'));
const SotModule = React.lazy(() => import('@/pages/zone3/sot/SotModule'));
const SotModuleDetail = React.lazy(() => import('@/pages/zone3/sot/SotModuleDetail'));
const SotUseCases = React.lazy(() => import('@/pages/zone3/sot/SotUseCases'));
const SotPreise = React.lazy(() => import('@/pages/zone3/sot/SotPreise'));
const SotDemo = React.lazy(() => import('@/pages/zone3/sot/SotDemo'));
const SotFAQ = React.lazy(() => import('@/pages/zone3/sot/SotFAQ'));

// Zone 3: ACQUIARY Website (lazy loaded)
const AcquiaryLayout = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryLayout'));
const AcquiaryHome = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryHome'));
const AcquiaryMethodik = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryMethodik'));
const AcquiaryNetzwerk = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryNetzwerk'));
const AcquiaryKarriere = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryKarriere'));
const AcquiaryObjekt = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryObjekt'));

// Zone 3: Projekt Landing Pages (lazy loaded)
const ProjektLandingLayout = React.lazy(() => import('@/pages/zone3/projekt/ProjektLandingLayout'));
const ProjektLandingPage = React.lazy(() => import('@/pages/zone3/projekt/ProjektLandingPage'));

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
  MasterTemplatesFahrzeugakte,
  MasterTemplatesPhotovoltaikakte,
  MasterTemplatesFinanzierungsakte,
  TileCatalog,
  Integrations,
  CommunicationHub,
  Oversight,
  AuditLog,
  AuditHub,
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
  // Social Media (Zone 1)
  SocialMediaDashboard: React.lazy(() => import('@/pages/admin/social-media/SocialMediaDashboard')),
  SocialMediaKampagnen: React.lazy(() => import('@/pages/admin/social-media/SocialMediaKampagnen')),
  SocialMediaCreator: React.lazy(() => import('@/pages/admin/social-media/SocialMediaCreator')),
  SocialMediaVertrieb: React.lazy(() => import('@/pages/admin/social-media/SocialMediaVertrieb')),
  SocialMediaVertriebDetail: React.lazy(() => import('@/pages/admin/social-media/SocialMediaVertriebDetail')),
  SocialMediaLeads: React.lazy(() => import('@/pages/admin/social-media/SocialMediaLeads')),
  SocialMediaTemplates: React.lazy(() => import('@/pages/admin/social-media/SocialMediaTemplates')),
  SocialMediaAbrechnung: React.lazy(() => import('@/pages/admin/social-media/SocialMediaAbrechnung')),
  // Landing Pages
  AdminLandingPages: React.lazy(() => import('@/pages/admin/AdminLandingPages')),
  // Fortbildung Management
  AdminFortbildung: React.lazy(() => import('@/pages/admin/AdminFortbildung')),
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
const FutureRoomTemplates = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomTemplates'));
const FutureRoomWebLeads = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomWebLeads'));
const FutureRoomContracts = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomContracts'));

// =============================================================================
// Component Map for Zone 2 Module Pages (with internal routing)
// =============================================================================
const DashboardPage = React.lazy(() => import('@/pages/portal/PortalDashboard'));

const portalModulePageMap: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: DashboardPage,
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
  FutureRoomLogin,
  FutureRoomAkte: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomAkteGuarded')),
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
  SotDemo,
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
  MietyLayout,
  FutureRoomLayout,
  SotLayout,
  AcquiaryLayout,
  ProjektLandingLayout,
};

const zone3ComponentMaps: Record<string, Record<string, React.ComponentType>> = {
  kaufy: kaufy2026ComponentMap,
  miety: mietyComponentMap,
  futureroom: futureroomComponentMap,
  sot: sotComponentMap,
  acquiary: acquiaryComponentMap,
  projekt: { ProjektLandingPage },
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
