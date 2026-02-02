/**
 * Car-Management Page (MOD-17)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function CarsPage() {
  const content = moduleContents['MOD-17'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="uebersicht" element={<ModuleStubPage />} />
      <Route path="fahrzeuge" element={<ModuleStubPage />} />
      <Route path="service" element={<ModuleStubPage />} />
      <Route path="settings" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/cars" replace />} />
    </Routes>
  );
}
