/**
 * Services Page (MOD-16)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function ServicesPage() {
  const content = moduleContents['MOD-16'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="katalog" element={<ModuleStubPage />} />
      <Route path="anfragen" element={<ModuleStubPage />} />
      <Route path="auftraege" element={<ModuleStubPage />} />
      <Route path="settings" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/services" replace />} />
    </Routes>
  );
}
