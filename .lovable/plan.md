

# Document Parser Engine -- Manifest-gesteuertes Parsing-System

## Analyse: Finanzierung vs. Immobilie

Die Finanzierungsakte (AKTE-10) ist bereits von der Immobilienakte (AKTE-01) getrennt:
- **Immobilienakte** = MOD-04, DB: `units/properties` -- Objektdaten, Mieter, NK
- **Finanzierungsakte** = MOD-11, DB: `finance_requests/finance_mandates/applicant_profiles` -- Darlehen, Konditionen, Selbstauskunft

Die Trennung ist korrekt. Der Parser muss jedoch eigenstaendige Modi fuer beide haben, damit z.B. ein Kreditvertrag nicht faelschlich als Immobilien-Dokument klassifiziert wird.

---

## Problem: Aktueller Zustand

Der `sot-document-parser` arbeitet derzeit mit:
- 4 generische `parseMode`-Strings (`properties`, `contacts`, `financing`, `general`)
- Freitext-Prompts ohne formale Felddefinitionen
- Keine Verbindung zu den Akten-Mastervorlagen
- Keine automatische DMS-Ablage nach Parsing
- Keine Validierung der extrahierten Felder gegen ein Schema

Das ist fragil und wird bei Erweiterung auf 10+ Aktentypen unwartbar.

---

## Loesung: Parser Engine Manifest (`parserManifest.ts`)

Eine zentrale Konfigurationsdatei, die pro Aktentyp exakt definiert:
1. Welche Felder extrahiert werden (mit DB-Mapping)
2. In welchen DMS-Ordner die Datei abgelegt wird
3. Welcher AI-Prompt verwendet wird
4. Wie das Ergebnis validiert wird

### Architektur-Uebersicht

```text
+---------------------------+
|   parserManifest.ts       |  <-- SSOT: Feld-Definitionen pro Aktentyp
|   (src/config/)           |
+-------------+-------------+
              |
              v
+---------------------------+
|   sot-document-parser     |  <-- Edge Function: Liest Manifest-Daten
|   (supabase/functions/)   |      als Prompt-Instruktionen
+-------------+-------------+
              |
              v
+---------------------------+
|   useDocumentIntake.ts    |  <-- Client-Hook: Orchestriert Upload ->
|   (src/hooks/)            |      Parse -> DMS-Ablage -> DB-Write
+---------------------------+
```

---

## Phase 3.1: Parser Manifest erstellen

### Neue Datei: `src/config/parserManifest.ts`

Definiert pro Aktentyp ein `ParserProfile`:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `parseMode` | string | Eindeutiger Modus-Schluessel (z.B. `immobilie`, `versicherung`) |
| `entityType` | string | Verknuepfung zu `recordCardManifest` |
| `label` | string | Anzeigename |
| `targetTable` | string | Ziel-DB-Tabelle fuer Import |
| `targetDmsFolder` | string | Standard-DMS-Ordner fuer Ablage (z.B. `01_Police`) |
| `fields` | Array | Felder mit `key`, `label`, `type`, `required`, `dbColumn` |
| `promptTemplate` | string | Strukturierter AI-Prompt mit exakten Feldnamen |
| `validationRules` | Array | Min/Max, Regex, Pflichtfelder |
| `exampleDocuments` | Array | Dokumenttypen, die dieser Modus erkennt |

### Definierte Parser-Modi (10 Stueck):

| Nr | parseMode | Aktentyp | Ziel-Tabelle | Primaere Felder |
|----|-----------|----------|-------------|----------------|
| 1 | `immobilie` | Immobilienakte | `units` | Adresse, Kaufpreis, Wohnflaeche, Baujahr, Mieteinnahmen |
| 2 | `finanzierung` | Finanzierungsakte | `finance_requests` | Bank, Darlehensbetrag, Zinssatz, Tilgung, Laufzeit |
| 3 | `versicherung` | Versicherungsakte | `insurance_contracts` | Versicherer, Policennr, Kategorie, Praemie, SB |
| 4 | `fahrzeugschein` | Fahrzeugakte | `cars_vehicles` | Kennzeichen, FIN, HSN/TSN, Erstzulassung, Halter |
| 5 | `pv_anlage` | PV-Akte | `pv_plants` | kWp, MaStR-Nr, Inbetriebnahme, Einspeiseverguetung |
| 6 | `vorsorge` | Vorsorgeakte | `vorsorge_contracts` | Anbieter, Vertragsnr, Vertragswert, Rente, Typ |
| 7 | `person` | Personenakte | `household_persons` | Name, Geburtsdatum, Adresse, Arbeitgeber, Einkommen |
| 8 | `haustier` | Haustierakte | `pets` | Name, Tierart, Rasse, Chipnummer, Tierarzt |
| 9 | `kontakt` | Kontakte (allg.) | `contacts` | Name, E-Mail, Telefon, Firma, Rolle |
| 10 | `allgemein` | Auto-Erkennung | -- | KI erkennt Dokumenttyp und waehlt Modus automatisch |

---

## Phase 3.2: Edge Function refactoring

### Aenderungen an `sot-document-parser/index.ts`:

1. **parseMode erweitern**: Die 4 alten Modi (`properties`, `contacts`, `financing`, `general`) werden als Aliase beibehalten fuer Abwaertskompatibilitaet, intern aber auf die neuen Modi gemappt
2. **Strukturierte Prompts**: Statt Freitext-Instruktionen generiert die Edge Function den Prompt aus dem Manifest -- jedes Feld wird mit exaktem Key, Typ und Validierung spezifiziert
3. **Response-Validierung**: Nach dem AI-Call wird das Ergebnis gegen das Manifest validiert (fehlende Pflichtfelder -> Warning, falsche Typen -> Auto-Korrektur)
4. **Neues Response-Format**: Das `data`-Objekt enthaelt statt generischer Arrays (`properties[]`, `contacts[]`) nun ein typisiertes `records`-Array mit `parseMode`-Referenz

```text
Aktuell:
  { data: { properties: [...], contacts: [...] } }

Neu:
  { data: { 
      parseMode: "versicherung",
      records: [{ provider_name: "HUK", policy_number: "V-123", ... }],
      targetTable: "insurance_contracts",
      targetDmsFolder: "01_Police"
    } 
  }
```

---

## Phase 3.3: Client-seitiger Orchestrator-Hook

### Neue Datei: `src/hooks/useDocumentIntake.ts`

Dieser Hook ersetzt die bisherigen fragmentierten Upload-Logiken und orchestriert den gesamten Prozess:

```text
1. Upload     -> Datei in Storage hochladen
2. Parse      -> sot-document-parser mit parseMode aufrufen
3. Preview    -> Extrahierte Daten dem Nutzer zur Pruefung zeigen
4. DMS-Ablage -> Datei in den korrekten Akten-Ordner verschieben
5. DB-Write   -> Extrahierte Daten in die Ziel-Tabelle schreiben
6. Feedback   -> Erfolg/Fehler-Meldung
```

Der Hook erhaelt den `parseMode` aus dem Kontext (welches Modul ist aktiv) und nutzt das Manifest, um:
- Den richtigen DMS-Ordner zu bestimmen
- Die richtigen DB-Felder zu mappen
- Die Preview-UI mit den korrekten Labels zu fuellen

---

## Phase 3.4: Abwaertskompatibilitaet

Die bestehenden Aufrufe bleiben funktionsfaehig:

| Alter Modus | Neuer Modus | Mapping |
|-------------|-------------|---------|
| `properties` | `immobilie` | Alias |
| `contacts` | `kontakt` | Alias |
| `financing` | `finanzierung` | Alias |
| `general` | `allgemein` | Alias |

Armstrong (`useArmstrongDocUpload`) und die Finanzierungs-Uploads (`DocumentUploadSection`, `FinanceUploadZone`) werden schrittweise auf die neuen Modi umgestellt.

---

## Dateien-Uebersicht

### Neue Dateien
- `src/config/parserManifest.ts` -- SSOT fuer alle Parser-Modi, Felder, Prompts, Validierung
- `src/hooks/useDocumentIntake.ts` -- Orchestrator-Hook (Upload -> Parse -> DMS -> DB)
- `src/types/parser-engine.ts` -- TypeScript-Typen fuer das neue Parser-System

### Geaenderte Dateien
- `supabase/functions/sot-document-parser/index.ts` -- Neue Modi, strukturierte Prompts, Response-Validierung
- `src/types/document-schemas.ts` -- Erweiterte ParseMode-Union, neues Record-Format
- `src/hooks/useArmstrongDocUpload.ts` -- Migration auf neuen Orchestrator
- `src/hooks/useUniversalUpload.ts` -- ParseMode-Union erweitern
- `spec/current/07_akten/akten_backlog.json` -- BL-03 bis BL-06 als "in_progress" markieren

### Unveraendert
- `src/config/recordCardManifest.ts` -- Wird vom parserManifest referenziert, nicht geaendert
- Bestehende MasterTemplate-Komponenten -- Dienen weiterhin als Referenz-Dokumentation

---

## Reihenfolge der Implementierung

1. **Schritt 1**: `parserManifest.ts` + `parser-engine.ts` erstellen (Manifest + Typen)
2. **Schritt 2**: `sot-document-parser` refactorn (10 Modi, strukturierte Prompts)
3. **Schritt 3**: `useDocumentIntake.ts` Hook bauen (Orchestrator)
4. **Schritt 4**: Bestehende Uploads migrieren (Armstrong, Finanzierung)
5. **Schritt 5**: E2E-Test pro Aktentyp (BL-08)

