/**
 * Akquise-Manager Page (MOD-12)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function AkquiseManagerPage() {
  const content = moduleContents['MOD-12'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="dashboard" element={<ModuleStubPage />} />
      <Route path="kunden" element={<ModuleStubPage />} />
      <Route path="mandate" element={<ModuleStubPage />} />
      <Route path="tools" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/akquise-manager" replace />} />
    </Routes>
  );
}
