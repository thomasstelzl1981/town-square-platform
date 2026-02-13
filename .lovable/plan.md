
# Ist-Analyse und Speicherkonzept: AkquiseManager-Datenbank

## 1. IST-ANALYSE: Was passiert aktuell?

### Tabellen-Landschaft

```text
acq_mandates          → Suchauftrag eines Investors (ACQ-2026-00001)
  └── acq_offers      → Einzelne Immobilien-Objekte (mandate_id = FK, NOT NULL!)
       ├── acq_offer_documents   → Dateien zum Objekt (Expose etc.)
       └── acq_analysis_runs     → KI-Analysen, GeoMap, Kalkulationen
  └── acq_outbound_messages     → E-Mails an Makler
  └── acq_inbound_messages      → Antworten
  └── acq_mandate_events        → Audit-Trail
  └── acq_offer_activities      → Aktivitaeten-Log pro Objekt

Storage-Bucket: acq-documents
```

### Kritisches Problem: `mandate_id NOT NULL`

`acq_offers.mandate_id` ist **NOT NULL**. Das bedeutet:
- Jedes Objekt MUSS einem Mandat zugeordnet sein
- Der `ExposeDragDropUploader` versucht, Objekte OHNE mandate_id einzufuegen (Zeile 114-124 — nutzt `as any` Cast, um den Constraint zu umgehen)
- Das schlaegt in der DB fehl oder erzeugt inkonsistente Daten
- Es gibt keine "globale Datenbank" — alles haengt am Mandat

### Wann wird eine ID erstellt?

```text
Weg 1: Inbound-E-Mail (Zone 1 Acquiary)
  → sot-acq-offer-extract Edge Function
  → INSERT in acq_offers mit mandate_id (via Routing-Regel)
  → ID wird per gen_random_uuid() erzeugt

Weg 2: Manueller Upload (ExposeDragDropUploader)
  → INSERT in acq_offers OHNE mandate_id (FEHLER!)
  → Versucht as any-Cast → scheitert oder erzeugt Datensatz ohne Zuordnung

Weg 3: Manuelles Anlegen (useCreateOffer Hook)
  → INSERT mit mandate_id (korrekt)
  → Nur im Kontext eines Mandats nutzbar
```

### Aktueller Datenbestand

| Objekt | Quelle | Mandat | Status |
|--------|--------|--------|--------|
| "Faktor 14,7: Aufgeteilte Rotklinkeranlage mit 40 Einheiten" | inbound_email | ACQ-2026-00001 | new |

Es existiert nur 1 Objekt und 1 Mandat. Das Objekt "Notklinkeranlage" (Rotklinkeranlage) ist vorhanden, aber der Titel ist die Expose-Ueberschrift, nicht die nackten Daten.

### Problem: Titel = Expose-Ueberschrift

Aktuell wird `title` aus dem Expose uebernommen ("Faktor 14,7: Aufgeteilte Rotklinkeranlage mit 40 Einheiten"). Das ist eine Marketing-Ueberschrift, keine strukturierte Information.

Die nackten Daten (Adresse, PLZ, Stadt, Preis, WE-Zahl) sind zwar in separaten Spalten vorhanden, aber die **Listenansicht (AkquiseDatenbank.tsx)** zeigt primaer den Titel und rendert Cards statt einer Tabellenstruktur.

### Storage-Pfad-Chaos

Drei verschiedene Upload-Pfade fuer denselben Bucket:
- `{tenant_id}/manual/{timestamp}_{filename}` (ExposeDragDropUploader)
- `{tenant_id}/exposes/{timestamp}_{filename}` (useExposeUpload)
- `{mandate_id}/{offer_id}/{filename}` (useUploadOfferDocument)

Kein `data_room_folders`-Table existiert, obwohl `acq_offers.data_room_folder_id` eine FK darauf hat.

---

## 2. SOLL-KONZEPT: Globale Objekt-Datenbank

### Kern-Idee

`acq_offers` wird zur **globalen Objekt-Datenbank**. Jedes Objekt bekommt eine ID beim Eingang, unabhaengig davon, ob es einem Mandat zugeordnet ist.

### Datenbank-Aenderungen

**Migration 1: mandate_id nullable machen**
```sql
ALTER TABLE acq_offers ALTER COLUMN mandate_id DROP NOT NULL;
```

Dies erlaubt:
- Objekte ohne Mandats-Zuordnung (globaler Pool)
- Spaetere Zuordnung per Dropdown/Button
- Upload-Flow ohne Mandat-Kontext

**Migration 2: Fehlenden Anbieter-Feld hinzufuegen**
```sql
ALTER TABLE acq_offers ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE acq_offers ADD COLUMN IF NOT EXISTS provider_contact TEXT;
ALTER TABLE acq_offers ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT now();
```

So werden die geforderten Spalten verfuegbar:
- `provider_name` → Anbieter des Objektes (z.B. "Dr. Hofeditz Real Estate GmbH")
- `provider_contact` → Kontaktdaten
- `received_at` → Wann kam das Objekt rein (getrennt von created_at)

Bei vorhandenen Daten: `provider_name` kann aus `extracted_data->>'source'` befuellt werden.

### Neue Listenansicht: Excel-Tabellenstruktur

Die `AkquiseDatenbank.tsx` wird von Card-Liste auf eine echte Tabelle umgebaut:

**Spalten (Excel-kompatibel):**

| Spalte | DB-Feld | Beschreibung |
|--------|---------|--------------|
| # | lfd. Nr. | Laufende Nummer |
| Eingangsdatum | received_at / created_at | Wann kam es rein |
| PLZ | postal_code | Postleitzahl |
| Stadt | city | Ort |
| Strasse | address | Strassenadresse |
| Anbieter | provider_name | Wer hat es geschickt |
| Quelle | source_type | E-Mail / Upload / Portal |
| Preis | price_asking | Kaufpreis formatiert |
| WE | units_count | Anzahl Wohneinheiten |
| Flaeche | area_sqm | Quadratmeter |
| Faktor | yield_indicated → calc | Kaufpreisfaktor |
| Status | status | Badge |
| Mandat | mandate.code | Zugeordnetes Mandat |

Kein Titel aus dem Expose. Die Zeile ist klickbar und oeffnet ein **Detail-Popup (Sheet/Dialog)** mit der Mini-Immobilienakte.

### Detail-Popup: Mini-Immobilienakte

Wenn man auf eine Zeile klickt, oeffnet sich ein Sheet (Seitenleiste) oder Dialog mit:
- Alle extrahierten Daten aus `extracted_data` JSON
- Expose-Vorschau (Link zum Dokument in acq-documents)
- Kurz-KPIs: Preis, Faktor, NOI, Flaeche
- Mandat-Zuordnung (Dropdown zum Aendern)
- Status-Aenderung
- Button "Zur Objektakte" (Vollansicht ObjekteingangDetail)
- Aktivitaeten-Log (letzte 5 Eintraege)

### Storage-Konzept: Standardisierter Pfad

Alle Dateien im Bucket `acq-documents` folgen einem einheitlichen Schema:

```text
acq-documents/
  └── {tenant_id}/
       └── {offer_id}/
            ├── expose_original.pdf
            ├── analyse_geomap.json
            └── sonstige_dokumente...
```

- Kein mandate_id im Pfad (Objekt kann Mandat wechseln)
- offer_id ist stabil und eindeutig
- Alte Pfade ({tenant_id}/manual/...) werden per Backfill-Migration korrigiert

---

## 3. TECHNISCHE UMSETZUNG

### Schritt 1: DB-Migration
- `mandate_id` → nullable
- Neue Spalten: `provider_name`, `provider_contact`, `received_at`
- Backfill: `provider_name` aus `extracted_data->>'source'` befuellen

### Schritt 2: AkquiseDatenbank.tsx komplett umbauen
- Card-Liste → CI-konforme TABLE-Struktur (wie ObjekteingangList, aber ohne Mandate-Widgets)
- Spalten wie oben definiert
- Sortierbar nach jeder Spalte (Klick auf Header)
- Excel-Export-Button (xlsx-Bibliothek ist bereits installiert)
- Zeilen-Klick oeffnet Detail-Sheet

### Schritt 3: Neues AcqOfferDetailSheet.tsx
- Seitenleiste (Radix Sheet) mit Mini-Immobilienakte
- Zeigt extracted_data, Dokumente, KPIs, Status, Mandat-Zuordnung
- Link "Zur vollen Objektakte" → ObjekteingangDetail

### Schritt 4: Hooks anpassen
- `useCreateOffer`: mandate_id optional machen
- `ExposeDragDropUploader`: Korrekten Insert ohne mandate_id (jetzt erlaubt)
- Neuer Hook `useAssignOfferToMandate` fuer nachtraegliche Zuordnung

### Schritt 5: Storage-Pfad standardisieren
- Neue Uploads nutzen `{tenant_id}/{offer_id}/{filename}`
- Bestehende Daten (1 Objekt, keine Dokumente) brauchen keinen Backfill

---

## 4. ERGEBNIS

- Globale Objekt-Datenbank ohne Mandats-Zwang
- Excel-taugliche Tabellenansicht mit nackten Daten (keine Expose-Ueberschriften)
- Klickbare Zeilen mit Mini-Akte als Popup
- Anbieter, Eingangsdatum und Quelle als Kern-Spalten
- Standardisierter Storage-Pfad pro Objekt
- Mandats-Zuordnung nachtraeglich moeglich
