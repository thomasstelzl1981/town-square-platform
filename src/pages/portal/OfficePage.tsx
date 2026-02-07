/**
 * KI Office Page (MOD-02) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Direct imports for sub-tabs (parent is already lazy-loaded)
 * UPDATED: Added Widgets tab (5th sub-tile)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Direct imports for instant sub-tab navigation
import { EmailTab } from './office/EmailTab';
import { BriefTab } from './office/BriefTab';
import { KontakteTab } from './office/KontakteTab';
import { KalenderTab } from './office/KalenderTab';
import { WidgetsTab } from './office/WidgetsTab';

const OfficePage = () => {
  const content = moduleContents['MOD-02'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="email" element={<EmailTab />} />
      <Route path="brief" element={<BriefTab />} />
      <Route path="kontakte" element={<KontakteTab />} />
      <Route path="kalender" element={<KalenderTab />} />
      <Route path="widgets" element={<WidgetsTab />} />
      <Route path="*" element={<Navigate to="/portal/office" replace />} />
    </Routes>
  );
};

export default OfficePage;
