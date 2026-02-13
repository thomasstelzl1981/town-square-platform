/**
 * Car-Management Page (MOD-17) - Full Implementation
 * P0-FIX: React.lazy for code splitting consistency
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoldenPathGuard } from '@/goldenpath/GoldenPathGuard';

const CarsFahrzeuge = lazy(() => import('@/components/portal/cars/CarsFahrzeuge'));
const CarsVersicherungen = lazy(() => import('@/components/portal/cars/CarsVersicherungen'));
const CarsFahrtenbuch = lazy(() => import('@/components/portal/cars/CarsFahrtenbuch'));
const CarsAngebote = lazy(() => import('@/components/portal/cars/CarsAngebote'));
const VehicleDetailPage = lazy(() => import('@/components/portal/cars/VehicleDetailPage'));

export default function CarsPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="fahrzeuge" replace />} />
      
      {/* Tiles */}
      <Route path="fahrzeuge" element={<CarsFahrzeuge />} />
      <Route path="versicherungen" element={<CarsVersicherungen />} />
      <Route path="fahrtenbuch" element={<CarsFahrtenbuch />} />
      <Route path="angebote" element={<CarsAngebote />} />
      
      {/* CANONICAL: Vehicle detail (Fahrzeugakte) - :id must be LAST */}
      <Route path=":id" element={
        <GoldenPathGuard moduleCode="MOD-17" entityIdParam="id">
          <VehicleDetailPage />
        </GoldenPathGuard>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/cars" replace />} />
    </Routes>
  );
}
