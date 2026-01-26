import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqItems = [
  {
    category: 'Allgemein',
    questions: [
      {
        q: 'Was ist Kaufy?',
        a: 'Kaufy ist eine Plattform für Kapitalanlage-Immobilien. Hier können Investoren Objekte finden, Berater ihre Kunden professionell beraten, und Anbieter ihre Immobilien vermarkten.'
      },
      {
        q: 'Für wen ist Kaufy geeignet?',
        a: 'Kaufy richtet sich an Kapitalanlageberater und Vertriebe, gewerbliche Anbieter (Aufteiler, Bauträger) sowie Endkunden, die in Immobilien investieren möchten.'
      },
      {
        q: 'Ist die Nutzung kostenlos?',
        a: 'Die Registrierung und Grundfunktionen sind kostenlos. Für erweiterte Funktionen und den Zugang zum Partnernetzwerk können Gebühren anfallen.'
      }
    ]
  },
  {
    category: 'Module & Funktionen',
    questions: [
      {
        q: 'Welche Module gibt es?',
        a: 'Kaufy bietet 10 Module: Stammdaten, KI Office, DMS, Immobilien, MSV, Verkauf, Finanzierung, Investment-Suche, Vertriebspartner und Leadgenerierung.'
      },
      {
        q: 'Wie funktioniert die Investment-Suche?',
        a: 'Sie können nach Kapitalanlage-Immobilien suchen, Ergebnisse filtern, Objekte favorisieren und Renditeberechnungen durchführen.'
      },
      {
        q: 'Was ist das DMS?',
        a: 'Das Dokumentenmanagementsystem (DMS) ermöglicht die zentrale Ablage, Suche und Freigabe aller Dokumente – mit automatischem Posteingang.'
      }
    ]
  },
  {
    category: 'Für Partner',
    questions: [
      {
        q: 'Wie werde ich Vertriebspartner?',
        a: 'Registrieren Sie sich, laden Sie Ihre Nachweise (§34c, VSH) hoch und durchlaufen Sie den Verifizierungsprozess. Nach Freigabe erhalten Sie vollen Zugang.'
      },
      {
        q: 'Was bedeutet §34c?',
        a: 'Die Erlaubnis nach §34c GewO berechtigt zur Vermittlung von Immobilien. Diese ist Voraussetzung für die Partnerschaft.'
      },
      {
        q: 'Wie funktioniert die Lead-Verteilung?',
        a: 'Qualifizierte Leads werden über den Lead-Pool an verifizierte Partner verteilt. Sie können Leads annehmen, bearbeiten und durch Ihre Pipeline führen.'
      },
      {
        q: 'Wie werden Provisionen abgerechnet?',
        a: 'Provisionsvereinbarungen werden pro Objekt dokumentiert. Nach erfolgreichem Abschluss werden Provisionen transparent abgerechnet.'
      }
    ]
  },
  {
    category: 'Für Anbieter',
    questions: [
      {
        q: 'Wie stelle ich Objekte ein?',
        a: 'Im Verkaufsmodul können Sie Objekte anlegen, Daten und Dokumente hochladen und für das Partnernetzwerk freigeben.'
      },
      {
        q: 'Wie erreiche ich Vertriebspartner?',
        a: 'Freigegebene Objekte werden im Objektkatalog für verifizierte Partner sichtbar. Partner können Anfragen stellen und Reservierungen vornehmen.'
      },
      {
        q: 'Welche Unterlagen benötige ich?',
        a: 'Grundbuchauszug, Teilungserklärung, Mieterlisten, Grundrisse, Energieausweis und ggf. weitere Objektdokumente.'
      }
    ]
  },
  {
    category: 'Sicherheit & Datenschutz',
    questions: [
      {
        q: 'Wie sicher sind meine Daten?',
        a: 'Alle Daten werden verschlüsselt übertragen und gespeichert. Der Zugriff erfolgt rollenbasiert und ist auf berechtigte Nutzer beschränkt.'
      },
      {
        q: 'Wer hat Zugriff auf meine Dokumente?',
        a: 'Nur Sie und von Ihnen freigegebene Personen. Für Vertriebsfreigaben können Sie gezielt Dokumente für Partner sichtbar machen.'
      }
    ]
  }
];

export default function KaufyFAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="kaufy-theme">
      {/* Hero */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">Häufige Fragen</h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Finden Sie Antworten auf die wichtigsten Fragen zu Kaufy.
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
            Registrieren Sie sich und erkunden Sie die Plattform selbst – oder kontaktieren Sie uns.
          </p>
          <Link to="/auth?source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Kostenlos starten
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
