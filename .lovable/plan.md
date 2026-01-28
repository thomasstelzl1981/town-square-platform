
# MOD-04 Fertigstellungsplan + Operations-Prompt

## STATUS-ÜBERSICHT: Was ist bereits fertig?

### Datenbank (100% fertig)
- 11 Tabellen existieren: `properties`, `units`, `leases`, `loans`, `meters`, `postings`, `bank_transactions`, `dp_catalog` (72 Einträge), `doc_type_catalog` (24 Einträge), `posting_categories`, `nk_periods`
- Alle Schema-Erweiterungen sind migriert (energy, features, rent models, etc.)
- Trigger für automatische Ordnerstrukturen sind aktiv

### UI-Komponenten (90% fertig)
- `PortfolioTab`: Zeigt Einheiten-Tabelle, KPIs, Charts (Tilgung/EÜR)
- `UnitDossierView` + 8 Blöcke: Existieren, aber sind NICHT eingebunden
- `PropertyDetail`: Zeigt einzelne Immobilie, nutzt aber NICHT die neue Akte

### Was fehlt noch? (10%)

| Aufgabe | Beschreibung | Aufwand |
|---------|--------------|---------|
| **1. Akte einbinden** | `UnitDossierView` in `/portal/immobilien/:id` integrieren | 15 min |
| **2. Daten laden** | Hook erstellen, der Unit + Lease + Loan + NK Daten zusammenführt | 30 min |
| **3. Route anpassen** | PropertyDetail durch Unit-Akte ersetzen oder erweitern | 10 min |

---

## FERTIGSTELLUNGSPLAN (3 Aufgaben)

### Aufgabe 1: Daten-Hook erstellen
Neuer Hook `useUnitDossier(unitId)` der alle Daten für die Akte lädt:

```typescript
// src/hooks/useUnitDossier.ts
- Lädt Unit + Property (JOIN)
- Lädt aktives Lease
- Lädt Loan (falls vorhanden)
- Lädt NK-Period (falls vorhanden)
- Lädt Dokumente aus storage_nodes
- Transformiert zu UnitDossierData Interface
```

### Aufgabe 2: PropertyDetail erweitern
Die Seite `/portal/immobilien/:id` (PropertyDetail.tsx) erhält:
- Import von `UnitDossierView`
- Aufruf von `useUnitDossier`
- Anzeige der neuen Akte statt/neben dem alten Exposé-Layout

### Aufgabe 3: Navigation prüfen
- PortfolioTab Klick auf Zeile navigiert zu `/portal/immobilien/:unitId`
- Route in App.tsx ist bereits vorhanden (Zeile 177)

---

## OPERATIONS-PROMPT (für zukünftige Datenverarbeitung)

Dieser Prompt beschreibt, wie Dokumente und Bank-Transaktionen durch das System fließen:

```text
OPERATIONS-PROMPT: System of a Town — Datenfluss MOD-04/05

=====================================================================
1) DOKUMENT-UPLOAD-FLOW
=====================================================================

Wenn ein Benutzer ein Dokument hochlädt:

SCHRITT 1: Speicherung
- Datei wird in Supabase Storage abgelegt
- Pfad: /{tenant_id}/{property_id}/{folder_name}/{filename}
- Parallel: Sidecar-JSON wird erstellt mit doc_meta.source_channel = 'UPLOAD'

SCHRITT 2: Typ-Erkennung
- WENN Upload in Ordner mit doc_type_hint:
  → doc_type = node.doc_type_hint (deterministisch)
- SONST:
  → KI-Klassifikation schlägt doc_type vor (Confidence < 0.90)

SCHRITT 3: Extraktion
- Edge Function `sot-document-parser` wird aufgerufen
- Extrahiert Felder gemäß doc_type_catalog.extractable_dp_keys
- Speichert in sidecar_json.extracted_fields

SCHRITT 4: Matching
- Versucht entity_matches zu finden:
  - property_id über address_fingerprint (PLZ + Straße + Hausnummer)
  - unit_id über unit.code oder Wohnungsnummer
  - tenancy_id über start_date + rent_cold_eur
  - loan_id über loan_number + bank_name
- Confidence wird berechnet (0.0 - 1.0)

SCHRITT 5: Review-Gate
- >= 0.90: AUTO_ACCEPTED → Darf Akte-Felder aktualisieren
- 0.70-0.89: NEEDS_REVIEW → Erscheint in Review-Queue
- < 0.70: UNASSIGNED → Erscheint in Sortieren-Queue

=====================================================================
2) BANK-TRANSAKTIONS-FLOW
=====================================================================

Wenn eine Bank-Transaktion importiert wird:

SCHRITT 1: Speicherung
- INSERT in bank_transactions mit match_status = 'UNMATCHED'

SCHRITT 2: Auto-Matching
- Prüft purpose_text auf bekannte Muster:
  - Mieter-Namen → tenancy_id
  - Darlehensnummern → loan_id
  - Versicherungs-Policen → property_id
- Prüft IBAN/Kontonummer gegen bekannte Zahlungsempfänger

SCHRITT 3: Posting-Generierung
- Bei Match: Erstellt Draft-Posting mit:
  - accounting_category (aus Mustererkennung)
  - tax_category (aus posting_categories Mapping)
  - status = 'DRAFT'
  - confidence

SCHRITT 4: Bestätigung
- User bestätigt Draft → status = 'CONFIRMED'
- Am Jahresende → status = 'LOCKED' (keine Änderung mehr)

=====================================================================
3) AKTE-UPDATE-FLOW
=====================================================================

Wenn Daten in der Akte geändert werden:

OPTION A: Manuell
- User bearbeitet Feld in UI
- UPDATE auf entsprechende Tabelle (units/leases/loans/nk_periods)
- dossier_asof_date wird aktualisiert
- dossier_data_quality bleibt 'OK' oder wird auf 'PRUEFEN' gesetzt

OPTION B: Automatisch (aus Dokument)
- NUR bei review_state = 'AUTO_ACCEPTED' (Confidence >= 0.90)
- Felder werden überschrieben WENN:
  - aktueller Wert ist NULL, ODER
  - Dokument ist neuer als bisherige Quelle
- Konflikt: Beide Werte werden gespeichert (History)

=====================================================================
4) OUTPUT-GENERIERUNG
=====================================================================

Exposé (Vermietung/Verkauf):
- Liest nur Felder mit privacy = 'public'
- unit.public_* Felder haben Vorrang
- Dokumente aus docs.* Referenzen mit is_public = true

V&V (Anlage V / Steuer):
- Aggregiert postings WHERE tax_category LIKE 'VV_%'
- Gruppiert nach Jahr
- Berechnet: Einnahmen - Werbungskosten - AfA

BWA/SuSa (Gewerblich):
- Aggregiert postings WHERE bwa_group IS NOT NULL
- Gruppiert nach bwa_group + Monat/Jahr
- Mapping gemäß landlord_context.skr (SKR04/SKR03)

NK-Abrechnung:
- Liest nk_periods für Jahr
- Liest invoices WHERE cost_category = 'BETRKV_UMLEG'
- Berechnet Umlagen gemäß allocation_key pro Unit
- Vergleicht mit tenancy.nk_advance_eur * 12
- Ergebnis: Nachzahlung / Guthaben

=====================================================================
5) CONFIDENCE-GATES (Zusammenfassung)
=====================================================================

| Schwelle | Status | Erlaubte Aktionen |
|----------|--------|-------------------|
| >= 0.90 | AUTO_ACCEPTED | Akte-Updates, Draft-Postings, Exposé-Daten |
| 0.70-0.89 | NEEDS_REVIEW | Nur Speicherung, User-Queue |
| < 0.70 | UNASSIGNED | Nur Speicherung, manuelle Zuordnung nötig |

=====================================================================
ENDE OPERATIONS-PROMPT
=====================================================================
```

---

## ZUSAMMENFASSUNG

**MOD-04 ist zu 90% fertig.** 

Die fehlenden 10% sind:
1. Hook `useUnitDossier` erstellen (30 min)
2. `PropertyDetail` mit `UnitDossierView` verbinden (15 min)
3. Navigation/Routing verifizieren (10 min)

Der **Operations-Prompt** oben beschreibt, wie Dokumente und Transaktionen später durch das System fließen werden. Diese Logik wird erst relevant, wenn MOD-03 (DMS) und MOD-05 (MSV) die entsprechenden Upload/Import-Funktionen haben.

**Nach Genehmigung implementiere ich die 3 Aufgaben und MOD-04 ist abgeschlossen.**
