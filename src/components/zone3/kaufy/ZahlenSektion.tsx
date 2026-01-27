import { TrendingUp, CreditCard, Clock, Calculator } from 'lucide-react';

const METRICS = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    value: 'Cashflow',
    label: 'monatlich berechnet',
    description: 'Einnahmen minus Ausgaben',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    value: 'Schulden',
    label: 'strukturiert dargestellt',
    description: 'Tilgungsplan über 40 Jahre',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    value: 'Zinsbindung',
    label: 'transparent erklärt',
    description: 'Restschuld bei Ablauf',
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    value: 'Netto-Belastung',
    label: 'exakt berechnet',
    description: 'Nach Steuerersparnis',
  },
];

export function ZahlenSektion() {
  return (
    <section className="zone3-section">
      <div className="zone3-container">
        <div className="text-center mb-12">
          <h2 className="zone3-heading-2 mb-4">
            Immobilien sind Zahlen. Kaufy macht sie verständlich.
          </h2>
          <p className="zone3-text-large max-w-2xl mx-auto">
            Unsere Investment-Engine berechnet alle relevanten Kennzahlen basierend auf Ihrer persönlichen Situation.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map((metric, idx) => (
            <div 
              key={idx}
              className="zone3-card p-6 text-center group hover:shadow-lg transition-shadow"
            >
              <div 
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors group-hover:scale-110"
                style={{ 
                  backgroundColor: 'hsl(var(--z3-primary) / 0.1)',
                  color: 'hsl(var(--z3-primary))',
                }}
              >
                {metric.icon}
              </div>
              <p 
                className="text-xl font-bold mb-1"
                style={{ color: 'hsl(var(--z3-foreground))' }}
              >
                {metric.value}
              </p>
              <p 
                className="text-sm font-medium mb-2"
                style={{ color: 'hsl(var(--z3-primary))' }}
              >
                {metric.label}
              </p>
              <p 
                className="text-xs"
                style={{ color: 'hsl(var(--z3-muted-foreground))' }}
              >
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
