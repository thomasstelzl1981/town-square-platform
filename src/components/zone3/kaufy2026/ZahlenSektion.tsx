/**
 * ZahlenSektion — Minimalist metric display
 * 
 * Design: Dark section with structured metric columns, refined typography.
 */

interface MetricItem {
  label: string;
  value: string;
}

const metrics: MetricItem[] = [
  { label: 'Cashflow', value: 'monatlich berechnet' },
  { label: 'Schulden', value: 'strukturiert dargestellt' },
  { label: 'Zinsbindung', value: 'transparent verglichen' },
  { label: 'Netto-Belastung', value: 'individuell ermittelt' },
];

export function ZahlenSektion() {
  return (
    <section className="bg-[hsl(220,20%,10%)] text-white py-16 rounded-2xl mx-6 lg:mx-10 my-8">
      <div className="px-6 lg:px-10">
        {/* Headline */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Immobilien sind Zahlen.
          </h2>
          <p className="text-lg md:text-xl text-white/70">
            KAUFY macht sie verständlich.
          </p>
        </div>

        {/* Metrics Table */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden">
          {metrics.map((metric, index) => (
            <div 
              key={metric.label} 
              className="bg-[hsl(220,20%,10%)] p-6 text-center relative"
            >
              {/* Left accent bar */}
              {(index === 0 || index === 2) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-[hsl(210,80%,55%)] hidden md:block" />
              )}
              
              <p className="text-lg font-semibold text-white mb-1">
                {metric.label}
              </p>
              <p className="text-sm text-white/60">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
