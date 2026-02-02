/**
 * Photovoltaik Page (MOD-19)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function PhotovoltaikPage() {
  const content = moduleContents['MOD-19'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="angebot" element={<ModuleStubPage />} />
      <Route path="checkliste" element={<ModuleStubPage />} />
      <Route path="projekt" element={<ModuleStubPage />} />
      <Route path="settings" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/photovoltaik" replace />} />
    </Routes>
  );
}
