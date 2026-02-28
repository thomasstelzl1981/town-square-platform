/**
 * OTTO² ADVISORY DATENSCHUTZ — Zone 3
 * DSGVO/TTDSG-konforme Datenschutzerklärung
 * ZL Finanzdienstleistungen GmbH — Stand 27.02.2026
 */
import { Helmet } from 'react-helmet';

export default function OttoDatenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutz — Otto² Advisory</title>
        <meta name="description" content="Datenschutzerklärung von Otto² Advisory — ZL Finanzdienstleistungen GmbH gemäß DSGVO und TTDSG." />
        <link rel="canonical" href="https://otto2advisory.com/datenschutz" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold">Datenschutzerklärung</h1>

          <div className="space-y-8 text-sm text-slate-600 leading-relaxed">

            {/* Einleitung entfernt — interne Checkliste darf nicht öffentlich erscheinen */}

            {/* ── § 1 VERANTWORTLICHER ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;1 Verantwortlicher</h2>
              <p>
                Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
              </p>
              <p className="mt-2">
                ZL Finanzdienstleistungen GmbH<br />
                Ruselstraße 16<br />
                94327 Bogen, Deutschland
              </p>
              <p className="mt-2">
                Telefon: +49 (0)9422 4845<br />
                E-Mail: info@otto2advisory.com
              </p>
              <p className="mt-2">
                Die ZL Finanzdienstleistungen GmbH ist als Versicherungsvertreter mit Erlaubnis nach §&nbsp;34d Abs.&nbsp;1 GewO tätig.
              </p>
            </div>

            {/* ── § 2 HOSTING ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;2 Hosting</h2>
              <p>
                Diese Website wird bei der IONOS SE, Elgendorfer Str.&nbsp;57, 56410 Montabaur, Deutschland, gehostet.
                IONOS verarbeitet personenbezogene Daten in unserem Auftrag. Die Verarbeitung erfolgt auf Grundlage
                eines Auftragsverarbeitungsvertrags gemäß Art.&nbsp;28 DSGVO.
              </p>
              <p className="mt-2">
                <strong className="text-slate-700">Server-Logfiles:</strong> Beim Aufruf unserer Website erhebt IONOS automatisch
                folgende Daten in sogenannten Server-Logfiles:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>IP-Adresse des anfragenden Geräts (anonymisiert/gekürzt)</li>
                <li>Datum und Uhrzeit des Zugriffs</li>
                <li>Aufgerufene Seite/Datei (Request)</li>
                <li>Referrer-URL (zuvor besuchte Seite)</li>
                <li>Verwendeter Browser und Betriebssystem (User-Agent)</li>
                <li>Übertragene Datenmenge</li>
                <li>HTTP-Statuscode</li>
              </ul>
              <p className="mt-2">
                Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO (berechtigtes Interesse an der sicheren und
                effizienten Bereitstellung der Website). Die Server-Logfiles werden nach
                <strong className="text-slate-700"> 14 Tagen</strong> automatisch gelöscht.
              </p>
              {/* Interner Hinweis entfernt */}
            </div>

            {/* ── § 3 ZUGRIFFSDATEN ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;3 Zugriffsdaten und Serverlogs</h2>
              <p>
                Die unter §&nbsp;2 genannten Daten werden ausschließlich zum Zweck des störungsfreien Betriebs der
                Website, zur Erkennung und Abwehr von Angriffen sowie zur statistischen Auswertung der Nutzung
                (ohne Personenbezug) verarbeitet.
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO. Unser berechtigtes Interesse liegt in der
                technischen Bereitstellung und Sicherheit der Website.
              </p>
              <p className="mt-2">
                Die Daten werden nicht mit anderen Datenquellen zusammengeführt. Eine Weitergabe an Dritte erfolgt
                nicht, es sei denn, wir sind gesetzlich dazu verpflichtet.
              </p>
            </div>

            {/* ── § 4 KONTAKTAUFNAHME E-MAIL/TELEFON ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;4 Kontaktaufnahme per E-Mail und Telefon</h2>
              <p>
                Wenn Sie uns per E-Mail oder Telefon kontaktieren, werden Ihre Angaben (Name, E-Mail-Adresse,
                Telefonnummer, Inhalt der Anfrage) zum Zweck der Bearbeitung Ihrer Anfrage verarbeitet und gespeichert.
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO (vorvertragliche Maßnahmen bzw.
                Vertragserfüllung) sowie Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO (berechtigtes Interesse an der
                Beantwortung Ihrer Anfrage).
              </p>
              <p className="mt-2">
                Ihre Daten werden gelöscht, sobald Ihre Anfrage abschließend bearbeitet wurde und keine gesetzlichen
                Aufbewahrungsfristen entgegenstehen (in der Regel 6 bzw. 10 Jahre nach HGB/AO).
              </p>
            </div>

            {/* ── § 5 KONTAKTFORMULAR / FINANZIERUNGSANFRAGEN ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;5 Kontaktformular und Finanzierungsanfragen</h2>
              <p>
                Über das Kontaktformular und die Finanzierungsanfrage auf dieser Website können Sie uns Ihre
                Angaben (u.&nbsp;a. Name, E-Mail, Telefon, Nachricht, Bonitätsdaten) übermitteln. Diese Daten
                werden ausschließlich intern verarbeitet — eine Weitergabe an Dritte oder externe Dienstleister
                findet nicht statt.
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO (Durchführung vorvertraglicher Maßnahmen
                auf Ihre Anfrage hin) sowie Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO (Ihre Einwilligung, soweit erteilt).
              </p>
              <p className="mt-2">
                Ihre Daten werden nach Abschluss der Bearbeitung gelöscht, sofern keine gesetzlichen
                Aufbewahrungsfristen entgegenstehen.
              </p>
            </div>

            {/* ── § 6 COOKIES ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;6 Cookies und ähnliche Technologien</h2>
              <p>
                Diese Website verwendet ausschließlich technisch notwendige Cookies, die für den Betrieb der
                Seite erforderlich sind (z.&nbsp;B. Session-Cookies). Diese Cookies werden nach §&nbsp;25 Abs.&nbsp;2 TTDSG
                ohne Einwilligung gesetzt, da sie unbedingt erforderlich sind, um den von Ihnen ausdrücklich
                gewünschten Dienst bereitzustellen.
              </p>
              <p className="mt-2">
                Ein Cookie-Consent-Banner ist daher nicht erforderlich.
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO (berechtigtes Interesse) in Verbindung
                mit §&nbsp;25 Abs.&nbsp;2 TTDSG.
              </p>
            </div>

            {/* §§ 7-9 entfernt — keine Webanalyse, Marketing-Pixel oder externe Inhalte im Einsatz */}

            {/* ── § 10 EMPFÄNGER ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;10 Empfänger und Kategorien von Empfängern</h2>
              <p>
                Eine Weitergabe Ihrer personenbezogenen Daten an Dritte erfolgt nur, soweit dies zur
                Vertragserfüllung erforderlich ist, wir gesetzlich dazu verpflichtet sind oder Sie
                ausdrücklich eingewilligt haben.
              </p>
              <p className="mt-2">Empfänger können sein:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Hosting-Anbieter (IONOS SE) — Auftragsverarbeitung gemäß Art.&nbsp;28 DSGVO</li>
                <li>IT-Dienstleister — soweit für den technischen Betrieb erforderlich</li>
                <li>Steuerberater/Wirtschaftsprüfer — soweit gesetzlich vorgeschrieben</li>
              </ul>
            </div>

            {/* ── § 11 DRITTLANDTRANSFER ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;11 Datenübermittlung in Drittländer</h2>
              <p>
                Personenbezogene Daten werden grundsätzlich ausschließlich innerhalb der EU/des EWR verarbeitet.
              </p>
              <p className="mt-2">
                Sofern im Einzelfall Daten an Empfänger außerhalb der EU/des EWR übermittelt werden
                (z.&nbsp;B. durch Nutzung externer Tools), erfolgt dies nur auf Grundlage eines
                Angemessenheitsbeschlusses der EU-Kommission (Art.&nbsp;45 DSGVO), geeigneter Garantien
                (Art.&nbsp;46 DSGVO, z.&nbsp;B. EU-Standardvertragsklauseln) oder Ihrer ausdrücklichen Einwilligung
                (Art.&nbsp;49 DSGVO).
              </p>
            </div>

            {/* ── § 12 SPEICHERDAUER ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;12 Speicherdauer</h2>
              <p>
                Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen
                Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
                Nach Ablauf der Fristen werden die Daten routinemäßig gelöscht. Maßgebliche gesetzliche
                Aufbewahrungsfristen betragen in der Regel 6 Jahre (§&nbsp;257 HGB) bzw. 10 Jahre (§&nbsp;147 AO).
              </p>
            </div>

            {/* ── § 13 BETROFFENENRECHTE ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;13 Ihre Rechte als betroffene Person</h2>
              <p>Ihnen stehen folgende Rechte gegenüber dem Verantwortlichen zu:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong className="text-slate-700">Auskunft</strong> über Ihre gespeicherten Daten (Art.&nbsp;15 DSGVO)</li>
                <li><strong className="text-slate-700">Berichtigung</strong> unrichtiger Daten (Art.&nbsp;16 DSGVO)</li>
                <li><strong className="text-slate-700">Löschung</strong> Ihrer Daten (Art.&nbsp;17 DSGVO)</li>
                <li><strong className="text-slate-700">Einschränkung</strong> der Verarbeitung (Art.&nbsp;18 DSGVO)</li>
                <li><strong className="text-slate-700">Datenübertragbarkeit</strong> (Art.&nbsp;20 DSGVO)</li>
                <li><strong className="text-slate-700">Widerspruch</strong> gegen die Verarbeitung (Art.&nbsp;21 DSGVO)</li>
              </ul>
              <p className="mt-3">
                Sofern die Verarbeitung auf Ihrer Einwilligung beruht, haben Sie das Recht, diese
                Einwilligung jederzeit zu widerrufen (Art.&nbsp;7 Abs.&nbsp;3 DSGVO). Die Rechtmäßigkeit
                der bis zum Widerruf erfolgten Verarbeitung bleibt davon unberührt.
              </p>
              <p className="mt-2">
                Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: info@otto2advisory.com
              </p>
            </div>

            {/* ── § 14 BESCHWERDERECHT ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;14 Beschwerderecht bei einer Aufsichtsbehörde</h2>
              <p>
                Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs
                steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind,
                dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt (Art.&nbsp;77 DSGVO).
              </p>
              <p className="mt-2">
                Die für den Sitz unseres Unternehmens zuständige Aufsichtsbehörde ist:
              </p>
              <p className="mt-2">
                Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />
                Promenade 18, 91522 Ansbach<br />
                poststelle@lda.bayern.de
              </p>
            </div>

            {/* ── § 15 SICHERHEITSMASSNAHMEN ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;15 Sicherheitsmaßnahmen</h2>
              <p>
                Wir setzen technische und organisatorische Maßnahmen (TOMs) ein, um Ihre personenbezogenen
                Daten gegen zufällige oder vorsätzliche Manipulation, Verlust, Zerstörung oder den Zugriff
                unberechtigter Personen zu schützen. Unsere Sicherheitsmaßnahmen werden entsprechend der
                technologischen Entwicklung fortlaufend verbessert.
              </p>
              <p className="mt-2">
                Diese Website nutzt aus Sicherheitsgründen eine SSL/TLS-Verschlüsselung. Eine verschlüsselte
                Verbindung erkennen Sie an „https://" in der Adresszeile Ihres Browsers.
              </p>
            </div>

            {/* ── § 16 STAND ── */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">§&nbsp;16 Aktualität und Änderung dieser Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen
                oder bei Änderungen des Dienstes bzw. der Datenverarbeitung anzupassen.
              </p>
              <p className="mt-2">
                <strong className="text-slate-700">Stand: 27. Februar 2026</strong>
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
