/**
 * ProjekteLeadManager — MOD-13 wrapper for Lead Manager with project context
 */
import { lazy, Suspense } from 'react';

const LeadManagerInline = lazy(() => import('../lead-manager/LeadManagerInline'));

export default function ProjekteLeadManager() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <LeadManagerInline contextMode="project" />
    </Suspense>
  );
}