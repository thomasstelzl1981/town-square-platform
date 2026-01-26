import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqItems = [
  {
    category: 'Allgemein',
    questions: [
      {
        q: 'Was ist System of a Town?',
        a: 'System of a Town ist eine Software für Immobilienverwaltung. Sie bringt Ordnung in Dokumente, Objekte, Mietthemen und Prozesse – unterstützt durch KI.'
      },
      {
        q: 'Für wen ist die Software geeignet?',
        a: 'Für Vermieter (privat oder semi-professionell), Portfoliohalter mit mehreren Objekten und Teams, die ihre Immobilienverwaltung digitalisieren möchten.'
      },
      {
        q: 'Brauche ich technische Vorkenntnisse?',
        a: 'Nein. Die Software ist so gestaltet, dass Sie ohne IT-Kenntnisse sofort loslegen können.'
      },
      {
        q: 'Kann ich die Software kostenlos testen?',
        a: 'Ja. Der Starter-Plan ist dauerhaft kostenlos und enthält alle Grundfunktionen für bis zu 3 Objekte.'
      }
    ]
  },
  {
    category: 'Module & Funktionen',
    questions: [
      {
        q: 'Welche Module gibt es?',
        a: 'Es gibt 8 Module: Stammdaten, KI Office, DMS, Immobilien, MSV, Verkauf, Finanzierung und Investment-Suche.'
      },
      {
        q: 'Was ist das DMS?',
        a: 'Das Dokumentenmanagementsystem (DMS) ermöglicht die zentrale Ablage, Suche und Freigabe aller Dokumente – inklusive automatischem Posteingang.'
      },
      {
        q: 'Was macht das KI Office?',
        a: 'Das KI Office unterstützt Sie mit intelligenter Textgenerierung, Aufgabenmanagement und kontextbezogenen Vorschlägen.'
      },
      {
        q: 'Was ist MSV?',
        a: 'MSV steht für Mietsonderverwaltung. Hier verwalten Sie Mieter, Verträge, Zahlungen und Nebenkostenabrechnungen.'
      }
    ]
  },
  {
    category: 'Daten & Sicherheit',
    questions: [
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'Alle Daten werden verschlüsselt in zertifizierten Rechenzentren in Deutschland gespeichert.'
      },
      {
        q: 'Wer hat Zugriff auf meine Daten?',
        a: 'Nur Sie und von Ihnen autorisierte Nutzer. Wir haben keinen Zugriff auf Ihre Inhalte.'
      },
      {
        q: 'Kann ich meine Daten exportieren?',
        a: 'Ja, Sie können jederzeit alle Ihre Daten exportieren – als strukturierte Dateien oder Dokumente.'
      },
      {
        q: 'Was passiert bei Kündigung?',
        a: 'Nach Kündigung können Sie Ihre Daten 30 Tage lang exportieren. Danach werden sie vollständig gelöscht.'
      }
    ]
  },
  {
    category: 'Erste Schritte',
    questions: [
      {
        q: 'Wie starte ich?',
        a: 'Registrieren Sie sich kostenlos, legen Sie Ihr erstes Objekt an und verbinden Sie optional Ihren Posteingang.'
      },
      {
        q: 'Wie lange dauert die Einrichtung?',
        a: 'Die Grundeinrichtung dauert etwa 10 Minuten. Für die vollständige Datenmigration planen Sie je nach Umfang 1-2 Stunden.'
      },
      {
        q: 'Gibt es eine Anleitung?',
        a: 'Ja, im Portal finden Sie Schritt-für-Schritt-Anleitungen und Video-Tutorials für alle Module.'
      },
      {
        q: 'Kann ich Unterstützung bekommen?',
        a: 'Im Starter-Plan per E-Mail, in höheren Plänen mit Prioritäts-Support und optional persönlichem Onboarding.'
      }
    ]
  }
];

export default function SotFAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="sot-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Häufige Fragen</h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Finden Sie Antworten auf die wichtigsten Fragen zu System of a Town.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container max-w-3xl">
          {faqItems.map((category, catIndex) => (
            <div key={catIndex} className="mb-8">
              <h2 className="zone3-heading-3 mb-4">{category.category}</h2>
              <div className="space-y-2">
                {category.questions.map((item, qIndex) => {
                  const id = `${catIndex}-${qIndex}`;
                  const isOpen = openItems.includes(id);
                  return (
                    <div key={id} className="zone3-card overflow-hidden">
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-black/5 transition-colors"
                      >
                        <span className="font-medium">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-black/70">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-4">Noch Fragen?</h2>
          <p className="zone3-text-large mb-8 max-w-xl mx-auto">
            Starten Sie kostenlos und erkunden Sie die Plattform selbst – oder kontaktieren Sie uns.
          </p>
          <Link to="/auth?source=sot" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
