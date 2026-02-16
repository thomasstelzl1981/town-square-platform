

# Vorsorge-Engine: Konsolidierter Gesamtplan

## Uebersicht

Dieser Plan fasst alle geplanten Aenderungen an Engine 9 (Vorsorge-Lueckenrechner) zusammen: Daten-Mapping-Korrekturen, BU-Kombiprodukt-Erkennung, Kategorie-Trennung Vorsorge vs. Investment, Wertzuwachs-Hochrechnung und korrekte Behandlung von Selbstaendigen.

---

## 1. DB-Migration: Neues Feld `bu_monthly_benefit`

Neues Feld in `vorsorge_contracts`, damit bei JEDEM Vorsorgevertrag (auch Kombiprodukten wie Ruerup+BU) die BU-Leistung separat erfasst werden kann:

```sql
ALTER TABLE public.vorsorge_contracts
  ADD COLUMN IF NOT EXISTS bu_monthly_benefit numeric DEFAULT NULL;
```

**Beispiel:** Ruerup mit BU-Zusatz speichert `monthly_benefit = 500` (Rente) UND `bu_monthly_benefit = 2000` (BU-Baustein).

---

## 2. Engine spec.ts — Typen und Konstanten erweitern

### Neue Konstante
- `DEFAULT_GROWTH_RATE = 0.05` (5% p.a. Wertzuwachs)

### VLPersonInput erweitern
- `planned_retirement_date: string | null` (fuer Restlaufzeit-Berechnung)

### VLContractInput erweitern
- `bu_monthly_benefit: number | null` (BU-Baustein bei Kombiprodukten)
- `premium: number | null` (laufende Sparleistung)
- `payment_interval: string | null` (fuer Umrechnung auf monatlich)

### ALTERSVORSORGE_TYPES erweitern

```text
VORHER:  'bAV', 'Riester', 'Ruerup', 'Lebensversicherung', 'Versorgungswerk', 'Privat', 'Sonstige'

NACHHER: 'bAV', 'Betriebliche Altersvorsorge',
         'Riester',
         'Ruerup', 'Basisrente',
         'Lebensversicherung', 'Rentenversicherung',
         'Fondsgebundene', 'Kapitalbildende',
         'Versorgungswerk',
         'Privat',
         'Sonstige'
```

---

## 3. Engine engine.ts — Berechnungslogik-Fixes

### 3a. Deutsche employment_status Werte erkennen

4 Stellen aendern (2x Altersvorsorge, 2x BU):

```text
'civil_servant' || 'beamter' || 'beamte'
'employee'      || 'angestellt'
'self_employed'  || 'selbstaendig' || 'selbststaendig'
```

### 3b. Selbstaendige: Gesetzliche Rente UND EM-Rente korrekt behandeln

**Altersvorsorge** (bereits korrekt): Der `else`-Branch faengt Employee UND Self-employed auf. Wenn `pension.projected_pension` vorhanden, wird es verwendet.

**BU-Luecke** (FIX noetig):

```text
VORHER (Zeile 160-169):
  } else if (empStatus === 'employee' || empStatus === 'angestellt') {
    // nur Angestellte geprueft
  }
  // self_employed: immer 0 — FALSCH

NACHHER:
  } else {
    // Alle Nicht-Beamten: DRV-EM pruefen
    if (pension?.disability_pension > 0) {
      gesetzliche = pension.disability_pension;
      quelle = 'drv_em';
    } else if (empStatus === 'employee' || empStatus === 'angestellt') {
      // 35% Brutto-Fallback NUR fuer Angestellte
      gesetzliche = gross_income * 0.35;
      quelle = 'fallback';
    }
    // self_employed ohne DRV-Daten: bleibt 0, quelle 'missing'
  }
```

### 3c. BU-Aggregation: Kombiversicherungen erkennen

```text
VORHER:
  buContracts = filter(isBuType)
  for c: privateBu += c.monthly_benefit

NACHHER:
  // 1) Alle Vertraege mit explizitem bu_monthly_benefit
  for c of vorsorgeContracts:
    if c.bu_monthly_benefit > 0: privateBu += c.bu_monthly_benefit

  // 2) Reine BU-Vertraege OHNE bu_monthly_benefit: Fallback auf monthly_benefit
  for c of vorsorgeContracts:
    if isBuType(c.contract_type) AND !c.bu_monthly_benefit:
      if c.monthly_benefit > 0: privateBu += c.monthly_benefit
```

Keine Doppelzaehlung: `bu_monthly_benefit` hat Vorrang.

### 3d. Wertzuwachs bei Kapital-Verrentung (5% p.a.)

```text
VORHER:  annuity = capital / 25 / 12

NACHHER:
  Wenn planned_retirement_date vorhanden:
    years = (retirement_date - heute) / 365
  Sonst:
    years = 15 (Fallback)

  // Kapital hochrechnen
  future_capital = current_balance * (1.05)^years

  // Falls Premium vorhanden: laufende Sparleistung hochrechnen
  if premium > 0:
    monthly_premium = premium (auf monatlich normalisiert)
    annual_premium = monthly_premium * 12
    future_capital += annual_premium * ((1.05^years - 1) / 0.05)

  annuity_monthly = future_capital / 25 / 12
```

---

## 4. VorsorgeTab.tsx — CONTRACT_TYPES und Formular

### 4a. CONTRACT_TYPES erweitern

```text
VORHER:
  'bAV', 'Riester', 'Ruerup', 'Versorgungswerk',
  'Berufsunfaehigkeit', 'Lebensversicherung', 'Privat', 'Sonstige'

NACHHER:
  'Private Rentenversicherung',
  'Ruerup (Basisrente)',
  'Riester-Rente',
  'Betriebliche Altersvorsorge (bAV)',
  'Kapitalbildende Lebensversicherung',
  'Fondsgebundene Lebensversicherung',
  'Versorgungswerk',
  'Berufsunfaehigkeitsversicherung',
  'Dienstunfaehigkeitsversicherung',
  'Sonstige'
```

### 4b. Neues Formularfeld "BU-Rente mtl."

Im `VorsorgeFields`-Formular unter "Leistungen und Guthaben":

```text
VORHER:
  Monatliche Rente / BU-Rente (monthly_benefit)
  Versicherungssumme (insured_sum)
  ...

NACHHER:
  Garantierte monatl. Rente (monthly_benefit)
  BU-Rente mtl. (bu_monthly_benefit)             <-- NEU
  Ablaufleistung / Kapital (insured_sum)
  ...
```

### 4c. Create/Update Mutations um bu_monthly_benefit erweitern

---

## 5. VorsorgeLueckenrechner.tsx — Mapping und UI-Texte

### 5a. mapPerson erweitern

```text
+ planned_retirement_date: p.planned_retirement_date
```

### 5b. mapContract erweitern

```text
+ bu_monthly_benefit: c.bu_monthly_benefit
+ premium: c.premium
+ payment_interval: c.payment_interval
```

### 5c. Verbesserte Hinweistexte fuer Selbstaendige

- Bei Altersvorsorge + `self_employed` + `missing`:
  "Keine DRV-Daten hinterlegt. Falls Sie frueher angestellt waren, tragen Sie Ihre DRV-Renteninformation in der Personenakte ein."
- Bei BU + `self_employed` + gesetzliche = 0:
  "Selbstaendige haben keinen automatischen gesetzlichen BU-Schutz. Private BU-Absicherung wird beruecksichtigt."

---

## 6. Demo-Daten erweitern

### DemoVorsorgeContract Interface (spec.ts)
- `buMonthlyBenefit?: number` hinzufuegen

### Demo-Daten (data.ts)
- Bestehende BU-Vertraege (Max: 3.000 EUR, Lisa: 1.500 EUR) um `buMonthlyBenefit` ergaenzen
- Demo-Seeding analog anpassen

---

## Betroffene Dateien (Gesamt)

| Datei | Aenderung |
|---|---|
| **DB-Migration** | `bu_monthly_benefit` Spalte in `vorsorge_contracts` |
| `src/engines/vorsorgeluecke/spec.ts` | `DEFAULT_GROWTH_RATE`, erweiterte Input-Typen, erweiterte `ALTERSVORSORGE_TYPES` |
| `src/engines/vorsorgeluecke/engine.ts` | Deutsche Status-Werte, BU fuer Selbstaendige, BU-Kombi-Aggregation, Wertzuwachs-Formel |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | Erweiterte `CONTRACT_TYPES`, neues BU-Feld, Mutations angepasst |
| `src/components/portal/finanzanalyse/VorsorgeLueckenrechner.tsx` | Erweitertes Mapping, verbesserte Hinweistexte |
| `src/engines/demoData/spec.ts` | `buMonthlyBenefit` im Interface |
| `src/engines/demoData/data.ts` | Demo-BU-Vertraege mit `buMonthlyBenefit` |

---

## Daten-Gegenueberstellung: Vorher vs. Nachher

```text
BEISPIEL 1: Ruerup mit BU-Zusatz (Alte Leipziger, Max)

  VORHER:
    contract_type: "Ruerup (Basisrente)"
    monthly_benefit: null
    current_balance: 21.000
    bu_monthly_benefit: [Feld existiert nicht]

    Engine:
      Altersvorsorge: 21.000 / 25 / 12 = 70 EUR/mtl. (ohne Wachstum)
      BU: 0 EUR (kein BU-Typ erkannt)

  NACHHER:
    contract_type: "Ruerup (Basisrente)"
    monthly_benefit: 500 (garantierte Rente)
    current_balance: 21.000
    bu_monthly_benefit: 2.000

    Engine:
      Altersvorsorge: 500 EUR/mtl. (garantierte Rente direkt)
      + Kapital-Verrentung: 21.000 * 1.05^15 / 25 / 12 = 146 EUR/mtl.
      BU: 2.000 EUR/mtl. (aus bu_monthly_benefit)


BEISPIEL 2: Selbstaendiger mit DRV-Anspruechen (Max)

  VORHER:
    employment_status: "selbstaendig"
    drv_estimated_pension: 800 EUR/mtl.
    drv_em_rente: 600 EUR/mtl.

    Engine BU:
      Gesetzlich: 0 EUR (self_employed uebersprungen)
      => BU-Luecke zu hoch

  NACHHER:
    Engine BU:
      Gesetzlich: 600 EUR/mtl. (aus DRV-EM erkannt)
      => Korrekte BU-Luecke
```
