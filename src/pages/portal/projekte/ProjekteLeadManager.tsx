/**
 * ProjekteLeadManager — MOD-13 wrapper for Lead Manager with project context
 */
import { lazy, Suspense } from 'react';

const LeadManagerKampagnen = lazy(() => import('../lead-manager/LeadManagerKampagnen'));

export default function ProjekteLeadManager() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <LeadManagerKampagnen contextMode="project" />
    </Suspense>
  );
}
