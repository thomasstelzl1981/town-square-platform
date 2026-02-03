/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases
 * 
 * Routes:
 * - /portal/immobilien → How It Works (index)
 * - /portal/immobilien/portfolio → Portfolio Dashboard + List
 * - /portal/immobilien/neu → Redirect to portfolio with create modal
 * - /portal/immobilien/:id → Canonical Dossier (Immobilienakte)
 * - /portal/immobilien/kontexte → Context Management
 * - /portal/immobilien/sanierung → Renovation (global)
 * - /portal/immobilien/bewertung → Valuation (global)
 */
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { Loader2 } from 'lucide-react';

// Lazy load sub-page components
const PortfolioTab = lazy(() => import('./immobilien/PortfolioTab').then(m => ({ default: m.PortfolioTab })));
const KontexteTab = lazy(() => import('./immobilien/KontexteTab').then(m => ({ default: m.KontexteTab })));
const SanierungTab = lazy(() => import('./immobilien/SanierungTab').then(m => ({ default: m.SanierungTab })));
const BewertungTab = lazy(() => import('./immobilien/BewertungTab').then(m => ({ default: m.BewertungTab })));
const CreatePropertyRedirect = lazy(() => import('./immobilien/CreatePropertyRedirect'));

// Property detail page (Immobilienakte SSOT)
const PropertyDetail = lazy(() => import('@/pages/portfolio/PropertyDetail'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const ImmobilienPage = () => {
  const content = moduleContents['MOD-04'];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* How It Works as index */}
        <Route index element={<ModuleHowItWorks content={content} />} />
        
        {/* PRIMARY: Portfolio (default tile) */}
        <Route path="portfolio" element={<PortfolioTab />} />
        
        {/* CREATE: Redirect to portfolio with modal trigger */}
        <Route path="neu" element={<CreatePropertyRedirect />} />
        
        {/* SECONDARY: Context management */}
        <Route path="kontexte" element={<KontexteTab />} />
        <Route path="sanierung" element={<SanierungTab />} />
        <Route path="bewertung" element={<BewertungTab />} />
        
        {/* CANONICAL: Property dossier (Immobilienakte) */}
        <Route path=":id" element={<PropertyDetail />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/immobilien" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ImmobilienPage;
