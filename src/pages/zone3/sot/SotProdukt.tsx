import { Link } from 'react-router-dom';
import { ArrowRight, Check, Layers, Zap, Shield, Clock } from 'lucide-react';

export default function SotProdukt() {
  const principles = [
    {
      icon: Layers,
      title: 'Alles an einem Ort',
      description: 'Dokumente, Objekte, Kontakte und Prozesse – zentral und vernetzt.'
    },
    {
      icon: Zap,
      title: 'KI-unterstützt',
      description: 'Intelligente Automatisierung für wiederkehrende Aufgaben.'
    },
    {
      icon: Shield,
      title: 'Sicher & privat',
      description: 'Ihre Daten bleiben Ihre Daten. Volle Kontrolle, volle Transparenz.'
    },
    {
      icon: Clock,
      title: 'Zeitgewinn',
      description: 'Weniger Suchen, weniger Chaos, mehr Zeit für das Wesentliche.'
    }
  ];

  return (
    <div className="sot-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Die Software für Immobilienverwaltung</h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            System of a Town bringt Ordnung in Ihre Immobilienverwaltung – mit 8 Modulen für Dokumente, Objekte, Mietthemen und mehr.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/auth?source=sot" className="zone3-btn-primary inline-flex items-center gap-2">
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/sot/module" className="zone3-btn-secondary">
              Module ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Unsere Prinzipien</h2>
          <div className="zone3-grid-2">
            {principles.map((p, i) => (
              <div key={i} className="zone3-card p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                  <p.icon className="w-6 h-6" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <h3 className="zone3-heading-3 mb-2">{p.title}</h3>
                <p className="zone3-text-small">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution → Outcome */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="zone3-card p-8 border-red-200">
              <h3 className="zone3-heading-3 mb-4 text-red-600">Das Problem</h3>
              <ul className="space-y-2 zone3-text-small">
                <li>• Dokumente über mehrere Ordner verteilt</li>
                <li>• Posteingang unübersichtlich</li>
                <li>• Keine Übersicht über Mietverträge</li>
                <li>• Prozesse nicht nachvollziehbar</li>
                <li>• Zeitverlust durch Suchen</li>
              </ul>
            </div>
            <div className="zone3-card p-8" style={{ borderColor: 'hsl(var(--z3-accent))' }}>
              <h3 className="zone3-heading-3 mb-4" style={{ color: 'hsl(var(--z3-accent))' }}>Die Lösung</h3>
              <ul className="space-y-2 zone3-text-small">
                <li>• Zentrales Dokumentenmanagement</li>
                <li>• Automatischer Posteingang</li>
                <li>• Strukturierte Objektverwaltung</li>
                <li>• KI-unterstützte Prozesse</li>
                <li>• Einheitliches System</li>
              </ul>
            </div>
            <div className="zone3-card p-8 border-green-200">
              <h3 className="zone3-heading-3 mb-4 text-green-600">Das Ergebnis</h3>
              <ul className="space-y-2 zone3-text-small">
                <li>• Alles sofort auffindbar</li>
                <li>• Weniger Verwaltungsaufwand</li>
                <li>• Bessere Entscheidungen</li>
                <li>• Mehr Transparenz</li>
                <li>• Zeit für das Wesentliche</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">So funktioniert es</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold" style={{ backgroundColor: 'hsl(var(--z3-accent))' }}>1</div>
              <h3 className="font-medium mb-2">Registrieren</h3>
              <p className="zone3-text-small">Kostenloses Konto erstellen</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold" style={{ backgroundColor: 'hsl(var(--z3-accent))' }}>2</div>
              <h3 className="font-medium mb-2">Einrichten</h3>
              <p className="zone3-text-small">Objekte und Kontakte anlegen</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold" style={{ backgroundColor: 'hsl(var(--z3-accent))' }}>3</div>
              <h3 className="font-medium mb-2">Dokumente</h3>
              <p className="zone3-text-small">Posteingang verbinden</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold" style={{ backgroundColor: 'hsl(var(--z3-accent))' }}>4</div>
              <h3 className="font-medium mb-2">Nutzen</h3>
              <p className="zone3-text-small">Ordnung genießen</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Bereit für strukturierte Verwaltung?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Starten Sie kostenlos und bringen Sie Ordnung in Ihre Immobilienverwaltung.
          </p>
          <Link to="/auth?source=sot" className="zone3-btn-primary inline-flex items-center gap-2">
            Jetzt starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
