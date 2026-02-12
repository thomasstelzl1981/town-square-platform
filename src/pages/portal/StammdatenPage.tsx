/**
 * Stammdaten Page (MOD-01) - Routes Pattern with How It Works
 * 
 * 4-Tile Structure:
 * - Profil: Persönliche Daten
 * - Verträge: Alle Vereinbarungen (NEU)
 * - Abrechnung: Zahlungen + Credits
 * - Sicherheit: Passwort + 2FA
 * 
 * OPTIMIZED: Lazy imports for sub-tab code-splitting
 */
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ProfilTab = lazy(() => import('./stammdaten/ProfilTab').then(m => ({ default: m.ProfilTab })));
const VertraegeTab = lazy(() => import('./stammdaten/VertraegeTab').then(m => ({ default: m.VertraegeTab })));
const AbrechnungTab = lazy(() => import('./stammdaten/AbrechnungTab').then(m => ({ default: m.AbrechnungTab })));
const SicherheitTab = lazy(() => import('./stammdaten/SicherheitTab').then(m => ({ default: m.SicherheitTab })));

const StammdatenPage = () => {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route index element={<Navigate to="profil" replace />} />
        <Route path="profil" element={<ProfilTab />} />
        <Route path="vertraege" element={<VertraegeTab />} />
        <Route path="abrechnung" element={<AbrechnungTab />} />
        <Route path="sicherheit" element={<SicherheitTab />} />
        {/* Legacy redirects */}
        <Route path="firma" element={<Navigate to="/portal/stammdaten/vertraege" replace />} />
        <Route path="personen" element={<Navigate to="/portal/stammdaten/profil" replace />} />
        <Route path="*" element={<Navigate to="/portal/stammdaten" replace />} />
      </Routes>
    </Suspense>
  );
};

export default StammdatenPage;
