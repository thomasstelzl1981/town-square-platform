/**
 * Fortbildung Page (MOD-15)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function FortbildungPage() {
  const content = moduleContents['MOD-15'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="katalog" element={<ModuleStubPage />} />
      <Route path="meine-kurse" element={<ModuleStubPage />} />
      <Route path="zertifikate" element={<ModuleStubPage />} />
      <Route path="settings" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/fortbildung" replace />} />
    </Routes>
  );
}
