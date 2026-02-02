/**
 * Vertriebspartner Page (MOD-09) - Routes Pattern with How It Works
 */
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { Loader2 } from 'lucide-react';

// Lazy load sub-pages
const KatalogTab = lazy(() => import('./vertriebspartner/KatalogTab'));
const BeratungTab = lazy(() => import('./vertriebspartner/BeratungTab'));
const KundenTab = lazy(() => import('./vertriebspartner/KundenTab'));
const NetworkTab = lazy(() => import('./vertriebspartner/NetworkTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const VertriebspartnerPage = () => {
  const content = moduleContents['MOD-09'];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* How It Works as index */}
        <Route index element={<ModuleHowItWorks content={content} />} />
        
        {/* Tile routes */}
        <Route path="katalog" element={<KatalogTab />} />
        <Route path="beratung" element={<BeratungTab />} />
        <Route path="kunden" element={<KundenTab />} />
        <Route path="network" element={<NetworkTab />} />
        
        {/* Legacy redirect */}
        <Route path="pipeline" element={<Navigate to="/portal/vertriebspartner/network" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/vertriebspartner" replace />} />
      </Routes>
    </Suspense>
  );
};

export default VertriebspartnerPage;
