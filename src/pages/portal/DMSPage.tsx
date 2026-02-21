/**
 * DMS Page (MOD-03) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const StorageTab = lazy(() => import('./dms/StorageTab').then(m => ({ default: m.StorageTab })));
const PosteingangTab = lazy(() => import('./dms/PosteingangTab').then(m => ({ default: m.PosteingangTab })));
const SortierenTab = lazy(() => import('./dms/SortierenTab').then(m => ({ default: m.SortierenTab })));
const EinstellungenTab = lazy(() => import('./dms/EinstellungenTab').then(m => ({ default: m.EinstellungenTab })));
const IntakeTab = lazy(() => import('./dms/IntakeTab').then(m => ({ default: m.IntakeTab })));

const DMSPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="intelligenz" replace />} />
        <Route path="intelligenz" element={<EinstellungenTab />} />
        <Route path="storage" element={<StorageTab />} />
        <Route path="posteingang" element={<PosteingangTab />} />
        <Route path="sortieren" element={<SortierenTab />} />
        <Route path="intake" element={<IntakeTab />} />
        {/* Legacy redirect */}
        <Route path="einstellungen" element={<Navigate to="/portal/dms/intelligenz" replace />} />
        <Route path="*" element={<Navigate to="/portal/dms" replace />} />
      </Routes>
    </Suspense>
  );
};

export default DMSPage;
