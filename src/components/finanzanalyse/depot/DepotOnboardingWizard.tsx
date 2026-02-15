/**
 * DepotOnboardingWizard — 3-step depot opening flow (Upvest prep)
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Circle, User, ClipboardCheck, FileText, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { icon: User, label: 'Persönliche Daten', description: 'Identifikation & Kontaktdaten' },
  { icon: ClipboardCheck, label: 'Angemessenheitsprüfung', description: 'Erfahrung & Kenntnisse' },
  { icon: FileText, label: 'Vertragsbedingungen', description: 'AGB & Risikohinweise' },
];

export function DepotOnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState({ aktien: false, anleihen: false, fonds: false, zertifikate: false });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <Card className="glass-card">
        <CardContent className="py-16">
          <div className="flex flex-col items-center text-center max-w-sm mx-auto">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 animate-pulse">
              <Sparkles className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Depot erfolgreich eröffnet!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ihr Wertpapierdepot wurde angelegt. Sie können jetzt Ihre Positionen und Performance einsehen.
            </p>
            <Button onClick={onComplete} className="gap-2">
              Depot anzeigen <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stepper Sidebar */}
      <Card className="glass-card md:col-span-1">
        <CardContent className="py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Fortschritt</p>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${i < step ? 'bg-emerald-500/10' : i === step ? 'bg-primary/10' : 'bg-muted/40'}`}>
                  {i < step ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <s.icon className={`h-5 w-5 ${i === step ? 'text-primary' : 'text-muted-foreground/50'}`} />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                  <p className="text-xs text-muted-foreground/60">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="glass-card md:col-span-2">
        <CardContent className="py-6">
          <h2 className="text-lg font-bold mb-1">{STEPS[step].label}</h2>
          <p className="text-sm text-muted-foreground mb-6">{STEPS[step].description}</p>

          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-xs">Anrede</Label><Input defaultValue="Herr" className="mt-1" /></div>
              <div><Label className="text-xs">Nationalität</Label><Input defaultValue="Deutsch" className="mt-1" /></div>
              <div><Label className="text-xs">Vorname</Label><Input defaultValue="Max" className="mt-1" /></div>
              <div><Label className="text-xs">Nachname</Label><Input defaultValue="Mustermann" className="mt-1" /></div>
              <div><Label className="text-xs">E-Mail</Label><Input defaultValue="max@mustermann.de" className="mt-1" /></div>
              <div><Label className="text-xs">Geburtsdatum</Label><Input defaultValue="15.03.1985" className="mt-1" /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Haben Sie Erfahrung mit den folgenden Finanzinstrumenten?</p>
              {Object.entries(experience).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium capitalize">{key}</span>
                  <Switch checked={val} onCheckedChange={(v) => setExperience(prev => ({ ...prev, [key]: v }))} />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/20 text-sm text-muted-foreground leading-relaxed">
                Mit der Eröffnung eines Wertpapierdepots stimmen Sie den Allgemeinen Geschäftsbedingungen,
                den Sonderbedingungen für den Wertpapierhandel und der Datenschutzerklärung zu.
                Sie bestätigen, die Risikohinweise zur Kenntnis genommen zu haben.
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <span className="text-sm font-medium">AGB & Datenschutz akzeptieren</span>
                <Switch checked={termsAccepted} onCheckedChange={setTermsAccepted} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <span className="text-sm font-medium">Risikohinweise gelesen</span>
                <Switch checked={riskAccepted} onCheckedChange={setRiskAccepted} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(s => s + 1)} className="gap-2">
                Weiter <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setSuccess(true)} disabled={!termsAccepted || !riskAccepted} className="gap-2">
                Depot eröffnen <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
