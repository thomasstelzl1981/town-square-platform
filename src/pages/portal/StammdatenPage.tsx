/**
 * Stammdaten Page (MOD-01) - Routes Pattern with How It Works
 * P0-FIX: Removed inner Suspense to prevent nested Suspense deadlock
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';

// Lazy load sub-page components
const ProfilTab = lazy(() => import('./stammdaten/ProfilTab').then(m => ({ default: m.ProfilTab })));
const PersonenTab = lazy(() => import('./stammdaten/PersonenTab').then(m => ({ default: m.PersonenTab })));
const FirmaTab = lazy(() => import('./stammdaten/FirmaTab').then(m => ({ default: m.FirmaTab })));
const AbrechnungTab = lazy(() => import('./stammdaten/AbrechnungTab').then(m => ({ default: m.AbrechnungTab })));
const SicherheitTab = lazy(() => import('./stammdaten/SicherheitTab').then(m => ({ default: m.SicherheitTab })));

const StammdatenPage = () => {
  const content = moduleContents['MOD-01'];

  return (
    <Routes>
      <Route index element={<ModuleHowItWorks content={content} />} />
      <Route path="profil" element={<ProfilTab />} />
      <Route path="firma" element={<FirmaTab />} />
      <Route path="personen" element={<PersonenTab />} />
      <Route path="abrechnung" element={<AbrechnungTab />} />
      <Route path="sicherheit" element={<SicherheitTab />} />
      <Route path="*" element={<Navigate to="/portal/stammdaten" replace />} />
    </Routes>
  );
};

export default StammdatenPage;
