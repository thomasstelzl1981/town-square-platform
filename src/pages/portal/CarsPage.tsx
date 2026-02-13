/**
 * Car-Management Page (MOD-17) - 4 Tabs: Fahrzeuge, Boote, Privatjet, Angebote
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const CarsFahrzeuge = lazy(() => import('@/components/portal/cars/CarsFahrzeuge'));
const CarsBoote = lazy(() => import('@/components/portal/cars/CarsBoote'));
const CarsPrivatjet = lazy(() => import('@/components/portal/cars/CarsPrivatjet'));
const CarsAngebote = lazy(() => import('@/components/portal/cars/CarsAngebote'));

export default function CarsPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="fahrzeuge" replace />} />
      <Route path="fahrzeuge" element={<CarsFahrzeuge />} />
      <Route path="boote" element={<CarsBoote />} />
      <Route path="privatjet" element={<CarsPrivatjet />} />
      <Route path="angebote" element={<CarsAngebote />} />
      <Route path="*" element={<Navigate to="/portal/cars" replace />} />
    </Routes>
  );
}
