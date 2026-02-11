/**
 * SoT FAQ — Dark Premium FAQ Page
 */
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';

const faqItems = [
  {
    category: 'Allgemein',
    questions: [
      {
        q: 'Was ist System of a Town?',
        a: 'System of a Town ist eine Software für Immobilienverwaltung. Sie bringt Ordnung in Dokumente, Objekte, Mietthemen und Prozesse — unterstützt durch KI.',
      },
      {
        q: 'Für wen ist die Software geeignet?',
        a: 'Für Vermieter (privat oder semi-professionell), Portfoliohalter mit mehreren Objekten und Teams, die ihre Immobilienverwaltung digitalisieren möchten.',
      },
      {
        q: 'Brauche ich technische Vorkenntnisse?',
        a: 'Nein. Die Software ist so gestaltet, dass Sie ohne IT-Kenntnisse sofort loslegen können.',
      },
      {
        q: 'Kann ich die Software kostenlos testen?',
        a: 'Ja. Der Starter-Plan ist dauerhaft kostenlos und enthält alle Grundfunktionen für bis zu 3 Objekte.',
      },
    ],
  },
  {
    category: 'Module & Funktionen',
    questions: [
      {
        q: 'Welche Module gibt es?',
        a: 'Es gibt über 15 Module: Stammdaten, KI Office, DMS, Immobilien, MSV, Verkauf, Finanzierung, Investment-Suche, Projekte, Buchhaltung und mehr.',
      },
      {
        q: 'Was ist das DMS?',
        a: 'Das Dokumentenmanagementsystem (DMS) ermöglicht die zentrale Ablage, Suche und Freigabe aller Dokumente — inklusive automatischem Posteingang.',
      },
      {
        q: 'Was macht das KI Office?',
        a: 'Das KI Office unterstützt Sie mit intelligenter Textgenerierung, Aufgabenmanagement und kontextbezogenen Vorschlägen durch Armstrong, unseren KI-Assistenten.',
      },
      {
        q: 'Was ist MSV?',
        a: 'MSV steht für Mietsonderverwaltung. Hier verwalten Sie Mieter, Verträge, Zahlungen und Nebenkostenabrechnungen.',
      },
    ],
  },
  {
    category: 'Daten & Sicherheit',
    questions: [
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'Alle Daten werden verschlüsselt in zertifizierten Rechenzentren in Deutschland gespeichert.',
      },
      {
        q: 'Wer hat Zugriff auf meine Daten?',
        a: 'Nur Sie und von Ihnen autorisierte Nutzer. Wir haben keinen Zugriff auf Ihre Inhalte.',
      },
      {
        q: 'Kann ich meine Daten exportieren?',
        a: 'Ja, Sie können jederzeit alle Ihre Daten exportieren — als strukturierte Dateien oder Dokumente.',
      },
      {
        q: 'Was passiert bei Kündigung?',
        a: 'Nach Kündigung können Sie Ihre Daten 30 Tage lang exportieren. Danach werden sie vollständig gelöscht.',
      },
    ],
  },
  {
    category: 'Erste Schritte',
    questions: [
      {
        q: 'Wie starte ich?',
        a: 'Registrieren Sie sich kostenlos, legen Sie Ihr erstes Objekt an und verbinden Sie optional Ihren Posteingang.',
      },
      {
        q: 'Wie lange dauert die Einrichtung?',
        a: 'Die Grundeinrichtung dauert etwa 10 Minuten. Für die vollständige Datenmigration planen Sie je nach Umfang 1-2 Stunden.',
      },
      {
        q: 'Gibt es eine Anleitung?',
        a: 'Ja, im Portal finden Sie Schritt-für-Schritt-Anleitungen und Video-Tutorials für alle Module.',
      },
      {
        q: 'Kann ich Unterstützung bekommen?',
        a: 'Im Starter-Plan per E-Mail, in höheren Plänen mit Prioritäts-Support und optional persönlichem Onboarding.',
      },
    ],
  },
];

export default function SotFAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { ref: heroRef, isVisible: heroVisible } = useSotScrollAnimation();

  const toggleItem = (id: string) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 sot-atmosphere relative">
        <div className="absolute inset-0 sot-grid-pattern opacity-10" />
        <div
          ref={heroRef}
          className={`zone3-container relative z-10 text-center sot-fade-in ${heroVisible ? 'visible' : ''}`}
        >
          <span className="sot-label mb-4 inline-block" style={{ color: 'hsl(var(--z3-accent))' }}>
            FAQ
          </span>
          <h1 className="sot-display mb-6">Häufige Fragen.</h1>
          <p className="sot-subheadline max-w-2xl mx-auto">
            Finden Sie Antworten auf die wichtigsten Fragen zu System of a Town.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-24">
        <div className="zone3-container max-w-4xl">
          {faqItems.map((category, catIndex) => {
            const CategorySection = () => {
              const { ref, isVisible } = useSotScrollAnimation();
              
              return (
                <div
                  ref={ref}
                  className={`mb-12 sot-fade-in ${isVisible ? 'visible' : ''}`}
                >
                  <h2 className="text-xl font-bold mb-6">{category.category}</h2>
                  <div className="space-y-3">
                    {category.questions.map((item, qIndex) => {
                      const id = `${catIndex}-${qIndex}`;
                      const isOpen = openItems.includes(id);
                      return (
                        <div
                          key={id}
                          className="sot-glass-card overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(id)}
                            className="w-full px-6 py-5 text-left flex items-center justify-between transition-colors hover:bg-[hsl(var(--z3-secondary))]"
                          >
                            <span className="font-medium pr-4">{item.q}</span>
                            <ChevronDown
                              className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              style={{ color: 'hsl(var(--z3-muted-foreground))' }}
                            />
                          </button>
                          {isOpen && (
                            <div
                              className="px-6 pb-5 text-sm"
                              style={{ color: 'hsl(var(--z3-muted-foreground))' }}
                            >
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            };
            
            return <CategorySection key={catIndex} />;
          })}
          
          {/* Contact CTA */}
          <div className="text-center mt-16 sot-glass-card p-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--z3-accent))' }} />
            <h3 className="text-xl font-bold mb-2">Noch Fragen?</h3>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
              Kontaktieren Sie uns — wir helfen gerne.
            </p>
            <Link to="/website/sot/kontakt" className="sot-btn-secondary">
              Kontakt aufnehmen
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <SotCTA variant="minimal" />
    </div>
  );
}