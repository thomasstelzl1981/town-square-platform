/**
 * ARMSTRONG INFO PAGE — Internal portal page explaining Armstrong capabilities
 * Route: /portal/armstrong
 */

import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, Zap, Shield, CreditCard, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  { num: '1', title: 'Frage stellen', desc: 'Beschreiben Sie, was Sie brauchen — in Ihren Worten.' },
  { num: '2', title: 'Plan prüfen', desc: 'Armstrong zeigt, was er tun wird und was es kostet. Nichts passiert ohne Ihre Freigabe.' },
  { num: '3', title: 'Ausführen', desc: 'Nach Bestätigung führt Armstrong die Aktion aus — nachvollziehbar und dokumentiert.' },
];

const usps = [
  { icon: CreditCard, title: 'Kein Abo', desc: 'Keine Grundgebühr. Viele Aktionen kostenlos. Credits nur bei echtem Mehrwert.' },
  { icon: Zap, title: 'Multi-Modul', desc: 'Ein Co-Pilot für alles: DMS, Immobilien, Finanzierung, Office, Verkauf und mehr.' },
  { icon: Shield, title: 'Datenschutz', desc: 'Ihre Daten bleiben in Ihrem Tenant. Kein Training, kein Weitergeben, keine Drittnutzung.' },
];

export default function ArmstrongInfoPage() {
  return (
    <PageShell>
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Armstrong — Ihr KI-Co-Pilot</h1>
            <p className="text-muted-foreground">Erklärt, analysiert und arbeitet für Sie. Direkt in jedem Modul.</p>
          </div>
        </div>
      </div>

      {/* Was Armstrong besonders macht */}
      <div className="grid gap-4 md:grid-cols-3">
        {usps.map((usp) => (
          <Card key={usp.title} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <usp.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{usp.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{usp.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wie Armstrong arbeitet — 3 Schritte */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Wie Armstrong arbeitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                  {step.num}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground/40 self-center ml-auto" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="glass-card border-primary/20">
        <CardContent className="pt-6 text-center space-y-3">
          <h3 className="text-lg font-semibold">Bereit loszulegen?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Öffnen Sie den Armstrong-Chat über das Bot-Symbol unten rechts — und stellen Sie Ihre erste Frage. Viele Aktionen sind kostenlos.
          </p>
          <Button asChild variant="outline">
            <Link to="/portal/stammdaten/abrechnung">
              <CreditCard className="h-4 w-4 mr-2" />
              Preise und Verbrauch ansehen
            </Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
