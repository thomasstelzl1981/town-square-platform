/**
 * Pet Desk — Billing Tab: Rechnungen, Zahlungen, Provisionen
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function PetDeskBilling() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Rechnungen, Zahlungen und Provisionsabrechnung.
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Keine offenen Rechnungen</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
