/**
 * MOD-05 Pets — Portal Module Page
 * Routes: meine-tiere, caring, shop, fotoalbum, :petId (detail)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

const PetsMeineTiere = React.lazy(() => import('./pets/PetsMeineTiere'));
const PetsCaring = React.lazy(() => import('./pets/PetsCaring'));
const CaringProviderDetail = React.lazy(() => import('./pets/CaringProviderDetail'));
const PetsShop = React.lazy(() => import('./pets/PetsShop'));
const PetsMeinBereich = React.lazy(() => import('./pets/PetsMeinBereich'));
const PetDetailPage = React.lazy(() => import('./pets/PetDetailPage'));

const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function PetsPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="meine-tiere" replace />} />
      <Route path="meine-tiere" element={<React.Suspense fallback={<Loading />}><PetsMeineTiere /></React.Suspense>} />
      <Route path="caring" element={<React.Suspense fallback={<Loading />}><PetsCaring /></React.Suspense>} />
      <Route path="caring/provider/:providerId" element={<React.Suspense fallback={<Loading />}><CaringProviderDetail /></React.Suspense>} />
      <Route path="shop" element={<React.Suspense fallback={<Loading />}><PetsShop /></React.Suspense>} />
      <Route path="mein-bereich" element={<React.Suspense fallback={<Loading />}><PetsMeinBereich /></React.Suspense>} />
      <Route path=":petId" element={<React.Suspense fallback={<Loading />}><PetDetailPage /></React.Suspense>} />
      <Route path="*" element={<Navigate to="meine-tiere" replace />} />
    </Routes>
  );
}
