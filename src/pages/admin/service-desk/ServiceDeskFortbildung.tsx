/**
 * ServiceDeskFortbildung — MOD-15: Delegiert an bestehende AdminFortbildung
 */
import { lazy, Suspense } from 'react';

const AdminFortbildung = lazy(() => import('@/pages/admin/AdminFortbildung'));

export default function ServiceDeskFortbildung() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Lade Fortbildung…</div>}>
      <AdminFortbildung />
    </Suspense>
  );
}
