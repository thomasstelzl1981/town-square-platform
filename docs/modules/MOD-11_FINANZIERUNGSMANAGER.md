# MOD-11: Finanzierungsmanager

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/finanzierungsmanager` |
| **Icon** | `Landmark` |
| **Org-Types** | `partner` |
| **Requires Role** | `finance_manager` |
| **Display Order** | 11 |

## Beschreibung

Der Finanzierungsmanager ist die aktive Workstation für verifizierte Finanzberater (`finance_manager`-Rolle). Das Modul ermöglicht die Bearbeitung von Finanzierungsanfragen, die über Zone 1 FutureRoom delegiert wurden.

## Tiles (4-Tile-Pattern)

### 1. So funktioniert's (Default)
- **Route:** `/portal/finanzierungsmanager`
- **Beschreibung:** Erklärt den Prozess und die Rolle des Finanzierungsmanagers
- **Inhalt:**
  - Workflow-Übersicht
  - Rollenverantwortlichkeiten
  - Vergütungsmodell

### 2. Selbstauskunft
- **Route:** `/portal/finanzierungsmanager/selbstauskunft`
- **Beschreibung:** Strukturierte Ansicht der Antragsteller-Profile
- **Funktionen:**
  - Anzeige Privatperson/Unternehmer-Daten
  - AI Pre-Fill aus Dokumenten
  - Manuelle Korrekturen
  - Credibility Guard (Bonitätswächter)

### 3. Einreichen
- **Route:** `/portal/finanzierungsmanager/einreichen`
- **Beschreibung:** Zusammenstellung der Finanzierungspakete für Banken
- **Funktionen:**
  - Bank-Auswahl aus Zone 1 Directory
  - Dokumenten-Checkliste
  - PDF-Export
  - Einreichungsprotokoll

### 4. Status
- **Route:** `/portal/finanzierungsmanager/status`
- **Beschreibung:** Tracking aller aktiven Fälle
- **Funktionen:**
  - Meilenstein-Timeline
  - Case-Events
  - Bank-Feedback

## Dynamische Routen

| Pfad | Component | Beschreibung |
|------|-----------|--------------|
| `/selbstauskunft/:caseId` | CaseDetailTab | Fall-Details |
| `/einreichen/:caseId` | SubmitToBankTab | Fall einreichen |

## Datenmodell

### Primäre Tabellen
- `finance_mandates` — Akzeptierte Mandate
- `applicant_profiles` — Antragsteller-Daten
- `finance_cases` — Fall-Container
- `case_events` — Event-Tracking

### Beziehungen
- 1:1 `finance_mandates` ↔ `finance_requests`
- 1:N `finance_cases` → `case_events`
- N:1 `applicant_profiles` → `finance_requests`

## Workflows

### Case-Lifecycle
```
mandate_accepted → documents_reviewed → package_prepared → 
submitted_to_bank → bank_response → case_closed
```

### Event-Types
- `mandate_accepted`
- `document_uploaded`
- `credibility_flag_raised`
- `package_submitted`
- `bank_responded`

## Integration

### Abhängigkeiten
- **MOD-07 (Finanzierung):** Liefert initiale Anfragen
- **Zone 1 FutureRoom:** Mandats-Delegation, Bank-Directory
- **MOD-04 (Immobilien):** Objektdaten für Finanzierung

### Datenfluss
```
MOD-07 → Zone 1 FutureRoom → MOD-11 → Bank
```
