import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronRight, Shield, Clock, CheckCircle2, 
  TrendingUp, Building2, Users, Sparkles 
} from 'lucide-react';

export default function FutureRoomHome() {
  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Professionelle Prüfung',
      description: 'Ihre Unterlagen werden von erfahrenen Finanzierungsspezialisten geprüft.',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Schnelle Bearbeitung',
      description: 'Innerhalb von 48 Stunden erhalten Sie eine erste Einschätzung.',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Beste Konditionen',
      description: 'Zugang zu über 400 Finanzierungspartnern für optimale Konditionen.',
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: 'Transparenter Prozess',
      description: 'Verfolgen Sie den Status Ihrer Anfrage jederzeit online.',
    },
  ];

  const stats = [
    { value: '400+', label: 'Bankpartner' },
    { value: '2.500+', label: 'Vermittelte Finanzierungen' },
    { value: '98%', label: 'Erfolgsquote' },
    { value: '48h', label: 'Erste Einschätzung' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-400 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              Professionelle Finanzierungsvermittlung
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ihre Immobilienfinanzierung.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Einfach gemacht.
              </span>
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Starten Sie Ihren Bonitätscheck und erhalten Sie innerhalb von 48 Stunden 
              eine professionelle Einschätzung Ihrer Finanzierungsmöglichkeiten.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/futureroom/bonitat">
                <Button size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:from-amber-500 hover:to-orange-600 text-lg px-8">
                  Bonitätscheck starten
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/futureroom/karriere">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8">
                  Für Finanzberater
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Warum FutureRoom?</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Wir verbinden modernste Technologie mit persönlicher Beratung für 
              die beste Finanzierungslösung.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-amber-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">So einfach geht's</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: '1', title: 'Daten eingeben', description: 'Füllen Sie den Bonitätscheck aus – kostenlos und unverbindlich.' },
                { step: '2', title: 'Prüfung', description: 'Unsere Experten prüfen Ihre Unterlagen und finden passende Banken.' },
                { step: '3', title: 'Finanzierung', description: 'Sie erhalten die besten Angebote und schließen Ihre Finanzierung ab.' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-slate-900 mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Bereit für Ihre Finanzierung?</h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Starten Sie jetzt Ihren kostenlosen Bonitätscheck und erhalten Sie 
                innerhalb von 48 Stunden eine professionelle Einschätzung.
              </p>
              <Link to="/futureroom/bonitat">
                <Button size="lg" className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:from-amber-500 hover:to-orange-600">
                  Jetzt starten
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
