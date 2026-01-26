import { Link } from 'react-router-dom';
import { Calculator, PiggyBank, FileText, AlertTriangle, ArrowRight } from 'lucide-react';

export default function KaufyBeratung() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Kapitalanlage verstehen
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Grundlagen für Ihre Investitionsentscheidung.
          </p>
        </div>
      </section>

      {/* Info Cards */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="zone3-grid-2">
            <div className="zone3-card p-8">
              <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Calculator className="w-7 h-7" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Rendite berechnen</h3>
              <p className="zone3-text-small mb-4">
                Die Mietrendite zeigt, wie profitabel eine Immobilie ist. Sie berechnet sich aus dem Verhältnis von Jahresnettomietertrag zum Kaufpreis.
              </p>
              <ul className="space-y-2 zone3-text-small">
                <li>• Bruttomietrendite: Jahresmiete / Kaufpreis × 100</li>
                <li>• Nettomietrendite: Berücksichtigt Nebenkosten</li>
                <li>• Eigenkapitalrendite: Berücksichtigt Finanzierung</li>
              </ul>
            </div>

            <div className="zone3-card p-8">
              <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <PiggyBank className="w-7 h-7" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Steuern verstehen</h3>
              <p className="zone3-text-small mb-4">
                Immobilien bieten steuerliche Vorteile durch Abschreibungen und Werbungskostenabzug.
              </p>
              <ul className="space-y-2 zone3-text-small">
                <li>• AfA: 2-3% jährliche Abschreibung</li>
                <li>• Zinsen als Werbungskosten absetzbar</li>
                <li>• Steuerersparnis abhängig vom Grenzsteuersatz</li>
              </ul>
            </div>

            <div className="zone3-card p-8">
              <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Finanzierung planen</h3>
              <p className="zone3-text-small mb-4">
                Die richtige Finanzierungsstrategie optimiert Ihre Rendite und minimiert Risiken.
              </p>
              <ul className="space-y-2 zone3-text-small">
                <li>• Eigenkapitalquote: Empfohlen 10-20%</li>
                <li>• Tilgungsrate: Balance zwischen Schuldenabbau und Cashflow</li>
                <li>• Zinsbindung: Planungssicherheit durch lange Laufzeiten</li>
              </ul>
            </div>

            <div className="zone3-card p-8">
              <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Risiken kennen</h3>
              <p className="zone3-text-small mb-4">
                Jede Investition birgt Risiken. Informieren Sie sich vor dem Kauf über mögliche Fallstricke.
              </p>
              <ul className="space-y-2 zone3-text-small">
                <li>• Leerstandsrisiko durch Mieterwechsel</li>
                <li>• Instandhaltungsrücklagen einplanen</li>
                <li>• Marktentwicklung beobachten</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Placeholder */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="zone3-card p-8 max-w-2xl mx-auto text-center">
            <h2 className="zone3-heading-2 mb-6">Investment-Rechner</h2>
            <p className="zone3-text-large mb-8">
              Berechnen Sie Ihre monatliche Belastung basierend auf Ihrem zu versteuernden Einkommen und verfügbarem Eigenkapital.
            </p>
            <div className="space-y-4 mb-8">
              <div className="text-left">
                <label className="block text-sm font-medium mb-2">Zu versteuerndes Einkommen (zvE)</label>
                <input
                  type="number"
                  placeholder="z.B. 80.000 €"
                  className="w-full p-3 rounded-lg border"
                  style={{ borderColor: 'hsl(var(--z3-border))' }}
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium mb-2">Verfügbares Eigenkapital</label>
                <input
                  type="number"
                  placeholder="z.B. 50.000 €"
                  className="w-full p-3 rounded-lg border"
                  style={{ borderColor: 'hsl(var(--z3-border))' }}
                />
              </div>
            </div>
            <button className="zone3-btn-primary">
              Berechnen
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Bereit für Ihre erste Investition?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Registrieren Sie sich kostenlos und erhalten Sie Zugang zu passenden Objekten.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2" style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}>
            Kostenlose Erstberatung
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
