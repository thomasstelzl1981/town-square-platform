

# Tiefenanalyse MOD-12 Akquise-Manager — Komplette Funktionsdokumentation

## Modulstruktur (6 Seiten + 21 Komponenten + 8 Edge Functions)

```text
AkquiseManagerPage (Router)
├── /dashboard        → AkquiseDashboard
├── /mandate          → AkquiseMandate (Mandats-Workflow)
├── /mandate/:id      → AkquiseMandateDetail (Workbench)
├── /objekteingang    → ObjekteingangList (Pipeline-Tabelle)
├── /objekteingang/:id→ ObjekteingangDetail (Objektakte)
├── /tools            → AkquiseTools (Standalone-Werkzeuge)
├── /datenbank        → AkquiseDatenbank (Excel-artige Gesamtübersicht)
└── /provisionen      → AkquiseProvisionen (Provisionsvereinbarung)
```

---

## 1. DASHBOARD (`AkquiseDashboard`)

**Funktion:** Startseite des Akquise-Managers mit Visitenkarte und Mandate-Übersicht.

**Was funktioniert:**
- Visitenkarte des Managers (ManagerVisitenkarte-Komponente) mit Profil-Bearbeitung via Sheet
- KPI-Widget: Aktive Mandate (live aus DB), Neue Aufträge (live), Kontakte gesamt (Platzhalter "—"), Pipeline-Objekte (Platzhalter "—")
- Widget-Grid mit MandateCaseCards: Jedes aktive/pending Mandat als Kachel
- "Neues Mandat"-Button navigiert zu `/mandate`
- Profil-Bearbeitung: Name, E-Mail, Telefon, Adresse, Firma, Website — schreibt direkt in `profiles` Tabelle

**Was NICHT funktioniert / Platzhalter:**
- KPI "Kontakte gesamt" und "Objekte in Pipeline" zeigen "—" — keine DB-Query dafür implementiert

---

## 2. MANDATS-WORKFLOW (`AkquiseMandate`) — 4-Kachel-System

Dies ist die zentrale Seite für die Mandatserstellung. Der Workflow hat 4 Kacheln:

### Kachel 1: KI-gestützte Erfassung (INPUT)
**Funktion:** Freitext-Eingabe eines Suchprofils + optionale Steuerparameter
- **Freitext-Feld** mit Diktat-Funktion (DictationButton)
- **Steuerparameter** (optional): Preis min/max, Region, Asset-Fokus (Checkboxen: MFH, ETW, ZFH, Gewerbe etc.), Zielrendite, Ausschlüsse
- **"Ankaufsprofil generieren"** Button → ruft Edge Function `sot-acq-profile-extract` auf
- Die Edge Function nutzt **Lovable AI (Gemini)** zur Extraktion strukturierter Daten aus dem Freitext

### Kachel 2: Ankaufsprofil (OUTPUT)
**Funktion:** Zeigt das extrahierte Profil + Mandanten-Eingabe
- Strukturierte Anzeige: Suchgebiet, Asset-Fokus, Investitionsrahmen, Zielrendite, Ausschlüsse
- Editierbarer Freitext-Zusammenfassung
- Mandantenname (Textarea mit Kontaktbuch-Button)
- **"Ankaufsprofil übernehmen"** Button → Orchestriert 3 Dinge gleichzeitig:
  1. CI-Vorschau befüllen
  2. E-Mail-Entwurf generieren
  3. Auto-Kontaktrecherche starten (via `useResearchEngine` → `sot-research-engine`)

### CI-Vorschau (Vollbreite)
- Zeigt das Ankaufsprofil im Corporate-Design (`AcqProfilePreview`)
- **PDF-Export** via jsPDF (mit Armstrong-Logo) — **funktioniert client-seitig, kein Server nötig**
- **Druck-Button** via `window.print()`

### Mandatserteilung
- 3 Consent-Checkboxen (Daten, Recherche, DSGVO)
- **"Mandat erstellen"** Button → `useCreateAcqMandate` → schreibt in `acq_mandates` Tabelle
- Generiert einen eindeutigen Mandats-Code

### Kachel 3: Kontaktrecherche (SourcingTab)
**Wird erst nach Mandatserstellung aktiv (vorher disabled/blurred).**

3 Quellen für Kontakte:
1. **KI-Recherche** (`useResearchEngine` → `sot-research-engine`): Sucht nach Immobilienmaklern in Zielregion. Nutzt Firecrawl + Gemini zur Extraktion. Parameter: Job-Titel, Standorte, Branchen, Limit.
2. **Portal Scraper** (Apify-Route über `sot-research-engine`): Durchsucht Portal-URLs
3. **Manuell**: Formular für Firma, Name, E-Mail, Telefon, Rolle, Region, Website

Kontakte landen in `acq_contact_staging` mit Status `pending`. Manager kann:
- **Übernehmen** (approved) → wird in `contact_links` persistiert
- **Ablehnen** (rejected)
- **Anreichern** → `sot-acq-contact-enrich` Edge Function (Firecrawl + Gemini)

### Kachel 4: E-Mail-Versand
- Empfänger aus genehmigten Kontakten auswählen
- Betreff + Nachricht (mit Diktat-Button)
- PDF-Anhang-Anzeige des Ankaufsprofils
- **"Senden"** Button → `useBulkSendOutreach` → `sot-acq-outbound` Edge Function
- Outbound nutzt User-Mailkonto (bevorzugt) oder **Resend** als Fallback
- Status-Tracking: queued → sending → sent → delivered → opened → replied

### Gesendete Nachrichten (unterhalb Kachel 4)
- Auflistung aller gesendeten E-Mails mit Statusanzeige

---

## 3. MANDATS-DETAIL / WORKBENCH (`AkquiseMandateDetail`)

**Funktion:** Detailansicht eines einzelnen Mandats mit 7-Stufen-Workflow.

### Stepper (AkquiseStepper)
Zeigt den Fortschritt: Erfassung → Profil → Kontakte → E-Mail → Objekteingang → Analyse → Delivery

### Terms Gate (Sektion 1)
- Erscheint nur bei Status `assigned` ohne Split-Bestätigung
- `TermsGatePanel` mit Template `ACQ_MANDATE_ACCEPTANCE_V1`
- Manager muss Provisionsvereinbarung akzeptieren → `useAcceptAcqMandate`

### Suchprofil-Zusammenfassung
- Read-only: Mandat-Code, Mandant, Asset-Fokus, Preisspanne, Zielrendite

### Sektion 5: Objekteingang & Analyse (InboundTab)
**Funktion:** Zeigt eingegangene E-Mails die dem Mandat zugeordnet wurden.

- Nachrichten kommen über `sot-acq-inbound-webhook` (Resend Webhook)
- Deterministische Zuordnung über 4 Methoden: Token, E-Mail-Match, Thread, KI-Fallback
- Zeigt: Betreff, Absender, Alter, Routing-Methode, Konfidenz
- HTML-Anzeige mit DOMPurify-Sanitization
- **"Als Angebot anlegen"** → `useConvertToOffer` konvertiert E-Mail-Anhänge zu `acq_offers`

### Sektion 6: Analyse & Kalkulation (AnalysisTab)
**Funktion:** Objektliste mit Side-by-Side Bestand + Aufteiler Kalkulationen.

- Objektübersicht: Status-Badges, Preis, Einheiten, Rendite
- **"Objekt hinzufügen"** Dialog: Titel, Adresse, PLZ, Stadt, Kaufpreis, Einheiten, Fläche, Baujahr
- Objekt-Detail-Ansicht:
  - **GeoMap-Button** → `useRunGeoMap` → `sot-geomap-snapshot` (mit offerId)
  - **KI-Recherche** → `useRunAIResearch` → `sot-acq-ai-research`
  - **Exposé hochladen** → `useUploadOfferDocument`
  - **Bestand-Kalkulation** (`BestandCalculation` Komponente) — nutzt `calcBestandQuick` aus `src/engines/akquiseCalc/engine.ts`
  - **Aufteiler-Kalkulation** (`AufteilerCalculation` Komponente) — nutzt `calcAufteilerFull` aus `src/engines/akquiseCalc/engine.ts`

### Sektion 7: Delivery (DeliveryTab)
**Funktion:** Objekte dem Mandanten präsentieren und Feedback erfassen.

Status-Flow: analyzed → presented → accepted/rejected
- "Präsentieren" markiert Objekt als vorgestellt (mit optionalen Notizen + Diktat)
- "Akzeptiert" / "Abgelehnt" Buttons für Kundenentscheidung
- KPI-Karten: Bereit, Präsentiert, Akzeptiert, Abgelehnt

---

## 4. OBJEKTEINGANG (ObjekteingangList + ObjekteingangDetail)

### ObjekteingangList
**Funktion:** Pipeline-Tabelle aller eingegangenen Angebote quer über alle Mandate.

- Mandate als Widget-Grid mit Upload-Drop-Zones (`MandateUploadWidget`)
- Filter-Chips: Alle, Eingegangen, In Analyse, Analysiert, Präsentiert
- Suche über Titel, Adresse, Stadt
- Table mit: Titel, Adresse, Preis, Status, Mandat-Code, Alter
- Click → navigiert zur Objektakte

### ObjekteingangDetail
**Funktion:** Einzelne Objektakte mit KPIs, Kalkulationen, Aktions-Dialogen.

- **KPI-Zeile**: Kaufpreis, Rendite, Fläche, Einheiten (live aus DB)
- **Status-Dropdown** mit allen 7 Status-Optionen
- **Stepper**: Erfassung → Analyse → Bewertung → Delivery
- **Preis-Override**: Eigenes Preisfeld das in `price_counter` persistiert wird
- **Tab-Kalkulationen**: Bestand (Hold) + Aufteiler (Flip) mit dynamischer Neuberechnung bei Preis-Override
- **Collapsible "Extrahierte Daten"**: Zeigt alle KI-extrahierten Felder aus dem Exposé
- **3 Aktions-Dialoge**: Absage, Preisvorschlag, Interesse (AbsageDialog, PreisvorschlagDialog, InteresseDialog)
- **Quell-E-Mail Viewer** (SourceEmailViewer): Zeigt die Original-E-Mail
- **Aktivitätslog** (ActivityLogPanel): Chronologische Events

---

## 5. TOOLS (`AkquiseTools`)

4 Standalone-Werkzeuge, unabhängig von Mandaten:

### 5.1 Portal-Recherche (`PortalSearchTool`)
**Funktion:** Durchsucht Immobilienportale nach Objekten oder Maklern.

- Portale: ImmoScout24, Immowelt, eBay Kleinanzeigen
- 2 Modi: Objekte suchen / Makler suchen
- Parameter: Portal, Suchbegriff, Region, Preisspanne
- Backend: `sot-research-engine` Edge Function (Firecrawl + Gemini)
- **Kein nativer Portal-API-Anschluss** — alles KI-basiert via Web-Scraping

### 5.2 Immobilienbewertung (`PropertyResearchTool`)
**Funktion:** KI-Standortanalyse mit 4 Tabs + optionalem GeoMap + Sprengnetter.

3 Buttons:
1. **KI-Recherche** → `sot-acq-standalone-research` → Lovable AI (Gemini) generiert Standort-, Markt-, Risiko-, und Empfehlungsdaten
2. **GeoMap-Analyse** → `sot-geomap-snapshot` (standalone-Modus) → Gemini-basierte Schätzwerte
3. **Sprengnetter** → `sot-sprengnetter-valuation` → Prüft ob `SPRENGNETTER_API_KEY` konfiguriert ist. **Wenn nicht** (aktueller Zustand): Fallback auf Gemini-Schätzwert

4 Ergebnis-Tabs: Standort (Score/10, Makro/Mikrolage, Infrastruktur, ÖPNV), Markt (Miete, Kaufpreis, Leerstand, Trend), Risiken (Score, Hochwasser, Lärm, Wirtschaftliche Abhängigkeit), Empfehlung (Strategien, Stärken, Schwächen)

### 5.3 Standalone-Kalkulatoren (`StandaloneCalculatorPanel`)
**Funktion:** Schnelle Bestand/Aufteiler-Kalkulation ohne DB-Persistenz.

- **Exposé-Upload** via SmartDropZone → `useUniversalUpload` (lädt in `tenant-documents` Bucket) → `sot-acq-offer-extract` (standaloneMode) → extrahiert Kaufpreis, Miete, Fläche, Einheiten per Gemini Vision OCR
- **Manuelle Eingabe**: Kaufpreis, Fläche, Einheiten, Jahresmiete, Faktor (auto-berechnet)
- 2 Tabs: Bestand (Hold) + Aufteiler (Flip)
- **Upload funktioniert**: Datei → `acq-documents` Bucket → Edge Function → Felder befüllt

### 5.4 Datenraum (`AcqDataRoom`)
**Funktion:** Read-only Tree-View aller Dateien im `acq-documents` Storage-Bucket.

- Listet Ordner und Dateien unter `{tenant_id}/`
- Zeigt: Dateiname, Typ-Icon, Dateigröße
- **Kein Download implementiert** — nur Anzeige

---

## 6. DATENBANK (`AkquiseDatenbank`)

**Funktion:** Excel-artige Gesamtübersicht aller `acq_offers` mit Sortierung, Filtern, Excel-Export.

- Filterpanel (`ObjectSearchPanel`): Status, Quelle, Mandat, Preis min/max, Fläche min, Rendite min, Stadt/PLZ, Freitextsuche
- Sortierbare Spalten: Eingang, PLZ, Stadt, Anbieter, Preis, WE, m², Faktor, Status
- **Excel-Export** via `xlsx` Library → generiert `.xlsx` Datei
- Click auf Zeile → `AcqOfferDetailSheet` (Side-Sheet mit Objektdetails)

---

## 7. PROVISIONEN (`AkquiseProvisionen`)

**Funktion:** Zeigt die Provisionsvereinbarung des Akquise-Managers.

- Nutzt `ManagerProvisionen` Shared-Komponente mit Config aus `MANAGER_COMMISSION_CONFIGS.akquise`
- Read-only Darstellung der Split-Vereinbarung

---

## 8. EDGE FUNCTIONS (Backend)

| Edge Function | Nutzt | Externe API? | Fallback |
|---|---|---|---|
| `sot-acq-profile-extract` | Gemini | Nein | — |
| `sot-research-engine` | Firecrawl + Gemini | Firecrawl (optional) | Gemini-only |
| `sot-acq-standalone-research` | Gemini | Nein | — |
| `sot-geomap-snapshot` | Gemini | Nein (GeoMap API optional) | Gemini-Schätzwerte |
| `sot-sprengnetter-valuation` | Gemini | Sprengnetter API (optional) | Gemini-Schätzwerte |
| `sot-acq-offer-extract` | Gemini Vision | Nein | — |
| `sot-acq-contact-enrich` | Firecrawl + Gemini | Firecrawl (optional) | Gemini-only |
| `sot-acq-outbound` | Resend | Resend (optional) | User-Mailkonto |
| `sot-acq-inbound-webhook` | — | Resend Webhook | — |
| `sot-acq-ai-research` | Gemini | Nein | — |
| `sot-acq-create-dataroom` | — | Nein | — |
| `sot-acq-generate-response` | Gemini | Nein | — |

**Ergebnis:** Alle Tools funktionieren auch OHNE externe API-Keys. GeoMap, Sprengnetter, und Portal-Recherche fallen auf **Gemini-basierte KI-Schätzwerte** zurück.

---

## 9. UPLOAD-FUNKTIONEN — STATUS

| Upload-Punkt | Bucket | Funktioniert? |
|---|---|---|
| StandaloneCalculatorPanel (SmartDropZone) | `tenant-documents` | Ja — Upload + Gemini Vision Extraktion |
| ExposeDragDropUploader (nicht auf AkquiseTools sichtbar!) | `acq-documents` | Ja — aber die Komponente wird NICHT geroutet |
| ObjekteingangDetail (File-Input) | via `useUploadOfferDocument` | Ja |
| MandateUploadWidget (ObjekteingangList) | via `useUploadOfferDocument` | Ja |
| AnalysisTab (File-Input "Exposé hochladen") | via `useUploadOfferDocument` | Ja |

**Befund:** `ExposeDragDropUploader` ist als Komponente exportiert und importierbar, wird aber auf der AkquiseTools-Seite **nicht eingebunden**. Die Datei existiert, ist aber nicht in den Router oder die Tools-Seite integriert. Der Upload-Weg für Tools geht über den StandaloneCalculatorPanel.

---

## 10. BEFUNDE & INKONSISTENZEN

### B-1: ExposeDragDropUploader ist verwaist
Die Komponente `ExposeDragDropUploader` ist in `components/index.ts` exportiert, wird aber nirgends importiert oder gerendert. Sie war vermutlich als eigenständiges Tool auf der Tools-Seite gedacht ("Exposé-Upload & Analyse" der in den Objekteingang schreibt), ist aber durch den StandaloneCalculatorPanel ersetzt worden. Die Funktionalität (Upload → acq_offers Eintrag + KI-Extraktion) ist jedoch **anders** als der StandaloneCalculatorPanel (der nur temporär rechnet und nicht persistiert). Es fehlt also ein persistierender Upload-Pfad auf der Tools-Seite.

### B-2: KPI-Dashboard Platzhalter
"Kontakte gesamt" und "Objekte in Pipeline" im Dashboard zeigen "—". Es gibt keine Query dafür.

### B-3: Datenraum hat keinen Download
`AcqDataRoom` listet Dateien, bietet aber keinen Download-Button.

### B-4: AkquiseMandate ist 885 Zeilen lang
Die Datei enthält alle 4 Kacheln + CI-Vorschau + Sentbox in einer einzigen Datei. Das ist architektonisch grenzwertig, funktioniert aber.

---

## ZUSAMMENFASSUNG

Das Modul ist **funktional vollständig** für den Kernworkflow:
1. Freitext → KI-Profil-Extraktion → Ankaufsprofil (PDF) 
2. KI-Kontaktrecherche → Staging → Genehmigung → E-Mail-Versand
3. Inbound-E-Mails → Routing → Konvertierung zu Angeboten
4. Objektanalyse: GeoMap, KI-Research, Bestand/Aufteiler-Kalkulation
5. Delivery: Präsentation → Akzeptiert/Abgelehnt

**Alle Tools funktionieren ohne externe APIs** — GeoMap, Sprengnetter, Portal-Recherche und Kontaktanreicherung fallen auf Gemini-Schätzwerte zurück. Die Ergebnisse sind KI-generiert (nicht echte Marktdaten), aber strukturiert und nutzbar.

**Uploads funktionieren** über den StandaloneCalculatorPanel (SmartDropZone → tenant-documents → Gemini Vision) und über die Mandats-Workbench (Exposé hochladen → acq_offer_documents).

