/**
 * OTTO² ADVISORY DATENSCHUTZ — Zone 3
 * Standard DSGVO-konforme Datenschutzerklärung
 */
import { Helmet } from 'react-helmet';

export default function OttoDatenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutz — Otto² Advisory</title>
        <meta name="description" content="Datenschutzerklärung von Otto² Advisory — Komplett ZL Finanzdienstleistungen GmbH." />
        <link rel="canonical" href="https://otto2advisory.com/datenschutz" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold">Datenschutzerklärung</h1>
          <div className="space-y-6 text-sm text-white/60 leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">1. Verantwortlicher</h2>
              <p>
                Komplett ZL Finanzdienstleistungen GmbH<br />
                Tisinstraße 19, 82041 Deisenhofen<br />
                E-Mail: info@otto2advisory.com
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">2. Erhebung und Speicherung personenbezogener Daten</h2>
              <p>
                Beim Besuch unserer Website werden automatisch Informationen durch den Browser übermittelt
                (Server-Log-Files): Browsertyp, Betriebssystem, Referrer-URL, IP-Adresse (anonymisiert),
                Uhrzeit der Serveranfrage. Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">3. Kontaktformular und Finanzierungsanfragen</h2>
              <p>
                Wenn Sie uns über das Kontaktformular oder die Finanzierungsanfrage kontaktieren,
                werden Ihre Angaben (Name, E-Mail, Telefon, Nachricht, Bonitätsdaten) zur Bearbeitung
                Ihrer Anfrage gespeichert. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
                (Vertragsanbahnung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
              </p>
              <p className="mt-2">
                Ihre Daten werden nach Abschluss der Bearbeitung gelöscht, sofern keine
                gesetzlichen Aufbewahrungsfristen entgegenstehen.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">4. Ihre Rechte</h2>
              <p>Sie haben das Recht auf:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
                <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">5. SSL-Verschlüsselung</h2>
              <p>
                Diese Seite nutzt aus Sicherheitsgründen eine SSL-Verschlüsselung. Eine verschlüsselte
                Verbindung erkennen Sie an „https://" in der Adresszeile Ihres Browsers.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">6. Hosting</h2>
              <p>
                Diese Website wird in der EU gehostet. Personenbezogene Daten werden ausschließlich
                innerhalb der EU/des EWR verarbeitet.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/80 mb-2">7. Änderung der Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen
                oder bei Änderungen des Dienstes anzupassen. Stand: Februar 2026.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
