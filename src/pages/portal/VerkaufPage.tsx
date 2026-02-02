/**
 * Verkauf Page (MOD-06) - Routes Pattern with How It Works
 */
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { Loader2 } from 'lucide-react';

// Lazy load tabs
const ObjekteTab = lazy(() => import('./verkauf/ObjekteTab'));
const ReportingTab = lazy(() => import('./verkauf/ReportingTab'));
const VorgaengeTab = lazy(() => import('./verkauf/VorgaengeTab'));
const ExposeDetail = lazy(() => import('./verkauf/ExposeDetail'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const VerkaufPage = () => {
  const content = moduleContents['MOD-06'];

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* How It Works as index */}
        <Route index element={<ModuleHowItWorks content={content} />} />
        
        {/* Tile routes */}
        <Route path="objekte" element={<ObjekteTab />} />
        <Route path="vorgaenge" element={<VorgaengeTab />} />
        <Route path="reporting" element={<ReportingTab />} />
        
        {/* Detail routes */}
        <Route path="expose/:propertyId" element={<ExposeDetail />} />
        
        {/* Legacy redirect */}
        <Route path="so-funktionierts" element={<Navigate to="/portal/verkauf" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/portal/verkauf" replace />} />
      </Routes>
    </Suspense>
  );
};

export default VerkaufPage;
