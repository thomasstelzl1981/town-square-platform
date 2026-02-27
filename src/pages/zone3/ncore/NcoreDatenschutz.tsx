/**
 * NCORE DATENSCHUTZ — Vollständige Datenschutzerklärung gemäß DSGVO
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

            {/* 1. Datenschutz auf einen Blick */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">1. Datenschutz auf einen Blick</h2>
              <h3 className="mb-2 font-semibold text-white/70">Allgemeine Hinweise</h3>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema 
                Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
              </p>
              <h3 className="mb-2 mt-4 font-semibold text-white/70">Datenerfassung auf dieser Website</h3>
              <p>
                <strong className="text-white/70">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen 
                Kontaktdaten können Sie dem Abschnitt „Hinweis zur verantwortlichen Stelle" in dieser 
                Datenschutzerklärung entnehmen.
              </p>
              <p className="mt-3">
                <strong className="text-white/70">Wie erfassen wir Ihre Daten?</strong><br />
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es 
                sich z.&nbsp;B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden 
                automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. 
                Das sind vor allem technische Daten (z.&nbsp;B. Internetbrowser, Betriebssystem oder Uhrzeit des 
                Seitenaufrufs).
              </p>
              <p className="mt-3">
                <strong className="text-white/70">Wofür nutzen wir Ihre Daten?</strong><br />
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu 
                gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>
              <p className="mt-3">
                <strong className="text-white/70">Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck 
                Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, 
                die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur 
                Datenverarbeitung erteilt haben, können Sie diese jederzeit für die Zukunft widerrufen. 
                Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der 
                Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein 
                Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
              </p>
            </div>

            {/* 2. Hosting */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">2. Hosting</h2>
              <p>
                Wir hosten die Inhalte unserer Website bei folgenden Anbietern:
              </p>
              <h3 className="mb-2 mt-4 font-semibold text-white/70">Externes Hosting</h3>
              <p>
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website 
                erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v.&nbsp;a. 
                um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, 
                Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
              </p>
              <p className="mt-3">
                Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen 
                und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, 
                schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen 
                Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </div>

            {/* 3. Allgemeine Hinweise und Pflichtinformationen */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              <h3 className="mb-2 font-semibold text-white/70">Datenschutz</h3>
              <p>
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
                Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen 
                Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
              <p className="mt-3">
                Wir weisen darauf hin, dass die Datenübertragung im Internet (z.&nbsp;B. bei der 
                Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz 
                der Daten vor dem Zugriff durch Dritte ist nicht möglich.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Hinweis zur verantwortlichen Stelle</h3>
              <p>
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="mt-2">
                N•Core Business Consulting<br />
                Thomas Stelzl<br />
                Sauerlacher Straße 30<br />
                82041 Deisenhofen<br /><br />
                Telefon: +49 (0)30 424 314 70<br />
                E-Mail:{' '}
                <a href="mailto:thomas.stelzl@ncore.online" className="text-emerald-400 hover:text-emerald-300">
                  thomas.stelzl@ncore.online
                </a>
              </p>
              <p className="mt-3">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder 
                gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen 
                Daten (z.&nbsp;B. Namen, E-Mail-Adressen o.&nbsp;Ä.) entscheidet.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Speicherdauer</h3>
              <p>
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt 
                wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die 
                Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen 
                oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, 
                sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer 
                personenbezogenen Daten haben (z.&nbsp;B. steuer- oder handelsrechtliche 
                Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall 
                dieser Gründe.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p>
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung 
                möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die 
                Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen (Art. 21 DSGVO)</h3>
              <p>
                Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, 
                haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen Situation 
                ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen. 
                Wir verarbeiten die betroffenen personenbezogenen Daten dann nicht mehr, es sei denn, 
                wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre 
                Interessen, Rechte und Freiheiten überwiegen.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
              <p>
                Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht 
                bei einer Aufsichtsbehörde zu. Die zuständige Aufsichtsbehörde ist:<br /><br />
                Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)<br />
                Promenade 18<br />
                91522 Ansbach<br />
                <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  www.lda.bayern.de
                </a>
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Recht auf Datenübertragbarkeit</h3>
              <p>
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung 
                eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, 
                maschinenlesbaren Format aushändigen zu lassen.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Auskunft, Berichtigung und Löschung</h3>
              <p>
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf 
                unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft 
                und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung 
                oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene 
                Daten können Sie sich jederzeit an uns wenden.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Recht auf Einschränkung der Verarbeitung</h3>
              <p>
                Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten 
                zu verlangen. Hierzu können Sie sich jederzeit an uns wenden.
              </p>
            </div>

            {/* 4. Datenerfassung auf dieser Website */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">4. Datenerfassung auf dieser Website</h2>

              <h3 className="mb-2 font-semibold text-white/70">Server-Log-Dateien</h3>
              <p>
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten 
                Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Browsertyp und Browserversion</li>
                <li>Verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="mt-3">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. 
                Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Kontaktformular</h3>
              <p>
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem 
                Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung 
                der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben 
                wir nicht ohne Ihre Einwilligung weiter.
              </p>
              <p className="mt-3">
                Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, 
                sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung 
                vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die 
                Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an 
                uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung 
                (Art. 6 Abs. 1 lit. a DSGVO), sofern diese abgefragt wurde.
              </p>
              <p className="mt-3">
                Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns 
                zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck 
                für die Datenspeicherung entfällt. Zwingende gesetzliche Bestimmungen – insbesondere 
                Aufbewahrungsfristen – bleiben unberührt.
              </p>

              <h3 className="mb-2 mt-4 font-semibold text-white/70">Anfrage per E-Mail oder Telefon</h3>
              <p>
                Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller 
                daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung 
                Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne 
                Ihre Einwilligung weiter.
              </p>
            </div>

            {/* 5. SSL/TLS */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-white/80">5. SSL- bzw. TLS-Verschlüsselung</h2>
              <p>
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher 
                Inhalte, wie zum Beispiel Anfragen, die Sie an uns als Seitenbetreiber senden, eine 
                SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass 
                die Adresszeile des Browsers von „http://" auf „https://" wechselt und an dem 
                Schloss-Symbol in Ihrer Browserzeile.
              </p>
              <p className="mt-3">
                Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an 
                uns übermitteln, nicht von Dritten mitgelesen werden.
              </p>
            </div>

            {/* Quelle */}
            <div className="rounded-xl border border-emerald-900/20 bg-emerald-950/10 p-5">
              <p className="text-xs text-white/30">
                Stand: Februar 2026 · Diese Datenschutzerklärung wurde unter Berücksichtigung der 
                DSGVO sowie des TMG erstellt und wird bei Bedarf über das Compliance-System aktualisiert.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
