/**
 * Miety Portal Page (MOD-20)
 * Exception: 6 tiles instead of 4
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function MietyPortalPage() {
  const content = moduleContents['MOD-20'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<ModuleStubPage />} />
      <Route path="dokumente" element={<ModuleStubPage />} />
      <Route path="kommunikation" element={<ModuleStubPage />} />
      <Route path="zaehlerstaende" element={<ModuleStubPage />} />
      <Route path="versorgung" element={<ModuleStubPage />} />
      <Route path="versicherungen" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/miety" replace />} />
    </Routes>
  );
}
