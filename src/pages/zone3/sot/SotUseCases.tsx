import { Link } from 'react-router-dom';
import { ArrowRight, Mail, FileText, Building2, MessageCircle, TrendingUp, Wallet } from 'lucide-react';

const useCases = [
  {
    icon: Mail,
    title: 'Posteingang digitalisieren',
    problem: 'Post landet auf dem Schreibtisch, geht unter, wird nicht zugeordnet.',
    solution: 'Automatischer digitaler Posteingang mit KI-Kategorisierung und Objektzuordnung.',
    outcome: 'Jedes Dokument ist sofort auffindbar und dem richtigen Objekt zugeordnet.',
    modules: ['MOD-03 DMS']
  },
  {
    icon: FileText,
    title: 'Dokumente finden',
    problem: 'Wichtige Unterlagen in verschiedenen Ordnern, E-Mails, Cloud-Speichern.',
    solution: 'Zentrales DMS mit Volltextsuche, Tags und automatischer Verknüpfung.',
    outcome: 'Jedes Dokument in Sekunden gefunden – egal wo es ursprünglich war.',
    modules: ['MOD-03 DMS', 'MOD-04 Immobilien']
  },
  {
    icon: Building2,
    title: 'Portfolio-Überblick',
    problem: 'Objektdaten verteilt in Excel, Ordnern, Notizen und E-Mails.',
    solution: 'Strukturierte Objektverwaltung mit Einheiten, Mietverträgen und Dokumenten.',
    outcome: 'Vollständige Transparenz über jedes Objekt auf einen Blick.',
    modules: ['MOD-04 Immobilien', 'MOD-05 MSV']
  },
  {
    icon: MessageCircle,
    title: 'Mieterkommunikation',
    problem: 'Anfragen per Telefon, E-Mail, Brief – keine Übersicht.',
    solution: 'Zentrale Kommunikation mit Verlauf, Zuordnung und Aufgabenerstellung.',
    outcome: 'Jede Anfrage dokumentiert, nichts geht verloren.',
    modules: ['MOD-05 MSV', 'MOD-02 KI Office']
  },
  {
    icon: TrendingUp,
    title: 'Verkaufsvorbereitung',
    problem: 'Bei Verkaufswunsch alle Unterlagen mühsam zusammensuchen.',
    solution: 'Verkaufsmodul mit Exposé-Erstellung, Dokumentenbündelung und Datenraum.',
    outcome: 'Verkaufsreife Unterlagen in Minuten statt Wochen.',
    modules: ['MOD-06 Verkauf', 'MOD-04 Immobilien']
  },
  {
    icon: Wallet,
    title: 'Finanzierungsfall',
    problem: 'Bank fordert Unterlagen an – langwieriges Zusammenstellen.',
    solution: 'Finanzierungsmodul mit Checkliste, Vollständigkeitsprüfung und Export.',
    outcome: 'Professionelle Finanzierungsunterlagen auf Knopfdruck.',
    modules: ['MOD-07 Finanzierung', 'MOD-03 DMS']
  }
];

export default function SotUseCases() {
  return (
    <div className="sot-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Anwendungsfälle</h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Konkrete Situationen aus dem Alltag – und wie System of a Town sie löst.
          </p>
        </div>
      </section>

      {/* Use Cases */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="space-y-8">
            {useCases.map((uc, i) => (
              <div key={i} className="zone3-card p-8">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.1)' }}>
                    <uc.icon className="w-7 h-7" style={{ color: 'hsl(var(--z3-accent))' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="zone3-heading-3 mb-4">{uc.title}</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs font-medium text-red-600 mb-1">Das Problem</p>
                        <p className="zone3-text-small">{uc.problem}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--z3-accent))' }}>Die Lösung</p>
                        <p className="zone3-text-small">{uc.solution}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-1">Das Ergebnis</p>
                        <p className="zone3-text-small">{uc.outcome}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {uc.modules.map((mod, j) => (
                        <span key={j} className="px-2 py-1 bg-black/5 rounded text-xs">{mod}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Welches Problem lösen wir für Sie?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Starten Sie kostenlos und erleben Sie selbst, wie einfach Verwaltung sein kann.
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
