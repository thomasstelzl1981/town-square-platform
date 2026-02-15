/**
 * Finance Desk — Zone-1 Operative Desk für private Finanzberatung
 * 
 * Zweck: Lead-Generierung für persönliche Finanzberatung (Video/Termin).
 * Schwerpunkte: Stiftungen, Vermögensschutz, Generationenvermögen,
 *               gewerbliche Versicherungen, Finanzierungen.
 * Flow: Z3 (Website) → Z1 (Finance Desk) → Z2 (Manager-Account)
 */
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Landmark, Users, Video, Shield, Building2,
  HeartHandshake, TrendingUp, ArrowRight, Inbox
} from 'lucide-react';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';

const BERATUNGSFELDER = [
  { icon: Landmark, label: 'Stiftungen', desc: 'Stiftungsgründung & -verwaltung' },
  { icon: Shield, label: 'Vermögensschutz', desc: 'Asset Protection & Strukturierung' },
  { icon: HeartHandshake, label: 'Generationenvermögen', desc: 'Generationsübergreifender Vermögenserhalt' },
  { icon: Building2, label: 'Gewerbliche Versicherungen', desc: 'Betriebliche Versicherungskonzepte' },
  { icon: TrendingUp, label: 'Finanzierungen', desc: 'Privat- & Investitionsfinanzierungen' },
];

// TODO: Replace with live query from leads table
const MOCK_KPIS: DeskKPI[] = [
  { label: 'Offene Anfragen', value: 0, icon: Inbox, color: 'text-amber-500' },
  { label: 'Zugewiesen', value: 0, icon: Users, color: 'text-primary' },
  { label: 'In Beratung', value: 0, icon: Video, color: 'text-emerald-500' },
  { label: 'Abgeschlossen', value: 0, icon: Shield, color: 'text-muted-foreground' },
];

export default function FinanceDesk() {
  return (
    <OperativeDeskShell
      title="Finance Desk"
      subtitle="Private Finanzberatung — Lead-Zuweisung & Terminierung"
      moduleCode="MOD-18"
      zoneFlow={{
        z3Surface: 'Website / Portal',
        z1Desk: 'Finance Desk',
        z2Manager: 'Finanzberater (Manager)',
      }}
      kpis={MOCK_KPIS}
    >
      {/* Beratungsangebot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5 text-primary" />
            Persönliche Finanzberatung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nutzer können über das Portal oder die Website eine persönliche Finanzberatung per
            Videotermin anfragen. Eingehende Leads erscheinen hier und können an Berater mit
            Manager-Accounts zugewiesen werden.
          </p>

          {/* Beratungsfelder Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BERATUNGSFELDER.map((feld) => (
              <div
                key={feld.label}
                className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <feld.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feld.label}</p>
                  <p className="text-xs text-muted-foreground">{feld.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lead-Flow Erklärung */}
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="shrink-0">Lead-Flow</Badge>
            <span>Anfrage via Website/Portal</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span>Finance Desk (Triage)</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span>Zuweisung an Berater</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span>Videoberatung</span>
          </div>
        </CardContent>
      </Card>
    </OperativeDeskShell>
  );
}
