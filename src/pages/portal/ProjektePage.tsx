/**
 * Projekte Page (MOD-13)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function ProjektePage() {
  const content = moduleContents['MOD-13'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<ModuleStubPage />} />
      <Route path="portfolio" element={<ModuleStubPage />} />
      <Route path="timeline" element={<ModuleStubPage />} />
      <Route path="settings" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/projekte" replace />} />
    </Routes>
  );
}
