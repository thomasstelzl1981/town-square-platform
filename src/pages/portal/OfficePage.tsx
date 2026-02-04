/**
 * KI Office Page (MOD-02) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Lazy load sub-page components
const EmailTab = lazy(() => import('./office/EmailTab').then(m => ({ default: m.EmailTab })));
const BriefTab = lazy(() => import('./office/BriefTab').then(m => ({ default: m.BriefTab })));
const KontakteTab = lazy(() => import('./office/KontakteTab').then(m => ({ default: m.KontakteTab })));
const KalenderTab = lazy(() => import('./office/KalenderTab').then(m => ({ default: m.KalenderTab })));

const OfficePage = () => {
  const content = moduleContents['MOD-02'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="email" element={<EmailTab />} />
      <Route path="brief" element={<BriefTab />} />
      <Route path="kontakte" element={<KontakteTab />} />
      <Route path="kalender" element={<KalenderTab />} />
      <Route path="*" element={<Navigate to="/portal/office" replace />} />
    </Routes>
  );
};

export default OfficePage;
