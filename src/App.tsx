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
import MasterTemplates from "./pages/admin/MasterTemplates";

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
import RentalExposeDetail from "./pages/portal/msv/RentalExposeDetail";

// Legacy Portfolio (kept for reference/migration)
import PropertyList from "./pages/portfolio/PropertyList";
import PropertyDetail from "./pages/portfolio/PropertyDetail";
import PropertyForm from "./pages/portfolio/PropertyForm";
import ExposeVorlage from "./pages/portfolio/ExposeVorlage";

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
import KaufyModule from "./pages/zone3/kaufy/KaufyModule";
import KaufyModuleDetail from "./pages/zone3/kaufy/KaufyModuleDetail";
import KaufyImmobilien from "./pages/zone3/kaufy/KaufyImmobilien";
import KaufyExpose from "./pages/zone3/kaufy/KaufyExpose";
import KaufyBerater from "./pages/zone3/kaufy/KaufyBerater";
import KaufyAnbieter from "./pages/zone3/kaufy/KaufyAnbieter";
import KaufyFAQ from "./pages/zone3/kaufy/KaufyFAQ";

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
import MietyInvite from "./pages/zone3/miety/MietyInvite";

// Zone 3: System of a Town Website
import SotLayout from "./pages/zone3/sot/SotLayout";
import SotHome from "./pages/zone3/sot/SotHome";
import SotProdukt from "./pages/zone3/sot/SotProdukt";
import SotModule from "./pages/zone3/sot/SotModule";
import SotModuleDetail from "./pages/zone3/sot/SotModuleDetail";
import SotUseCases from "./pages/zone3/sot/SotUseCases";
import SotPreise from "./pages/zone3/sot/SotPreise";
import SotFAQ from "./pages/zone3/sot/SotFAQ";

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
              <Route path="master-templates" element={<MasterTemplates />} />
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
              
              {/* MOD-01: Stammdaten (Profil, Firma, Abrechnung, Sicherheit) */}
              <Route path="stammdaten" element={<StammdatenPage />} />
              <Route path="stammdaten/profil" element={<StammdatenPage />} />
              <Route path="stammdaten/personen" element={<StammdatenPage />} />
              <Route path="stammdaten/abrechnung" element={<StammdatenPage />} />
              <Route path="stammdaten/sicherheit" element={<StammdatenPage />} />
              
              {/* MOD-02: KI Office (E-Mail, Brief, Kontakte, Kalender) */}
              <Route path="office" element={<OfficePage />} />
              <Route path="office/email" element={<OfficePage />} />
              <Route path="office/brief" element={<OfficePage />} />
              <Route path="office/kontakte" element={<OfficePage />} />
              <Route path="office/kalender" element={<OfficePage />} />
              
              {/* MOD-03: DMS (Storage, Posteingang, Sortieren, Einstellungen) */}
              <Route path="dms" element={<DMSPage />} />
              <Route path="dms/storage" element={<DMSPage />} />
              <Route path="dms/posteingang" element={<DMSPage />} />
              <Route path="dms/sortieren" element={<DMSPage />} />
              <Route path="dms/einstellungen" element={<DMSPage />} />
              
              {/* MOD-04: Immobilien (Kontexte, Portfolio, Sanierung, Bewertung) */}
              <Route path="immobilien" element={<ImmobilienPage />} />
              <Route path="immobilien/kontexte" element={<ImmobilienPage />} />
              <Route path="immobilien/portfolio" element={<ImmobilienPage />} />
              <Route path="immobilien/sanierung" element={<ImmobilienPage />} />
              <Route path="immobilien/bewertung" element={<ImmobilienPage />} />
              <Route path="immobilien/neu" element={<PropertyForm />} />
              <Route path="immobilien/vorlage" element={<ExposeVorlage />} />
              <Route path="immobilien/:id" element={<PropertyDetail />} />
              <Route path="immobilien/:id/edit" element={<PropertyForm />} />
              
              {/* MOD-05: MSV (Objekte, Mieteingang, Vermietung, Einstellungen) */}
              <Route path="msv" element={<MSVPage />} />
              <Route path="msv/objekte" element={<MSVPage />} />
              <Route path="msv/mieteingang" element={<MSVPage />} />
              <Route path="msv/vermietung" element={<MSVPage />} />
              <Route path="msv/vermietung/:id" element={<RentalExposeDetail />} />
              <Route path="msv/einstellungen" element={<MSVPage />} />
              
              {/* MOD-06: Verkauf (Objekte, Aktivitäten, Anfragen, Vorgänge) */}
              <Route path="verkauf/*" element={<VerkaufPage />} />
              
              {/* MOD-07: Finanzierung (Fälle, Dokumente, Export, Status) */}
              <Route path="finanzierung" element={<FinanzierungPage />} />
              <Route path="finanzierung/faelle" element={<FinanzierungPage />} />
              <Route path="finanzierung/dokumente" element={<FinanzierungPage />} />
              <Route path="finanzierung/export" element={<FinanzierungPage />} />
              <Route path="finanzierung/status" element={<FinanzierungPage />} />
              
              {/* MOD-08: Investments (Suche, Favoriten, Mandat, Simulation) */}
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="investments/suche" element={<InvestmentsPage />} />
              <Route path="investments/favoriten" element={<InvestmentsPage />} />
              <Route path="investments/mandat" element={<InvestmentsPage />} />
              <Route path="investments/simulation" element={<InvestmentsPage />} />
              
              {/* MOD-09: Vertriebspartner (Katalog, Beratung, Pipeline) */}
              <Route path="vertriebspartner/*" element={<VertriebspartnerPage />} />
              
              {/* MOD-10: Leads (Inbox, Meine Leads, Pipeline, Werbung) */}
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/inbox" element={<LeadsPage />} />
              <Route path="leads/meine" element={<LeadsPage />} />
              <Route path="leads/pipeline" element={<LeadsPage />} />
              <Route path="leads/werbung" element={<LeadsPage />} />
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
              <Route path="module" element={<KaufyModule />} />
              <Route path="module/:moduleId" element={<KaufyModuleDetail />} />
              <Route path="immobilien" element={<KaufyImmobilien />} />
              <Route path="immobilien/:publicId" element={<KaufyExpose />} />
              <Route path="berater" element={<KaufyBerater />} />
              <Route path="anbieter" element={<KaufyAnbieter />} />
              <Route path="faq" element={<KaufyFAQ />} />
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
              <Route path="invite" element={<MietyInvite />} />
            </Route>

            {/* Zone 3: System of a Town Website */}
            <Route path="/sot" element={<SotLayout />}>
              <Route index element={<SotHome />} />
              <Route path="produkt" element={<SotProdukt />} />
              <Route path="module" element={<SotModule />} />
              <Route path="module/:moduleId" element={<SotModuleDetail />} />
              <Route path="use-cases" element={<SotUseCases />} />
              <Route path="preise" element={<SotPreise />} />
              <Route path="faq" element={<SotFAQ />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
