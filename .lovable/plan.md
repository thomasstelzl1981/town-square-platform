
# Erweiterung Personenkarten, Finanzbericht-Strukturierung und Demodaten

## 1. Personenkarten um Einkommensdaten erweitern

### Ist-Zustand
Die Person-Detailkarte in `UebersichtTab.tsx` zeigt nur: Persoenliche Daten, Adresse und DRV-Renteninformation. Einkommensbezogene Felder fehlen komplett.

### Neue Sektion: "Beschaeftigung und Einkommen"
Wird zwischen "Persoenliche Daten" und "Adresse" eingefuegt.

**Felder fuer Angestellte (employment_status = 'angestellt'):**
- Arbeitgeber (`employer_name` — existiert bereits in `household_persons`)
- Beschaeftigungsstatus (`employment_status` — existiert bereits)
- Bruttoeinkommen (NEUES Feld `gross_income_monthly` — muss hinzugefuegt werden)
- Nettoeinkommen (NEUES Feld `net_income_monthly` — muss hinzugefuegt werden)
- Steuerklasse (NEUES Feld `tax_class` — muss hinzugefuegt werden)
- Kinderfreibetraege (NEUES Feld `child_allowances` — muss hinzugefuegt werden)

**Felder fuer Selbststaendige (employment_status = 'selbstaendig'):**
- Firmenname (`employer_name` — Wiederverwendung als "Firmenname")
- Einkuenfte aus Gewerbebetrieb (NEUES Feld `business_income_monthly`)

**Zusatzfelder fuer alle:**
- Einkuenfte aus Photovoltaik (NEUES Feld `pv_income_monthly`)

### DB-Migration: `household_persons` erweitern
```sql
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS gross_income_monthly NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS net_income_monthly NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS tax_class TEXT;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS child_allowances NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS business_income_monthly NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS pv_income_monthly NUMERIC;
```

### Demo-Daten Update
- Max Mustermann: `employment_status = 'selbstaendig'`, `business_income_monthly = 8500`, `pv_income_monthly = 320`, `gross_income_monthly = NULL` (selbstaendig)
- Lisa Mustermann: `employment_status = 'angestellt'`, `employer_name = 'MediaCorp GmbH'`, `gross_income_monthly = 5200`, `net_income_monthly = 3200`, `tax_class = 'V'`, `child_allowances = 1.0`

---

## 2. PV-Anlage um Darlehensvertrag und Ertragsdaten erweitern

### Ist-Zustand
`pv_plants` hat keine Felder fuer Finanzierung oder Ertragsdaten (jaehrlich).

### DB-Migration: `pv_plants` erweitern
```sql
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_bank TEXT;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_amount NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_monthly_rate NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_interest_rate NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_remaining_balance NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS annual_yield_kwh NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS feed_in_tariff_cents NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC;
```

### Demo-Daten Update (Oberhaching-Anlage)
```sql
UPDATE pv_plants SET
  loan_bank = 'KfW', loan_amount = 45000, loan_monthly_rate = 285,
  loan_interest_rate = 1.95, loan_remaining_balance = 38200,
  annual_yield_kwh = 31000, feed_in_tariff_cents = 8.2,
  annual_revenue = 2542
WHERE id = '00000000-0000-4000-a000-000000000901';
```

---

## 3. Finanzbericht strukturierter aufbauen

### Neue Sektionen im `FinanzberichtSection.tsx`

**Sektion Abonnements (NEU — zwischen KPI-Kacheln und Vertragsuebersicht):**
- Kategorisierte Liste aller Abonnements aus `user_subscriptions`
- Gruppiert nach Kategorie (Streaming, Mobilfunk, Internet, Energie, etc.)
- Zeigt Anbieter, monatlichen Betrag und Status

**Sektion Energievertraege (NEU):**
- Daten aus `miety_contracts` (Kategorie Strom/Gas/Wasser)
- Zeigt: Versorger, Vertragsnummer, monatliche Kosten, Laufzeit

### Erweiterung `useFinanzberichtData.ts`
- Abonnements nach Kategorie gruppiert zurueckgeben (nicht nur als Summe)
- `miety_contracts` Query hinzufuegen fuer Energievertraege
- PV-Darlehen und PV-Ertraege in die Vermoegensberechnung integrieren

### Demo-Daten: Energievertraege anlegen
Neue Eintraege in `miety_contracts`:
- Strom: "Vattenfall", 89 EUR/mtl.
- Gas: "SWM Stadtwerke Muenchen", 125 EUR/mtl.
- Wasser: "SWM", 45 EUR/mtl.

---

## 4. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | `household_persons`: 6 neue Spalten |
| DB-Migration | `pv_plants`: 8 neue Spalten |
| DB-Migration | Demo-Daten: household_persons, pv_plants, miety_contracts |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Neue Sektion "Beschaeftigung und Einkommen" in der Personenkarte mit konditionaler Anzeige je nach employment_status |
| `src/hooks/useFinanzberichtData.ts` | Abonnements gruppiert, miety_contracts Query, PV-Darlehen/Ertraege integriert |
| `src/components/finanzanalyse/FinanzberichtSection.tsx` | Neue Sektionen: Abonnements (kategorisiert), Energievertraege; bessere Strukturierung |

## 5. Technische Details

### Konditionale Anzeige der Einkommensfelder
```text
IF employment_status === 'angestellt':
  Show: Arbeitgeber, Brutto, Netto, Steuerklasse, Kinderfreibetraege
IF employment_status === 'selbstaendig':
  Show: Firmenname, Einkuenfte aus Gewerbebetrieb
ALWAYS (if > 0):
  Show: Einkuenfte aus Photovoltaik
```

### Abonnement-Gruppierung im Hook
```text
subscriptionsByCategory = Map<string, { label, items, subtotal }>
  - streaming_video -> [Netflix, Disney+, ...]
  - telecom_mobile -> [Telekom, ...]
  - utilities_energy -> [Vattenfall, SWM, ...]
  - ...
```

### PV-Integration in Vermoegensberechnung
- PV-Darlehen fliessen in die Verbindlichkeiten ein (loan_remaining_balance)
- PV-Ertraege (annual_revenue / 12) fliessen in die Einnahmen ein
- PV-Darlehensrate fliesst in die Ausgaben ein
