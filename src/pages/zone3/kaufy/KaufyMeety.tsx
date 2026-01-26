import { Link } from 'react-router-dom';
import { FileText, MessageCircle, Wrench, ArrowRight } from 'lucide-react';

export default function KaufyMeety() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            MIETY — Das Mieterportal
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Die App für die Kommunikation zwischen Vermietern und Mietern.
          </p>
          <Link to="/miety" className="zone3-btn-primary inline-flex items-center gap-2">
            Mehr über MIETY erfahren
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-grid-3">
            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Digitale Dokumente</h3>
              <p className="zone3-text-small">
                Mietverträge, Nebenkostenabrechnungen und Protokolle immer griffbereit.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Direkte Kommunikation</h3>
              <p className="zone3-text-small">
                Nachrichten und Anfragen zentral an einem Ort verwalten.
              </p>
            </div>

            <div className="zone3-card p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wrench className="w-8 h-8" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Serviceanfragen</h3>
              <p className="zone3-text-small">
                Reparaturen und Anliegen einfach melden und nachverfolgen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Note */}
      <section className="zone3-section">
        <div className="zone3-container text-center">
          <div className="zone3-card p-8 max-w-2xl mx-auto">
            <h2 className="zone3-heading-2 mb-6">Nahtlose Integration</h2>
            <p className="zone3-text-large mb-6">
              MIETY ist nahtlos in die System of a Town Plattform integriert. 
              Als Vermieter laden Sie Ihre Mieter ein und behalten die volle Kontrolle.
            </p>
            <Link to="/miety" className="zone3-btn-secondary inline-flex items-center gap-2">
              Zur MIETY-Website
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
