/**
 * ZL WOHNBAU DATENSCHUTZ — Zone 3
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';

export default function ZLWohnbauDatenschutz() {
  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{ title: 'Datenschutz', description: 'Datenschutzerklärung der ZL Wohnbau GmbH', path: '/datenschutz', noIndex: true }}
      />
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl prose prose-slate">
          <h1 className="text-3xl font-bold text-slate-800">Datenschutzerklärung</h1>

          <h2 className="text-xl font-semibold text-slate-800 mt-8">1. Verantwortlicher</h2>
          <p className="text-slate-600">
            ZL Wohnbau GmbH<br />
            Tisinstraße 19, 82041 Oberhaching<br />
            E-Mail: info@zl-wohnbau.de<br />
            Telefon: 089 66667788
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p className="text-slate-600">
            Beim Besuch unserer Website werden automatisch Informationen erfasst, die Ihr Browser an unseren Server übermittelt.
            Diese Informationen werden temporär in einem sog. Logfile gespeichert. Folgende Informationen werden dabei ohne Ihr Zutun
            erfasst und bis zur automatisierten Löschung gespeichert: IP-Adresse des anfragenden Rechners, Datum und Uhrzeit des
            Zugriffs, Name und URL der abgerufenen Datei, Website, von der aus der Zugriff erfolgt (Referrer-URL), verwendeter
            Browser und ggf. das Betriebssystem Ihres Rechners sowie der Name Ihres Access-Providers.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">3. Kontaktaufnahme</h2>
          <p className="text-slate-600">
            Wenn Sie uns per E-Mail kontaktieren, werden die von Ihnen mitgeteilten Daten (Ihre E-Mail-Adresse, ggf. Ihr Name
            und Ihre Telefonnummer) von uns gespeichert, um Ihre Anfrage zu beantworten. Die in diesem Zusammenhang anfallenden
            Daten löschen wir, nachdem die Speicherung nicht mehr erforderlich ist, oder schränken die Verarbeitung ein, falls
            gesetzliche Aufbewahrungspflichten bestehen.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">4. Ihre Rechte</h2>
          <p className="text-slate-600">
            Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten: Recht auf Auskunft,
            Recht auf Berichtigung oder Löschung, Recht auf Einschränkung der Verarbeitung, Recht auf Widerspruch gegen die
            Verarbeitung, Recht auf Datenübertragbarkeit.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">5. Hosting</h2>
          <p className="text-slate-600">
            Diese Website wird bei IONOS SE, Elgendorfer Str. 57, 56410 Montabaur gehostet.
            Wir haben einen Vertrag über Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO mit IONOS geschlossen.
          </p>

          <h2 className="text-xl font-semibold text-slate-800 mt-6">6. Cookielose Analyse</h2>
          <p className="text-slate-600">
            Diese Website verwendet keine Cookies und keine externen Tracking-Dienste. Es werden ausschließlich
            anonymisierte Seitenaufrufe ohne personenbezogene Daten erfasst.
          </p>
        </div>
      </section>
    </>
  );
}
