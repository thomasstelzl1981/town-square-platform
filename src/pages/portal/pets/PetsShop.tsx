/**
 * Pets — Shop Tab (Platzhalter)
 * Shop-Integration (Futter, Zubehör) + Buchungssystem
 */
import { ShoppingCart } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';

export default function PetsShop() {
  return (
    <PageShell>
      <ModulePageHeader title="SHOP" description="Futter, Zubehör bestellen und Services buchen" />
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Pet Shop & Buchungen</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Futter, Zubehör bestellen und Services buchen.
        </p>
      </div>
    </PageShell>
  );
}
