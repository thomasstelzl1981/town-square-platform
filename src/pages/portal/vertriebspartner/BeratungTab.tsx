import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileDown, Handshake, Save, UserPlus } from 'lucide-react';
import { HowItWorks, QuickActions } from '@/components/vertriebspartner';
import { toast } from 'sonner';

// Mock data for selected properties (would come from partner_listing_selections)
const mockSelectedProperties = [
  { id: '1', title: 'MFH Leipzig-Connewitz', price: 850000, rent: 3680 },
  { id: '3', title: 'Zinshaus Chemnitz', price: 720000, rent: 3660 },
];

// Mock data for customers (would come from customer_projects)
const mockCustomers = [
  { id: 'c1', name: 'Max Mustermann', status: 'active' },
  { id: 'c2', name: 'Erika Muster', status: 'running' },
];

const BeratungTab = () => {
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  const handleResult = (result: CalculationResult) => {
    setLastResult(result);
  };

  const handleSave = () => {
    if (!selectedProperty || !selectedCustomer) {
      toast.warning('Bitte wählen Sie Objekt und Kunde aus');
      return;
    }
    toast.success('Simulation gespeichert', {
      description: `Für ${mockCustomers.find(c => c.id === selectedCustomer)?.name}`,
    });
  };

  const handleExportPdf = () => {
    toast.info('PDF wird erstellt...', {
      description: 'Der Download startet in Kürze',
    });
  };

  const handleStartDeal = () => {
    if (!selectedProperty || !selectedCustomer) {
      toast.warning('Bitte wählen Sie Objekt und Kunde aus');
      return;
    }
    toast.success('Deal gestartet', {
      description: 'Der Vorgang wurde in der Pipeline angelegt',
    });
  };

  return (
    <div className="space-y-6">
      <HowItWorks variant="beratung" />
      
      {/* Quick Actions */}
      <QuickActions />

      {/* Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Objekt auswählen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Aus Ihrer Auswahl wählen..." />
              </SelectTrigger>
              <SelectContent>
                {mockSelectedProperties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.title} — {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prop.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Nur Objekte mit ♥ im Katalog werden hier angezeigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Kunde auswählen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Kunde wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id}>
                      {cust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" title="Neuen Kunden anlegen">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Verknüpfen Sie die Simulation mit einem Kunden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Calculator */}
      <InvestmentCalculator onResult={handleResult} />

      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {lastResult && (
                <span>
                  Monatsbelastung: <strong className="text-foreground">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(lastResult.summary.monthlyBurden)}
                  </strong> / Monat
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF Export
              </Button>
              <Button onClick={handleStartDeal}>
                <Handshake className="mr-2 h-4 w-4" />
                Deal starten
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BeratungTab;
