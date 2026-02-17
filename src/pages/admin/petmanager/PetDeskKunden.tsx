/**
 * Pet Desk — Kunden Tab: Z1-Kundendatenbank
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function PetDeskKunden() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Kundendatenbank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Zentrale Kunden-Governance für alle Pet-Service-Kunden (Z1).
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Noch keine Kunden erfasst</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
