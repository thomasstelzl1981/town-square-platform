

# Fix: Finanzbericht-Datenfluss und profile_type Korrektur

## Analyse-Ergebnis

### Problem 1: Falscher `profile_type` Filter (KRITISCH)
Der `useFinanzberichtData` Hook filtert `applicant_profiles` mit `profile_type: 'self'`. Tatsaechlich verwenden aber ALLE Datensaetze `profile_type: 'private'` (Selbstauskunft) oder `'self_disclosure'` (Finanzierungsanfrage). **Ergebnis: Der Finanzbericht erhaelt KEINE Einkommens-/Ausgabendaten.**

### Problem 2: Stammdaten-Flow Bewertung
Der Stammdaten-Flow ist korrekt aufgebaut:
- `profiles` (MOD-01) synchronisiert per DB-Trigger automatisch nach `household_persons` (Finanzanalyse-Personen)
- Die Selbstauskunft (MOD-07) kopiert beim Erstanlegen einmalig Daten aus `profiles` in `applicant_profiles` — das ist gewollt und kein Fehler
- Zuhause (Miety) hat eigene Daten in `miety_homes`, unabhaengig von Stammdaten

### Problem 3: Demo-Daten Luecke
Der Demo-Datensatz in `applicant_profiles` (ID `00000000-...0005`) hat `net_income_monthly: 4800`, aber `living_expenses_monthly` ist NULL. Der zweite Mustermann-Datensatz hat umgekehrt nur `living_expenses_monthly: 2200`. Die Daten sind ueber zwei Records fragmentiert.

## Geplante Aenderungen

### 1. `src/hooks/useFinanzberichtData.ts` — profile_type Fix
- Zeile 109: `profile_type: 'self'` aendern zu `profile_type: 'private'`
- Zusaetzlich: `finance_request_id` auf `null` filtern, damit nur die persistente Selbstauskunft (nicht anfragespezifische Kopien) gezogen wird

### 2. Demo-Daten Konsolidierung (DB-Migration)
- Den Demo-Datensatz `00000000-0000-4000-a000-000000000005` aktualisieren:
  - `living_expenses_monthly` auf 2200 setzen
  - `self_employed_income_monthly`, `child_benefit_monthly` etc. mit Demo-Werten befuellen
- Sicherstellen, dass beide Demo-Personen (Max + Lisa) vollstaendige Einkommens-/Ausgabendaten haben

### 3. Keine Aenderung an Stammdaten-Flow
Der Datenfluss Stammdaten -> Selbstauskunft -> Finanzbericht ist architektonisch korrekt:
- Stammdaten aendern `profiles`
- Trigger synct nach `household_persons`
- Selbstauskunft liest `applicant_profiles` (einmalige Kopie bei Erstanlage)
- Finanzbericht aggregiert aus `applicant_profiles` + Portfolio + Zuhause

Es findet KEINE direkte Live-Verbindung von Stammdaten nach MOD-07 oder Zuhause statt — das ist so gewollt.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useFinanzberichtData.ts` | `profile_type: 'self'` -> `'private'`, Filter auf `finance_request_id IS NULL` |
| DB-Migration | Demo-Datensatz `applicant_profiles` vervollstaendigen |

## Technische Details

```text
// VORHER (Zeile 109 in useFinanzberichtData.ts)
.eq('profile_type', 'self')

// NACHHER
.eq('profile_type', 'private')
.is('finance_request_id', null)
```

Die zweite Bedingung stellt sicher, dass nur die persistente Selbstauskunft (ohne Verknuepfung zu einer konkreten Finanzierungsanfrage) herangezogen wird — nicht die Snapshot-Kopien aus MOD-11.
