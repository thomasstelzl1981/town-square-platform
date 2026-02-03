/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases
 * 
 * P0 Stabilization: The /neu route is NON-LAZY to prevent infinite loader states.
 * 
 * Routes:
 * - /portal/immobilien → Redirect to /portfolio (via ManifestRouter)
 * - /portal/immobilien/portfolio → Portfolio Dashboard + List
 * - /portal/immobilien/neu → Create Property (NON-LAZY, shows visible UI)
 * - /portal/immobilien/kontexte → Context Management
 * - /portal/immobilien/sanierung → Renovation (global)
 * - /portal/immobilien/bewertung → Valuation (global)
 * - /portal/immobilien/:id → Canonical Dossier (Immobilienakte)
 */
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// NON-LAZY: Create redirect must always work without Suspense
import { CreatePropertyRedirect } from './immobilien/CreatePropertyRedirect';

// Lazy load other sub-page components
const PortfolioTab = lazy(() => import('./immobilien/PortfolioTab').then(m => ({ default: m.PortfolioTab })));
const KontexteTab = lazy(() => import('./immobilien/KontexteTab').then(m => ({ default: m.KontexteTab })));
const SanierungTab = lazy(() => import('./immobilien/SanierungTab').then(m => ({ default: m.SanierungTab })));
const BewertungTab = lazy(() => import('./immobilien/BewertungTab').then(m => ({ default: m.BewertungTab })));

// Property detail page (Immobilienakte SSOT) - now canonical location
const PropertyDetailPage = lazy(() => import('./immobilien/PropertyDetailPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const ImmobilienPage = () => {
  return (
    <Routes>
      {/* CREATE: NON-LAZY - P0 requirement to prevent infinite loader */}
      <Route path="neu" element={<CreatePropertyRedirect />} />
      
      {/* Other routes wrapped in Suspense */}
      <Route path="*" element={
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* PRIMARY: Portfolio (default tile) */}
            <Route path="portfolio" element={<PortfolioTab />} />
            
            {/* SECONDARY: Context management */}
            <Route path="kontexte" element={<KontexteTab />} />
            <Route path="sanierung" element={<SanierungTab />} />
            <Route path="bewertung" element={<BewertungTab />} />
            
            {/* CANONICAL: Property dossier (Immobilienakte) - :id must be LAST */}
            <Route path=":id" element={<PropertyDetailPage />} />
            
            {/* Fallback for any unmatched paths */}
            <Route path="*" element={<Navigate to="/portal/immobilien/portfolio" replace />} />
          </Routes>
        </Suspense>
      } />
    </Routes>
  );
};

export default ImmobilienPage;
