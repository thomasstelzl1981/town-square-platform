/**
 * MOD-18 Finanzanalyse — Seite D: Risiko & Absicherung + Investment Stub
 * Versicherungskostenquote, Coverage Snapshot, DRV Quick-View, Investment-Stub
 */
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert,
  HeartPulse, Banknote, TrendingUp, Lock,
  ExternalLink, Users, PiggyBank
} from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

// Standard-Versicherungskategorien für Coverage Check
const INSURANCE_TYPES = [
  { key: 'haftpflicht', label: 'Privathaftpflicht', essential: true },
  { key: 'hausrat', label: 'Hausratversicherung', essential: true },
  { key: 'wohngebaeude', label: 'Wohngebäudeversicherung', essential: false },
  { key: 'berufsunfaehigkeit', label: 'Berufsunfähigkeit', essential: true },
  { key: 'kranken', label: 'Krankenversicherung', essential: true },
  { key: 'rechtsschutz', label: 'Rechtsschutzversicherung', essential: false },
  { key: 'kfz', label: 'KFZ-Versicherung', essential: false },
  { key: 'unfall', label: 'Unfallversicherung', essential: false },
];

export default function EinstellungenTile() {
  const { kpis, isLoading } = useFinanzanalyseData();
  const navigate = useNavigate();

  // D1: Versicherungskostenquote
  const insuranceRatio = kpis.totalExpenses > 0 ? (kpis.insuranceMonthlyCost / (kpis.totalExpenses / 12)) * 100 : 0;

  // D2: Coverage — derzeit Platzhalter (echte Daten kommen aus fm_insurance_contracts)
  const coveredTypes: string[] = []; // Wird befüllt wenn fm_insurance_contracts existiert
  const essentialMissing = INSURANCE_TYPES.filter(t => t.essential && !coveredTypes.includes(t.key));

  return (
    <PageShell>
      <ModulePageHeader title="Risiko & Absicherung" description="Versicherungscheck und Vorsorge-Überblick" />

      {/* D1: Versicherungskostenquote */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{fmt(kpis.insuranceMonthlyCost)}</p>
            <p className="text-xs text-muted-foreground">Versicherungen / Monat</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Banknote className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{insuranceRatio.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Anteil an Ausgaben</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <HeartPulse className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{coveredTypes.length}/{INSURANCE_TYPES.length}</p>
            <p className="text-xs text-muted-foreground">Abdeckung</p>
          </CardContent>
        </Card>
      </div>

      {/* D2: Coverage Snapshot */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Versicherungs-Check
          </CardTitle>
          <CardDescription>Überblick über Ihre Absicherung</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INSURANCE_TYPES.map(type => {
              const isCovered = coveredTypes.includes(type.key);
              return (
                <div key={type.key} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {isCovered ? (
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    ) : type.essential ? (
                      <ShieldX className="h-5 w-5 text-destructive" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{type.label}</p>
                      {type.essential && <Badge variant="outline" className="text-xs">Essentiell</Badge>}
                    </div>
                  </div>
                  <Badge variant={isCovered ? 'default' : type.essential ? 'destructive' : 'secondary'}>
                    {isCovered ? 'Aktiv' : 'Nicht erkannt'}
                  </Badge>
                </div>
              );
            })}
          </div>
          {essentialMissing.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">
                {essentialMissing.length} essentielle Versicherung(en) nicht erkannt
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Verbinden Sie Ihre Versicherungsdaten im Finanzmanager für einen vollständigen Check.
              </p>
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/portal/finanzierung')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Versicherungen im Finanzmanager verwalten
          </Button>
        </CardContent>
      </Card>

      {/* D3: Personen & Vorsorge (DRV) Quick-View */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vorsorge & Rente
          </CardTitle>
          <CardDescription>DRV-Daten und Altersvorsorge</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <PiggyBank className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Noch keine Vorsorgedaten hinterlegt.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Importieren Sie Ihre DRV-Daten im Finanzmanager für eine Altersvorsorge-Prognose.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/portal/finanzierung')}>
              Finanzmanager öffnen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* E-Stub: Investment Analyse */}
      <Card className="mt-6 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Investment-Analyse
            <Badge variant="secondary">Bald verfügbar</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Die Investment-Analyse wird in einer zukünftigen Version verfügbar sein.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Verbinden Sie Ihr Depot im Finanzmanager, um sich für den Beta-Zugang vorzumerken.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
