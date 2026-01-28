# OPERATIONS-PROMPT: System of a Town — Datenfluss MOD-04/05

Dieses Dokument beschreibt, wie Dokumente und Bank-Transaktionen durch das System fließen.

---

## 1) DOKUMENT-UPLOAD-FLOW

Wenn ein Benutzer ein Dokument hochlädt:

### SCHRITT 1: Speicherung
- Datei wird in Supabase Storage abgelegt
- Pfad: `/{tenant_id}/{property_id}/{folder_name}/{filename}`
- Parallel: Sidecar-JSON wird erstellt mit `doc_meta.source_channel = 'UPLOAD'`

### SCHRITT 2: Typ-Erkennung
- **WENN** Upload in Ordner mit `doc_type_hint`:
  → `doc_type = node.doc_type_hint` (deterministisch)
- **SONST**:
  → KI-Klassifikation schlägt `doc_type` vor (Confidence < 0.90)

### SCHRITT 3: Extraktion
- Edge Function `sot-document-parser` wird aufgerufen
- Extrahiert Felder gemäß `doc_type_catalog.extractable_dp_keys`
- Speichert in `sidecar_json.extracted_fields`

### SCHRITT 4: Matching
- Versucht `entity_matches` zu finden:
  - `property_id` über address_fingerprint (PLZ + Straße + Hausnummer)
  - `unit_id` über `unit.code` oder Wohnungsnummer
  - `tenancy_id` über `start_date` + `rent_cold_eur`
  - `loan_id` über `loan_number` + `bank_name`
- Confidence wird berechnet (0.0 - 1.0)

### SCHRITT 5: Review-Gate
| Schwelle | Status | Aktion |
|----------|--------|--------|
| >= 0.90 | `AUTO_ACCEPTED` | Darf Akte-Felder aktualisieren |
| 0.70-0.89 | `NEEDS_REVIEW` | Erscheint in Review-Queue |
| < 0.70 | `UNASSIGNED` | Erscheint in Sortieren-Queue |

---

## 2) BANK-TRANSAKTIONS-FLOW

Wenn eine Bank-Transaktion importiert wird:

### SCHRITT 1: Speicherung
- `INSERT` in `bank_transactions` mit `match_status = 'UNMATCHED'`

### SCHRITT 2: Auto-Matching
- Prüft `purpose_text` auf bekannte Muster:
  - Mieter-Namen → `tenancy_id`
  - Darlehensnummern → `loan_id`
  - Versicherungs-Policen → `property_id`
- Prüft IBAN/Kontonummer gegen bekannte Zahlungsempfänger

### SCHRITT 3: Posting-Generierung
- Bei Match: Erstellt Draft-Posting mit:
  - `accounting_category` (aus Mustererkennung)
  - `tax_category` (aus `posting_categories` Mapping)
  - `status = 'DRAFT'`
  - `confidence`

### SCHRITT 4: Bestätigung
- User bestätigt Draft → `status = 'CONFIRMED'`
- Am Jahresende → `status = 'LOCKED'` (keine Änderung mehr)

---

## 3) AKTE-UPDATE-FLOW

Wenn Daten in der Akte geändert werden:

### OPTION A: Manuell
- User bearbeitet Feld in UI
- `UPDATE` auf entsprechende Tabelle (units/leases/loans/nk_periods)
- `dossier_asof_date` wird aktualisiert
- `dossier_data_quality` bleibt `'OK'` oder wird auf `'PRUEFEN'` gesetzt

### OPTION B: Automatisch (aus Dokument)
- NUR bei `review_state = 'AUTO_ACCEPTED'` (Confidence >= 0.90)
- Felder werden überschrieben WENN:
  - aktueller Wert ist `NULL`, ODER
  - Dokument ist neuer als bisherige Quelle
- **Konflikt**: Beide Werte werden gespeichert (History)

---

## 4) OUTPUT-GENERIERUNG

### Exposé (Vermietung/Verkauf)
- Liest nur Felder mit `privacy = 'public'`
- `unit.public_*` Felder haben Vorrang
- Dokumente aus `docs.*` Referenzen mit `is_public = true`

### V&V (Anlage V / Steuer)
- Aggregiert `postings WHERE tax_category LIKE 'VV_%'`
- Gruppiert nach Jahr
- Berechnet: Einnahmen - Werbungskosten - AfA

### BWA/SuSa (Gewerblich)
- Aggregiert `postings WHERE bwa_group IS NOT NULL`
- Gruppiert nach `bwa_group` + Monat/Jahr
- Mapping gemäß `landlord_context.skr` (SKR04/SKR03)

### NK-Abrechnung
- Liest `nk_periods` für Jahr
- Liest Invoices WHERE `cost_category = 'BETRKV_UMLEG'`
- Berechnet Umlagen gemäß `allocation_key` pro Unit
- Vergleicht mit `tenancy.nk_advance_eur * 12`
- Ergebnis: Nachzahlung / Guthaben

---

## 5) CONFIDENCE-GATES (Zusammenfassung)

| Schwelle | Status | Erlaubte Aktionen |
|----------|--------|-------------------|
| >= 0.90 | `AUTO_ACCEPTED` | Akte-Updates, Draft-Postings, Exposé-Daten |
| 0.70-0.89 | `NEEDS_REVIEW` | Nur Speicherung, User-Queue |
| < 0.70 | `UNASSIGNED` | Nur Speicherung, manuelle Zuordnung nötig |

---

## 6) SIDECAR-JSON SCHEMA

Jedes Dokument erhält ein Sidecar-JSON mit folgender Struktur:

```typescript
interface DocumentSidecar {
  doc_meta: {
    doc_id: string;
    doc_type: string;
    scope: 'LANDLORD_CONTEXT' | 'PROPERTY' | 'UNIT' | 'TENANCY' | 'LOAN';
    doc_date: string | null;
    service_period_start: string | null;
    service_period_end: string | null;
    vendor: string | null;
    source_channel: 'UPLOAD' | 'EMAIL' | 'CONNECTOR' | 'API';
    classification_trace?: { classifier: string; confidence: number };
  };
  extracted_fields: Array<{
    dp_key: string;
    value: unknown;
    confidence: number;
    evidence_span?: string;
  }>;
  entity_matches: {
    property_id?: { id: string; confidence: number };
    unit_id?: { id: string; confidence: number };
    tenancy_id?: { id: string; confidence: number };
    loan_id?: { id: string; confidence: number };
  };
  posting_suggestions?: Array<{
    posting_type: string;
    amount: number;
    accounting_category: string;
    tax_category: string;
    confidence: number;
    source_refs: string[];
  }>;
  review_state: 'AUTO_ACCEPTED' | 'NEEDS_REVIEW' | 'UNASSIGNED';
  versioning: {
    extracted_at: string;
    extractor_version: string;
    mapping_rules_version: string;
  };
}
```

---

## 7) MATCHING-REGELN (Priorität)

```typescript
const MATCHING_PRIORITY = [
  // Stufe 1: Explizite IDs (höchste Konfidenz)
  { 
    type: 'EXPLICIT_ID', 
    fields: ['unit.code', 'loan.loan_number', 'property.mea_te_no'], 
    confidence: 0.99 
  },
  
  // Stufe 2: Address-Fingerprint
  { 
    type: 'ADDRESS_FP', 
    fields: ['zip', 'street', 'house_no'], 
    confidence: 0.95 
  },
  
  // Stufe 3: Dokument-spezifische Kombis
  { 
    type: 'DOC_COMBO', 
    doc_types: {
      'DOC_LEASE_CONTRACT': ['start_date', 'rent_cold_eur', 'tenant_name'],
      'DOC_LOAN_*': ['bank_name', 'loan_number', 'outstanding_balance'],
      'DOC_NK_STATEMENT': ['year', 'address', 'settlement_total'],
    },
    confidence: 0.85 
  },
  
  // Stufe 4: Vendor+Amount (nur Vorschlag)
  { 
    type: 'VENDOR_AMOUNT', 
    fields: ['vendor', 'amount', 'period'], 
    confidence: 0.60 
  },
];
```

---

## Implementierungshinweise

Diese Operations-Logik wird implementiert durch:
1. **Edge Function `sot-document-parser`**: Extraktion + Matching
2. **Edge Function `sot-bank-matcher`**: Bank-Transaktions-Matching
3. **UI-Queues**: `UnassignedQueue`, `NeedsReviewQueue` in `/portal/dms/sortieren`
4. **Hooks**: `useUnitDossier`, `usePropertyDossier` für Daten-Aggregation

Status: **Bereit für Implementierung** nach MOD-04 UI-Fertigstellung.
