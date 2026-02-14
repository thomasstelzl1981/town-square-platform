/**
 * SoT Real Estate — Immobilien verwalten
 */
export default function SotRealEstate() {
  return (
    <div className="space-y-12">
      <section className="pt-8 lg:pt-16 text-center">
        <span className="sot-label" style={{ color: 'hsl(var(--z3-accent))' }}>Real Estate</span>
        <h1 className="sot-headline mt-4">Immobilien verwalten.</h1>
        <p className="sot-subheadline mt-4 max-w-2xl mx-auto">
          Akten, Datenraum, Bewertung — alles an einem Ort.
        </p>
      </section>
    </div>
  );
}
