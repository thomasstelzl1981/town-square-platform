/**
 * ARMSTRONG INFO PAGE — Feature-Übersicht & Aktionskatalog
 * Route: /portal/armstrong
 * Zeigt: Was Armstrong kann, wie er funktioniert, Aktionen & Preise, Add-Ons
 */

import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bot, Zap, Shield, CreditCard, ArrowRight, ChevronDown, Package, ListChecks
} from 'lucide-react';

import { SystemPreisliste } from '@/components/shared/SystemPreisliste';
import { EmailEnrichmentCard } from '@/components/shared/EmailEnrichmentCard';
import { WhatsAppArmstrongCard } from '@/components/shared/WhatsAppArmstrongCard';

import { AktionsKatalog } from '@/pages/portal/communication-pro/agenten/AktionsKatalog';
import { cn } from '@/lib/utils';

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

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-3 px-1 group cursor-pointer hover:bg-muted/30 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ArmstrongInfoPage() {
  return (
    <PageShell>
      {/* ─── HERO ─── */}
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

      {/* ─── USPs ─── */}
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

      <Separator />

      {/* ─── WIE ARMSTRONG ARBEITET — Collapsible, default geschlossen ─── */}
      <CollapsibleSection title="Wie Armstrong arbeitet" icon={Bot}>
        <Card className="glass-card">
          <CardContent className="pt-6">
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
      </CollapsibleSection>

      <Separator />

      {/* ─── AKTIONEN & PREISE — Konsolidiert, Collapsible ─── */}
      <CollapsibleSection title="Aktionen & Preise" icon={ListChecks}>
        <div className="space-y-6">
          <AktionsKatalog />
          <Separator />
          <SystemPreisliste />
        </div>
      </CollapsibleSection>

      <Separator />

      {/* ─── SERVICES & ADD-ONS — Collapsible ─── */}
      <CollapsibleSection title="Services & Add-Ons" icon={Package}>
        <div className="space-y-4">
          <EmailEnrichmentCard />
          <WhatsAppArmstrongCard />
        </div>
      </CollapsibleSection>

      {/* ─── CTA ─── */}
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
