/**
 * Finanzanalyse Page (MOD-18)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function FinanzanalysePage() {
  const content = moduleContents['MOD-18'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="dashboard" element={<ModuleStubPage />} />
      <Route path="reports" element={<ModuleStubPage />} />
      <Route path="szenarien" element={<ModuleStubPage />} />
      <Route path="settings" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/finanzanalyse" replace />} />
    </Routes>
  );
}
