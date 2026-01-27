import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

// Lazy load sub-pages
const KatalogTab = lazy(() => import('./vertriebspartner/KatalogTab'));
const BeratungTab = lazy(() => import('./vertriebspartner/BeratungTab'));
const PipelineTab = lazy(() => import('./vertriebspartner/PipelineTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const VertriebspartnerPage = () => {
  const location = useLocation();
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-09');

  if (isLoading) {
    return <LoadingFallback />;
  }

  // If on module dashboard, show sub-tile cards
  const isOnDashboard = location.pathname === '/portal/vertriebspartner';

  if (isOnDashboard) {
    return (
      <div className="space-y-6">
        <div ref={contentRef}>
          <ModuleDashboard
            title={data?.title || 'Vertriebspartner'}
            description={data?.description || 'Partner-Dashboard, Objektkatalog und Beratung'}
            subTiles={data?.sub_tiles || []}
            moduleCode="MOD-09"
          />
        </div>
        <div className="px-6">
          <PdfExportFooter 
            contentRef={contentRef} 
            documentTitle="Partner-Dashboard" 
            moduleName="MOD-09 Vertriebspartner" 
          />
        </div>
      </div>
    );
  }

  // Sub-routes via Sidebar (keine TabsList mehr)
  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="p-6 pb-4">
          <h1 className="text-3xl font-bold">Vertriebspartner</h1>
          <p className="text-muted-foreground">
            Partner-Dashboard, Objektkatalog und Beratung
          </p>
        </div>
        
        <div className="px-6">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route index element={<Navigate to="katalog" replace />} />
              <Route path="katalog" element={<KatalogTab />} />
              <Route path="beratung" element={<BeratungTab />} />
              <Route path="pipeline" element={<PipelineTab />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Vertriebspartner" 
          moduleName="MOD-09 Vertriebspartner" 
        />
      </div>
    </div>
  );
};

export default VertriebspartnerPage;
