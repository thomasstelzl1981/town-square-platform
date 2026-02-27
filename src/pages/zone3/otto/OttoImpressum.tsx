/**
 * OTTO² ADVISORY IMPRESSUM — Zone 3
 * Legal: Komplett ZL Finanzdienstleistungen GmbH
 */
import { Helmet } from 'react-helmet';

export default function OttoImpressum() {
  return (
    <>
      <Helmet>
        <title>Impressum — Otto² Advisory</title>
        <meta name="description" content="Impressum der Komplett ZL Finanzdienstleistungen GmbH — Betreiber von otto2advisory.com." />
        <link rel="canonical" href="https://otto2advisory.com/impressum" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold">Impressum</h1>
          <div className="space-y-6 text-sm text-white/60 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Angaben gemäß § 5 TMG</h2>
              <p>
                Komplett ZL Finanzdienstleistungen GmbH<br />
                Tisinstraße 19<br />
                82041 Deisenhofen
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Vertreten durch</h2>
              <p>Geschäftsführer: Otto Stelzl, Thomas Otto Stelzl</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Kontakt</h2>
              <p>
                Telefon: 089 / 158 933 41-0<br />
                E-Mail: info@otto2advisory.com
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Registereintrag</h2>
              <p>
                Handelsregister: Amtsgericht München<br />
                Registernummer: wird nachgetragen<br />
                Umsatzsteuer-ID: wird nachgetragen
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Berufsbezeichnung und berufsrechtliche Regelungen</h2>
              <p>
                Versicherungsmakler und Finanzanlagenvermittler nach §§ 34d, 34f GewO<br />
                Zuständige Aufsichtsbehörde: IHK für München und Oberbayern
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-2">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">Haftungshinweis</h2>
              <p>
                Otto² Advisory erbringt keine Steuer- oder Rechtsberatung. Steuerliche und rechtliche Fragen
                werden in Abstimmung mit dem Steuerberater/Rechtsanwalt des Kunden geklärt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
