import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

// Lazy load tabs
const SoFunktioniertsTab = lazy(() => import('./verkauf/SoFunktioniertsTab'));
const ObjekteTab = lazy(() => import('./verkauf/ObjekteTab'));
const ReportingTab = lazy(() => import('./verkauf/ReportingTab'));
const VorgaengeTab = lazy(() => import('./verkauf/VorgaengeTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const VerkaufPage = () => {
  const contentRef = usePdfContentRef();

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        {/* Header */}
        <div className="p-6 pb-4">
          <h1 className="text-3xl font-bold">Verkauf</h1>
          <p className="text-muted-foreground">
            Bestandsimmobilien verkaufen – einfach und transparent
          </p>
        </div>
        
        {/* Tab Content - Routing über Sidebar */}
        <div className="px-6">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="so-funktionierts" replace />} />
              <Route path="so-funktionierts" element={<SoFunktioniertsTab />} />
              <Route path="objekte" element={<ObjekteTab />} />
              <Route path="reporting" element={<ReportingTab />} />
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
