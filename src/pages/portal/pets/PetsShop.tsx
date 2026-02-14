/**
 * Pets — Shop Tab (Platzhalter)
 * Shop-Integration (Futter, Zubehör) + Buchungssystem
 */
import { ShoppingCart } from 'lucide-react';

export default function PetsShop() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">Shop</h2>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-medium text-muted-foreground">Pet Shop & Buchungen</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Futter, Zubehör bestellen und Services buchen.
        </p>
      </div>
    </div>
  );
}
