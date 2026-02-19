

# Seed: Impressums fuer vier Webseiten (v1 als Draft + Aktivierung)

## Rechtliche Pruefung und Ergaenzungen

Folgende Punkte wurden recherchiert und eingearbeitet:

1. **Rechtsgrundlage aktualisiert**: Seit Mai 2024 gilt nicht mehr § 5 TMG, sondern **§ 5 DDG** (Digitale-Dienste-Gesetz). Das wird in den Texten korrekt nicht als Ueberschrift referenziert, aber die Pflichtangaben sind identisch.

2. **Zustaendige IHK identifiziert**: Fuer Future Room GmbH (Sitz Altoetting) ist die **IHK fuer Muenchen und Oberbayern** zustaendig (Max-Joseph-Str. 2, 80333 Muenchen, Tel. 089 5116-0, ihk-muenchen.de).

3. **DIHK Vermittlerregister Telefon**: (0180) 600 585 0, E-Mail: vr@dihk.de

4. **VSBG-Text**: Standardformulierung eingefuegt ("Wir sind weder verpflichtet noch bereit...").

5. **MStV § 18 Abs. 2**: Abschnitt wird nur aufgefuehrt, wenn redaktionell-journalistische Inhalte vorliegen. Fuer reine Unternehmensseiten entfaellt er — wird daher bei allen vier Impressums weggelassen.

6. **Platzhalter**: Telefon und USt-IdNr. bleiben als `[TELEFON]` / `[UST-ID]` markiert, da diese Daten nicht vorliegen. Beim SoT-Impressum fehlt auch die HRB-Nummer — bleibt als `[HRB-NUMMER]` markiert.

7. **Postleitzahl Muenchen korrigiert**: In der Datenbank steht PLZ 80797 fuer System of a Town — wird im Text verwendet (Nutzerdaten haben keine PLZ angegeben).

8. **Haftungsausschluss-Texte** sind rechtlich Standard und bleiben so.

## Technische Umsetzung

### Eine neue SQL-Migration die folgendes tut:

Fuer jedes der vier Dokumente (kaufy, futureroom, acquiary, sot):

1. **INSERT** in `compliance_document_versions` mit:
   - `document_id` = jeweilige ID aus `compliance_documents`
   - `version` = 1
   - `status` = 'active'
   - `content_md` = ausformulierter Markdown-Text
   - `activated_at` = NOW()

2. **UPDATE** auf `compliance_documents`:
   - `current_version` = 1
   - `status` = 'active'

### Dokument-IDs (aus DB):

| Brand | doc_key | ID |
|-------|---------|-----|
| kaufy | website_imprint_kaufy | 41890ce7-f4ca-4a9a-bc27-adebec1cf39a |
| futureroom | website_imprint_futureroom | 5cdc402c-bde5-4187-b725-a56332627c32 |
| acquiary | website_imprint_acquiary | 0ce00eec-a188-4bd3-867a-77131d903c2e |
| sot | website_imprint_sot | 361cd0a6-7d3d-4889-83b8-a197fc78c0da |

### Inhalt der vier Impressums (zusammengefasst):

**futureroom.finance** — Vollstaendiges Impressum mit allen GewO-Erlaubnissen (34d, 34i, 34f), IHK Muenchen und Oberbayern als Aufsichtsbehoerde, DIHK-Vermittlerregister-Kontakt, VSBG-Hinweis, Haftungs- und Urheberrechtsklauseln.

**kaufy.com** — Markenhinweis ("Kaufy ist eine Marke der Future Room GmbH"), gleiche GewO-Erlaubnisse in Kurzform, gleiche IHK/DIHK-Angaben, gleiche Standard-Klauseln.

**acquiary.com** — Markenhinweis ("Acquiary ist eine Marke der Future Room GmbH"), identische Struktur wie Kaufy.

**systemofatown.com** — Eigene GmbH (System of a Town GmbH), kein GewO-Erlaubnisse, stattdessen Klarstellungs-Hinweis dass Vermittlung ueber Future Room GmbH erfolgt, VSBG-Hinweis, Standard-Klauseln.

### Keine Code-Aenderungen noetig

Die CompliancePublicPages-Komponente zeigt bereits alle Dokumente mit Markdown-Vorschau und Inline-Editor an. Sobald die Versionen in der DB stehen, erscheinen sie automatisch.

