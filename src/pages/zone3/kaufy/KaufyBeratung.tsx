import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, PiggyBank, FileText, AlertTriangle, ArrowRight, Download, Search, TrendingUp, CheckCircle } from 'lucide-react';
import { useInvestmentEngine, CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';

export default function KaufyBeratung() {
  const [input, setInput] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });
  const { calculate, result, isLoading, error } = useInvestmentEngine();

  const handleCalculate = async () => {
    await calculate(input);
  };

  const updateInput = <K extends keyof CalculationInput>(key: K, value: CalculationInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="zone3-hero">
        <div className="zone3-container">
          <h1 className="zone3-heading-1 mb-6">
            Kapitalanlage verstehen
          </h1>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Berechnen Sie Ihre individuelle Monatsbelastung und finden Sie passende Immobilien.
          </p>
        </div>
      </section>

      {/* Calculator Section - CORE FEATURE */}
      <section className="zone3-section">
        <div className="zone3-container">
          <div className="zone3-card p-8 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="zone3-heading-2 mb-4">Investment-Rechner</h2>
              <p className="zone3-text-large">
                Berechnen Sie Ihre monatliche Belastung basierend auf Ihren persönlichen Daten.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* Left Column: Property & Financing */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kaufpreis des Objekts *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.purchasePrice}
                      onChange={(e) => updateInput('purchasePrice', Number(e.target.value))}
                      placeholder="z.B. 250000"
                      className="w-full p-3 pr-12 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">€</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Monatliche Kaltmiete *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.monthlyRent}
                      onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
                      placeholder="z.B. 800"
                      className="w-full p-3 pr-12 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">€/Monat</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Eigenkapital *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.equity}
                      onChange={(e) => updateInput('equity', Number(e.target.value))}
                      placeholder="z.B. 50000"
                      className="w-full p-3 pr-12 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">€</span>
                  </div>
                </div>
              </div>
              
              {/* Right Column: Tax Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zu versteuerndes Einkommen (zvE) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={input.taxableIncome}
                      onChange={(e) => updateInput('taxableIncome', Number(e.target.value))}
                      placeholder="z.B. 60000"
                      className="w-full p-3 pr-12 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">€/Jahr</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Veranlagung (Familienstand)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateInput('maritalStatus', 'single')}
                      className="flex-1 p-3 rounded-lg border transition-colors"
                      style={{ 
                        borderColor: input.maritalStatus === 'single' ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: input.maritalStatus === 'single' ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      Grundtabelle
                      <span className="block text-xs opacity-60">Einzelveranlagung</span>
                    </button>
                    <button
                      onClick={() => updateInput('maritalStatus', 'married')}
                      className="flex-1 p-3 rounded-lg border transition-colors"
                      style={{ 
                        borderColor: input.maritalStatus === 'married' ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: input.maritalStatus === 'married' ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      Splittingtarif
                      <span className="block text-xs opacity-60">Zusammenveranlagung</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kirchensteuer
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateInput('hasChurchTax', false)}
                      className="flex-1 p-3 rounded-lg border transition-colors"
                      style={{ 
                        borderColor: !input.hasChurchTax ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: !input.hasChurchTax ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      Nein
                    </button>
                    <button
                      onClick={() => { updateInput('hasChurchTax', true); updateInput('churchTaxState', 'BY'); }}
                      className="flex-1 p-3 rounded-lg border transition-colors"
                      style={{ 
                        borderColor: input.hasChurchTax && (input.churchTaxState === 'BY' || input.churchTaxState === 'BW') ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: input.hasChurchTax && (input.churchTaxState === 'BY' || input.churchTaxState === 'BW') ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      8%
                      <span className="block text-xs opacity-60">BY / BW</span>
                    </button>
                    <button
                      onClick={() => { updateInput('hasChurchTax', true); updateInput('churchTaxState', 'NW'); }}
                      className="flex-1 p-3 rounded-lg border transition-colors"
                      style={{ 
                        borderColor: input.hasChurchTax && input.churchTaxState !== 'BY' && input.churchTaxState !== 'BW' ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: input.hasChurchTax && input.churchTaxState !== 'BY' && input.churchTaxState !== 'BW' ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      9%
                      <span className="block text-xs opacity-60">Übrige</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleCalculate}
              disabled={isLoading}
              className="zone3-btn-primary w-full"
            >
              <Calculator className="w-5 h-5 mr-2 inline" />
              {isLoading ? 'Berechne...' : 'Jetzt berechnen'}
            </button>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {/* Result Display */}
            {result && (
              <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <h3 className="zone3-heading-3 mb-4 text-center">Ihr Ergebnis</h3>
                
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <p className="text-sm opacity-70 mb-1">Monatliche Belastung</p>
                    <p className={`text-2xl font-bold ${result.summary.monthlyBurden < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {result.summary.monthlyBurden < 0 ? '+' : ''}{formatCurrency(Math.abs(result.summary.monthlyBurden))}
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      {result.summary.monthlyBurden < 0 ? 'Sie erhalten' : 'Sie zahlen'} monatlich
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <p className="text-sm opacity-70 mb-1">Steuerersparnis</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(result.summary.yearlyTaxSavings)}</p>
                    <p className="text-xs opacity-60 mt-1">pro Jahr</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <p className="text-sm opacity-70 mb-1">Rendite n. Steuern</p>
                    <p className="text-2xl font-bold">{result.summary.roiAfterTax.toFixed(1)}%</p>
                    <p className="text-xs opacity-60 mt-1">auf Eigenkapital</p>
                  </div>
                </div>
                
                <div className="text-center text-sm opacity-70 mb-6">
                  <p>
                    Darlehen: {formatCurrency(result.summary.loanAmount)} | 
                    Zinssatz: {result.summary.interestRate}% | 
                    LTV: {result.summary.ltv}%
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    to={`/kaufy/immobilien?maxPrice=${input.purchasePrice}`}
                    className="zone3-btn-primary inline-flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Passende Objekte finden
                  </Link>
                  <button className="zone3-btn-secondary inline-flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Als PDF speichern
                  </button>
                </div>

                {/* Projection Preview */}
                <div className="mt-6 pt-6 border-t border-white/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      40-Jahres-Projektion
                    </h4>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    {[10, 20, 30, 40].map(year => {
                      const yearData = result.projection.find(p => p.year === year);
                      return (
                        <div key={year} className="p-2 rounded bg-white/30">
                          <p className="opacity-60">Jahr {year}</p>
                          <p className="font-bold">{formatCurrency(yearData?.netWealth || 0)}</p>
                          <p className="text-xs opacity-60">Nettovermögen</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA for Registration */}
                <div className="mt-6 p-4 rounded-lg bg-white/50 text-center">
                  <p className="font-medium mb-2">Vollständige Analyse freischalten</p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs mb-3">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Detaillierte Charts</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> PDF-Export</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Berater-Anbindung</span>
                  </div>
                  <Link to="/auth?mode=register&source=kaufy" className="zone3-btn-primary text-sm">
                    Kostenlos registrieren
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="zone3-section" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
        <div className="zone3-container">
          <h2 className="zone3-heading-2 text-center mb-12">Grundlagen verstehen</h2>
          <div className="zone3-grid-2">
            <div className="zone3-card p-8">
              <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <Calculator className="w-7 h-7" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Rendite berechnen</h3>
              <p className="zone3-text-small mb-4">
                Die Mietrendite zeigt, wie profitabel eine Immobilie ist.
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
                Immobilien bieten steuerliche Vorteile durch Abschreibungen.
              </p>
              <ul className="space-y-2 zone3-text-small">
                <li>• AfA: 2% jährliche Abschreibung</li>
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
                Die richtige Finanzierungsstrategie optimiert Ihre Rendite.
              </p>
              <ul className="space-y-2 zone3-text-small">
                <li>• Eigenkapitalquote: Empfohlen 10-20%</li>
                <li>• Tilgungsrate: Balance zwischen Schuldenabbau und Cashflow</li>
                <li>• Zinsbindung: 15 Jahre für Planungssicherheit</li>
              </ul>
            </div>

            <div className="zone3-card p-8">
              <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="zone3-heading-3 mb-4">Risiken kennen</h3>
              <p className="zone3-text-small mb-4">
                Jede Investition birgt Risiken. Informieren Sie sich vorab.
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
