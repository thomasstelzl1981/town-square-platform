/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 * 
 * Routes:
 * - /portal/immobilien → Redirect to portfolio
 * - /portal/immobilien/portfolio → Portfolio Dashboard + List
 * - /portal/immobilien/neu → Create Property (shows visible UI)
 * - /portal/immobilien/kontexte → Context Management
 * - /portal/immobilien/sanierung → Renovation (global)
 * - /portal/immobilien/bewertung → Valuation (global)
 * - /portal/immobilien/:id → Canonical Dossier (Immobilienakte)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';

// Lazy imports for sub-tab code-splitting
const CreatePropertyRedirect = lazy(() => import('./immobilien/CreatePropertyRedirect').then(m => ({ default: m.CreatePropertyRedirect })));
const PortfolioTab = lazy(() => import('./immobilien/PortfolioTab').then(m => ({ default: m.PortfolioTab })));
const KontexteTab = lazy(() => import('./immobilien/KontexteTab').then(m => ({ default: m.KontexteTab })));
const SanierungTab = lazy(() => import('./immobilien/SanierungTab').then(m => ({ default: m.SanierungTab })));
const BewertungTab = lazy(() => import('./immobilien/BewertungTab').then(m => ({ default: m.BewertungTab })));
const PropertyDetailPage = lazy(() => import('./immobilien/PropertyDetailPage'));

const ImmobilienPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* CREATE: Lazy for code-splitting */}
        <Route path="neu" element={<CreatePropertyRedirect />} />
        
        {/* PRIMARY: Redirect to portfolio */}
        <Route index element={<Navigate to="portfolio" replace />} />
        <Route path="portfolio" element={<PortfolioTab />} />
        
        {/* SECONDARY: Context management */}
        <Route path="kontexte" element={<KontexteTab />} />
        <Route path="sanierung/*" element={<SanierungTab />} />
        <Route path="bewertung" element={<BewertungTab />} />
        
        {/* CANONICAL: Property dossier (Immobilienakte) - :id must be LAST, guarded by GoldenPathGuard */}
        <Route path=":id" element={
          <GoldenPathGuard moduleCode="MOD-04" entityIdParam="id">
            <PropertyDetailPage />
          </GoldenPathGuard>
        } />
        
        {/* Fallback for any unmatched paths */}
        <Route path="*" element={<Navigate to="/portal/immobilien" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ImmobilienPage;
