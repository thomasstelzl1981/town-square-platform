/**
 * ZL WOHNBAU IMPRESSUM — Zone 3
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';

export default function ZLWohnbauImpressum() {
  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{ title: 'Impressum', description: 'Impressum der ZL Wohnbau GmbH', path: '/impressum', noIndex: true }}
      />
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl prose prose-slate">
          <h1 className="text-3xl font-bold text-slate-800">Impressum</h1>

          <h2 className="text-xl font-semibold text-slate-800 mt-8">Angaben gemäß § 5 TMG</h2>
          <p className="text-slate-600">
            ZL Wohnbau GmbH<br />
            Tisinstraße 19<br />
            82041 Oberhaching
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Vertreten durch</h2>
          <p className="text-slate-600">Geschäftsführer: Otto Stelzl</p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Kontakt</h2>
          <p className="text-slate-600">
            Telefon: 089 66667788<br />
            E-Mail: info@zl-wohnbau.de
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Registereintrag</h2>
          <p className="text-slate-600">
            Eintragung im Handelsregister.<br />
            Registergericht: Amtsgericht München<br />
            Registernummer: HRB 281711
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Stammkapital</h2>
          <p className="text-slate-600">25.000,00 EUR</p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Gegenstand des Unternehmens</h2>
          <p className="text-slate-600">
            Handel und Dienstleistungen im Bereich Grundstücke und (Wohn- und Gewerbe-)Bauwerke,
            insbesondere deren Erwerb, Bebauung, Bewirtschaftung, Verwaltung und Veräußerung
            sowie die Ausübung von Bauträgertätigkeiten (§ 34c GewO).
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Zugehörigkeit</h2>
          <p className="text-slate-600">
            Die ZL Wohnbau GmbH ist ein Unternehmen der ZL Gruppe.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Streitschlichtung</h2>
          <p className="text-slate-600">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="underline">
              https://ec.europa.eu/consumers/odr/
            </a>.<br />
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">Hosting</h2>
          <p className="text-slate-600">
            IONOS SE<br />
            Elgendorfer Str. 57, 56410 Montabaur
          </p>
        </div>
      </section>
    </>
  );
}
