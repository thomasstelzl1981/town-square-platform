import { Link } from 'react-router-dom';
import { 
  Briefcase, Target, Wallet, Wrench, Check, ArrowRight, 
  TrendingUp, Shield, GraduationCap, Award, Users, Rocket
} from 'lucide-react';

export default function KaufyVertrieb() {
  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Exklusive Objekte für Ihren Vertrieb
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto mb-8">
            Werden Sie KAUFY-Partner und erhalten Sie Zugang zu geprüften Rendite-Immobilien mit transparenten Provisionen.
          </p>
          <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary inline-flex items-center gap-2">
            Partnerantrag stellen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Ihre Vorteile als Partner</h2>
          <div className="zone3-grid-4">
            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Exklusiver Objektkatalog</h3>
              <p className="zone3-text-small">Zugang zu geprüften Rendite-Immobilien, die nicht auf öffentlichen Portalen inseriert sind.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Qualifizierte Leads</h3>
              <p className="zone3-text-small">Erhalten Sie vorqualifizierte Interessenten mit nachgewiesener Bonität und Finanzierungsnachweis.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wallet className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Transparente Provisionen</h3>
              <p className="zone3-text-small">Klare Vergütungsstruktur bei jedem Abschluss. Keine versteckten Kosten oder Gebühren.</p>
            </div>

            <div className="zone3-card p-6 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Digitale Vertriebstools</h3>
              <p className="zone3-text-small">Investment-Rechner, Exposé-Generator und Kundenverwaltung für Ihre Beratung.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Tracks — NEW SECTION */}
      <section className="zone3-section">
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-4">Zwei Wege zum Erfolg</h2>
          <p className="zone3-text-large text-center max-w-2xl mx-auto mb-12">
            Ob Einsteiger oder erfahrener Profi – bei KAUFY finden Sie den passenden Karrierepfad.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Newcomer Track */}
            <div className="zone3-card p-8 relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 px-4 py-1 text-xs font-semibold rounded-bl-lg"
                style={{ backgroundColor: 'hsl(var(--z3-accent))', color: 'hsl(var(--z3-accent-foreground))' }}
              >
                Für Einsteiger
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-accent) / 0.15)' }}
                >
                  <GraduationCap className="w-8 h-8" style={{ color: 'hsl(var(--z3-accent))' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Newcomer</h3>
                  <p className="zone3-text-small">Starten Sie Ihre Karriere</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                  <span className="zone3-text-small">Persönliches Mentoring durch erfahrene Partner</span>
                </li>
                <li className="flex items-start gap-3">
                  <Rocket className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                  <span className="zone3-text-small">Strukturiertes Schulungsprogramm (6-8 Wochen)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                  <span className="zone3-text-small">Wir unterstützen Sie beim §34c Antrag</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--z3-accent))' }} />
                  <span className="zone3-text-small">Erste Deals gemeinsam mit Ihrem Mentor</span>
                </li>
              </ul>
              
              <Link 
                to="/auth?mode=register&source=kaufy&track=newcomer" 
                className="zone3-btn-secondary inline-flex items-center gap-2 w-full justify-center"
              >
                Als Newcomer starten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Professional Track */}
            <div className="zone3-card p-8 relative overflow-hidden" style={{ borderColor: 'hsl(var(--z3-primary))' }}>
              <div 
                className="absolute top-0 right-0 px-4 py-1 text-xs font-semibold rounded-bl-lg"
                style={{ backgroundColor: 'hsl(var(--z3-primary))', color: 'hsl(var(--z3-primary-foreground))' }}
              >
                Für Profis
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'hsl(var(--z3-primary) / 0.1)' }}
                >
                  <Award className="w-8 h-8" style={{ color: 'hsl(var(--z3-primary))' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Professional</h3>
                  <p className="zone3-text-small">Sofortiger Zugang</p>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span className="zone3-text-small">Sofortiger Zugang zum vollen Objektkatalog</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span className="zone3-text-small">Höhere Provisionsanteile ab dem ersten Deal</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span className="zone3-text-small">Vollständige Vertriebstools ohne Einschränkungen</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                  <span className="zone3-text-small">Priorisierter Support und Deal-Zugang</span>
                </li>
              </ul>
              
              <Link 
                to="/auth?mode=register&source=kaufy&track=professional" 
                className="zone3-btn-primary inline-flex items-center gap-2 w-full justify-center"
              >
                Als Professional bewerben
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-12">So werden Sie Partner</h2>
            <div className="space-y-6">
              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Partnerantrag stellen</h3>
                  <p className="zone3-text-small">
                    Registrieren Sie sich kostenlos und laden Sie Ihre Unterlagen hoch. Die Prüfung dauert in der Regel 2-3 Werktage.
                  </p>
                </div>
              </div>

              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Onboarding & Schulung</h3>
                  <p className="zone3-text-small">
                    Nach der Freischaltung erhalten Sie eine Einführung in die Plattform und lernen die Investment-Tools kennen.
                  </p>
                </div>
              </div>

              <div className="zone3-card p-6 flex items-start gap-6">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Objekte vermitteln & verdienen</h3>
                  <p className="zone3-text-small">
                    Greifen Sie auf den Objektkatalog zu, beraten Sie Ihre Kunden mit unseren Tools und verdienen Sie attraktive Provisionen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements — Updated with track info */}
      <section className="zone3-section-sm">
        <div className="zone3-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="zone3-heading-2 text-center mb-8">Voraussetzungen</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Newcomer Requirements */}
              <div className="zone3-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" style={{ color: 'hsl(var(--z3-accent))' }} />
                  Newcomer
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                    <span className="zone3-text-small">Interesse an Immobilien & Finanzberatung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                    <span className="zone3-text-small">Bereitschaft zur Schulungsteilnahme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                    <span className="zone3-text-small">Wir helfen beim §34c Antrag</span>
                  </li>
                </ul>
              </div>
              
              {/* Professional Requirements */}
              <div className="zone3-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" style={{ color: 'hsl(var(--z3-primary))' }} />
                  Professional
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                    <span className="zone3-text-small">§34c GewO Gewerbeanmeldung</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                    <span className="zone3-text-small">Vermögensschadenhaftpflicht (VSH)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(142 71% 45%)' }} />
                    <span className="zone3-text-small">Mind. 2 Jahre Branchenerfahrung</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="zone3-section-sm" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-2">5-15%</p>
              <p className="zone3-text-small">Provision pro Abschluss</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-2">200+</p>
              <p className="zone3-text-small">Aktive Partner</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-2">50+</p>
              <p className="zone3-text-small">Objekte im Katalog</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-2">0 €</p>
              <p className="zone3-text-small">Partnergebühren</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-foreground))', color: 'hsl(var(--z3-background))' }}>
        <div className="zone3-container text-center">
          <h2 className="zone3-heading-2 mb-6">Werden Sie KAUFY-Partner</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
            Kostenlose Registrierung. Exklusiver Objektkatalog. Attraktive Provisionen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/auth?mode=register&source=kaufy&track=newcomer" 
              className="zone3-btn-secondary inline-flex items-center gap-2 justify-center"
              style={{ backgroundColor: 'transparent', borderColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-background))' }}
            >
              <GraduationCap className="w-4 h-4" />
              Als Newcomer starten
            </Link>
            <Link 
              to="/auth?mode=register&source=kaufy&track=professional" 
              className="zone3-btn-primary inline-flex items-center gap-2 justify-center" 
              style={{ backgroundColor: 'hsl(var(--z3-background))', color: 'hsl(var(--z3-foreground))' }}
            >
              <Award className="w-4 h-4" />
              Als Professional bewerben
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
