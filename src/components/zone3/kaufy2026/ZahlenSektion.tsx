/**
 * ZahlenSektion — Dark section with key metrics
 */

interface StatItem {
  value: string;
  label: string;
}

const stats: StatItem[] = [
  { value: '500+', label: 'Aktive Objekte' },
  { value: '€250M+', label: 'Transaktionsvolumen' },
  { value: '3.000+', label: 'Registrierte Investoren' },
  { value: '4,2%', label: 'Ø Bruttorendite' },
];

export function ZahlenSektion() {
  return (
    <section className="bg-[hsl(220,20%,10%)] text-white py-16 rounded-2xl mx-6 lg:mx-10 my-8">
      <div className="px-6 lg:px-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Zahlen, die überzeugen.
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[hsl(210,80%,55%)]">{stat.value}</p>
              <p className="text-sm text-white/70 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
