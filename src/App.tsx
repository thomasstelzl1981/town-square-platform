/**
 * APP.TSX — Minimal Entry Point
 * 
 * MANIFEST-DRIVEN ROUTING:
 * This file only defines special routes. All other routing is delegated
 * to ManifestRouter which reads from the SSOT manifest.
 * 
 * SPECIAL ROUTES (defined here):
 * - /auth (public authentication)
 * - /presentation-* (hidden demo pages)
 * - / (redirect to /portal)
 * 
 * ALL OTHER ROUTES are generated from manifests/routesManifest.ts
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
// Special routes (not in manifest)
import Auth from "./pages/Auth";
import AuthResetPassword from "./pages/AuthResetPassword";
import PresentationPage from "./pages/presentation/PresentationPage";
import { lazy, Suspense } from "react";
import { getDomainEntry } from "./hooks/useDomainRouter";
const VideocallJoinPage = lazy(() => import("./pages/portal/office/VideocallJoinPage"));
const InstallPage = lazy(() => import("./pages/Install"));



// Manifest-driven router
import { ManifestRouter } from "./router/ManifestRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on auth errors (401/403) or not found (404)
        const errorWithStatus = error as { status?: number; code?: number };
        const status = errorWithStatus?.status ?? errorWithStatus?.code;
        if (status && [401, 403, 404, 422].includes(status)) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 0, // Never retry mutations automatically
    },
  },
});

// ZBC Step 9: DEV-only validators on app start
if (import.meta.env.DEV) {
  import('./goldenpath/devValidator').then(({ validateGoldenPaths }) => {
    validateGoldenPaths();
  });
  import('./validation/architectureValidator').then(({ validateZoneBoundaries, validateTileCatalogSync, validateContractCoverage, validateStorageBoundaries, validateTenantHygiene }) => {
    validateZoneBoundaries();
    validateTileCatalogSync();
    validateContractCoverage();
    validateStorageBoundaries();
    validateTenantHygiene();
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Root redirect: Brand domain → Zone 3 home, otherwise → Portal */}
              <Route path="/" element={
                getDomainEntry() 
                  ? <Navigate to={getDomainEntry()!.base} replace /> 
                  : <Navigate to="/portal" replace />
              } />
              
              {/* Special: Authentication (public) */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset-password" element={<AuthResetPassword />} />
              
              {/* Special: Presentation (hidden, non-guessable URL) */}
              <Route path="/presentation-sot-k7m3x9p2" element={<PresentationPage />} />
              
              {/* Special: Public Videocall Join (no auth required) */}
              <Route path="/portal/office/videocalls/join/:inviteId" element={
                <Suspense fallback={null}><VideocallJoinPage /></Suspense>
              } />
              
              {/* PWA Install Prompt */}
              <Route path="/install" element={
                <Suspense fallback={null}><InstallPage /></Suspense>
              } />
              
              {/* ALL OTHER ROUTES: Delegated to ManifestRouter */}
              <Route path="/*" element={<ManifestRouter />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
