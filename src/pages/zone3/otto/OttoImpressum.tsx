/**
 * OTTO² ADVISORY IMPRESSUM — Zone 3
 * Legal: ZL Finanzdienstleistungen GmbH
 * DDG-konform — Stand 27.02.2026
 */
import { Helmet } from 'react-helmet';

export default function OttoImpressum() {
  return (
    <>
      <Helmet>
        <title>Impressum — Otto² Advisory</title>
        <meta name="description" content="Impressum der ZL Finanzdienstleistungen GmbH — Betreiber von otto2advisory.com." />
        <link rel="canonical" href="https://otto2advisory.com/impressum" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold">Impressum</h1>
          <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Angaben gemäß § 5 DDG</h2>
              <p>
                ZL Finanzdienstleistungen GmbH<br />
                Ruselstraße 16<br />
                94327 Bogen, Deutschland
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Vertreten durch</h2>
              <p>Geschäftsführer: Otto Stelzl</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Kontakt</h2>
              <p>
                Telefon: <a href="tel:+498941432903" className="underline">+49 89 4143 2903</a> (Armstrong KI-Assistent)<br />
                E-Mail: info@otto2advisory.com
              </p>
            </div>
            <div>
             <h2 className="text-lg font-semibold text-slate-800 mb-2">Registereintrag</h2>
              <p>
                Handelsregister: Amtsgericht Straubing, HRB 13762<br />
                Umsatzsteuer-Identifikationsnummer: in Gründung — wird nach Erteilung ergänzt
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Berufsbezeichnung und berufsrechtliche Regelungen</h2>
              <p>
               Versicherungsvertreter mit Erlaubnis nach § 34d Abs. 1 GewO<br />
              Zuständige Behörde: IHK für München und Oberbayern<br />
              Registrierungsnummer im Vermittlerregister (§ 11a GewO): D-5XQ1-QCZZB-31
              </p>
              <p className="mt-2">
                Vermittlerregister: DIHK, Breite Straße 29, 10178 Berlin —{' '}
                <span className="text-slate-400">www.vermittlerregister.info</span>
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Streitschlichtung</h2>
              <p>
                Die Plattform der Europäischen Kommission zur Online-Streitbeilegung (OS) wurde
                zum 20.&nbsp;Juli 2025 eingestellt und steht nicht mehr zur Verfügung.
              </p>
              <p className="mt-2">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Haftungshinweis</h2>
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
