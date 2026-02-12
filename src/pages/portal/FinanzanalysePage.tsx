/**
 * Finanzanalyse Page (MOD-18) - BLUEPRINT MODULE
 * Status: All tiles are intentional empty-state stubs pending feature implementation.
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const DashboardTile = lazy(() => import('./finanzanalyse/DashboardTile'));
const ReportsTile = lazy(() => import('./finanzanalyse/ReportsTile'));
const SzenarienTile = lazy(() => import('./finanzanalyse/SzenarienTile'));
const EinstellungenTile = lazy(() => import('./finanzanalyse/EinstellungenTile'));

export default function FinanzanalysePage() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardTile />} />
      <Route path="reports" element={<ReportsTile />} />
      <Route path="szenarien" element={<SzenarienTile />} />
      <Route path="settings" element={<EinstellungenTile />} />
      <Route path="*" element={<Navigate to="/portal/finanzanalyse" replace />} />
    </Routes>
  );
}
