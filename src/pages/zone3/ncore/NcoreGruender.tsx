import { Helmet } from 'react-helmet';

export default function NcoreGruender() {
  return (
    <>
      <Helmet>
        <title>Gründer — Ncore Business Consulting</title>
        <meta name="description" content="Über den Gründer von Ncore Business Consulting. Langjährige Erfahrung in Unternehmens- und Finanzberatung." />
      </Helmet>

      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            Der <span className="text-emerald-400">Gründer</span>
          </h1>
          <p className="text-lg text-white/60 leading-relaxed mb-8">
            Langjährige Erfahrung in der Finanz- und Unternehmensberatung. Operatives Wissen darüber, 
            wie Digitalisierung und KI in Unternehmen effektiv eingesetzt werden. Nicht Theorie, sondern Praxis.
          </p>
          <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-8">
            <p className="text-white/50 text-sm leading-relaxed">
              Diese Seite wird in Kürze mit detailliertem Inhalt ergänzt.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
