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
import LeadPool from "./pages/admin/LeadPool";
import PartnerVerification from "./pages/admin/PartnerVerification";
import CommissionApproval from "./pages/admin/CommissionApproval";

// Zone 2: User Portal Layout
import { PortalLayout } from "./components/portal/PortalLayout";
import PortalDashboard from "./pages/portal/PortalDashboard";

// Zone 2: Module Pages (10 Modules)
import StammdatenPage from "./pages/portal/StammdatenPage";
import OfficePage from "./pages/portal/OfficePage";
import DMSPage from "./pages/portal/DMSPage";
import ImmobilienPage from "./pages/portal/ImmobilienPage";
import MSVPage from "./pages/portal/MSVPage";
import VerkaufPage from "./pages/portal/VerkaufPage";
import FinanzierungPage from "./pages/portal/FinanzierungPage";
import InvestmentsPage from "./pages/portal/InvestmentsPage";
import VertriebspartnerPage from "./pages/portal/VertriebspartnerPage";
import LeadsPage from "./pages/portal/LeadsPage";

// Legacy Portfolio (kept for reference/migration)
import PropertyList from "./pages/portfolio/PropertyList";
import PropertyDetail from "./pages/portfolio/PropertyDetail";
import PropertyForm from "./pages/portfolio/PropertyForm";

// Presentation (non-guessable URL)
import PresentationPage from "./pages/presentation/PresentationPage";

// Zone 3: Kaufy Website
import KaufyLayout from "./pages/zone3/kaufy/KaufyLayout";
import KaufyHome from "./pages/zone3/kaufy/KaufyHome";
import KaufyVermieter from "./pages/zone3/kaufy/KaufyVermieter";
import KaufyVerkaeufer from "./pages/zone3/kaufy/KaufyVerkaeufer";
import KaufyVertrieb from "./pages/zone3/kaufy/KaufyVertrieb";
import KaufyBeratung from "./pages/zone3/kaufy/KaufyBeratung";
import KaufyMeety from "./pages/zone3/kaufy/KaufyMeety";

// Zone 3: Miety Website
import MietyLayout from "./pages/zone3/miety/MietyLayout";
import MietyHome from "./pages/zone3/miety/MietyHome";
import MietyLeistungen from "./pages/zone3/miety/MietyLeistungen";
import MietyVermieter from "./pages/zone3/miety/MietyVermieter";
import MietyApp from "./pages/zone3/miety/MietyApp";
import MietyPreise from "./pages/zone3/miety/MietyPreise";
import MietySoFunktioniert from "./pages/zone3/miety/MietySoFunktioniert";
import MietyKontakt from "./pages/zone3/miety/MietyKontakt";
import MietyRegistrieren from "./pages/zone3/miety/MietyRegistrieren";

// Zone 3: System of a Town Website
import SotLayout from "./pages/zone3/sot/SotLayout";
import SotHome from "./pages/zone3/sot/SotHome";

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
              <Route path="leadpool" element={<LeadPool />} />
              <Route path="partner-verification" element={<PartnerVerification />} />
              <Route path="commissions" element={<CommissionApproval />} />
              <Route path="support" element={<Support />} />
            </Route>

            {/* Zone 2: User Portal - 10 Module Structure */}
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalDashboard />} />
              
              {/* MOD-01: Stammdaten */}
              <Route path="stammdaten" element={<StammdatenPage />} />
              <Route path="stammdaten/profil" element={<StammdatenPage />} />
              <Route path="stammdaten/kontakte" element={<StammdatenPage />} />
              <Route path="stammdaten/adressen" element={<StammdatenPage />} />
              <Route path="stammdaten/einstellungen" element={<StammdatenPage />} />
              
              {/* MOD-02: KI Office */}
              <Route path="office" element={<OfficePage />} />
              <Route path="office/chat" element={<OfficePage />} />
              <Route path="office/aufgaben" element={<OfficePage />} />
              <Route path="office/kalender" element={<OfficePage />} />
              <Route path="office/notizen" element={<OfficePage />} />
              
              {/* MOD-03: DMS */}
              <Route path="dms" element={<DMSPage />} />
              <Route path="dms/storage" element={<DMSPage />} />
              <Route path="dms/post" element={<DMSPage />} />
              <Route path="dms/sort" element={<DMSPage />} />
              <Route path="dms/settings" element={<DMSPage />} />
              
              {/* MOD-04: Immobilien */}
              <Route path="immobilien" element={<ImmobilienPage />} />
              <Route path="immobilien/liste" element={<PropertyList />} />
              <Route path="immobilien/neu" element={<PropertyForm />} />
              <Route path="immobilien/:id" element={<PropertyDetail />} />
              <Route path="immobilien/karte" element={<ImmobilienPage />} />
              <Route path="immobilien/analyse" element={<ImmobilienPage />} />
              
              {/* MOD-05: MSV (Mietmanagement) */}
              <Route path="msv" element={<MSVPage />} />
              <Route path="msv/uebersicht" element={<MSVPage />} />
              <Route path="msv/mieter" element={<MSVPage />} />
              <Route path="msv/zahlungen" element={<MSVPage />} />
              <Route path="msv/mahnungen" element={<MSVPage />} />
              
              {/* MOD-06: Verkauf */}
              <Route path="verkauf" element={<VerkaufPage />} />
              <Route path="verkauf/inserate" element={<VerkaufPage />} />
              <Route path="verkauf/anfragen" element={<VerkaufPage />} />
              <Route path="verkauf/reservierungen" element={<VerkaufPage />} />
              <Route path="verkauf/transaktionen" element={<VerkaufPage />} />
              
              {/* MOD-07: Finanzierung */}
              <Route path="finanzierung" element={<FinanzierungPage />} />
              <Route path="finanzierung/faelle" element={<FinanzierungPage />} />
              <Route path="finanzierung/dokumente" element={<FinanzierungPage />} />
              <Route path="finanzierung/export" element={<FinanzierungPage />} />
              <Route path="finanzierung/status" element={<FinanzierungPage />} />
              
              {/* MOD-08: Investments */}
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="investments/suche" element={<InvestmentsPage />} />
              <Route path="investments/favoriten" element={<InvestmentsPage />} />
              <Route path="investments/profile" element={<InvestmentsPage />} />
              <Route path="investments/alerts" element={<InvestmentsPage />} />
              
              {/* MOD-09: Vertriebspartner (Kaufy Addon) */}
              <Route path="vertriebspartner" element={<VertriebspartnerPage />} />
              <Route path="vertriebspartner/dashboard" element={<VertriebspartnerPage />} />
              <Route path="vertriebspartner/katalog" element={<VertriebspartnerPage />} />
              <Route path="vertriebspartner/auswahl" element={<VertriebspartnerPage />} />
              <Route path="vertriebspartner/netzwerk" element={<VertriebspartnerPage />} />
              
              {/* MOD-10: Leadgenerierung (Kaufy Addon) */}
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/inbox" element={<LeadsPage />} />
              <Route path="leads/pipeline" element={<LeadsPage />} />
              <Route path="leads/kampagnen" element={<LeadsPage />} />
              <Route path="leads/statistik" element={<LeadsPage />} />
            </Route>

            {/* Legacy Portfolio Routes (for migration reference) */}
            <Route path="/portfolio" element={<AdminLayout />}>
              <Route index element={<PropertyList />} />
              <Route path="new" element={<PropertyForm />} />
              <Route path=":id" element={<PropertyDetail />} />
            </Route>

            {/* Presentation Page (non-guessable URL for demos) */}
            <Route path="/presentation-sot-k7m3x9p2" element={<PresentationPage />} />

            {/* Zone 3: Kaufy Website */}
            <Route path="/kaufy" element={<KaufyLayout />}>
              <Route index element={<KaufyHome />} />
              <Route path="vermieter" element={<KaufyVermieter />} />
              <Route path="verkaeufer" element={<KaufyVerkaeufer />} />
              <Route path="vertrieb" element={<KaufyVertrieb />} />
              <Route path="beratung" element={<KaufyBeratung />} />
              <Route path="meety" element={<KaufyMeety />} />
            </Route>

            {/* Zone 3: Miety Website */}
            <Route path="/miety" element={<MietyLayout />}>
              <Route index element={<MietyHome />} />
              <Route path="leistungen" element={<MietyLeistungen />} />
              <Route path="vermieter" element={<MietyVermieter />} />
              <Route path="app" element={<MietyApp />} />
              <Route path="preise" element={<MietyPreise />} />
              <Route path="so-funktioniert" element={<MietySoFunktioniert />} />
              <Route path="kontakt" element={<MietyKontakt />} />
              <Route path="registrieren" element={<MietyRegistrieren />} />
            </Route>

            {/* Zone 3: System of a Town Website */}
            <Route path="/sot" element={<SotLayout />}>
              <Route index element={<SotHome />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
