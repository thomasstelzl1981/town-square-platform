/**
 * FutureRoomAkteGuarded — Lazy-compatible wrapper combining AuthGuard + Akte
 * Fixes AUD-008: Prevents inline arrow function in component map
 */
import { lazy, Suspense } from 'react';

const FutureRoomAuthGuard = lazy(() => import('./FutureRoomAuthGuard'));
const FutureRoomAkte = lazy(() => import('./FutureRoomAkte'));

export default function FutureRoomAkteGuarded() {
  return (
    <Suspense fallback={null}>
      <FutureRoomAuthGuard>
        <Suspense fallback={null}>
          <FutureRoomAkte />
        </Suspense>
      </FutureRoomAuthGuard>
    </Suspense>
  );
}
