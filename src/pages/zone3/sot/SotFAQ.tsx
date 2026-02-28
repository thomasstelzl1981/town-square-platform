/**
 * SoT FAQ — Häufige Fragen zur Digitalisierungsplattform
 */
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { SotCTA } from '@/components/zone3/sot';
import { useSotScrollAnimation } from '@/hooks/useSotScrollAnimation';
import { Brand } from '@/components/ui/brand';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

const faqItems = [
  {
    category: 'Allgemein',
    questions: [
      {
        q: 'Was ist System of a Town?',
        a: 'System of a Town ist eine Digitalisierungsplattform für Unternehmer, Vermieter und Teams. Mit 15+ Modulen organisieren Sie Immobilien, Finanzen, Fuhrpark, Dokumente, Kommunikation und mehr — alles an einem Ort, unterstützt durch den KI-Assistenten Armstrong.',
      },
      {
        q: 'Für wen ist die Plattform geeignet?',
        a: 'Für alle, die ihr Unternehmen oder ihre Vermögenswerte digital organisieren wollen: Vermieter (privat oder gewerblich), KMU-Inhaber, Selbstständige mit Fuhrpark, Teams die gemeinsam arbeiten, und alle, die endlich Ordnung in ihre Dokumente und Prozesse bringen wollen.',
      },
      {
        q: 'Brauche ich technische Vorkenntnisse?',
        a: 'Nein. System of a Town ist so gebaut, dass Sie ohne IT-Kenntnisse sofort loslegen können. Die KI-gestützte Einrichtung (Magic Intake) hilft Ihnen beim Import Ihrer bestehenden Daten.',
      },
      {
        q: 'Was unterscheidet euch von anderen Lösungen?',
        a: 'Drei Dinge: (1) Alles in einer Plattform — keine 5 verschiedenen Apps. (2) KI-Assistent Armstrong kennt Ihren gesamten Datenraum. (3) Pay per Use — keine Grundgebühr, keine versteckten Kosten.',
      },
    ],
  },
  {
    category: 'Für Unternehmen',
    questions: [
      {
        q: 'Kann ich die Plattform für mein Unternehmen nutzen?',
        a: 'Absolut. System of a Town ist für Unternehmer gebaut: Fuhrpark-Management, E-Mail-Automatisierung, Dokumentenverwaltung, Finanzanalyse und mehr. Alles, was ein Unternehmen digital braucht.',
      },
      {
        q: 'Ist das nur für Immobilien?',
        a: 'Nein. Immobilien sind einer von vielen Bereichen. Die Plattform umfasst auch Fuhrpark, Photovoltaik, Finanzanalyse, E-Mail-Serien, Fortbildung, Einkauf und KI-Assistenz — alles modular buchbar.',
      },
      {
        q: 'Können mehrere Mitarbeiter die Plattform nutzen?',
        a: 'Ja. Sie können Teammitglieder einladen und Rollen zuweisen. Jeder sieht nur das, was für seine Rolle relevant ist.',
      },
      {
        q: 'Brauche ich eine eigene IT-Abteilung?',
        a: 'Nein. Das ist der Kern unseres Angebots: Digitalisierung ohne eigene IT-Investition. Kein Server, keine Installation, kein IT-Personal nötig.',
      },
    ],
  },
  {
    category: 'Module & Funktionen',
    questions: [
      {
        q: 'Welche Module gibt es?',
        a: 'Über 15 Module in drei Bereichen: CLIENT (Finanzanalyse, Immobilien, Finanzierung, Verkauf, Investments, KI Office), SERVICE (Fahrzeuge, Photovoltaik, Kommunikation, Fortbildung, Shops, Mieterportal) und BASE (DMS, Stammdaten, Armstrong KI).',
      },
      {
        q: 'Was ist Armstrong?',
        a: 'Armstrong ist Ihr KI-Co-Pilot. Er liest Ihren gesamten Datenraum — Dokumente, Verträge, E-Mails, Finanzdaten — und kann Fragen beantworten, Texte generieren, Zusammenfassungen erstellen und Workflows automatisieren. Ohne manuelles Hochladen.',
      },
      {
        q: 'Was ist das DMS?',
        a: 'Das Dokumentenmanagementsystem ist Ihr zentraler Datenraum: automatischer Posteingang, KI-Kategorisierung, Volltextsuche, OCR-Erkennung und sichere Freigaben. Nie wieder Dokumente suchen.',
      },
      {
        q: 'Muss ich alle Module nutzen?',
        a: 'Nein. Sie aktivieren nur die Module, die Sie brauchen. Starten Sie mit einem — zum Beispiel DMS für Dokumente — und erweitern Sie nach Bedarf.',
      },
    ],
  },
  {
    category: 'Kosten & Start',
    questions: [
      {
        q: 'Was kostet System of a Town?',
        a: 'Es gibt keine Grundgebühr. Der Starter-Plan ist dauerhaft kostenlos. Sie zahlen nur für Premium-Module und KI-Nutzung (Pay per Use). So bleibt Digitalisierung bezahlbar.',
      },
      {
        q: 'Wie starte ich?',
        a: 'Registrieren Sie sich kostenlos (keine Kreditkarte nötig), aktivieren Sie die gewünschten Module und legen Sie los. Die Grundeinrichtung dauert etwa 10 Minuten.',
      },
      {
        q: 'Kann ich die Software kostenlos testen?',
        a: 'Ja. Der Starter-Plan ist dauerhaft kostenlos und enthält alle Grundfunktionen. Upgrade jederzeit möglich, wenn Sie mehr brauchen.',
      },
      {
        q: 'Gibt es eine Vertragsbindung?',
        a: 'Nein. Pay per Use bedeutet: Sie zahlen nur, was Sie nutzen. Keine Mindestlaufzeit, keine Kündigungsfrist. Aufhören, wann Sie wollen.',
      },
    ],
  },
  {
    category: 'Daten & Sicherheit',
    questions: [
      {
        q: 'Wo werden meine Daten gespeichert?',
        a: 'Alle Daten werden verschlüsselt in zertifizierten Rechenzentren in Deutschland gespeichert. DSGVO-konform.',
      },
      {
        q: 'Wer hat Zugriff auf meine Daten?',
        a: 'Nur Sie und von Ihnen autorisierte Nutzer. Wir haben keinen Zugriff auf Ihre Inhalte. Punkt.',
      },
      {
        q: 'Kann ich meine Daten exportieren?',
        a: 'Ja, Sie können jederzeit alle Ihre Daten exportieren — als strukturierte Dateien oder Dokumente. Ihre Daten gehören Ihnen.',
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
      <SEOHead
        brand="sot"
        page={{ title: 'Häufige Fragen (FAQ) zur Digitalisierungsplattform', description: 'Antworten auf häufige Fragen zu System of a Town: Plattform, Module, KI-Assistent Armstrong, Kosten und Datensicherheit.', path: '/faq' }}
        faq={faqItems.flatMap(cat => cat.questions.map(q => ({ question: q.q, answer: q.a })))}
      />
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
            Alles, was Sie über <Brand>System of a Town</Brand> wissen müssen — von der Plattform bis zur Sicherheit.
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
