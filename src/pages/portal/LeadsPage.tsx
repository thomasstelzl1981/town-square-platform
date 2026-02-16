/**
 * Provisionen Page (MOD-10) - Provisionsabrechnung
 */
import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ProvisionenUebersicht = lazy(() => import('./leads/ProvisionenUebersicht'));

const LeadsPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="uebersicht" replace />} />
      <Route path="uebersicht" element={<ProvisionenUebersicht />} />
      <Route path="*" element={<Navigate to="/portal/provisionen" replace />} />
    </Routes>
  );
};

export default LeadsPage;
