/**
 * DMS Page (MOD-03) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Direct imports for sub-tabs (parent is already lazy-loaded)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
// Direct imports for instant sub-tab navigation
import { StorageTab } from './dms/StorageTab';
import { PosteingangTab } from './dms/PosteingangTab';
import { SortierenTab } from './dms/SortierenTab';
import { EinstellungenTab } from './dms/EinstellungenTab';

const DMSPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="storage" replace />} />
      <Route path="storage" element={<StorageTab />} />
      <Route path="posteingang" element={<PosteingangTab />} />
      <Route path="sortieren" element={<SortierenTab />} />
      <Route path="einstellungen" element={<EinstellungenTab />} />
      <Route path="*" element={<Navigate to="/portal/dms" replace />} />
    </Routes>
  );
};

export default DMSPage;
