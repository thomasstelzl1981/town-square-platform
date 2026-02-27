/**
 * NCORE IMPRESSUM — Vollständiges Impressum gemäß § 5 TMG
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
                N•Core Business Consulting<br />
                Sauerlacher Straße 30<br />
                82041 Deisenhofen
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Kontakt</h2>
              <p>
                Telefon: +49 (0)30 424 314 70<br />
                Mobil: +49 (0) 160 901 173 58<br />
                E-Mail:{' '}
                <a href="mailto:thomas.stelzl@ncore.online" className="text-emerald-400 hover:text-emerald-300">
                  thomas.stelzl@ncore.online
                </a>
                <br />
                Web:{' '}
                <a href="https://www.ncore.online" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  www.ncore.online
                </a>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Vertretungsberechtigter</h2>
              <p>Geschäftsführer: Thomas Stelzl</p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Registereintrag</h2>
              <p>
                Registergericht: Amtsgericht München<br />
                Registernummer: HRA 121933
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Umsatzsteuer-ID</h2>
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                <em className="text-white/30">Wird bei Vorliegen ergänzt</em>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p>
                Thomas Stelzl<br />
                Sauerlacher Straße 30<br />
                82041 Deisenhofen
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">EU-Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
                .<br />
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Haftung für Inhalte</h2>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als 
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
                Tätigkeit hinweisen.
              </p>
              <p className="mt-3">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den 
                allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch 
                erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei 
                Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Haftung für Links</h2>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
                Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf 
                mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der 
                Verlinkung nicht erkennbar.
              </p>
              <p className="mt-3">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete 
                Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von 
                Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Urheberrecht</h2>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
                der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
                Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind 
                nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              </p>
              <p className="mt-3">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die 
                Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche 
                gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, 
                bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen 
                werden wir derartige Inhalte umgehend entfernen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
