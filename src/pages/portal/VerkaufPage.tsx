import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { SubTabNav } from '@/components/shared';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

// Lazy load tabs
const ObjekteTab = lazy(() => import('./verkauf/ObjekteTab'));
const AktivitaetenTab = lazy(() => import('./verkauf/AktivitaetenTab'));
const AnfragenTab = lazy(() => import('./verkauf/AnfragenTab'));
const VorgaengeTab = lazy(() => import('./verkauf/VorgaengeTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const VerkaufPage = () => {
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-06');
  const location = useLocation();

  const tabs = [
    { title: 'Objekte', route: '/portal/verkauf/objekte' },
    { title: 'Aktivitäten', route: '/portal/verkauf/aktivitaeten' },
    { title: 'Anfragen', route: '/portal/verkauf/anfragen' },
    { title: 'Vorgänge', route: '/portal/verkauf/vorgaenge' }
  ];

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        {/* Header */}
        <div className="p-6 pb-4">
          <h1 className="text-3xl font-bold">{data?.title || 'Verkauf'}</h1>
          <p className="text-muted-foreground">{data?.description || 'Immobilienverkauf und Inserate verwalten'}</p>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pb-4">
          <SubTabNav tabs={tabs} />
        </div>
        
        {/* Tab Content */}
        <div className="px-6">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="objekte" replace />} />
              <Route path="objekte" element={<ObjekteTab />} />
              <Route path="aktivitaeten" element={<AktivitaetenTab />} />
              <Route path="anfragen" element={<AnfragenTab />} />
              <Route path="vorgaenge" element={<VorgaengeTab />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Verkaufsübersicht" 
          moduleName="MOD-06 Verkauf" 
        />
      </div>
    </div>
  );
};

export default VerkaufPage;
