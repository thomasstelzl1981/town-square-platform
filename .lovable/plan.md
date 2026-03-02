

# NK-Abrechnung Flow — Vollstaendige Pruefung und Lueckenanalyse

## Ist-Stand: Der aktuelle End-to-End Flow

Der Flow laeuft ueber 4 Systeme: **Zahlungsverkehr-Tab** → **NK-Abrechnung-Tab** → **Steuer (Anlage V)** → **BWA**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ZAHLUNGSVERKEHR-TAB (GeldeingangTab.tsx)                          │
│                                                                     │
│  Zone A: Kontenabgleich-Button → sot-rent-match Edge Function      │
│          + "Zahlung manuell erfassen" Button                        │
│  Zone B: 12-Monats-Grid (Soll vs Ist, Status, Quelle)             │
│  Zone C: Nicht zugeordnete Buchungen → "Zuordnen" Button          │
│                                                                     │
│  Bankkonto-Verknuepfung: Lease → linked_bank_account_id            │
│  Auto-Match: Switch pro Lease aktivierbar                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ rent_payments Tabelle
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NK-ABRECHNUNG-TAB (NKAbrechnungTab.tsx) — 5 Sektionen            │
│                                                                     │
│  1. WEG-Abrechnung (BetrKV §2, umlagefaehig/nicht umlagefaehig)   │
│  2. Grundsteuerbescheid (Direktzahlung)                             │
│  3. Mieteinnahmen & Vorauszahlungen (inkl. Zahlungseingaenge)      │
│  4. Berechnung & Saldo → calculateSettlement()                     │
│  5. Export & Versand (PDF, DMS, Briefgenerator)                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ nk_cost_items + nk_tenant_settlements
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEUER / ANLAGE V (VVAnlageVForm.tsx + useVVSteuerData.ts)       │
│                                                                     │
│  Auto-Felder:                                                       │
│   - Kaltmiete p.a. ← leases.rent_cold_eur * 12                    │
│   - NK-Vorauszahlungen p.a. ← leases.nk_advance_eur * 12         │
│   - NK-Nachzahlung ← nk_tenant_settlements.saldo_eur              │
│   - Grundsteuer ← nk_cost_items (category=grundsteuer)            │
│   - Nicht umlf. NK ← nk_cost_items (is_apportionable=false)      │
│   - Darlehenszinsen ← property_financing.annual_interest           │
│                                                                     │
│  Manuelle Felder (vv_annual_data):                                 │
│   - Instandhaltung, Verwalterkosten, Rechtsberatung               │
│   - Versicherung, Fahrtkosten, Bankgebuehren, Sonstige            │
│   - Disagio, Finanzierungsnebenkosten                              │
│   - AfA (autom. aus property_accounting)                           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ gleiche Datenquellen
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BWA / DATEV (BWATab.tsx)                                          │
│                                                                     │
│  Liest parallel: units, leases, property_financing,                │
│  property_accounting, vv_annual_data, nk_periods, nk_cost_items    │
│  → calcDatevBWA() → SKR04 Kontenrahmen → DATEV-Export             │
└─────────────────────────────────────────────────────────────────────┘
```

## Bewertung: Was funktioniert

1. **Bankkonto-Verknuepfung**: Lease → `linked_bank_account_id` → `msv_bank_accounts` — korrekt
2. **Auto-Match**: `sot-rent-match` Edge Function + `sot-rent-arrears-check` — vorhanden
3. **Manuelle Zuordnung**: Zone C zeigt unmatched `bank_transactions` mit "Zuordnen"-Button → erstellt `rent_payment` + markiert Transaktion als `MANUAL_OVERRIDE` — funktioniert
4. **Manuelle Zahlungserfassung**: "Zahlung manuell erfassen" in Zone A — funktioniert (z.B. Barzahlung)
5. **NK-Engine**: Vollstaendige allocationLogic mit 6 Verteilerschluesseln + unterjaerig — korrekt
6. **Datenfluss NK → Steuer**: `useVVSteuerData` liest `nk_cost_items` fuer Grundsteuer und nicht-umlagefaehige Kosten — korrekt
7. **Datenfluss NK → BWA**: `BWATab` liest `nk_cost_items` via `nk_periods` — korrekt

## Identifizierte Luecken und Probleme

### Luecke 1: Manuelle Ausgaben fehlen im Zahlungsverkehr-Tab
**Problem**: Der Zahlungsverkehr-Tab zeigt nur **Mieteinnahmen** (rent_payments). Ausgaben wie Handwerker, Sanierungen, Reparaturen, die nicht ueber das Bankkonto laufen (z.B. Barzahlung, private Karte), koennen nirgends erfasst werden.

**Auswirkung**: Diese Kosten fehlen in:
- NK-Abrechnung (falls umlagefaehig)
- Anlage V → `costMaintenance` muss manuell im Steuer-Tab eingetragen werden (ist dort als Feld vorhanden, aber ohne Verbindung zum Zahlungsverkehr)
- BWA → `vv_annual_data.cost_maintenance` wird separat geladen

**Loesung**: Im Zahlungsverkehr-Tab eine **"Ausgabe erfassen"**-Funktion ergaenzen, die in eine eigene Tabelle schreibt (z.B. `property_expenses`) mit Kategorisierung (Instandhaltung, Handwerker, Versicherung, Reisekosten etc.). Diese Daten fliessen dann automatisch in Steuer + BWA.

### Luecke 2: Ist-Zahlungseingaenge in NK-Abrechnung nicht mit Zahlungsverkehr verbunden
**Problem**: In der NK-Abrechnung (Sektion 3) gibt es einen eigenen "Zahlungseingaenge laden"-Button der `rent_payments` separat abfragt. Die Daten aus dem Zahlungsverkehr-Tab (Zone B) werden nicht wiederverwendet — es sind die gleichen Daten, aber die Logik ist dupliziert.

**Auswirkung**: Nutzer muss Zahlungen ggf. doppelt pruefen/bearbeiten.

**Loesung**: Die NK-Sektion 3 sollte direkt auf die bereits im Zahlungsverkehr-Tab festgestellten Daten verweisen, statt eine eigene Lade-/Bearbeitungs-UI zu haben. Alternativ: Read-Only-Ansicht mit Verweis "Details im Zahlungsverkehr-Tab".

### Luecke 3: Banktransaktionen nur als Mieteinnahmen zuordenbar
**Problem**: Zone C im Zahlungsverkehr ordnet Buchungen nur als `rent_payment` zu. Ausgaben-Buchungen (Handwerker-Rechnung, WEG-Hausgeld, Versicherung) koennen nicht kategorisiert werden.

**Auswirkung**: Negative Banktransaktionen (Ausgaben) bleiben "unmatched" und fliessen nirgendwohin.

**Loesung**: "Zuordnen"-Button sollte auch Ausgaben-Kategorien anbieten: Instandhaltung, WEG-Hausgeld, Versicherung, Grundsteuer etc. → schreibt in `property_expenses` mit Referenz zur Banktransaktion.

### Luecke 4: Fehlender Rueckfluss NK-Saldo in Zahlungsverkehr
**Problem**: Wenn die NK-Abrechnung einen Saldo ergibt (Nachzahlung oder Guthaben), wird dieser zwar in `nk_tenant_settlements` gespeichert und von der Anlage V gelesen, aber im Zahlungsverkehr-Tab gibt es keine Zeile dafuer.

**Loesung**: NK-Nachzahlung/Guthaben als separate Zeile im Zahlungsverkehr-Grid anzeigen (Soll = NK-Saldo, Ist = tatsaechliche Zahlung/Erstattung).

### Luecke 5: Keine Verbindung manuelle Steuer-Felder ← Zahlungsverkehr
**Problem**: In der Anlage V sind Felder wie `costMaintenance`, `costTravel`, `costBankFees` rein manuell. Es gibt keine automatische Aggregation aus tatsaechlichen Zahlungen.

**Auswirkung**: Nutzer muss alle Einzelposten mental zusammenrechnen und manuell eintragen.

**Loesung**: Wenn `property_expenses` eingefuehrt wird, koennen diese Felder automatisch vorbelegt werden (mit "auto"-Badge wie bei Grundsteuer), mit Ueberschreibungsmoeglichkeit.

## Empfohlener Implementierungsplan

### Phase 1: Property Expenses Tabelle + UI (Kernluecke)
- Neue DB-Tabelle `property_expenses` (property_id, tenant_id, category, amount, date, description, bank_transaction_id, tax_deductible)
- Im Zahlungsverkehr-Tab: "Ausgabe erfassen"-Button (Zone A) + Ausgaben-Zuordnung fuer negative Banktransaktionen (Zone C)
- Kategorien: Instandhaltung/Reparatur, Handwerker, Versicherung (nicht umlagefaehig), Verwalterkosten, Rechtsberatung, Fahrtkosten, Bankgebuehren, Sonstige

### Phase 2: Auto-Aggregation in Steuer + BWA
- `useVVSteuerData.ts`: `property_expenses` nach Kategorie aggregieren und als Vorschlagswerte in die manuellen Felder einspeisen
- `BWATab.tsx`: `property_expenses` in die SKR04-Konten einordnen
- UI: "auto"-Badge bei vorausgefuellten Feldern, manuelle Ueberschreibung moeglich

### Phase 3: NK ↔ Zahlungsverkehr Konsolidierung
- NK-Sektion 3 als Read-Only-Zusammenfassung mit Link zum Zahlungsverkehr-Tab
- NK-Saldo als Zeile im Zahlungsverkehr-Grid

### Betroffene Module und Freezes
- **MOD-04** (Immobilienakte): Zahlungsverkehr-Tab, NK-Tab, BWA-Tab, Steuer-Tab — **muss unfrozen sein**
- Engines: `nkAbrechnung`, `bewirtschaftung`, `vvSteuer` — nur lesend verwendet, kein Engine-Change in Phase 1

### Technische Voraussetzung
- Neue DB-Tabelle `property_expenses` mit RLS
- Keine neuen Edge Functions noetig (rein client-seitige CRUD)

