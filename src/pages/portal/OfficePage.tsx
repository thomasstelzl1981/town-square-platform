/**
 * KI Office Page (MOD-02) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Lazy imports for code-splitting sub-tabs
 * UPDATED: Added Widgets tab (5th sub-tile)
 * MOBILE: E-Mail, Kontakte, Kalender are hidden on mobile (redirects to Brief)
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy imports for sub-tab code-splitting
const EmailTab = lazy(() => import('./office/EmailTab').then(m => ({ default: m.EmailTab })));
const BriefTab = lazy(() => import('./office/BriefTab').then(m => ({ default: m.BriefTab })));
const KontakteTab = lazy(() => import('./office/KontakteTab').then(m => ({ default: m.KontakteTab })));
const KalenderTab = lazy(() => import('./office/KalenderTab').then(m => ({ default: m.KalenderTab })));
const WidgetsTab = lazy(() => import('./office/WidgetsTab').then(m => ({ default: m.WidgetsTab })));
const WhatsAppTab = lazy(() => import('./office/WhatsAppTab').then(m => ({ default: m.WhatsAppTab })));

// Mobile guard wrapper - redirects desktop-only tabs to Brief on mobile
function MobileGuard({ children, allowedOnMobile = false }: { 
  children: React.ReactNode; 
  allowedOnMobile?: boolean;
}) {
  const isMobile = useIsMobile();
  
  if (isMobile && !allowedOnMobile) {
    return <Navigate to="/portal/office/brief" replace />;
  }
  
  return <>{children}</>;
}

const OfficePage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="email" replace />} />
        {/* Desktop-only tabs: E-Mail, Kontakte, Kalender */}
        <Route path="email" element={
          <MobileGuard allowedOnMobile={false}>
            <EmailTab />
          </MobileGuard>
        } />
        <Route path="kontakte" element={
          <MobileGuard allowedOnMobile={false}>
            <KontakteTab />
          </MobileGuard>
        } />
        <Route path="kalender" element={
          <MobileGuard allowedOnMobile={false}>
            <KalenderTab />
          </MobileGuard>
        } />
        {/* Mobile + Desktop: Brief, Widgets, WhatsApp */}
        <Route path="brief" element={<BriefTab />} />
        <Route path="widgets" element={<WidgetsTab />} />
        <Route path="whatsapp" element={<WhatsAppTab />} />
        <Route path="*" element={<Navigate to="/portal/office" replace />} />
      </Routes>
    </Suspense>
  );
};

export default OfficePage;
