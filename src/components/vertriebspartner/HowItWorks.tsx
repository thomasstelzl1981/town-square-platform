import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Heart, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HowItWorksProps {
  variant?: 'katalog' | 'beratung' | 'kunden' | 'network';
}

const steps = {
  katalog: [
    { icon: Filter, title: 'Filter setzen', description: 'Grenzen Sie nach Region, Preis oder Rendite ein.' },
    { icon: Heart, title: 'Objekte auswählen', description: 'Markieren Sie mit ♥ interessante Objekte für Ihre Kunden.' },
    { icon: Calculator, title: 'Beratung starten', description: 'Öffnen Sie ein Objekt in der Beratung und simulieren Sie live.' },
  ],
  beratung: [
    { icon: Filter, title: 'Objekt wählen', description: 'Wählen Sie ein Objekt aus Ihrem Katalog.' },
    { icon: Calculator, title: 'Simulation anpassen', description: 'Passen Sie Eigenkapital, Tilgung und Steuerdaten an.' },
    { icon: Heart, title: 'Deal starten', description: 'Speichern Sie die Beratung oder starten Sie einen Deal.' },
  ],
  kunden: [
    { icon: Filter, title: 'Kunden anlegen', description: 'Erfassen Sie neue Kunden mit Investment-Profil.' },
    { icon: Calculator, title: 'Beratungen dokumentieren', description: 'Verknüpfen Sie Objekte und Simulationen.' },
    { icon: Heart, title: 'Status pflegen', description: 'Behalten Sie den Überblick über alle Projekte.' },
  ],
  network: [
    { icon: Filter, title: 'Provisionen prüfen', description: 'Sehen Sie Ihre abgeschlossenen Deals.' },
    { icon: Calculator, title: 'Team erweitern', description: 'Laden Sie Partner in Ihr Netzwerk ein (Phase 2).' },
    { icon: Heart, title: 'Kunden einladen', description: 'Erstellen Sie Kundenportale (Phase 2).' },
  ],
};

const tips = {
  katalog: 'Tipp: Objekte, die Sie mit ♥ markieren, erscheinen direkt in der Beratung zur Auswahl.',
  beratung: 'Tipp: Speichern Sie Simulationen, um sie später mit Ihrem Kunden zu besprechen.',
  kunden: 'Tipp: Verknüpfen Sie Kunden mit Leads aus der Lead-Generierung für lückenlose Dokumentation.',
  network: 'Tipp: Ihre Provisionen werden automatisch nach Kaufabschluss berechnet.',
};

export function HowItWorks({ variant = 'katalog' }: HowItWorksProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentSteps = steps[variant];
  const currentTip = tips[variant];

  return (
    <Card className={cn(
      'border-dashed border-primary/30 bg-primary/5 transition-all duration-300',
      !isExpanded && 'bg-transparent border-transparent'
    )}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-sm text-muted-foreground">
          SO FUNKTIONIERT ES
        </h3>
        <Button variant="ghost" size="sm" className="h-6 px-2">
          {isExpanded ? (
            <>Ausblenden <ChevronUp className="ml-1 h-4 w-4" /></>
          ) : (
            <>Einblenden <ChevronDown className="ml-1 h-4 w-4" /></>
          )}
        </Button>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {currentSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-2">
                  <span className="font-bold text-sm">{idx + 1}</span>
                </div>
                <step.icon className="h-5 w-5 text-primary mb-2" />
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center italic">
            {currentTip}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
