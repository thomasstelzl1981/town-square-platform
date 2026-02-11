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


// Manifest-driven router
import { ManifestRouter } from "./router/ManifestRouter";

const queryClient = new QueryClient();

// ZBC Step 9: DEV-only validators on app start
if (import.meta.env.DEV) {
  import('./goldenpath/devValidator').then(({ validateGoldenPaths, validateZoneBoundaries, validateTileCatalogSync }) => {
    validateGoldenPaths();
    validateZoneBoundaries();
    validateTileCatalogSync();
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
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/portal" replace />} />
              
              {/* Special: Authentication (public) */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset-password" element={<AuthResetPassword />} />
              
              {/* Special: Presentation (hidden, non-guessable URL) */}
              <Route path="/presentation-sot-k7m3x9p2" element={<PresentationPage />} />
              
              
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
