
# Diagnose: Konto-Umsaetze vs. Modul 4 Geldeingaenge

## Befund

### Problem 1: Konten zeigen nur 3 statt 100 Transaktionen

Die CSV-Datei `demo_bank_transactions.csv` enthaelt **100 vollstaendige Transaktionen** (14 Monate: Jan 2025 - Feb 2026, je 3 Mieten + 3 Hausgelder + quartalsweise Grundsteuer + 1 Reparatur).

In der Datenbank (`bank_transactions`) existieren jedoch **nur 3 Datensaetze** — die ersten 3 Zeilen der CSV. 

**Ursache:** Die Seed-Engine (`useDemoSeedEngine.ts`) funktioniert technisch korrekt (Chunks a 50 Zeilen, Upsert), aber der Seed-Lauf wurde offenbar nur einmal waehrend eines fruehen Tests ausgefuehrt, als die CSV noch weniger Zeilen hatte — oder der zweite Chunk (Zeilen 51-100) schlug fehl, ohne dass der Fehler sichtbar war (der Code loggt den Fehler per `console.error`, bricht aber nicht ab und zaehlt trotzdem alle IDs als erfolgreich).

**Fix:** Die Seed-Engine muss erneut getriggert werden, und die Fehlerbehandlung muss verbessert werden, sodass nur tatsaechlich geschriebene IDs gezaehlt werden.

### Problem 2: Modul 4 zeigt "Geldeingaenge" ohne Kontodaten

Der `GeldeingangTab` in Modul 4 liest **nicht** aus `bank_transactions`. Er liest aus zwei separaten Quellen:

```text
Datenfluesse — Ist-Zustand:

  bank_transactions (Konten-Tab)
  |
  |  [KEIN automatischer Link!]
  |
  leases ──────────► GeldeingangTab (Soll-Spalte)
  rent_payments ───► GeldeingangTab (Ist-Spalte)
```

Der Tab zeigt ein 12-Monats-Raster mit:
- **Soll**: Berechnet aus `leases.monthly_rent` (kommt direkt aus den SSOT-Leases)
- **Ist**: Kommt aus `rent_payments` — aktuell **0 Eintraege**

Was der User sieht, sind die **Soll-Werte aus den Mietvertraegen**, nicht tatsaechliche Zahlungen. Die "Ist"-Spalte ist leer.

### Soll-Datenfluss (fehlendes Glied)

Der korrekte Fluss waere:

```text
CSV ──► bank_transactions (100 Buchungen)
              |
              ▼
        Engine 17 (KontoMatch) kategorisiert als "MIETE"
              |
              ▼
        Edge Function "sot-rent-match" matched zu Lease
              |
              ▼
        rent_payments (automatisch erzeugt)
              |
              ▼
        GeldeingangTab zeigt Soll vs. Ist
```

Aktuell bricht die Kette bei Schritt 1 ab — nur 3 von 100 Transaktionen sind in der DB.

---

## Umsetzungsplan

### Schritt 1: Bank-Transaktionen vollstaendig seeden

Die `seedBankTransactions`-Funktion reparieren:
- **Fehlerbehandlung verbessern**: Nur IDs von tatsaechlich erfolgreichen Inserts zaehlen
- **Re-Seed triggern**: Alle 100 Transaktionen per Upsert schreiben
- **Verifikation**: DB-Count nach Seed pruefen (Erwartung: 100)

### Schritt 2: KontoAkteInline verifizieren

Nach erfolgreichem Seed pruefen, dass der Konten-Tab alle 100 Transaktionen anzeigt. Die `KontoAkteInline`-Komponente liest bereits per Standard-Query aus `bank_transactions` — das sollte funktionieren.

### Schritt 3: Rent-Match-Pipeline testen

Den Button "Mietabgleich starten" im GeldeingangTab nutzen, um die `sot-rent-match` Edge Function zu triggern. Diese sollte:
1. Alle Mietzahlungen in `bank_transactions` finden (36 Stueck: 3 Mieter x 12 Monate)
2. Via Engine 17 als `MIETE` kategorisieren
3. Zu `rent_payments` matchen und Eintraege erstellen

### Schritt 4: Backlog aktualisieren

`FK_CASCADE_BACKLOG.md` mit dem Status der Rent-Match-Pipeline aktualisieren.

---

## Technische Details

### Seed-Engine Fix (useDemoSeedEngine.ts)

Aktuelle Schwaeche in `seedBankTransactions`:
```typescript
// PROBLEM: IDs werden auch bei Fehler gezaehlt
if (error) {
  console.error(`...chunk ${i}:`, error.message);
}
allIds.push(...chunk.map(...)); // ← Zaehlt IMMER
```

Fix:
```typescript
if (error) {
  console.error(`...chunk ${i}:`, error.message);
} else {
  allIds.push(...chunk.map(...)); // ← Nur bei Erfolg
}
```

### CSV-Schema vs. DB-Schema (Kompatibilitaet)

| CSV-Spalte | DB-Spalte | Match |
|------------|-----------|-------|
| id | id | OK |
| account_ref | account_ref | OK |
| booking_date | booking_date | OK |
| value_date | value_date | OK |
| amount_eur | amount_eur | OK |
| counterparty | counterparty | OK |
| purpose_text | purpose_text | OK |

Alle Spalten stimmen ueberein. Das `coerceRow`-System wandelt `amount_eur` korrekt in eine Zahl um. Die fehlenden DB-Spalten (`match_status`, `match_category`, etc.) haben Defaults und muessen nicht in der CSV stehen.
