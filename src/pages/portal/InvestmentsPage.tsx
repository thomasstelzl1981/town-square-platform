/**
 * Investments Page (MOD-08) - Routes Pattern with How It Works
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Heart } from 'lucide-react';
import { InvestmentCalculator } from '@/components/investment';
import MandatTab from './investments/MandatTab';
import MandatCreateWizard from './investments/MandatCreateWizard';
import MandatDetail from './investments/MandatDetail';

// Sub-tile components
function SucheTab() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Objektsuche</h1>
        <p className="text-muted-foreground">Durchsuchen Sie verfügbare Investmentobjekte</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Objektsuche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Objektsuche wird mit Listings verbunden...</p>
            <p className="text-sm">MOD-06 Verkauf → Listings API</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FavoritenTab() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favoriten</h1>
        <p className="text-muted-foreground">Ihre gespeicherten Objekte</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Favoriten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Favoriten vorhanden</p>
            <p className="text-sm">Favoriten aus Kaufy werden hier synchronisiert</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SimulationTab() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Investment-Simulation</h1>
        <p className="text-muted-foreground">Berechnen Sie Rendite und Cashflow</p>
      </div>
      <InvestmentCalculator />
    </div>
  );
}

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
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal/investments" replace />} />
    </Routes>
  );
};

export default InvestmentsPage;
