/**
 * Finanzierungsmanager Page (MOD-11) - Routes Pattern with How It Works
 */
import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { WorkflowSubbar, FINANCE_MANAGER_WORKFLOW_STEPS } from '@/components/shared/WorkflowSubbar';
import { useFutureRoomCases } from '@/hooks/useFinanceMandate';
import { Loader2 } from 'lucide-react';

// Lazy load tab components
const CaseDetailTab = React.lazy(() => import('./finanzierungsmanager/CaseDetailTab'));
const SubmitToBankTab = React.lazy(() => import('./finanzierungsmanager/SubmitToBankTab'));
const StatusTab = React.lazy(() => import('./finanzierungsmanager/StatusTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const FinanzierungsmanagerPage = () => {
  const content = moduleContents['MOD-11'];
  const { data: cases, isLoading } = useFutureRoomCases();

  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={FINANCE_MANAGER_WORKFLOW_STEPS} moduleBase="finanzierungsmanager" />
      <div className="flex-1 overflow-auto">
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* How It Works as index */}
            <Route index element={<ModuleHowItWorks content={content} />} />
            
            {/* Tile routes */}
            <Route path="selbstauskunft" element={<CaseDetailTab cases={cases || []} isLoading={isLoading} />} />
            <Route path="selbstauskunft/:caseId" element={<CaseDetailTab cases={cases || []} isLoading={isLoading} />} />
            <Route path="einreichen" element={<SubmitToBankTab cases={cases || []} isLoading={isLoading} />} />
            <Route path="einreichen/:caseId" element={<SubmitToBankTab cases={cases || []} isLoading={isLoading} />} />
            <Route path="status" element={<StatusTab cases={cases || []} isLoading={isLoading} />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/portal/finanzierungsmanager" replace />} />
          </Routes>
        </React.Suspense>
      </div>
    </div>
  );
};

export default FinanzierungsmanagerPage;
