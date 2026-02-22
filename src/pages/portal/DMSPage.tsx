/**
 * DMS Page (MOD-03) - Routes Pattern with How It Works
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileText, ChevronRight } from 'lucide-react';

const StorageTab = lazy(() => import('./dms/StorageTab').then(m => ({ default: m.StorageTab })));
const PosteingangTab = lazy(() => import('./dms/PosteingangTab').then(m => ({ default: m.PosteingangTab })));
const SortierenTab = lazy(() => import('./dms/SortierenTab').then(m => ({ default: m.SortierenTab })));
const EinstellungenTab = lazy(() => import('./dms/EinstellungenTab').then(m => ({ default: m.EinstellungenTab })));
const IntakeTab = lazy(() => import('./dms/IntakeTab').then(m => ({ default: m.IntakeTab })));

const DMSPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile-only: Quick-Link zum Briefgenerator */}
      {isMobile && (
        <button
          onClick={() => navigate('/portal/office/brief')}
          className="w-full flex items-center gap-3 mx-3 mt-2 mb-1 px-3 py-2.5 rounded-xl bg-accent/40 transition-colors hover:bg-accent active:scale-[0.98]"
          style={{ width: 'calc(100% - 1.5rem)' }}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground">
            Briefgenerator öffnen
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
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
    </>
  );
};

export default DMSPage;
