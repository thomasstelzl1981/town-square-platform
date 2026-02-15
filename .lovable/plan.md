

# Testament-Widget: PDF-Schreibvorlage zum Download + Scan-Upload

## Zusammenfassung

Das Testament-Widget bekommt einen **anderen Workflow** als die Patientenverfuegung. Statt eines interaktiven Formulars wird beim Klick eine **PDF-Schreibvorlage** mit allen 4 Testament-Varianten heruntergeladen. Der Nutzer schreibt das Testament von Hand ab, unterschreibt es und laedt den Scan hoch. Die Karte selbst enthaelt ausfuehrliche Hinweise zur Handhabung.

---

## Ablauf

```text
+---------------------------+
| Testament-Widget          |
| (mit ausfuehrlichem       |
|  Erklaertext + Hinweise)  |
|                           |
| Klicken → PDF Download    |
+---------------------------+
        |
        v
  PDF mit 4 Vorlagen
  wird heruntergeladen
        |
        v
  Nutzer schreibt von
  Hand ab + unterschreibt
        |
        v
+---------------------------+
| Upload-Dialog oeffnet     |
| sich nach Download        |
| → Scan hochladen          |
| → Status wird gruen       |
+---------------------------+
```

---

## Aenderung 1: Testament-Widget Kartentext erweitern

Die bestehende Karte in `VorsorgedokumenteTab.tsx` bekommt:

- **Ausfuehrlicherer Erklaertext** auf der Karte selbst (warum ein Testament wichtig ist, dass es handschriftlich sein muss, Hinweise zur amtlichen Verwahrung)
- **CTA-Text** aendern zu "Klicken zum Herunterladen der Schreibvorlage"
- Beim Klick: Statt `LegalDocumentDialog` mit Formular wird ein **vereinfachter Dialog** geoeffnet

---

## Aenderung 2: Testament-Dialog (vereinfacht, 2 Schritte)

Statt des 3-Schritt-Formularprozesses der Patientenverfuegung:

**Schritt 1: Hinweise + PDF-Download**
- Alle wichtigen Hinweise aus dem gelieferten Text (Wirksamkeit, Handhabung, Hinterlegung, Widerruf)
- Button "PDF-Schreibvorlage herunterladen" → generiert PDF mit allen 4 Vorlagen
- "Weiter"-Button zum Upload-Schritt

**Schritt 2: Scan hochladen**
- FileDropZone fuer den unterschriebenen Scan
- Bestaetigung "Original sicher aufbewahrt"
- Setzt `is_completed = true` in `legal_documents`

---

## Aenderung 3: Neue PDF-Funktion `generateTestamentVorlagenPdf`

In `generateLegalDocumentPdf.ts` wird eine neue Funktion ergaenzt, die alle 4 Vorlagen als Schreibvorlagen im Notarvertrag-Stil generiert:

1. **Deckblatt**: Allgemeine Hinweise (Wirksamkeit, Handhabung, Hinterlegung ZTR, Widerruf)
2. **Vorlage 1/4**: Einzeltestament — Alleinerbe (mit Ersatzerbe)
3. **Vorlage 2/4**: Einzeltestament — Mehrere Erben (Quoten, Anwachsung)
4. **Vorlage 3/4**: Vor- und Nacherbschaft
5. **Vorlage 4/4**: Berliner Testament (gegenseitige Alleinerbeneinsetzung)
6. **Schlussseite**: Zusatzhinweis zur Hinterlegung / ZTR

Jede Vorlage enthaelt Platzhalter-Unterstriche (`______`) fuer Namen, Daten, Adressen — der Nutzer schreibt den gesamten Text von Hand ab.

---

## Aenderung 4: LegalDocumentDialog fuer Testament-Modus anpassen

Die bestehende `LegalDocumentDialog`-Komponente wird um eine Fallunterscheidung erweitert:

- `documentType === 'patientenverfuegung'` → bestehender 3-Schritt-Prozess (Formular → Vorschau → Upload)
- `documentType === 'testament'` → neuer 2-Schritt-Prozess (Hinweise+Download → Upload)

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/VorsorgedokumenteTab.tsx` | Kartentext erweitern, CTA aendern |
| `src/components/legal/LegalDocumentDialog.tsx` | Testament-Modus mit 2-Schritt-Prozess (Hinweise+Download → Upload) |
| `src/lib/generateLegalDocumentPdf.ts` | Neue Funktion `generateTestamentVorlagenPdf` mit allen 4 Vorlagen + Hinweisseiten |

**Keine DB-Migration noetig** — die bestehende `legal_documents`-Tabelle deckt den Testament-Typ bereits ab.

