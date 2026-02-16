
# Einkommen kumulieren, Wachstumsrate 4%, Vertrags-Hochrechnung transparent und editierbar

## 1. Einkommen: Kumulierung aus Anstellung + Gewerbebetrieb

Das Feld `business_income_monthly` existiert bereits in der DB (`household_persons`) und wird in der Uebersicht-Personenakte erfasst. Der Lueckenrechner ignoriert es bisher komplett.

### Aenderung Engine (`spec.ts` + `engine.ts`)

**spec.ts — VLPersonInput erweitern:**
```
+ business_income_monthly: number | null
```

**engine.ts — Kumuliertes Netto berechnen:**

An allen Stellen, wo `person.net_income_monthly` fuer den Bedarf verwendet wird (Zeile 177 in `calcAltersvorsorge`, Zeile 267 in `calcBuLuecke`):

```text
VORHER:
  const need = (person.net_income_monthly || 0) * needPercent

NACHHER:
  const totalNetIncome = (person.net_income_monthly || 0) + (person.business_income_monthly || 0)
  const need = totalNetIncome * needPercent
```

Das kumulierte Einkommen wird auch in den Ergebnissen sichtbar, damit die UI es darstellen kann.

### Aenderung UI (`VorsorgeLueckenrechner.tsx`)

**Datenbasis — Persoenliche Daten erweitern:**

Neues Feld "Einnahmen aus Gewerbebetrieb (EUR/mtl.)" neben dem bestehenden Netto-Feld. Darunter eine berechnete Zeile:

```text
  Netto mtl. (EUR)          Gewerbe mtl. (EUR)        Brutto mtl. (EUR)
  [3.200]                   [1.800]                   [5.200]

  Gesamteinkommen: 5.000 EUR / mtl.   <- berechnete Summe, nicht editierbar
```

**mapPerson erweitern:**
```
+ business_income_monthly: p.business_income_monthly
```

**handleSave erweitern:**
```
+ business_income_monthly: editBusiness ? Number(editBusiness) : null
```

---

## 2. Wachstumsrate: 4% statt 5%

### Aenderung spec.ts

```text
VORHER:  DEFAULT_GROWTH_RATE = 0.05
NACHHER: DEFAULT_GROWTH_RATE = 0.04
```

Eine einzelne Zeile. Die `projectCapital`-Funktion in engine.ts nutzt diese Konstante bereits.

---

## 3. Vertrags-Hochrechnung transparent und editierbar

### 3a. DB-Migration: Neue Spalten fuer manuelle Ueberschreibung

Zwei neue Felder in `vorsorge_contracts`:

```sql
ALTER TABLE public.vorsorge_contracts
  ADD COLUMN IF NOT EXISTS projected_end_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS growth_rate_override numeric DEFAULT NULL;
```

- `projected_end_value`: Manuell eingetragene Ablaufleistung (z.B. aus Versorgungsmitteilung der Lebensversicherung). Wenn vorhanden, ueberschreibt sie die automatische Hochrechnung.
- `growth_rate_override`: Individuelle Wachstumsrate pro Vertrag (z.B. 0.03 fuer 3%). Wenn NULL, wird `DEFAULT_GROWTH_RATE` (4%) verwendet.

### 3b. Engine-Logik anpassen

**spec.ts — VLContractInput erweitern:**
```
+ projected_end_value: number | null
+ growth_rate_override: number | null
```

**engine.ts — calcAltersvorsorge, Verrentungs-Block (Zeile 160-172):**

```text
VORHER:
  const capital = c.insured_sum || c.current_balance || 0;
  const futureCapital = projectCapital(capital, monthlyPremium, ytr);
  privateVerrentung += futureCapital / DEFAULT_ANNUITY_YEARS / 12;

NACHHER:
  let futureCapital: number;

  if (c.projected_end_value && c.projected_end_value > 0) {
    // Manuell eingetragene Ablaufleistung (z.B. aus Versorgungsmitteilung)
    futureCapital = c.projected_end_value;
  } else {
    const capital = c.insured_sum || c.current_balance || 0;
    const rate = c.growth_rate_override ?? DEFAULT_GROWTH_RATE;
    const monthlyPremium = (c.premium && c.premium > 0)
      ? normalizeToMonthly(c.premium, c.payment_interval) : 0;
    futureCapital = projectCapital(capital, monthlyPremium, ytr, rate);
  }

  privateVerrentung += futureCapital / DEFAULT_ANNUITY_YEARS / 12;
```

### 3c. UI: Vertrags-Tabelle erweitern (editierbar)

Die AV-Vertragstabelle in der Datenbasis-Sektion bekommt zusaetzliche Spalten und wird editierbar:

```text
VORHER (readonly):
  Anbieter/Typ | Guthaben | Rente mtl. | Sparrate

NACHHER (teilweise editierbar):
  Anbieter/Typ | Guthaben | Rente mtl. | Sparrate | Wachstum % | Hochrechnung | Rente aus Kapital
                                                     [4.0]        [~43.700]       ~146 EUR/mtl.
                                                     editierbar   editierbar      berechnet
```

- **Wachstum %**: Editierbares Input (default 4.0). Wird in `growth_rate_override` gespeichert.
- **Hochrechnung**: Zeigt den hochgerechneten Wert. Ist editierbar — wenn manuell geaendert, wird `projected_end_value` gespeichert und die automatische Berechnung ueberschrieben.
- **Rente aus Kapital**: Berechnet (Hochrechnung / 25 / 12). Nicht editierbar.

Der Save-Button im Datenbasis-Bereich speichert auch die Vertragsaenderungen ueber den neuen `onUpdateContract`-Callback.

### 3d. VorsorgeTab.tsx — Callbacks erweitern

```text
onUpdateContract={async (c) => {
  await supabase.from('vorsorge_contracts')
    .update({
      growth_rate_override: c.growth_rate_override,
      projected_end_value: c.projected_end_value,
    })
    .eq('id', c.id);
}}
```

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| **DB-Migration** | `projected_end_value` + `growth_rate_override` in `vorsorge_contracts` |
| `src/engines/vorsorgeluecke/spec.ts` | `DEFAULT_GROWTH_RATE` auf 0.04, `business_income_monthly` in VLPersonInput, `projected_end_value` + `growth_rate_override` in VLContractInput |
| `src/engines/vorsorgeluecke/engine.ts` | Kumuliertes Einkommen, projected_end_value-Vorrang, growth_rate_override |
| `src/components/portal/finanzanalyse/VorsorgeLueckenrechner.tsx` | Gewerbe-Feld, Gesamteinkommen-Anzeige, editierbare Vertragstabelle mit Hochrechnung |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | `onUpdateContract` Callback durchreichen |

---

## Datenbeispiel

```text
Person: Max, Angestellter Geschaeftsfuehrer
  net_income_monthly: 3.200 EUR (Anstellung)
  business_income_monthly: 1.800 EUR (Einzelfirma)
  => Gesamteinkommen: 5.000 EUR/mtl.
  => Bedarf bei 75%: 3.750 EUR/mtl.

Vertrag: Alte Leipziger Ruerup
  current_balance: 21.000 EUR
  premium: 250 EUR/mtl.
  growth_rate_override: null => nutzt 4%
  projected_end_value: null => automatisch
  => Hochrechnung (15 Jahre, 4%):
     21.000 * 1.04^15 + 250*12 * ((1.04^15 - 1) / 0.04) = ~97.900 EUR
  => Rente aus Kapital: 97.900 / 25 / 12 = ~326 EUR/mtl.

Vertrag: Allianz Lebensversicherung
  current_balance: 45.000 EUR
  projected_end_value: 62.000 EUR  <- manuell aus Versorgungsmitteilung
  => Hochrechnung: 62.000 EUR (manuell, keine Berechnung)
  => Rente aus Kapital: 62.000 / 25 / 12 = ~207 EUR/mtl.
```
