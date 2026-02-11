
# E-Mail bearbeitbar machen, Angebots-Vergleichsmanager bauen

## Problem 1: "Bearbeiten"-Button zeigt nicht den E-Mail-Text

Der Edit-Modus in `TenderDraftPanel.tsx` zeigt nur "Angebotsfrist" und "Zusaetzliche Hinweise", aber nicht den eigentlichen E-Mail-Text. Der Nutzer erwartet, den kompletten E-Mail-Body bearbeiten zu koennen.

**Loesung:** Im Edit-Modus den gesamten E-Mail-Body in einer grossen Textarea anzeigen, die bearbeitbar ist. Dazu einen "Speichern"-Button, der die Aenderungen uebernimmt.

### Datei: `TenderDraftPanel.tsx`

- Neuer State: `editableBody` (string), initialisiert mit `getEmailBody()` wenn Edit-Modus aktiviert wird
- Neuer State: `editableSubject` (string), initialisiert mit `getSubject()`
- Edit-Modus zeigt: Subject-Input + Body-Textarea + Deadline + Custom-Hinweise
- "Speichern"-Button setzt `isPreviewMode = true` und uebernimmt die editierten Werte
- `handleSendAll` nutzt `editableBody` / `editableSubject` falls vorhanden, sonst die generierten Werte

## Problem 2: "Angebote vergleichen" nicht klickbar

Der Step ist nur klickbar wenn `idx <= activeStep`. Da `activeStep` aus dem DB-Status kommt und der UI-Workflow diesen Status nie auf `offers_received` setzt, bleibt Step 3 immer gesperrt.

**Loesung:** Die Navigation-Logik aendern: Alle Steps bis einschliesslich `activeStep + 1` sind klickbar (der naechste Step ist immer erreichbar). Zusaetzlich: Step 3 wird immer erreichbar sobald Ausschreibungen versendet wurden (Step 2 abgeschlossen).

### Datei: `SanierungTab.tsx`

- `isReachable` Logik aendern: `idx <= activeStep + 1` oder per viewStep-Tracking
- Einfacher: Alle Steps immer klickbar machen (`isReachable = true`), da der Stepper rein zur Navigation dient und keine harte Sperre braucht

## Problem 3: Angebots-Vergleichsmanager (Step 3) ist nur Placeholder

Hier braucht es eine echte Komponente: einen Angebotsvergleichs-Manager mit Upload, KI-Auswertung und Vergleichstabelle.

### Neue Datei: `src/components/portal/immobilien/sanierung/offers/OfferComparisonPanel.tsx`

**Funktionen:**

1. **Upload-Bereich:**
   - Drag-and-Drop Zone fuer PDF/Bilder/Excel (nutzt vorhandene `FileUploader`-Komponente)
   - Mehrere Dateien gleichzeitig
   - Upload in Lovable Cloud Storage (Bucket: `tenant-documents`, Pfad: `{tenantId}/sanierung/{caseId}/offers/`)

2. **KI-Extraktion:**
   - Nach Upload: Edge Function `sot-extract-offer` aufrufen
   - KI liest das Angebot aus (Positionen, Preise, Konditionen, Anbieter-Name)
   - Ergebnis wird in einer neuen DB-Tabelle `service_case_offers` gespeichert

3. **Vergleichstabelle:**
   - Alle eingegangenen Angebote nebeneinander
   - Zeilen: Positionen aus dem LV
   - Spalten: Je ein Anbieter
   - Zellen: Preis pro Position
   - Summenzeile unten
   - Guenstigstes Angebot farblich hervorgehoben

4. **Vergabe-Aktion:**
   - Button "Zuschlag erteilen" pro Anbieter
   - Setzt Status auf `awarded`

### Neue DB-Tabelle: `service_case_offers`

```text
id              UUID PRIMARY KEY
service_case_id UUID REFERENCES service_cases(id)
tenant_id       UUID
provider_name   TEXT
provider_email  TEXT
file_path       TEXT (Storage-Pfad)
file_name       TEXT
total_net       INTEGER (Cent)
total_gross     INTEGER (Cent)
positions       JSONB (Array von {description, quantity, unit, unit_price, total})
conditions      TEXT
valid_until     DATE
extracted_at    TIMESTAMPTZ
status          TEXT DEFAULT 'received' (received, accepted, rejected)
created_at      TIMESTAMPTZ DEFAULT now()
```

RLS: Tenant-basiert wie andere service_case-Tabellen.

### Neue Edge Function: `supabase/functions/sot-extract-offer/index.ts`

- Empfaengt: `file_url` oder `file_path` + `service_case_id`
- Laedt das Dokument aus Storage
- Sendet es an Lovable AI (Gemini 2.5 Flash) mit Prompt:
  - "Extrahiere aus diesem Angebot: Anbietername, Positionen mit Preisen, Gesamtsumme netto/brutto, Konditionen, Gueltigkeitsdatum"
- Speichert das Ergebnis in `service_case_offers`
- Gibt die extrahierten Daten zurueck

### Neue Datei: `src/components/portal/immobilien/sanierung/offers/index.ts`

Export der OfferComparisonPanel-Komponente.

### Aenderung: `SanierungTab.tsx`

- Import `OfferComparisonPanel`
- Step 3 (Zeilen 302-308): Placeholder ersetzen durch `OfferComparisonPanel` mit `serviceCase`-Prop
- Alle Steps klickbar machen

## Zusammenfassung

| Datei | Aenderung |
|---|---|
| `TenderDraftPanel.tsx` | E-Mail-Body editierbar, Speichern-Button |
| `SanierungTab.tsx` | Steps immer klickbar, Step 3 = OfferComparisonPanel |
| `offers/OfferComparisonPanel.tsx` | NEU: Upload, KI-Extraktion, Vergleichstabelle |
| `offers/index.ts` | NEU: Export |
| `sot-extract-offer/index.ts` | NEU: KI-basierte Angebotsauswertung |
| DB-Migration | NEU: `service_case_offers` Tabelle + RLS |
