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

// Zone 2: Portfolio (Legacy - kept for reference)
import PropertyList from "./pages/portfolio/PropertyList";
import PropertyDetail from "./pages/portfolio/PropertyDetail";
import PropertyForm from "./pages/portfolio/PropertyForm";

// Zone 2: User Portal
import PortalHome from "./pages/portal/PortalHome";
import ModulePlaceholder from "./pages/portal/ModulePlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
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
              <Route path="support" element={<Support />} />
            </Route>

            {/* Zone 2: Portfolio Routes (Legacy Reference Module) */}
            <Route path="/portfolio" element={<AdminLayout />}>
              <Route index element={<PropertyList />} />
              <Route path="new" element={<PropertyForm />} />
              <Route path=":id" element={<PropertyDetail />} />
            </Route>

            {/* Zone 2: User Portal */}
            <Route path="/portal" element={<PortalHome />} />
            <Route path="/portal/:moduleCode" element={<ModulePlaceholder />} />
            <Route path="/portal/:moduleCode/:subRoute" element={<ModulePlaceholder />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
