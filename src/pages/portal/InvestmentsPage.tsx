/**
 * Investments Page (MOD-08) - Routes Pattern with How It Works
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import MandatTab from './investments/MandatTab';
import MandatCreateWizard from './investments/MandatCreateWizard';
import MandatDetail from './investments/MandatDetail';
import SucheTab from './investments/SucheTab';
import FavoritenTab from './investments/FavoritenTab';
import SimulationTab from './investments/SimulationTab';
import InvestmentExposePage from './investments/InvestmentExposePage';

const InvestmentsPage = () => {
  const content = moduleContents['MOD-08'];

  return (
    <Routes>
      {/* How It Works as index */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tile routes */}
      <Route path="suche" element={<SucheTab />} />
      <Route path="favoriten" element={<FavoritenTab />} />
      <Route path="mandat" element={<MandatTab />} />
      <Route path="mandat/neu" element={<MandatCreateWizard />} />
      <Route path="mandat/:mandateId" element={<MandatDetail />} />
      <Route path="simulation" element={<SimulationTab />} />
      
      {/* NEW: Full-page Exposé route */}
      <Route path="objekt/:publicId" element={<InvestmentExposePage />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/investments" replace />} />
    </Routes>
  );
};

export default InvestmentsPage;
