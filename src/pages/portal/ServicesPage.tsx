/**
 * Shops Page (MOD-16) — Amazon Business, Büroshop24, Miete24, Bestellungen
 */

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ShopTab = lazy(() => import('./services/ShopTab'));
const BestellungenTab = lazy(() => import('./services/BestellungenTab'));

export default function ServicesPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="amazon" replace />} />
      <Route path="amazon" element={<ShopTab shopKey="amazon" />} />
      <Route path="bueroshop24" element={<ShopTab shopKey="bueroshop24" />} />
      <Route path="miete24" element={<ShopTab shopKey="miete24" />} />
      <Route path="smart-home" element={<ShopTab shopKey="smart-home" />} />
      <Route path="bestellungen" element={<BestellungenTab />} />
      <Route path="*" element={<Navigate to="/portal/services" replace />} />
    </Routes>
  );
}
