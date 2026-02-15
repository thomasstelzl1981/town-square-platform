/**
 * MOD-18 Finanzen — Tab 2: INVESTMENT
 * Upvest-Integration (read-only, Empty State)
 */
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RECORD_CARD } from '@/config/designManifest';
import {
  TrendingUp, CheckCircle2, Circle, User, ClipboardCheck, FileText,
  BarChart3, ArrowRight, Lock
} from 'lucide-react';

const ONBOARDING_STEPS = [
  { icon: User, label: 'Persönliche Daten', description: 'Identifikation & Kontaktdaten' },
  { icon: ClipboardCheck, label: 'Angemessenheitsprüfung', description: 'Erfahrung & Kenntnisse' },
  { icon: FileText, label: 'Vertragsbedingungen', description: 'AGB & Risikohinweise' },
];

export default function InvestmentTab() {
  return (
    <PageShell>
      <ModulePageHeader title="Investment" description="Depot-Verwaltung über Upvest — Wertpapiere, ETFs und mehr" />

      <div className={RECORD_CARD.GRID}>
        {/* Main Empty State Card */}
        <div className="md:col-span-2">
          <Card className="glass-card">
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Depot nicht verbunden</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Verbinden Sie Ihr Investment-Depot über Upvest, um Ihr Portfolio, Positionen und Transaktionen hier einzusehen.
                </p>
                <Button disabled className="gap-2">
                  <Lock className="h-4 w-4" />
                  Upvest verbinden (demnächst)
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Powered by Upvest Investment API
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onboarding Stepper */}
      <Card className="glass-card mt-2">
        <CardContent className="py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Onboarding-Schritte
          </p>
          <div className="space-y-4">
            {ONBOARDING_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Circle className="h-5 w-5 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prepared Connected State Preview */}
      <div className="mt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Nach Verbindung verfügbar
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BarChart3, label: 'Depot-Übersicht', desc: 'Portfolio-Wert & Cash' },
            { icon: TrendingUp, label: 'Positionen', desc: 'ISIN, Stücke, Wert' },
            { icon: ArrowRight, label: 'Transaktionen', desc: 'Kauf/Verkauf Historie' },
            { icon: FileText, label: 'Reports', desc: 'Statements & DMS' },
          ].map((item, i) => (
            <Card key={i} className="glass-card opacity-50">
              <CardContent className="p-4 text-center">
                <item.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground/60">{item.label}</p>
                <p className="text-xs text-muted-foreground/40">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
