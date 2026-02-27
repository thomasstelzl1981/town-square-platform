import { Helmet } from 'react-helmet';

export default function NcoreDatenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutz — Ncore Business Consulting</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold">Datenschutzerklärung</h1>
          <div className="prose prose-invert text-white/60 text-sm leading-relaxed">
            <p>Datenschutzerklärung wird in Kürze über die Compliance Engine bereitgestellt.</p>
          </div>
        </div>
      </section>
    </>
  );
}
