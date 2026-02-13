/**
 * Immobilien Page (MOD-04) - SSOT for Properties, Units, Leases, Verwaltung
 * 
 * ZUHAUSE (MOD-20 Miety) is rendered inline as default entry point.
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';

const CreatePropertyRedirect = lazy(() => import('./immobilien/CreatePropertyRedirect').then(m => ({ default: m.CreatePropertyRedirect })));
const PortfolioTab = lazy(() => import('./immobilien/PortfolioTab').then(m => ({ default: m.PortfolioTab })));
const SanierungTab = lazy(() => import('./immobilien/SanierungTab').then(m => ({ default: m.SanierungTab })));
const VerwaltungTab = lazy(() => import('./immobilien/VerwaltungTab'));
const PropertyDetailPage = lazy(() => import('./immobilien/PropertyDetailPage'));
const RentalExposeDetail = lazy(() => import('./msv/RentalExposeDetail'));
const MietyPortalPage = lazy(() => import('./MietyPortalPage'));

const ImmobilienPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* CREATE */}
        <Route path="neu" element={<CreatePropertyRedirect />} />
        
        {/* DEFAULT: Redirect to ZUHAUSE */}
        <Route index element={<Navigate to="zuhause" replace />} />
        
        {/* ZUHAUSE: MOD-20 Miety rendered inline */}
        <Route path="zuhause/*" element={<MietyPortalPage />} />
        
        {/* LEGACY: Old "haus" path redirects to "zuhause" */}
        <Route path="haus" element={<Navigate to="/portal/immobilien/zuhause" replace />} />
        
        {/* PORTFOLIO */}
        <Route path="portfolio" element={<PortfolioTab />} />
        
        {/* REDIRECT: Context management now integrated in Portfolio */}
        <Route path="kontexte" element={<Navigate to="/portal/immobilien/portfolio" replace />} />
        <Route path="sanierung/*" element={<SanierungTab />} />
        
        {/* VERWALTUNG */}
        <Route path="verwaltung" element={<VerwaltungTab />} />
        
        {/* RENTAL: Expose detail */}
        <Route path="vermietung/:id" element={<RentalExposeDetail />} />
        
        {/* CANONICAL: Property dossier */}
        <Route path=":id" element={
          <GoldenPathGuard moduleCode="MOD-04" entityIdParam="id">
            <PropertyDetailPage />
          </GoldenPathGuard>
        } />
        
        <Route path="*" element={<Navigate to="/portal/immobilien" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ImmobilienPage;
