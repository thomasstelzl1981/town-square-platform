/**
 * KI Office Page (MOD-02) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Direct imports for sub-tabs (parent is already lazy-loaded)
 * UPDATED: Added Widgets tab (5th sub-tile)
 * MOBILE: E-Mail, Kontakte, Kalender are hidden on mobile (redirects to Brief)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { useIsMobile } from '@/hooks/use-mobile';

// Direct imports for instant sub-tab navigation
import { EmailTab } from './office/EmailTab';
import { BriefTab } from './office/BriefTab';
import { KontakteTab } from './office/KontakteTab';
import { KalenderTab } from './office/KalenderTab';
import { WidgetsTab } from './office/WidgetsTab';
import { WhatsAppTab } from './office/WhatsAppTab';

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
  const content = moduleContents['MOD-02'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
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
  );
};

export default OfficePage;
