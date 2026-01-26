import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, PiggyBank, FileText, AlertTriangle, ArrowRight, Download, Search } from 'lucide-react';

interface CalculationResult {
  monthlyBurden: number;
  maxPurchasePrice: number;
  loanAmount: number;
  interestRate: number;
}

export default function KaufyBeratung() {
  const [taxableIncome, setTaxableIncome] = useState<string>('');
  const [equity, setEquity] = useState<string>('');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [churchTax, setChurchTax] = useState<boolean>(false);
  const [churchTaxRate, setChurchTaxRate] = useState<0.08 | 0.09>(0.09);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const handleCalculate = () => {
    const zve = parseFloat(taxableIncome) || 0;
    const ek = parseFloat(equity) || 0;
    
    if (zve <= 0 || ek <= 0) {
      return;
    }

    // Simplified calculation (will be replaced by sot-investment-engine)
    // Assuming 15 years fixed, LTV based on typical equity ratio
    const interestRate = 4.0; // 15 Jahre, ~80% LTV
    const repaymentRate = 1.0;
    const annualRate = (interestRate + repaymentRate) / 100;
    
    // Max loan based on 30% of net income as burden
    const estimatedNetIncome = zve * 0.6; // Rough estimate after tax
    const maxMonthlyBurden = (estimatedNetIncome / 12) * 0.3;
    const maxLoan = (maxMonthlyBurden * 12) / annualRate;
    const maxPurchasePrice = maxLoan + ek;
    
    setResult({
      monthlyBurden: Math.round(maxMonthlyBurden),
      maxPurchasePrice: Math.round(maxPurchasePrice),
      loanAmount: Math.round(maxLoan),
      interestRate: interestRate
    });
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
              {/* Left Column: Income & Equity */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zu versteuerndes Einkommen (zvE) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={taxableIncome}
                      onChange={(e) => setTaxableIncome(e.target.value)}
                      placeholder="z.B. 80000"
                      className="w-full p-3 pr-12 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">€/Jahr</span>
                  </div>
                  <p className="text-xs opacity-60 mt-1">Aus Ihrem Steuerbescheid</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Verfügbares Eigenkapital *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={equity}
                      onChange={(e) => setEquity(e.target.value)}
                      placeholder="z.B. 50000"
                      className="w-full p-3 pr-12 rounded-lg border"
                      style={{ borderColor: 'hsl(var(--z3-border))' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">€</span>
                  </div>
                  <p className="text-xs opacity-60 mt-1">Für Kaufpreis und Nebenkosten</p>
                </div>
              </div>
              
              {/* Right Column: Tax Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Veranlagung (Familienstand)
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMaritalStatus('single')}
                      className={`flex-1 p-3 rounded-lg border transition-colors ${
                        maritalStatus === 'single' 
                          ? 'border-current bg-opacity-10' 
                          : ''
                      }`}
                      style={{ 
                        borderColor: maritalStatus === 'single' ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: maritalStatus === 'single' ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      Grundtabelle
                      <span className="block text-xs opacity-60">Einzelveranlagung</span>
                    </button>
                    <button
                      onClick={() => setMaritalStatus('married')}
                      className={`flex-1 p-3 rounded-lg border transition-colors`}
                      style={{ 
                        borderColor: maritalStatus === 'married' ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: maritalStatus === 'married' ? 'hsl(var(--z3-secondary))' : 'transparent'
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
                      onClick={() => setChurchTax(false)}
                      className={`flex-1 p-3 rounded-lg border transition-colors`}
                      style={{ 
                        borderColor: !churchTax ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: !churchTax ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      Nein
                    </button>
                    <button
                      onClick={() => { setChurchTax(true); setChurchTaxRate(0.08); }}
                      className={`flex-1 p-3 rounded-lg border transition-colors`}
                      style={{ 
                        borderColor: churchTax && churchTaxRate === 0.08 ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: churchTax && churchTaxRate === 0.08 ? 'hsl(var(--z3-secondary))' : 'transparent'
                      }}
                    >
                      8%
                      <span className="block text-xs opacity-60">BY / BW</span>
                    </button>
                    <button
                      onClick={() => { setChurchTax(true); setChurchTaxRate(0.09); }}
                      className={`flex-1 p-3 rounded-lg border transition-colors`}
                      style={{ 
                        borderColor: churchTax && churchTaxRate === 0.09 ? 'hsl(var(--z3-foreground))' : 'hsl(var(--z3-border))',
                        backgroundColor: churchTax && churchTaxRate === 0.09 ? 'hsl(var(--z3-secondary))' : 'transparent'
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
              className="zone3-btn-primary w-full"
            >
              <Calculator className="w-5 h-5 mr-2 inline" />
              Berechnen
            </button>
            
            {/* Result Display */}
            {result && (
              <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <h3 className="zone3-heading-3 mb-4 text-center">Ihr Ergebnis</h3>
                
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <p className="text-sm opacity-70 mb-1">Maximaler Kaufpreis</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.maxPurchasePrice)}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white/50">
                    <p className="text-sm opacity-70 mb-1">Monatliche Belastung (ca.)</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.monthlyBurden)}</p>
                  </div>
                </div>
                
                <div className="text-center text-sm opacity-70 mb-6">
                  <p>Darlehen: {formatCurrency(result.loanAmount)} | Zinssatz: {result.interestRate}% (15 Jahre fix)</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    to={`/kaufy/immobilien?maxPrice=${result.maxPurchasePrice}`}
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
