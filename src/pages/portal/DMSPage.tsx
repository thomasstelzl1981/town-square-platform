/**
 * DMS Page (MOD-03) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Lazy load sub-page components
const StorageTab = lazy(() => import('./dms/StorageTab').then(m => ({ default: m.StorageTab })));
const PosteingangTab = lazy(() => import('./dms/PosteingangTab').then(m => ({ default: m.PosteingangTab })));
const SortierenTab = lazy(() => import('./dms/SortierenTab').then(m => ({ default: m.SortierenTab })));
const EinstellungenTab = lazy(() => import('./dms/EinstellungenTab').then(m => ({ default: m.EinstellungenTab })));

const DMSPage = () => {
  const content = moduleContents['MOD-03'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="storage" element={<StorageTab />} />
      <Route path="posteingang" element={<PosteingangTab />} />
      <Route path="sortieren" element={<SortierenTab />} />
      <Route path="einstellungen" element={<EinstellungenTab />} />
      <Route path="*" element={<Navigate to="/portal/dms" replace />} />
    </Routes>
  );
};

export default DMSPage;
