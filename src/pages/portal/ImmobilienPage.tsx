/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases, Verwaltung
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
 * - /portal/immobilien/verwaltung → Consolidated Property Management (ex-MSV)
 * - /portal/immobilien/vermietung/:id → Rental Expose Detail
 * - /portal/immobilien/:id → Canonical Dossier (Immobilienakte)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';

// Lazy imports for sub-tab code-splitting
const CreatePropertyRedirect = lazy(() => import('./immobilien/CreatePropertyRedirect').then(m => ({ default: m.CreatePropertyRedirect })));
const PortfolioTab = lazy(() => import('./immobilien/PortfolioTab').then(m => ({ default: m.PortfolioTab })));
// KontexteTab removed — context management is now integrated into PortfolioTab
const SanierungTab = lazy(() => import('./immobilien/SanierungTab').then(m => ({ default: m.SanierungTab })));
const VerwaltungTab = lazy(() => import('./immobilien/VerwaltungTab'));
const PropertyDetailPage = lazy(() => import('./immobilien/PropertyDetailPage'));
const RentalExposeDetail = lazy(() => import('./msv/RentalExposeDetail'));

const ImmobilienPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* CREATE: Lazy for code-splitting */}
        <Route path="neu" element={<CreatePropertyRedirect />} />
        
        {/* PRIMARY: Redirect to portfolio */}
        <Route index element={<Navigate to="portfolio" replace />} />
        <Route path="portfolio" element={<PortfolioTab />} />
        
        {/* REDIRECT: Context management now integrated in Portfolio */}
        <Route path="kontexte" element={<Navigate to="/portal/immobilien/portfolio" replace />} />
        <Route path="sanierung/*" element={<SanierungTab />} />
        {/* Bewertung entfernt — jetzt in PropertyDetailPage als Tab */}
        
        {/* VERWALTUNG: Consolidated property management (ex-MSV) */}
        <Route path="verwaltung" element={<VerwaltungTab />} />
        
        {/* HAUS: Redirect to MOD-20 (Miety) */}
        <Route path="haus" element={<Navigate to="/portal/miety" replace />} />
        
        {/* RENTAL: Expose detail (moved from MSV) */}
        <Route path="vermietung/:id" element={<RentalExposeDetail />} />
        
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
