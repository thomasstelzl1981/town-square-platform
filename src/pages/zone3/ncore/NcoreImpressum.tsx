/**
 * NCORE IMPRESSUM — Legal page (Compliance Engine placeholder)
 */
import { Helmet } from 'react-helmet';

export default function NcoreImpressum() {
  return (
    <>
      <Helmet>
        <title>Impressum — Ncore Business Consulting</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="py-28 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-10 text-3xl font-bold">Impressum</h1>
          <div className="space-y-8 text-sm text-white/55 leading-relaxed">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Angaben gemäß § 5 TMG</h2>
              <p>
                Ncore Business Consulting<br />
                Thomas Stelzl<br />
                <br />
                <em className="text-white/30">Adresse wird ergänzt</em>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Kontakt</h2>
              <p>
                E-Mail: <a href="mailto:info@ncore.online" className="text-emerald-400 hover:text-emerald-300">info@ncore.online</a><br />
                Telefon: Auf Anfrage
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Umsatzsteuer-ID</h2>
              <p className="text-white/30"><em>Wird ergänzt</em></p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p>
                Thomas Stelzl<br />
                <em className="text-white/30">Adresse wird ergänzt</em>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                {' '}<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  https://ec.europa.eu/consumers/odr
                </a>.<br />
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
