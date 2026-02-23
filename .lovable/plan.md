

# Recurring Contract Detection Dialog (ENG-KONTOMATCH Extension)

## Ziel

Nach dem Konto-Matching (Kategorisierung der Transaktionen) soll ein in-app Dialog erscheinen, der automatisch erkannte wiederkehrende Vertraege anzeigt. Der User kann Vertraege an-/abwaehlen, die Kategorie korrigieren und dann die gewuenschten Vertraege mit einem Klick in die jeweiligen Tabellen (`user_subscriptions`, `insurance_contracts`, `miety_contracts`) uebernehmen.

**Wichtig:** Dies ist ein Radix Dialog (unsere `Dialog`-Komponente), KEIN Browser-Popup. Kein Popup-Blocker-Problem.

## Architektur

### Phase 1: Recurring Pattern Detection (Engine-Erweiterung)

Erweiterung von **ENG-KONTOMATCH** um eine reine Analysefunktion, die aus kategorisierten Transaktionen wiederkehrende Muster erkennt.

**Neue Datei: `src/engines/kontoMatch/recurring.ts`**
- Pure Function `detectRecurringContracts(transactions): DetectedContract[]`
- Gruppiert Transaktionen nach Counterparty + aehnlichem Betrag
- Erkennt Frequenz (monatlich, quartalsweise, jaehrlich) anhand der Buchungsdaten
- Ordnet erkannte Muster einem Vertragstyp zu:
  - `VERSICHERUNG` -> `insurance_contracts`
  - Streaming/Software/Mobilfunk-Patterns -> `user_subscriptions`
  - Energie/Internet-Patterns -> `miety_contracts`
- Mindestens 2 Buchungen noetig fuer "wiederkehrend"
- Rein client-side, pure TypeScript, keine DB-Aufrufe

**Erweiterung: `src/engines/kontoMatch/spec.ts`**
- Neue Typen: `DetectedContract`, `ContractTargetTable`, `RecurringPattern`
- Mapping-Konstanten: Kategorie -> Ziel-Tabelle + Felder

### Phase 2: Dialog-Komponente

**Neue Datei: `src/components/finanzanalyse/ContractDetectionDialog.tsx`**

- Verwendet unsere bestehende `Dialog`-Komponente (Radix UI)
- Oeffnet sich nach erfolgreichem `sot-transaction-categorize`-Lauf
- Zeigt eine Liste erkannter Vertraege mit:
  - Checkbox (an/abwaehlen)
  - Counterparty-Name
  - Erkannter Betrag + Frequenz
  - Kategorie-Dropdown (zum Korrigieren)
  - Ziel-Badge ("Abo", "Versicherung", "Energievertrag")
- "Alle auswaehlen / Keine auswaehlen" Toggle
- "Vertraege uebernehmen"-Button: schreibt ausgewaehlte Eintraege in die jeweiligen DB-Tabellen
- Zusammenfassung: "X von Y Vertraegen erkannt"

### Phase 3: Integration in KontenTab / TransactionReviewQueue

**Aenderung: `src/pages/portal/finanzanalyse/KontenTab.tsx`**

- Nach dem "Kategorisieren"-Button-Click (bzw. nach erfolgreichem Sync):
  1. `sot-transaction-categorize` laeuft (wie bisher)
  2. Danach: `detectRecurringContracts()` auf die kategorisierten Transaktionen anwenden
  3. Falls Ergebnisse: `ContractDetectionDialog` oeffnen
- Kein neuer Menuepunkt, kein neuer Tab — nur ein Dialog nach dem Matching

### Phase 4: DB-Insert-Logik

**Neue Datei: `src/hooks/useContractCreation.ts`**

- Hook, der `DetectedContract[]` entgegennimmt
- Fuer jeden Vertrag:
  - `user_subscriptions.insert(...)` fuer Abos
  - `insurance_contracts.insert(...)` fuer Versicherungen
  - `miety_contracts.insert(...)` fuer Energievertraege
- Duplikat-Check: Vor Insert pruefen, ob bereits ein Vertrag mit gleichem Merchant/Anbieter + aehnlichem Betrag existiert
- Batch-Insert mit Fehlerbehandlung

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/engines/kontoMatch/spec.ts` | Neue Typen fuer RecurringDetection |
| `src/engines/kontoMatch/recurring.ts` | Neue pure Analysefunktion (NEU) |
| `src/components/finanzanalyse/ContractDetectionDialog.tsx` | Dialog-UI (NEU) |
| `src/hooks/useContractCreation.ts` | DB-Insert-Hook (NEU) |
| `src/pages/portal/finanzanalyse/KontenTab.tsx` | Integration des Dialogs nach Kategorisierung |

## Governance

- Keine Menuestruktur-Aenderung
- Keine neuen Routen
- Engine-Erweiterung bleibt im bestehenden ENG-KONTOMATCH (keine neue Engine-Nummer)
- Business-Logik (Pattern-Erkennung) liegt in `src/engines/`, nicht in Komponenten
- Module Freeze Check: MOD-18 muss ungefroren sein

## Technisches Detail: Recurring Detection Algorithmus

```text
Eingabe: Kategorisierte Transaktionen (match_category != null)

1. Gruppiere nach: counterparty (normalized, lowercase, trimmed)
2. Fuer jede Gruppe:
   a. Finde aehnliche Betraege (Toleranz +/- 5%)
   b. Pruefe Buchungsdaten auf Regelmaessigkeit:
      - Abstand ~30 Tage = monatlich
      - Abstand ~90 Tage = quartalsweise
      - Abstand ~365 Tage = jaehrlich
   c. Mindestens 2 Treffer in Folge = "recurring"
3. Mappe match_category auf Vertragstyp:
   - VERSICHERUNG -> insurance_contracts
   - DARLEHEN -> (skip, bereits in anderen Modulen)
   - HAUSGELD, GRUNDSTEUER -> (skip, Immobilien-spezifisch)
   - GEHALT -> (skip, kein Vertrag)
   - SONSTIG_AUSGANG -> user_subscriptions (Abo-Kandidat)
4. Ausgabe: DetectedContract[] mit Confidence-Score
```

