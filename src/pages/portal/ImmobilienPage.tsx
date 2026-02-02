/**
 * Immobilien Page (MOD-04) - Routes Pattern with How It Works
 * 
 * Property creation is now handled via CreatePropertyDialog modal in PortfolioTab.
 * No separate /neu route needed - triggers auto-create Unit + Storage folders.
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
        
        {/* Tile routes */}
        <Route path="kontexte" element={<KontexteTab />} />
        <Route path="portfolio" element={<PortfolioTab />} />
        <Route path="sanierung" element={<SanierungTab />} />
        <Route path="bewertung" element={<BewertungTab />} />
        
        {/* Property detail route (Immobilienakte) */}
        <Route path=":id" element={<PropertyDetail />} />
        
        {/* Legacy redirects - /neu now handled by modal */}
        <Route path="neu" element={<Navigate to="/portal/immobilien/portfolio" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/immobilien" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ImmobilienPage;
