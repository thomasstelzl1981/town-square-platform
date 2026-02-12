/**
 * Shops Page (MOD-16) — Amazon Business, OTTO Office, Miete24, Bestellungen
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ShopTab = lazy(() => import('./services/ShopTab'));
const BestellungenTab = lazy(() => import('./services/BestellungenTab'));

export default function ServicesPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<Navigate to="amazon" replace />} />
          <Route path="amazon" element={<ShopTab shopKey="amazon" />} />
          <Route path="otto-office" element={<ShopTab shopKey="otto-office" />} />
          <Route path="miete24" element={<ShopTab shopKey="miete24" />} />
          <Route path="bestellungen" element={<BestellungenTab />} />
          <Route path="*" element={<Navigate to="/portal/services" replace />} />
        </Routes>
      </div>
    </div>
  );
}
