/**
 * FMInvestmentTab — MOD-11 Menu (2) INVESTMENT
 * Upvest Integration (read-only), Empty State bei fehlender Verbindung
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { TrendingUp, Wallet, BarChart3, FileText, Link2Off } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

export default function FMInvestmentTab() {
  // TODO: Upvest integration — for now show empty state
  const isConnected = false;

  if (!isConnected) {
    return (
      <PageShell>
        <ModulePageHeader title="INVESTMENT" />
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
              <Link2Off className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Depot nicht verbunden</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Verbinden Sie Ihr Investment-Depot über Upvest, um Ihre Positionen, Transaktionen und Reports hier einzusehen.
            </p>
            <Button disabled>
              <TrendingUp className="h-4 w-4 mr-2" />
              Upvest verbinden (demnächst)
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader title="INVESTMENT" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Depot-Übersicht */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Depot-Übersicht</h3>
            </div>
            <div className="text-2xl font-bold">—</div>
            <Badge variant="outline">Verbunden</Badge>
          </CardContent>
        </Card>

        {/* Positionen */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Positionen</h3>
            </div>
            <p className="text-sm text-muted-foreground">Keine Positionen geladen.</p>
          </CardContent>
        </Card>

        {/* Transaktionen */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Transaktionen</h3>
            </div>
            <p className="text-sm text-muted-foreground">Keine Transaktionen.</p>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Reports & Statements</h3>
            </div>
            <p className="text-sm text-muted-foreground">Keine Reports verfügbar.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
