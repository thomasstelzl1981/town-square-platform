/**
 * ZONE 1 ROUTER — Admin Portal Routes
 * 
 * Extracted from ManifestRouter.tsx for code-splitting.
 * Only loaded when visiting /admin/* paths.
 */

import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { zone1Admin } from '@/manifests/routesManifest';
import { AdminLayout } from '@/components/admin/AdminLayout';

// =============================================================================
// Loading Fallback
// =============================================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// =============================================================================
// Zone 1: Admin Portal Components (all lazy-loaded)
// =============================================================================
const Dashboard = React.lazy(() => import('@/pages/admin/Dashboard'));
const Organizations = React.lazy(() => import('@/pages/admin/Organizations'));
const OrganizationDetail = React.lazy(() => import('@/pages/admin/OrganizationDetail'));
const Users = React.lazy(() => import('@/pages/admin/Users'));
const Delegations = React.lazy(() => import('@/pages/admin/Delegations'));
const Support = React.lazy(() => import('@/pages/admin/Support'));
const RolesManagement = React.lazy(() => import('@/pages/admin/RolesManagement'));
const TileCatalog = React.lazy(() => import('@/pages/admin/TileCatalog'));
const Integrations = React.lazy(() => import('@/pages/admin/Integrations'));
const Oversight = React.lazy(() => import('@/pages/admin/Oversight'));
const AuditHub = React.lazy(() => import('@/pages/admin/audit/AuditHub'));
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
const MasterTemplatesVersicherungsakte = React.lazy(() => import('@/pages/admin/MasterTemplatesVersicherungsakte'));
const MasterTemplatesVorsorgeakte = React.lazy(() => import('@/pages/admin/MasterTemplatesVorsorgeakte'));
const MasterTemplatesPersonenakte = React.lazy(() => import('@/pages/admin/MasterTemplatesPersonenakte'));
const MasterTemplatesHaustierakte = React.lazy(() => import('@/pages/admin/MasterTemplatesHaustierakte'));
const AdminFutureRoomLayout = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomLayout'));
const AdminStubPage = React.lazy(() => import('@/pages/admin/stub').then(m => ({ default: m.AdminStubPage })));
const SalesDesk = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.SalesDesk })));
const FinanceDesk = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.FinanceDesk })));
const Acquiary = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.Acquiary })));
const LeadDeskComponent = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.LeadDesk })));
const ProjektDeskComponent = React.lazy(() => import('@/pages/admin/desks').then(m => ({ default: m.ProjektDesk })));

// Armstrong Console Components
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
const PlatformHealth = React.lazy(() => import('@/pages/admin/armstrong/PlatformHealth'));
const WeeklyReview = React.lazy(() => import('@/pages/admin/armstrong/WeeklyReview'));

// Ncore + Otto Desks
const NcoreDesk = React.lazy(() => import('@/pages/admin/desks/NcoreDesk'));
const OttoDesk = React.lazy(() => import('@/pages/admin/desks/OttoDesk'));

// FutureRoom Sub-Pages
const FutureRoomInbox = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomInbox'));
const FutureRoomZuweisung = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomZuweisung'));
const FutureRoomManagers = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomManagers'));
const FutureRoomBanks = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomBanks'));
const FutureRoomMonitoring = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomMonitoring'));
const FutureRoomTemplates = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomTemplates'));
const FutureRoomWebLeads = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomWebLeads'));
const FutureRoomContracts = React.lazy(() => import('@/pages/admin/futureroom/FutureRoomContracts'));

// =============================================================================
// Component Maps
// =============================================================================
const adminComponentMap: Record<string, React.ComponentType> = {
  Dashboard,
  Organizations,
  OrganizationDetail,
  Users,
  Delegations,
  MasterTemplates,
  MasterTemplatesImmobilienakte,
  MasterTemplatesSelbstauskunft,
  MasterTemplatesProjektakte,
  MasterTemplatesFahrzeugakte,
  MasterTemplatesPhotovoltaikakte,
  MasterTemplatesFinanzierungsakte,
  MasterTemplatesVersicherungsakte,
  MasterTemplatesVorsorgeakte,
  MasterTemplatesPersonenakte,
  MasterTemplatesHaustierakte,
  TileCatalog,
  Integrations,
  Oversight,
  AuditHub,
  AdminRecherche,
  AdminKontaktbuch,
  AdminEmailAgent,
  Agreements,
  PartnerVerification,
  ManagerFreischaltung: React.lazy(() => import('@/pages/admin/ManagerFreischaltung')),
  RolesManagement,
  AdminFutureRoomLayout,
  FutureRoomBanks: React.lazy(() => import('@/pages/admin/futureroom/FutureRoomBanks')),
  FutureRoomManagers: React.lazy(() => import('@/pages/admin/futureroom/FutureRoomManagers')),
  Support,
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
  PlatformHealth,
  WeeklyReview,
  AdminFortbildung: React.lazy(() => import('@/pages/admin/AdminFortbildung')),
  ServiceDeskRouter: React.lazy(() => import('@/pages/admin/service-desk/ServiceDeskRouter')),
  ComplianceDeskRouter: React.lazy(() => import('@/pages/admin/compliance/ComplianceDeskRouter')),
  LeadDeskDashboard: LeadDeskComponent,
  ProjektDeskDashboard: ProjektDeskComponent,
  PetDeskRouter: React.lazy(() => import('@/pages/admin/desks/PetmanagerDesk')),
  FinanceDeskDashboard: FinanceDesk,
};

const CommProDesk = React.lazy(() => import('@/pages/admin/desks/CommProDesk'));

const adminDeskMap: Record<string, React.ComponentType> = {
  'sales-desk': SalesDesk,
  'finance-desk': FinanceDesk,
  acquiary: Acquiary,
  'lead-desk': LeadDeskComponent,
  'projekt-desk': ProjektDeskComponent,
  'pet-desk': React.lazy(() => import('@/pages/admin/desks/PetmanagerDesk')) as unknown as React.ComponentType,
  'service-desk': React.lazy(() => import('@/pages/admin/service-desk/ServiceDeskRouter')) as unknown as React.ComponentType,
  'ncore-desk': NcoreDesk as unknown as React.ComponentType,
  'otto-desk': OttoDesk as unknown as React.ComponentType,
  'commpro-desk': CommProDesk as unknown as React.ComponentType,
};

const DESK_PREFIXES = ['futureroom', 'sales-desk', 'finance-desk', 'acquiary', 'projekt-desk', 'pet-desk', 'lead-desk', 'service-desk', 'ncore-desk', 'otto-desk', 'commpro-desk'];

// =============================================================================
// ZONE 1 ROUTER
// =============================================================================
export default function Zone1Router() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* FutureRoom — Explicit Nested Routes */}
        <Route path="futureroom" element={<React.Suspense fallback={<LoadingFallback />}><AdminFutureRoomLayout /></React.Suspense>}>
          <Route index element={<Navigate to="inbox" replace />} />
          <Route path="inbox" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomInbox /></React.Suspense>} />
          <Route path="zuweisung" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomZuweisung /></React.Suspense>} />
          <Route path="finanzierungsmanager" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomManagers /></React.Suspense>} />
          <Route path="bankkontakte" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomBanks /></React.Suspense>} />
          <Route path="monitoring" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomMonitoring /></React.Suspense>} />
          <Route path="vorlagen" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomTemplates /></React.Suspense>} />
          <Route path="website-leads" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomWebLeads /></React.Suspense>} />
          <Route path="contracts" element={<React.Suspense fallback={<LoadingFallback />}><FutureRoomContracts /></React.Suspense>} />
          <Route path="*" element={<Navigate to="inbox" replace />} />
        </Route>

        {/* Admin Desk Routes */}
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
          if (DESK_PREFIXES.some(desk => route.path.startsWith(desk))) {
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
    </Routes>
  );
}
