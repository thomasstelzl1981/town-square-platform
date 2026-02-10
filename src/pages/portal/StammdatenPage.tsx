/**
 * Stammdaten Page (MOD-01) - Routes Pattern with How It Works
 * 
 * 4-Tile Structure:
 * - Profil: Persönliche Daten
 * - Verträge: Alle Vereinbarungen (NEU)
 * - Abrechnung: Zahlungen + Credits
 * - Sicherheit: Passwort + 2FA
 * 
 * OPTIMIZED: Direct imports for sub-tabs (parent is already lazy-loaded)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
// Direct imports for instant sub-tab navigation (module is already lazy-loaded)
import { ProfilTab } from './stammdaten/ProfilTab';
import { VertraegeTab } from './stammdaten/VertraegeTab';
import { AbrechnungTab } from './stammdaten/AbrechnungTab';
import { SicherheitTab } from './stammdaten/SicherheitTab';

const StammdatenPage = () => {
  return (
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
  );
};

export default StammdatenPage;
