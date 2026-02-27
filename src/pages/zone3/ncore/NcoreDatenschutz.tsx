/**
 * NCORE DATENSCHUTZ — Privacy policy (Compliance Engine placeholder)
 */
import { Helmet } from 'react-helmet';

export default function NcoreDatenschutz() {
  return (
    <>
      <Helmet>
        <title>Datenschutzerklärung — Ncore Business Consulting</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="py-28 px-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-10 text-3xl font-bold">Datenschutzerklärung</h1>
          <div className="space-y-8 text-sm text-white/55 leading-relaxed">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">1. Datenschutz auf einen Blick</h2>
              <h3 className="mb-2 font-semibold text-white/70">Allgemeine Hinweise</h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                denen Sie persönlich identifiziert werden können.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">2. Verantwortliche Stelle</h2>
              <p>
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
                Ncore Business Consulting<br />
                Thomas Stelzl<br />
                E-Mail: <a href="mailto:info@ncore.online" className="text-emerald-400 hover:text-emerald-300">info@ncore.online</a>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">3. Datenerfassung auf dieser Website</h2>
              <h3 className="mb-2 font-semibold text-white/70">Kontaktformular</h3>
              <p>
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem 
                Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung 
                der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben 
                wir nicht ohne Ihre Einwilligung weiter.
              </p>
              <p className="mt-3">
                Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, 
                sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung 
                vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung 
                auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten 
                Anfragen (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">4. Ihre Rechte</h2>
              <p>
                Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten 
                personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung 
                sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu 
                weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">5. SSL-Verschlüsselung</h2>
              <p>
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher 
                Inhalte eine SSL-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, 
                dass die Adresszeile des Browsers von „http://" auf „https://" wechselt.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-5">
              <p className="text-xs text-white/30">
                Diese Datenschutzerklärung wird über die Compliance Engine bereitgestellt und kann 
                jederzeit über das Admin-Dashboard aktualisiert werden.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
