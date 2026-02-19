

# Seed: Datenschutzerklaerungen fuer vier Webseiten (v1, active)

## Rechtliche Pruefung und Ergaenzungen

1. **TDDDG korrekt referenziert**: Seit Mai 2024 ersetzt das TDDDG (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz) das fruehere TTDSG. Die Texte referenzieren korrekt TDDDG fuer Cookie-/Endgeraetezugriff.

2. **Aufsichtsbehoerde identifiziert**: Fuer nicht-oeffentliche Stellen in Bayern ist das **Bayerische Landesamt fuer Datenschutzaufsicht (BayLDA)** zustaendig:
   - Promenade 18, 91522 Ansbach
   - Telefon: 0981 180093-0
   - Internet: lda.bayern.de

3. **Bewerbungs-Abschnitt**: § 26 BDSG wurde durch § 26 BDSG n.F. (seit 2024 teils diskutiert) nicht ersetzt — bleibt als Rechtsgrundlage korrekt. Der Abschnitt wird bei allen vier Seiten als optionaler Platzhalter belassen.

4. **Kaufy und Acquiary**: Die Vorlage verweist auf "identisch wie futureroom". Fuer die Seed-Daten werden **vollstaendige, eigenstaendige Texte** erstellt (nicht Verweise), damit jede Webseite eine komplett lesbare Datenschutzerklaerung hat. Unterschiede: E-Mail-Adresse und Markenhinweis.

5. **System of a Town**: Eigene GmbH, eigener Verantwortlicher (Sebastian Maximilian Bergler), kein Vermittlungsbezug. Abschnitt 7 wird auf "Produkt-/Plattformbezug" angepasst statt Vermittlung.

6. **Platzhalter bleiben**: Alle `[PLATZHALTER]` werden beibehalten und koennen spaeter im Compliance Desk Inline-Editor ersetzt werden. Bekannte Werte (Aufsichtsbehoerde) werden direkt eingesetzt.

7. **OS-Plattform-Link**: Der Link zur EU-OS-Plattform (ec.europa.eu/consumers/odr) ist seit Juli 2025 nicht mehr aktiv (Verordnung 2024/3228 hat die ODR-Plattform abgeschafft). Der Hinweis auf die Plattform wird daher weggelassen — nur der VSBG-Hinweis bleibt.

## Technische Umsetzung

### Daten-INSERT (kein Schema-Aenderung, nur Daten)

Fuer jedes der vier Dokumente:

1. **INSERT** in `compliance_document_versions`:
   - `document_id` = jeweilige ID
   - `version` = 1
   - `status` = 'active'
   - `content_md` = vollstaendiger Markdown-Text
   - `activated_at` = NOW()

2. **UPDATE** auf `compliance_documents`:
   - `current_version` = 1
   - `status` = 'active'

### Dokument-IDs:

| Brand | doc_key | ID |
|-------|---------|-----|
| futureroom | website_privacy_futureroom | 982d366b-d92e-4a44-b0a3-d452525025c7 |
| kaufy | website_privacy_kaufy | 4cf15a95-bdfa-4537-a8c0-859a432d7738 |
| acquiary | website_privacy_acquiary | c0b4086a-fc29-4c37-a793-99a3c34f38f4 |
| sot | website_privacy_sot | 2dc282de-f150-46eb-af26-f14e6d66506e |

### Inhalt (zusammengefasst):

**futureroom.finance** — Vollstaendige 16-Abschnitte-Datenschutzerklaerung mit DSGVO + TDDDG, BayLDA als Aufsichtsbehoerde, alle Platzhalter fuer Hosting/Analytics/Newsletter/DPO.

**kaufy.com** — Eigenstaendiger Volltext (nicht Verweis), Markenhinweis "Kaufy ist eine Marke der Future Room GmbH", E-Mail info@kaufy.com, sonst identische Struktur.

**acquiary.com** — Eigenstaendiger Volltext, Markenhinweis "Acquiary ist eine Marke der Future Room GmbH", E-Mail info@acquiary.com, sonst identische Struktur.

**systemofatown.com** — Eigene GmbH (System of a Town GmbH), Geschaeftsfuehrer Sebastian Maximilian Bergler, Abschnitt 7 auf Software-/Plattformbezug angepasst, keine Vermittlungsreferenzen.

### Keine Code-Aenderungen noetig

Die CompliancePublicPages-Komponente zeigt bereits alle Dokumente inline an. Sobald die Versionen in der DB stehen, erscheinen die Datenschutzerklaerungen automatisch neben den Impressums.

