/**
 * MOD-07: Anfrage Tab
 * Two-card layout: FinanceObjectCard + FinanceRequestCard
 * No draft creation, no DB writes — localStorage only.
 */
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import FinanceObjectCard, { type FinanceObjectCardHandle } from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard, { type FinanceRequestCardHandle } from '@/components/finanzierung/FinanceRequestCard';

export default function AnfrageTab() {
  const objectCardRef = useRef<FinanceObjectCardHandle>(null);
  const requestCardRef = useRef<FinanceRequestCardHandle>(null);

  const handleFloatingSave = () => {
    objectCardRef.current?.save();
    requestCardRef.current?.save();
    toast.success('Daten zwischengespeichert');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsanfrage</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Erfassen Sie die Objektdaten und Ihren Finanzierungswunsch
        </p>
      </div>

      {/* Section heading: Finanzierungsobjekt */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight uppercase">Finanzierungsobjekt</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hier erfassen Sie Ihr Finanzierungsobjekt.
        </p>
      </div>

      <FinanceObjectCard ref={objectCardRef} storageKey="mod07-anfrage" hideFooter />
      <FinanceRequestCard ref={requestCardRef} storageKey="mod07-anfrage" hideFooter />

      {/* Floating save button */}
      <Button
        onClick={handleFloatingSave}
        variant="glass"
        className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"
      >
        <Save className="h-4 w-4" /> Zwischenspeichern
      </Button>
    </div>
  );
}
