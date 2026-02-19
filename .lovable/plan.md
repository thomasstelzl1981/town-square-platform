

# Engine 17: Konto-Matching Engine (ENG-KONTOMATCH)

## Antwort auf die Frage

**Ja, wir brauchen eine eigene Engine.** Begruendung:

1. **sot-rent-match existiert bereits als Edge Function** — aber ohne `spec.ts`, ohne Typen, ohne Engine-Registry-Eintrag. Es ist eine "wilde" Funktion ausserhalb der Governance.
2. **Die Matching-Logik ist reine Geschaeftslogik** (Betragstoleranz, Verwendungszweck-Parsing, Kategorie-Erkennung). Das gehoert in eine Engine mit `spec.ts` + `engine.ts`, genau wie BWA, NK-Abrechnung etc.
3. **Zwei getrennte Transaktions-Tabellen** (`bank_transactions` + `finapi_transactions`) brauchen eine einheitliche Abstraktion, die in der Spec dokumentiert ist.
4. **Drei verschiedene owner_types** (Person, Immobilie, PV-Anlage) brauchen unterschiedliche Matching-Regeln — das muss an EINER Stelle definiert sein.

---

## Was wird gebaut

### Teil 1: Engine-Dateien (Client-seitige Spec + Logik)

Neue Dateien unter `src/engines/kontoMatch/`:

**spec.ts** — Typen und Konstanten (SSOT fuer Matching-Regeln)

```text
Definiert:
- TransactionCategory (enum): MIETE, HAUSGELD, GRUNDSTEUER, VERSICHERUNG,
  EINSPEISEVERGUETUNG, DARLEHEN, WARTUNG, PACHT, SONSTIG_EINGANG, SONSTIG_AUSGANG
- MatchRule: { category, ownerTypes[], patterns[], amountRange?, direction }
- DEFAULT_MATCH_RULES: Array von MatchRule — die kanonische Liste aller Erkennungsregeln
- MatchResult: { transactionId, category, confidence, matchedBy, ruleCode }
- UnifiedTransaction: { id, tenantId, accountRef, bookingDate, amount, purpose, counterparty, source }
- MATCH_TOLERANCES: { rentAmountEur: 1, minConfidence: 0.75 }
```

**engine.ts** — Pure Functions

```text
Exportiert:
- unifyTransaction(csv | finapi): UnifiedTransaction
  Normalisiert beide Tabellen-Formate in ein einheitliches Objekt

- categorizeTransaction(tx: UnifiedTransaction, rules: MatchRule[], context: OwnerContext): MatchResult
  Wendet die Regeln sequentiell an, gibt die beste Kategorie + Confidence zurueck

- matchRentPayment(tx, lease, tolerance): RentMatchResult
  Die bestehende Logik aus sot-rent-match als pure Function (testbar!)

- matchPVIncome(tx, pvPlant): PVMatchResult
  Einspeiseverguetung erkennen (Netzbetreiber, regelmaessiger Eingang)

- matchLoanPayment(tx, loanRef): LoanMatchResult
  Darlehenszahlung erkennen (Bank-IBAN, regelmaessige Ausgabe)
```

### Teil 2: Engine-Registry aktualisieren

**ENGINE_REGISTRY.md** — Neuer Eintrag #17:

```text
| 17 | **Konto-Matching Engine** | Ordnet Kontobewegungen automatisch Immobilien, PV-Anlagen und Vertraegen zu | Finanzanalyse, Immobilien, PV | Free |

Technische Registry:
| ENG-KONTOMATCH | Konto-Matching Engine | MOD-04, MOD-18, MOD-19 | Teilweise | src/engines/kontoMatch/spec.ts, engine.ts |
```

Kategorie: **Kalkulation** (die regelbasierte Logik ist eine pure Function, die Edge Function nutzt sie nur als Consumer).

### Teil 3: index.ts erweitern

```text
// Engine 10: Konto-Matching
export * from './kontoMatch/engine';
export * from './kontoMatch/spec';
```

### Teil 4: sot-rent-match refactoren

Die bestehende Edge Function `sot-rent-match` wird vereinfacht:
- Die Matching-Logik wird durch Imports aus der Engine ersetzt (soweit in Edge Functions moeglich)
- Die Engine-Typen werden in der Edge Function gespiegelt (da Edge Functions nicht direkt aus src/ importieren koennen)
- Die Funktion wird umbenannt/erweitert zu einem breiteren Matching-Scope

Da Edge Functions nicht direkt aus `src/engines/` importieren koennen, wird die Spec als Kopie im Edge-Function-Verzeichnis gehalten, mit einem Kommentar der auf die SSOT verweist.

### Teil 5: Default-Matching-Regeln (die SSOT)

Die wichtigsten Regeln die in `spec.ts` definiert werden:

**Fuer owner_type = 'property_context' (Immobilie):**

```text
| Kategorie          | Erkennung                                                    | Richtung |
|--------------------|--------------------------------------------------------------|----------|
| MIETE              | Betragsabgleich mit Warmmiete (+-1 EUR), Mietername          | Eingang  |
| HAUSGELD           | "Hausgeld", "WEG", Hausverwaltung im Zweck                  | Ausgang  |
| GRUNDSTEUER        | "Grundsteuer" im Zweck, Finanzamt als Empfaenger             | Ausgang  |
| VERSICHERUNG       | "Versicherung", "Gebaeude", bekannte Versicherer             | Ausgang  |
| DARLEHEN           | Bank-IBAN aus Darlehensvertrag, regelmaessiger Betrag        | Ausgang  |
| INSTANDHALTUNG     | "Handwerker", "Reparatur", "Sanierung" im Zweck              | Ausgang  |
```

**Fuer owner_type = 'pv_plant' (PV-Anlage):**

```text
| Kategorie              | Erkennung                                                | Richtung |
|------------------------|----------------------------------------------------------|----------|
| EINSPEISEVERGUETUNG    | Netzbetreiber im Empfaenger, regelmaessiger Eingang      | Eingang  |
| WARTUNG                | "Wartung", "Service", "PV" im Zweck                     | Ausgang  |
| PACHT                  | "Pacht", "Dachmiete" im Zweck                           | Ausgang  |
| DARLEHEN               | Bank-IBAN aus PV-Finanzierung                            | Ausgang  |
| VERSICHERUNG           | "PV", "Solar", "Anlage" + "Versicherung" im Zweck       | Ausgang  |
```

**Fuer owner_type = 'person' (Privatkonto):**

```text
| Kategorie    | Erkennung                                        | Richtung |
|--------------|--------------------------------------------------|----------|
| GEHALT       | "Gehalt", "Lohn" im Zweck, regelmaessig          | Eingang  |
| SONSTIG      | Keine spezifische Regel greift                    | Beide    |
```

---

## Dateien-Uebersicht

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/engines/kontoMatch/spec.ts` | NEU | Typen, Kategorien, Default-Regeln |
| `src/engines/kontoMatch/engine.ts` | NEU | Pure Functions: unify, categorize, match |
| `src/engines/index.ts` | EDIT | Engine 10 re-export hinzufuegen |
| `spec/current/06_engines/ENGINE_REGISTRY.md` | EDIT | Engine #17 ENG-KONTOMATCH eintragen |
| `supabase/functions/sot-rent-match/index.ts` | EDIT | Refactor: Engine-Typen nutzen, Scope erweitern |

## Nicht in diesem Schritt

- SQL-View `v_all_transactions` (Phase 2 — erfordert separate DB-Migration)
- KI-Fallback-Matching (Phase 3)
- Review-Queue UI (Phase 4)

Diese werden als Folge-Schritte geplant, sobald die Engine-Grundlage steht.

