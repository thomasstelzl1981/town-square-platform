/**
 * Car-Management Page (MOD-17) - Full Implementation
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { 
  CarsFahrzeuge, 
  CarsVersicherungen, 
  CarsFahrtenbuch, 
  CarsAngebote,
  VehicleDetailPage 
} from '@/components/portal/cars';

export default function CarsPage() {
  const content = moduleContents['MOD-17'];

  return (
    <Routes>
      {/* Index: How It Works Landing */}
      <Route index element={<ModuleHowItWorks content={content} />} />
      
      {/* Tiles */}
      <Route path="fahrzeuge" element={<CarsFahrzeuge />} />
      <Route path="versicherungen" element={<CarsVersicherungen />} />
      <Route path="fahrtenbuch" element={<CarsFahrtenbuch />} />
      <Route path="angebote" element={<CarsAngebote />} />
      
      {/* CANONICAL: Vehicle detail (Fahrzeugakte) - :id must be LAST */}
      <Route path=":id" element={<VehicleDetailPage />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/cars" replace />} />
    </Routes>
  );
}
