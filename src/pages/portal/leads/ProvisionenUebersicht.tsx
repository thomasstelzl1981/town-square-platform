/**
 * Provisionen Übersicht — Reserve-Modul (MOD-10)
 * Platzhalter für künftiges Provisionsabrechnungssystem
 */
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function ProvisionenUebersicht() {
  return (
    <PageShell>
      <ModulePageHeader 
        title="Provisionen" 
        description="Provisionsabrechnungen und Zahlungsübersicht" 
      />

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <EmptyState
            icon={CreditCard}
            title="Provisionsabrechnung in Vorbereitung"
            description="Hier werden künftig Ihre Provisionsabrechnungen, Zahlungseingänge und Gutschriften zentral verwaltet."
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
