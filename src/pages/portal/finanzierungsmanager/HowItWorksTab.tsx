import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  FileText, User, Send, CheckCircle2, 
  ArrowRight, Building2, Shield, Clock 
} from 'lucide-react';

export default function HowItWorksTab() {
  const steps = [
    {
      icon: <User className="h-6 w-6" />,
      title: 'Mandat annehmen',
      description: 'Sie erhalten Finanzierungsanfragen vom Plattform-Admin. Prüfen Sie die Unterlagen und nehmen Sie geeignete Mandate an.',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Selbstauskunft prüfen',
      description: 'Überprüfen und vervollständigen Sie die Selbstauskunft des Kunden. Der Bonitätswächter zeigt Ihnen Unstimmigkeiten an.',
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Bank auswählen',
      description: 'Wählen Sie passende Banken aus dem Kontaktverzeichnis und bereiten Sie die Einreichung vor.',
    },
    {
      icon: <Send className="h-6 w-6" />,
      title: 'Bei Bank einreichen',
      description: 'Reichen Sie die vollständigen Unterlagen bei der Bank ein und verfolgen Sie den Status.',
    },
  ];

  const benefits = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Automatische Prüfung',
      description: 'Der Bonitätswächter erkennt Unstimmigkeiten in den Unterlagen automatisch.',
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Zeitersparnis',
      description: 'Strukturierte Dokumentenablage und vorausgefüllte Formulare sparen Zeit.',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: 'Transparenz',
      description: 'Kunden und Partner sehen den aktuellen Status ihrer Anfrage in Echtzeit.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Process Steps */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Der Ablauf</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Schritt {index + 1}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ihre Vorteile</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Bereit loszulegen?</CardTitle>
          <CardDescription>
            Wechseln Sie zum Tab "Selbstauskunft", um Ihre aktiven Fälle zu bearbeiten, 
            oder prüfen Sie im "Status"-Tab den Fortschritt Ihrer eingereichten Anfragen.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
