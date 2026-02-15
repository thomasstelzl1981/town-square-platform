/**
 * FMInvestmentTab — MOD-11 Menu (2) INVESTMENT
 * Upvest Integration (read-only). Glass-card Design mit Upvest-inspiriertem Stepper.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { TrendingUp, Wallet, BarChart3, FileText, Link2Off, Check, Circle } from 'lucide-react';
import { DESIGN, RECORD_CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const ONBOARDING_STEPS = [
  { label: 'Persönliche Daten', done: false },
  { label: 'Angemessenheitsprüfung', done: false },
  { label: 'Geschäftsbedingungen', done: false },
];

export default function FMInvestmentTab() {
  const isConnected = false;

  if (!isConnected) {
    return (
      <PageShell>
        <ModulePageHeader title="INVESTMENT" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Card */}
          <div className="md:col-span-2">
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-12 text-center space-y-6">
                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                  <Link2Off className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Depot nicht verbunden</h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    Verbinden Sie Ihr Investment-Depot über Upvest, um Ihre Positionen, Transaktionen und Reports hier einzusehen.
                  </p>
                </div>
                <Button disabled size="lg" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Upvest verbinden (demnächst)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stepper Card (Upvest-inspired) */}
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <h4 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Onboarding-Schritte</h4>
              <div className="space-y-4">
                {ONBOARDING_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0 border',
                      step.done ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'
                    )}>
                      {step.done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>
                    <span className={cn('text-sm', step.done ? 'font-medium' : 'text-muted-foreground')}>{step.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Sobald alle Schritte abgeschlossen sind, wird Ihr Depot automatisch verbunden.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  // Connected state — 4 Cards
  return (
    <PageShell>
      <ModulePageHeader title="INVESTMENT" />
      <div className={RECORD_CARD.GRID}>
        {/* Depot Overview */}
        <Card className="glass-card overflow-hidden md:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Depot-Übersicht</h3>
              </div>
              <Badge variant="default">Verbunden</Badge>
            </div>
            <div className="text-3xl font-bold text-primary">—</div>
            <p className={DESIGN.TYPOGRAPHY.MUTED}>Portfolio-Wert</p>
          </CardContent>
        </Card>

        {/* Positions */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Positionen</h3>
            </div>
            <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Positionen geladen.</p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Transaktionen</h3>
            </div>
            <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Transaktionen.</p>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Reports & Statements</h3>
            </div>
            <p className={DESIGN.TYPOGRAPHY.MUTED}>Keine Reports verfügbar.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
