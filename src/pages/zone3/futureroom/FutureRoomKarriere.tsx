import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronRight, TrendingUp, Users, Building2, 
  Award, Clock, Wallet 
} from 'lucide-react';

export default function FutureRoomKarriere() {
  const benefits = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Attraktive Provisionen',
      description: 'Verdienen Sie an jeder vermittelten Finanzierung mit transparentem Provisionsmodell.',
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Zugang zu 400+ Banken',
      description: 'Nutzen Sie unser Netzwerk zu über 400 Finanzierungspartnern.',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Flexible Arbeitszeiten',
      description: 'Arbeiten Sie selbstständig und gestalten Sie Ihren Arbeitsalltag.',
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Professionelles Tooling',
      description: 'Moderne Plattform mit automatisierter Dokumentenprüfung und Statusverfolgung.',
    },
  ];

  const requirements = [
    'IHK-Zulassung als Immobiliardarlehensvermittler (§34i GewO)',
    'Erfahrung in der Finanzierungsberatung',
    'Eigenständige und kundenorientierte Arbeitsweise',
    'Affinität zu digitalen Tools',
  ];

  return (
    <div>
      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm mb-6">
              <Users className="h-4 w-4" />
              Karriere bei FutureRoom
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Werden Sie{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Finanzierungsmanager
              </span>
            </h1>
            <p className="text-xl text-white/70 mb-8">
              Profitieren Sie von unserer Plattform und unserem Netzwerk. 
              Begleiten Sie Kunden auf dem Weg zur Immobilienfinanzierung.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900">
              Jetzt bewerben
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ihre Vorteile</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-amber-400 mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-white/60">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Anforderungen</h2>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ChevronRight className="h-4 w-4 text-amber-400" />
                      </div>
                      <span className="text-white/80">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Bereit für den nächsten Schritt?</h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Senden Sie uns Ihre Bewerbung und werden Sie Teil des FutureRoom-Teams.
              </p>
              <Button size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900">
                Bewerbung starten
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
