/**
 * Pet Desk — Vorgänge Tab: Lead-Qualifizierung, Zuweisungen, offene Anfragen
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function PetDeskVorgaenge() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Vorgänge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Lead-Qualifizierung, Zuweisungen und offene Anfragen werden hier verwaltet.
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Noch keine Vorgänge vorhanden</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
