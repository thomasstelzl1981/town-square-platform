

## Fix: Demodaten — Doppelzaehlung bei Max Mustermann

### Problem

In `public/demo-data/demo_household_persons.csv` hat Max Mustermann:

| Feld | Wert | Bedeutung |
|------|------|-----------|
| `gross_income_monthly` | 8.500 | Brutto aus Selbstaendigkeit |
| `net_income_monthly` | 5.200 | Netto aus Selbstaendigkeit |
| `business_income_monthly` | 8.500 | **Identisch mit Brutto — FEHLER** |

Die Engine-Logik ist korrekt: `net_income_monthly` ist das Nettoeinkommen (Gehalt/Selbstaendigkeit), `business_income_monthly` ist ein **zusaetzliches** Geschaeftseinkommen (Nebengewerbe, Beteiligung, etc.). Beide werden addiert (Zeile 103 in engine.ts).

Das Problem: Max ist rein selbstaendig. Seine 5.200 EUR netto kommen bereits aus seiner IT-Beratung. Die 8.500 EUR in `business_income_monthly` sind dasselbe wie sein Brutto — keine separate Einkommensquelle. Ergebnis: Doppelzaehlung von 8.500 EUR.

### Loesung

`business_income_monthly` fuer Max auf leer setzen, da er kein **zusaetzliches** Geschaeftseinkommen neben seiner Haupttaetigkeit hat.

### Aenderung

**Datei: `public/demo-data/demo_household_persons.csv`**

Zeile 2 (Max Mustermann) aendern — das Feld `business_income_monthly` (Spalte 22) von `8500` auf leer:

Vorher:
```text
b1f6d204-...;hauptperson;Herr;Max;Mustermann;...;8500;5200;III;2.0;8500;212;2049-03-15
```

Nachher:
```text
b1f6d204-...;hauptperson;Herr;Max;Mustermann;...;8500;5200;III;2.0;;212;2049-03-15
```

### Auswirkung

| Kennzahl | Vorher (falsch) | Nachher (korrekt) |
|----------|-----------------|-------------------|
| netIncomeTotal | 8.000 EUR (5.200 + 2.800) | 8.000 EUR (unveraendert) |
| selfEmployedIncome | 8.500 EUR | 0 EUR |
| totalIncome | 16.500+ EUR | 8.000+ EUR (plus Miete, PV, etc.) |
| livingExpenses-Basis | 16.500 EUR | 8.000 EUR |

### Engine-Test anpassen

**Datei: `src/engines/finanzuebersicht/engine.test.ts`**

Zeile 47-48: Testdaten aktualisieren — `business_income_monthly` fuer hp1 auf `0` oder `null` setzen, Erwartungswert `selfEmployedIncome` auf `0` anpassen (Zeile 53).

### Was NICHT geaendert wird

- Engine-Logik (ist korrekt — addiert separate Einkommensquellen)
- Andere CSV-Dateien
- Frontend
- Datenbank-Schema

