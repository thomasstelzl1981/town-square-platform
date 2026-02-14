/**
 * MOD-18 Finanzanalyse — Tab 4: Risiko & Absicherung
 * Versicherungskostenquote, Coverage Snapshot, Vorsorge-Teaser
 * KEIN Investment-Stub
 */
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert,
  HeartPulse, Banknote, ExternalLink, Users, PiggyBank
} from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

const INSURANCE_TYPES = [
  { key: 'haftpflicht', label: 'Privathaftpflicht', essential: true },
  { key: 'hausrat', label: 'Hausratversicherung', essential: true },
  { key: 'wohngebaeude', label: 'Wohngebäudeversicherung', essential: false },
  { key: 'kranken', label: 'Krankenversicherung', essential: true },
  { key: 'kfz', label: 'KFZ-Versicherung', essential: false },
  { key: 'berufsunfaehigkeit', label: 'Berufsunfähigkeit', essential: true },
  { key: 'rechtsschutz', label: 'Rechtsschutzversicherung', essential: false },
  { key: 'unfall', label: 'Unfallversicherung', essential: false },
];

export default function RisikoAbsicherungTab() {
  const { kpis } = useFinanzanalyseData();
  const navigate = useNavigate();

  const insuranceRatio = kpis.totalExpenses > 0 ? (kpis.insuranceMonthlyCost / (kpis.totalExpenses / 12)) * 100 : 0;
  const coveredTypes: string[] = [];
  const essentialMissing = INSURANCE_TYPES.filter(t => t.essential && !coveredTypes.includes(t.key));

  return (
    <PageShell>
      {/* KPI Row */}
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

      {/* Versicherungs-Check */}
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
                    {isCovered ? 'Erkannt' : 'Nicht erkannt'}
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
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/portal/finanzierungsmanager')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Versicherungen im Finanzmanager verwalten
          </Button>
        </CardContent>
      </Card>

      {/* Vorsorge & Rente Teaser */}
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
              Hinterlegen Sie Ihre DRV-Renteninformation unter „Übersicht → Personen" für eine Vorsorge-Prognose.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/portal/finanzierungsmanager')}>
              Finanzmanager öffnen
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
