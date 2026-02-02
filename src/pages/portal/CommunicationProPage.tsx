/**
 * Communication Pro Page (MOD-14)
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleStubPage } from './stub';

export default function CommunicationProPage() {
  const content = moduleContents['MOD-14'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="serien-emails" element={<ModuleStubPage />} />
      <Route path="recherche" element={<ModuleStubPage />} />
      <Route path="social" element={<ModuleStubPage />} />
      <Route path="agenten" element={<ModuleStubPage />} />
      <Route path="*" element={<Navigate to="/portal/communication-pro" replace />} />
    </Routes>
  );
}
