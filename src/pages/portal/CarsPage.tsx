/**
 * Car-Management Page (MOD-17) - Restructured: Autos, Bikes, Boote, Privatjet, Angebote
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const CarsAutos = lazy(() => import('@/components/portal/cars/CarsAutos'));
const CarsBikes = lazy(() => import('@/components/portal/cars/CarsBikes'));
const CarsBoote = lazy(() => import('@/components/portal/cars/CarsBoote'));
const CarsPrivatjet = lazy(() => import('@/components/portal/cars/CarsPrivatjet'));
const CarsAngebote = lazy(() => import('@/components/portal/cars/CarsAngebote'));

export default function CarsPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="autos" replace />} />
      <Route path="autos" element={<CarsAutos />} />
      <Route path="bikes" element={<CarsBikes />} />
      <Route path="boote" element={<CarsBoote />} />
      <Route path="privatjet" element={<CarsPrivatjet />} />
      <Route path="angebote" element={<CarsAngebote />} />
      <Route path="*" element={<Navigate to="/portal/cars" replace />} />
    </Routes>
  );
}
