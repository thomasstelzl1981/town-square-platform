/**
 * MOD-15 Fortbildung — Kuratierter Empfehlungs- & Such-Hub
 * 4 Tabs: Bücher, Fortbildungen, Vorträge, Kurse
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

const FortbildungTabContent = lazy(() => import('@/components/portal/fortbildung/FortbildungTabContent').then(m => ({ default: m.FortbildungTabContent })));

export default function FortbildungPage() {
  return (
    <PageShell>
      <ModulePageHeader
        title="Fortbildung"
        description="Bücher, Kurse, Vorträge – kuratiert & durchsuchbar"
      />
      
      <Routes>
        <Route index element={<Navigate to="buecher" replace />} />
        <Route path="buecher" element={<FortbildungTabContent tab="books" />} />
        <Route path="fortbildungen" element={<FortbildungTabContent tab="trainings" />} />
        <Route path="vortraege" element={<FortbildungTabContent tab="talks" />} />
        <Route path="kurse" element={<FortbildungTabContent tab="courses" />} />
        <Route path="*" element={<Navigate to="/portal/fortbildung/buecher" replace />} />
      </Routes>
    </PageShell>
  );
}
