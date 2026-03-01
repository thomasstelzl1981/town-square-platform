

# Briefgenerator — Vollständiger Audit

## 1. Architektur-Übersicht

```text
BriefTab.tsx (914 Zeilen)
  ├── Absender-Auswahl (SenderSelector)
  ├── Empfänger (Kontaktbuch oder Manuell)
  ├── Betreff + Prompt
  ├── KI-Generierung → sot-letter-generate (Gemini 2.5 Pro)
  ├── Bearbeitung (Textarea)
  ├── Vorschau → LetterPreview.tsx (HTML-Vorschau, Multi-Page)
  ├── PDF → letterPdf.ts (jsPDF, DIN 5008)
  └── Versand → sot-system-mail-send (Resend API)
       ├── E-Mail: direkt an Empfänger
       ├── Fax: an simplefax@systemofatown.com (Faxnummer im Subject)
       └── Post: an simplebrief@systemofatown.com (PDF als Anhang)
```

## 2. Versandweg — Ja, alles über Resend

Alle drei Kanäle (E-Mail, Fax, Post) laufen über `sot-system-mail-send` → Resend API:
- **E-Mail**: PDF als Anhang direkt an `recipient.email`
- **Fax**: E-Mail an `simplefax@systemofatown.com` mit Faxnummer im Subject-Feld (SimpleFax-Gateway)
- **Post**: E-Mail an `simplebrief@systemofatown.com` mit PDF-Anhang (SimpleBrief-Gateway)

Es gibt keinen separaten Fax- oder Briefdienst-API-Call. Alles wird als E-Mail mit Anhang versendet.

---

## 3. Gefundene Probleme

### 3.1 HOCH: PDF-Seitenumbruch fehlerhaft

**`letterPdf.ts` (Z. 96-98)**: Der Seitenumbruch springt bei `yPos > 270` auf `yPos = 25`. Das ist grundsätzlich korrekt, ABER:
- Nach `addPage()` wird der **Header (Absenderzeile, Empfänger-Fenster, Datum, Betreff) NICHT wiederholt** — das ist korrekt für DIN 5008.
- **Problem**: Der neue `yPos = 25` beginnt zu hoch — auf Seite 2+ fehlt der obere Rand. DIN 5008 sieht 27mm Kopfabstand vor. Außerdem: wenn ein einzelner Absatz genau an der Grenze liegt, wird er mitten im Wort getrennt (kein Absatz-Schutz).

### 3.2 HOCH: Schriftgrößen im PDF zu groß

**`letterPdf.ts`**: 
- Empfänger-Fenster: `setFontSize(12)` → 12pt ist korrekt für DIN 5008
- Datum: `setFontSize(12)` → OK
- Betreff: `setFontSize(13)` → **zu groß**. DIN 5008 empfiehlt den Betreff in gleicher Größe wie den Fließtext (12pt), nur fett
- Body: `setFontSize(12)` → **zu groß für einen Geschäftsbrief**. Standard ist 10-11pt. Bei 12pt passen deutlich weniger Zeilen auf die Seite, was den Seitenumbruch verschärft
- `lineHeight = 6mm` bei 12pt → das ergibt ca. 1.5x Zeilenabstand, was in Ordnung ist, aber bei 10pt wäre `lineHeight = 5mm` besser

### 3.3 HOCH: HTML-Vorschau vs. PDF divergieren

**`LetterPreview.tsx`** nutzt `fontSize: 8.5px` und CSS-basierte Pagination mit `marginTop`-Offset. **`letterPdf.ts`** nutzt `12pt` jsPDF. Diese beiden Darstellungen können stark abweichen:
- Unterschiedliche Fonts (Helvetica in PDF vs. D-DIN/Arial/Calibri in Vorschau)
- Unterschiedliche Zeilenumbrüche (jsPDF `splitTextToSize` vs. CSS `white-space: pre-wrap`)
- Der Font-Selektor in der Vorschau (din/arial/calibri/times/georgia) hat **keinen Einfluss auf das PDF** — das PDF ist immer Helvetica

### 3.4 MITTEL: LetterPreview Pagination ist fragil

**`LetterPreview.tsx` (Z. 218-237)**: Die Folgeseiten verwenden einen negativen `marginTop`-Hack:
```
marginTop: `-${pageIndex * (PAGE_HEIGHT - 80)}px`
```
Plus einen unsichtbaren 220px-Header-Spacer. Das ist eine Näherung — bei unterschiedlichen Body-Längen stimmt der Offset nicht exakt, und Text kann am Seitenrand abgeschnitten werden oder doppelt erscheinen.

### 3.5 MITTEL: `letterPdf.ts` nutzt synchronen Import statt `lazyJspdf`

**Dead Code / Inkonsistenz**: Es existiert `src/lib/lazyJspdf.ts` als Lazy-Loading-Wrapper für jsPDF (~250KB Bundle-Ersparnis). Aber `letterPdf.ts` importiert `jsPDF` direkt synchron (`import jsPDF from 'jspdf'`). Da `BriefTab.tsx` lazy-loaded ist, ist der Impact gering, aber es ist inkonsistent mit dem Rest der Codebase (LogbookExport, PMFinanzen, AkquiseMandate nutzen alle `getJsPDF()`).

Ebenso: `generateLegalDocumentPdf.ts`, `generateProjectReportPdf.ts`, `nkAbrechnung/pdfExport.ts` — alle nutzen synchronen Import.

### 3.6 NIEDRIG: Spracheingabe-Button deaktiviert

**`BriefTab.tsx` (Z. 665-673)**: Der Mikrofon-Button im Prompt-Feld ist `disabled` mit Tooltip "in Entwicklung". Entweder implementieren oder entfernen.

### 3.7 NIEDRIG: Draft-Laden nicht implementiert

**`BriefTab.tsx` (Z. 859-870)**: Die Entwurf-Liste zeigt Drafts an, aber der `button`-Click hat **keine onClick-Handler** — man kann gespeicherte Entwürfe nicht wieder laden.

### 3.8 NIEDRIG: `senderIdentity.company` Typ-Problem

**`sot-letter-generate/index.ts` (Z. 18)**: `company` ist als `string` (required) definiert, aber in `BriefTab.tsx` (Z. 323) wird `undefined` gesendet wenn der Absender kein Business ist. Kein Runtime-Fehler, aber TypeScript-Lücke.

### 3.9 KOSMETISCH: Fallback-Demo-Text im Fehlerfall

**`BriefTab.tsx` (Z. 349-363)**: Bei KI-Fehler wird ein Fallback-Brief mit hartcodierten Texten generiert. Das ist kein Demo-Data-Violation (es ist Error-Fallback, nicht Mock-Data), aber der Text ist sehr generisch.

---

## 4. Dead Code

| Code | Zeilen | Status |
|------|--------|--------|
| `Mic`-Import + Button | Z. 55, 665-673 | Deaktiviert, nie funktional |
| `showCreateContext` State + Dialog | Z. 126, 908-911 | Dialog existiert, wird aber nirgends geöffnet — kein Button triggert `setShowCreateContext(true)` |

---

## 5. Empfohlene Fixes (nach Priorität)

### Priorität 1 — PDF-Qualität (Schriftgrößen + Seitenumbruch)

**`letterPdf.ts`**:
- Body-Schriftgröße: 12pt → **10.5pt** (professioneller Standard)
- Betreff-Schriftgröße: 13pt → **10.5pt bold** (gleiche Größe wie Body, nur fett)
- `lineHeight`: 6mm → **5mm** (passt zu 10.5pt)
- Seite 2+ `yPos`: 25mm → **27mm** (korrekter DIN-Kopfabstand)
- Absenderzeile: 7pt → OK (bleibt)

### Priorität 2 — Font-Konsistenz Vorschau ↔ PDF

**`letterPdf.ts`**: Den Font-Selektor aus `LetterPreview` auch im PDF berücksichtigen. Problem: jsPDF unterstützt nur Helvetica, Courier, Times nativ. Für Arial/Calibri/D-DIN müsste ein Font eingebettet werden, was die Dateigröße erhöht.

**Pragmatischer Fix**: Die Vorschau auf die gleichen Schriftgrößen-Verhältnisse wie das PDF bringen (8.5px Basis ist zu klein — sollte proportional zu 10.5pt berechnet werden).

### Priorität 3 — Funktionale Lücken

- **Draft-Laden**: onClick-Handler für Entwurf-Buttons hinzufügen, der Subject + Body + Channel wiederherstellt
- **CreateContext-Trigger**: Entweder einen "Neuen Absender anlegen"-Button in den SenderSelector integrieren oder den toten Code entfernen

### Priorität 4 — Code-Hygiene

- Spracheingabe-Button entfernen (oder als Feature-Flag markieren)
- `letterPdf.ts` auf `getJsPDF()` umstellen (async, lazy-loaded)

---

## 6. Zusammenfassung

| Bereich | Note | Kommentar |
|---------|------|-----------|
| Architektur | A | Saubere Trennung: KI-Generierung → Vorschau → PDF → Versand |
| KI-Generierung | A | Gemini 2.5 Pro, guter System-Prompt, Sender-Kontext |
| Versandlogik | A | Alle 3 Kanäle über Resend, SimpleFax/SimpleBrief-Gateway |
| PDF-Qualität | C | Schriftgrößen zu groß, Seitenumbruch-Position falsch |
| Vorschau-Treue | C | Font/Größe divergiert vom PDF, Pagination-Hack fragil |
| Code-Hygiene | B- | 2 Dead-Code-Stellen, fehlender Draft-Load, deaktiviertes Mic |

**Gesamtnote: B-** — Funktional vollständig, aber PDF-Qualität und Vorschau-Konsistenz brauchen Nacharbeit.

### Vorgeschlagenes Vorgehen

Ich würde mit **Priorität 1 (PDF-Schriftgrößen + Seitenumbruch)** und **Priorität 3 (Draft-Laden)** starten — das sind die spürbaren User-Probleme. Die Font-Konsistenz (Priorität 2) ist aufwändiger und kann in einem zweiten Schritt erfolgen.

