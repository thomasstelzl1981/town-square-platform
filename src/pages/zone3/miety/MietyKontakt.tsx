import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Send } from 'lucide-react';

const faqs = [
  {
    question: 'Was ist Miety?',
    answer: 'Miety ist das digitale Mieterportal für die Kommunikation zwischen Vermietern und Mietern.',
  },
  {
    question: 'Wie kann ich mich anmelden?',
    answer: 'Als Vermieter registrieren Sie sich direkt. Als Mieter benötigen Sie eine Einladung von Ihrem Vermieter.',
  },
  {
    question: 'Ist Miety kostenlos?',
    answer: 'Das Basis-Paket ist kostenlos. Erweiterte Funktionen sind kostenpflichtig.',
  },
  {
    question: 'Wie sicher sind meine Daten?',
    answer: 'Alle Daten werden verschlüsselt übertragen und in Deutschland gespeichert.',
  },
  {
    question: 'Kann ich meine Einladung erneut senden?',
    answer: 'Ja, kontaktieren Sie Ihren Vermieter für eine neue Einladung.',
  },
  {
    question: 'Welche Dokumente kann ich einsehen?',
    answer: 'Mietvertrag, Nebenkostenabrechnungen, Protokolle und weitere freigegebene Dokumente.',
  },
  {
    question: 'Gibt es eine mobile App?',
    answer: 'Miety ist als Web-App vollständig mobil-optimiert.',
  },
  {
    question: 'Wie erstelle ich eine Service-Anfrage?',
    answer: 'Klicken Sie auf "Neue Anfrage" und beschreiben Sie Ihr Anliegen.',
  },
  {
    question: 'Wer kann meine Nachrichten lesen?',
    answer: 'Nur Sie und Ihr direkter Ansprechpartner (Vermieter/Hausverwaltung).',
  },
  {
    question: 'Wie kündige ich mein Konto?',
    answer: 'Kontaktieren Sie unseren Support oder nutzen Sie die Kontoeinstellungen.',
  },
];

export default function MietyKontakt() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Kontakt & FAQ
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Haben Sie Fragen? Hier finden Sie Antworten.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Häufig gestellte Fragen</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="zone3-card overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 flex items-center justify-between text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="zone3-text-small">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="max-w-xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-8">Kontaktformular</h2>
            <div className="zone3-card p-8">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                    placeholder="Ihr Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">E-Mail</label>
                  <input
                    type="email"
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                    placeholder="ihre@email.de"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Betreff</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-lg border"
                    style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                    placeholder="Ihr Anliegen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nachricht</label>
                  <textarea
                    rows={5}
                    className="w-full p-3 rounded-lg border resize-none"
                    style={{ borderColor: 'hsl(var(--z3-border))', backgroundColor: 'hsl(var(--z3-background))' }}
                    placeholder="Ihre Nachricht..."
                  />
                </div>
                <button
                  type="button"
                  className="zone3-btn-primary w-full flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
                >
                  <Send className="w-4 h-4" />
                  Absenden
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
