/**
 * ARMSTRONG INFO PAGE — Internal portal page explaining Armstrong capabilities
 * Route: /portal/armstrong
 */

import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, Zap, Shield, CreditCard, 
  CheckCircle, ArrowRight, Brain,
  FileText, Building2, Search, Mic,
  Calculator, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Free actions users can do
const freeActions = [
  { icon: Brain, label: 'Begriffe erklären', desc: 'Immobilien- und Finanzbegriffe verständlich erklärt' },
  { icon: FileText, label: 'FAQ beantworten', desc: 'Häufige Fragen zu Plattform und Prozessen' },
  { icon: Building2, label: 'Modul-Onboarding', desc: 'Erklärt wie ein Modul funktioniert' },
  { icon: Calculator, label: 'Rendite berechnen', desc: 'Brutto-, Netto- und Eigenkapitalrendite' },
  { icon: Calculator, label: 'Tilgung berechnen', desc: 'Tilgungsplan und Restschuld' },
  { icon: Calculator, label: 'Belastung berechnen', desc: 'Monatliche Netto-Belastung nach Steuern' },
];

const creditActions = [
  { icon: Globe, label: 'Web-Recherche', cost: '5 Ct', desc: 'Recherche mit Quellennachweis' },
  { icon: FileText, label: 'Dokument analysieren', cost: '1 Credit', desc: 'Zusammenfassung & Extraktion' },
  { icon: Building2, label: 'Immobilie anlegen', cost: '1 Credit', desc: 'Strukturierte Datenerfassung' },
  { icon: Search, label: 'Datenqualitäts-Check', cost: '1 Credit', desc: 'Prüfung auf Vollständigkeit' },
  { icon: Mic, label: 'Spracheingabe', cost: '1 Credit', desc: 'Aufgaben & Notizen per Stimme' },
  { icon: FileText, label: 'Landing Page generieren', cost: '5 Credits', desc: 'KI-generierte Verkaufsseite' },
];

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

      {/* Kostenlos */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Kostenlos verfügbar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freeActions.map((action) => (
              <div key={action.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <action.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credit-Aktionen */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Mit Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creditActions.map((action) => (
              <div key={action.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <action.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{action.label}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{action.cost}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Kosten werden immer vorab angezeigt. Sie entscheiden vor jeder Ausführung.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="glass-card border-primary/20">
        <CardContent className="pt-6 text-center space-y-3">
          <h3 className="text-lg font-semibold">Bereit loszulegen?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Öffnen Sie den Armstrong-Chat über das Bot-Symbol unten rechts — und stellen Sie Ihre erste Frage. Viele Aktionen sind kostenlos.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
