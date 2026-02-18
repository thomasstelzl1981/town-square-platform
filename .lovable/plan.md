
# Armstrong: ChatGPT-Parität -- Dokument-Analyse im Chat

## Status Quo

Armstrong kann bereits:
- Texte zusammenfassen (wenn der User den Text als Nachricht eingibt)
- E-Mails, Briefe, Anschreiben entwerfen (Global Assist Mode)
- Allgemeine Fragen beantworten (wie ChatGPT)
- Begriffe erklaeren, Checklisten erstellen, Strategien vorschlagen

Was fehlt: Der User kann Armstrong **kein Dokument uebergeben** und sagen "analysiere das". Der Datenpfad "Datei -> Armstrong-Chat" existiert nicht.

## Was gebaut werden muss

### 1. Armstrong Chat: Dokument-Upload ermoeglichen

Aktuell akzeptiert der Armstrong-Chat nur Text-Nachrichten. Ergaenzung:
- Upload-Button im Chat-Interface (Bueroklammer-Icon)
- Unterstuetzte Formate: PDF, Bilder (JPG/PNG), DOCX
- Dateien werden temporaer in den Supabase Storage hochgeladen
- Der Dateiinhalt wird per `sot-document-parser` extrahiert und als Kontext an Armstrong uebergeben

### 2. Neue Armstrong-Aktion: `ARM.GLOBAL.ANALYZE_DOCUMENT`

Registrierung im Manifest:
- action_code: `ARM.GLOBAL.ANALYZE_DOCUMENT`
- execution_mode: `readonly` (liest nur, schreibt nichts)
- cost_model: `metered` (1 Credit pro Dokument, wie ENG-DOCINT)
- Verfuegbar in allen Modulen (Global Action)
- Intent-Keywords: "analysiere", "pruefe", "was steht in", "zusammenfassung", "rechnung"

### 3. Backend: Dokument-Kontext an Lovable AI uebergeben

Erweiterung der `sot-armstrong-advisor` Edge Function:
- Neuer Parameter `document_context` im Request-Body
- Wenn vorhanden: Extrahierter Text wird als System-Context an das LLM uebergeben
- Prompt-Template fuer Dokumentanalyse: "Analysiere das folgende Dokument und beantworte die Frage des Users"
- Unterstuetzte Analyse-Typen:
  - Zusammenfassung ("Fasse das zusammen")
  - Rechnungsanalyse ("Was steht auf dieser Rechnung?")
  - Datenextraktion ("Extrahiere die wichtigsten Zahlen")
  - Vergleich ("Vergleiche diese zwei Dokumente")
  - Aufbereitung ("Erstelle eine Tabelle aus diesen Daten")

### 4. Frontend: Chat-UI-Erweiterung

Aenderungen am Armstrong-Chat-Panel:
- Datei-Upload-Button neben dem Textfeld
- Datei-Vorschau (Thumbnail + Dateiname) ueber dem Textfeld
- Lade-Indikator waehrend der Dokument-Extraktion
- Ergebnis-Darstellung mit Markdown-Rendering (Tabellen, Listen, etc.)

## Ablauf fuer den User

```text
+----------------------------------------------------------+
|  User                                                     |
|  1. Klickt Bueroklammer-Icon im Armstrong-Chat            |
|  2. Waehlt Datei (PDF, Bild, DOCX)                       |
|  3. Tippt: "Fasse das zusammen" oder "Was steht drauf?"  |
|  4. Sendet                                                |
+----------------------------------------------------------+
          |
          v
+----------------------------------------------------------+
|  Frontend                                                 |
|  1. Upload der Datei in Supabase Storage (temp/)         |
|  2. Aufruf: sot-document-parser (Text-Extraktion)        |
|  3. Aufruf: sot-armstrong-advisor mit document_context    |
+----------------------------------------------------------+
          |
          v
+----------------------------------------------------------+
|  Armstrong Advisor (Backend)                              |
|  1. Erkennt Intent: EXPLAIN oder DRAFT                   |
|  2. Fuegt extrahierten Dokumenttext als Context ein      |
|  3. Sendet an Lovable AI (Gemini) mit Analyse-Prompt     |
|  4. Gibt strukturierte Antwort zurueck                   |
+----------------------------------------------------------+
          |
          v
+----------------------------------------------------------+
|  User sieht                                               |
|  - Zusammenfassung / Analyse / Tabelle                   |
|  - Kann Folgefragen stellen (Kontext bleibt erhalten)    |
|  - Kann Ergebnis kopieren oder als Widget speichern      |
+----------------------------------------------------------+
```

## Was NICHT gebaut werden muss

- Die KI-Infrastruktur (Lovable AI Gateway) existiert bereits
- `sot-document-parser` existiert bereits (ENG-DOCINT)
- Der Global Assist Mode existiert bereits (EXPLAIN + DRAFT funktionieren)
- E-Mail-Drafts funktionieren bereits (AIReplyAssistant)

Es fehlt nur der **Verbindungspfad**: Datei-Upload -> Text-Extraktion -> Armstrong-Context

## Technische Details

### Neue/geaenderte Dateien

**Manifest (1 Datei):**
- `src/manifests/armstrongManifest.ts` -- Neue Action `ARM.GLOBAL.ANALYZE_DOCUMENT` registrieren

**Backend (1 Datei):**
- `supabase/functions/sot-armstrong-advisor/index.ts` -- Erweiterung um `document_context` Parameter, Analyse-Prompt-Template, Intent-Keywords

**Frontend (2-3 Dateien):**
- Armstrong-Chat-Komponente -- Upload-Button, Datei-Vorschau, Upload-Logik
- Hook fuer Dokument-Upload + Parser-Aufruf (ggf. neuer Hook `useArmstrongDocUpload`)

### Kosten-Modell
- 1 Credit pro Dokument-Analyse (wie ENG-DOCINT)
- Credit-Preflight vor Parser-Aufruf
- Folgefragen zum selben Dokument: Free (Kontext ist bereits extrahiert)

### Governance
- execution_mode: `readonly` -- Armstrong liest nur, schreibt nichts
- risk_level: `low` -- keine Seiteneffekte
- Dokumente bleiben im Tenant-Scope (RLS)
- Temporaere Dateien werden nach 24h geloescht

## Umfang
- 1 Manifest-Eintrag
- 1 Backend-Erweiterung (~100 Zeilen)
- 2-3 Frontend-Dateien (~200 Zeilen)
- Geschaetzte Umsetzung: 1 Session
