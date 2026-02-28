/**
 * NCORE IMPRESSUM — Angaben gemäß § 5 DDG + § 18 MStV
 * Vollständige Neufassung für UG (haftungsbeschränkt) & Co. KG Struktur
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

            {/* Angaben gemäß § 5 DDG */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Angaben gemäß § 5 DDG</h2>
              <p>
                Ncore Business Consulting UG (haftungsbeschränkt) &amp; Co. KG<br />
                Sauerlacher Straße 30<br />
                82041 Oberhaching (Deisenhofen)<br />
                Deutschland
              </p>
            </div>

            {/* Kontakt */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Kontakt</h2>
              <p>
                Telefon: +49 (0)30 424 314 70<br />
                Mobil: +49 (0)160 901 17 358<br />
                E-Mail:{' '}
                <a href="mailto:info@ncore.online" className="text-emerald-400 hover:text-emerald-300">
                  info@ncore.online
                </a>
                <br />
                Web:{' '}
                <a href="https://www.ncore.online" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  www.ncore.online
                </a>
              </p>
            </div>

            {/* Komplementär */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Persönlich haftende Gesellschafterin (Komplementär)</h2>
              <p>
                Ncore Consulting UG (haftungsbeschränkt)<br />
                Sauerlacher Straße 30<br />
                82041 Oberhaching (Deisenhofen)<br /><br />
                Registergericht: Amtsgericht München<br />
                Registernummer: HRB 307081<br /><br />
                Geschäftsführer: Thomas Stelzl
              </p>
            </div>

            {/* Register KG */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Registereintrag der KG</h2>
              <p>
                Registergericht: Amtsgericht München<br />
                Registernummer: HRA 121933
              </p>
            </div>

            {/* Steuerliche Angaben */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Steuerliche Angaben</h2>
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                DE459006252
              </p>
              <p className="mt-2">
                Steuernummer: 9143/551/20741
              </p>
            </div>

            {/* Inhaltlich Verantwortlicher */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Inhaltlich Verantwortlicher gemäß § 18 Abs. 2 MStV</h2>
              <p>
                Thomas Stelzl<br />
                Sauerlacher Straße 30<br />
                82041 Oberhaching (Deisenhofen)
              </p>
            </div>

            {/* EU-Streitschlichtung */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">EU-Streitschlichtung</h2>
              <p>
                Die Europäische Kommission hat die Plattform zur Online-Streitbeilegung (OS) zum 
                20.&nbsp;Juli&nbsp;2025 eingestellt. Eine Verlinkung entfällt daher.
              </p>
            </div>

            {/* Verbraucherstreitbeilegung */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>

            {/* Haftung für Inhalte */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">Haftung für Inhalte</h2>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als 
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

            {/* Haftung für Links */}
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

            {/* Urheberrecht */}
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

            {/* Stand */}
            <div className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-5">
              <p className="text-xs text-white/30">
                Stand: Februar 2026 · Dieses Impressum wurde unter Berücksichtigung des DDG und MStV erstellt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
