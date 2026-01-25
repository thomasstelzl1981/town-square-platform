import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Zone 1: Admin Portal
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Organizations from "./pages/admin/Organizations";
import OrganizationDetail from "./pages/admin/OrganizationDetail";
import Users from "./pages/admin/Users";
import Delegations from "./pages/admin/Delegations";
import Support from "./pages/admin/Support";
import MasterContacts from "./pages/admin/MasterContacts";
import TileCatalog from "./pages/admin/TileCatalog";
import Integrations from "./pages/admin/Integrations";
import CommunicationHub from "./pages/admin/CommunicationHub";
import Oversight from "./pages/admin/Oversight";
import AuditLog from "./pages/admin/AuditLog";
import Billing from "./pages/admin/Billing";
import Agreements from "./pages/admin/Agreements";
import Inbox from "./pages/admin/Inbox";

// Zone 2: User Portal
import { PortalLayout } from "./components/portal/PortalLayout";
import PortalDashboard from "./pages/portal/PortalDashboard";
import ModulePage from "./pages/portal/ModulePage";

// Legacy Portfolio (kept for reference/migration)
import PropertyList from "./pages/portfolio/PropertyList";
import PropertyDetail from "./pages/portfolio/PropertyDetail";
import PropertyForm from "./pages/portfolio/PropertyForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/portal" replace />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Zone 1: Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="organizations/:id" element={<OrganizationDetail />} />
              <Route path="users" element={<Users />} />
              <Route path="delegations" element={<Delegations />} />
              <Route path="contacts" element={<MasterContacts />} />
              <Route path="tiles" element={<TileCatalog />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="communication" element={<CommunicationHub />} />
              <Route path="oversight" element={<Oversight />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="billing" element={<Billing />} />
              <Route path="agreements" element={<Agreements />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="support" element={<Support />} />
            </Route>

            {/* Zone 2: User Portal - 9 Module Grid (45 Routes) */}
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalDashboard />} />
              
              {/* Module 1: Stammdaten */}
              <Route path="stammdaten" element={<ModulePage />} />
              <Route path="stammdaten/profil" element={<ModulePage />} />
              <Route path="stammdaten/firma" element={<ModulePage />} />
              <Route path="stammdaten/abrechnung" element={<ModulePage />} />
              <Route path="stammdaten/sicherheit" element={<ModulePage />} />
              
              {/* Module 2: KI Office */}
              <Route path="ki-office" element={<ModulePage />} />
              <Route path="ki-office/email" element={<ModulePage />} />
              <Route path="ki-office/brief" element={<ModulePage />} />
              <Route path="ki-office/kontakte" element={<ModulePage />} />
              <Route path="ki-office/kalender" element={<ModulePage />} />
              
              {/* Module 3: DMS (Posteingang / Dokumentenmanagement) */}
              <Route path="dms" element={<ModulePage />} />
              <Route path="dms/eingang" element={<ModulePage />} />
              <Route path="dms/zuordnung" element={<ModulePage />} />
              <Route path="dms/archiv" element={<ModulePage />} />
              <Route path="dms/einstellungen" element={<ModulePage />} />
              
              {/* Module 4: Immobilien */}
              <Route path="immobilien" element={<ModulePage />} />
              <Route path="immobilien/portfolio" element={<ModulePage />} />
              <Route path="immobilien/verwaltung" element={<ModulePage />} />
              <Route path="immobilien/verkauf" element={<ModulePage />} />
              <Route path="immobilien/sanierung" element={<ModulePage />} />
              
              {/* Module 5: MSV (Miet-/Service-Verwaltung) */}
              <Route path="msv" element={<ModulePage />} />
              <Route path="msv/listen" element={<ModulePage />} />
              <Route path="msv/mieteingang" element={<ModulePage />} />
              <Route path="msv/vermietung" element={<ModulePage />} />
              <Route path="msv/einstellungen" element={<ModulePage />} />
              
              {/* Module 6: Verkauf */}
              <Route path="verkauf" element={<ModulePage />} />
              <Route path="verkauf/objekte" element={<ModulePage />} />
              <Route path="verkauf/aktivitaeten" element={<ModulePage />} />
              <Route path="verkauf/anfragen" element={<ModulePage />} />
              <Route path="verkauf/vorgaenge" element={<ModulePage />} />
              
              {/* Module 7: Vertriebspartner */}
              <Route path="vertriebspartner" element={<ModulePage />} />
              <Route path="vertriebspartner/pipeline" element={<ModulePage />} />
              <Route path="vertriebspartner/auswahl" element={<ModulePage />} />
              <Route path="vertriebspartner/beratung" element={<ModulePage />} />
              <Route path="vertriebspartner/team" element={<ModulePage />} />
              
              {/* Module 8: Finanzierung */}
              <Route path="finanzierung" element={<ModulePage />} />
              <Route path="finanzierung/selbstauskunft" element={<ModulePage />} />
              <Route path="finanzierung/unterlagen" element={<ModulePage />} />
              <Route path="finanzierung/pakete" element={<ModulePage />} />
              <Route path="finanzierung/status" element={<ModulePage />} />
              
              {/* Module 9: Leadgenerierung */}
              <Route path="leadgenerierung" element={<ModulePage />} />
              <Route path="leadgenerierung/kampagnen" element={<ModulePage />} />
              <Route path="leadgenerierung/studio" element={<ModulePage />} />
              <Route path="leadgenerierung/landingpages" element={<ModulePage />} />
              <Route path="leadgenerierung/leads" element={<ModulePage />} />
            </Route>

            {/* Legacy Portfolio Routes (for migration reference) */}
            <Route path="/portfolio" element={<AdminLayout />}>
              <Route index element={<PropertyList />} />
              <Route path="new" element={<PropertyForm />} />
              <Route path=":id" element={<PropertyDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
