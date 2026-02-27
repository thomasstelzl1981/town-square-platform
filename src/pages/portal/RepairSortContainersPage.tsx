/**
 * RepairSortContainers — Einmalige Repair-Seite
 * 
 * Aufruf: /portal/repair-sort-containers
 * Erstellt fehlende inbox_sort_containers + inbox_sort_rules für alle Fahrzeuge.
 * Kann nach Ausführung wieder entfernt werden.
 */
import { useAuth } from '@/contexts/AuthContext';
import { useRepairSortContainers } from '@/hooks/useRepairSortContainers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Loader2, CheckCircle } from 'lucide-react';

export default function RepairSortContainersPage() {
  const { activeTenantId } = useAuth();
  const repair = useRepairSortContainers();

  return (
    <div className="max-w-xl mx-auto mt-12 p-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Repair: Sortierkacheln nacherstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Erstellt für alle bestehenden Fahrzeuge ohne Sortierkachel nachträglich
            <strong> inbox_sort_containers</strong> und <strong>inbox_sort_rules</strong>.
            Bestehende Einträge werden übersprungen.
          </p>

          {repair.data && (
            <div className="rounded-lg border p-3 bg-muted/30 text-sm space-y-1">
              <div className="flex items-center gap-2 text-status-success">
                <CheckCircle className="h-4 w-4" />
                <span>{repair.data.repaired} repariert, {repair.data.skipped} übersprungen</span>
              </div>
              {repair.data.errors.length > 0 && (
                <div className="text-destructive">
                  {repair.data.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => activeTenantId && repair.mutate(activeTenantId)}
            disabled={repair.isPending || !activeTenantId}
            className="w-full gap-2"
          >
            {repair.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4" />
            )}
            Repair ausführen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
