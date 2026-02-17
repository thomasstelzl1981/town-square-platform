/**
 * Pet Desk — Shop Tab: Service-Katalog-Moderation, Provider-Services
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';

export default function PetDeskShop() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5" />
            Shop & Service-Katalog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Service-Katalog-Moderation und Provider-Services-Verwaltung.
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Service-Katalog wird geladen…</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
