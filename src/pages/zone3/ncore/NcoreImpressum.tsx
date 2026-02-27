import { Helmet } from 'react-helmet';

export default function NcoreImpressum() {
  return (
    <>
      <Helmet>
        <title>Impressum — Ncore Business Consulting</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold">Impressum</h1>
          <div className="prose prose-invert text-white/60 text-sm leading-relaxed space-y-4">
            <p>Ncore Business Consulting</p>
            <p>Impressumsdaten werden in Kürze ergänzt.</p>
          </div>
        </div>
      </section>
    </>
  );
}
