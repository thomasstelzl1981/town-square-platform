
# Zuhause-Akte verbreitern, Miet-/Darlehensverhältnis daneben, Vermögensauskunft mit Immobilien- und Darlehensaufstellung

## Zusammenfassung

Drei zusammenhaengende Aenderungen:
1. Die Zuhause-Akte (Inline-Dossier) bekommt ein breiteres Layout mit dem Miet- oder Darlehensverhältnis als eigene Spalte rechts neben der Akte
2. Der Finanzbericht erhaelt zwei neue dedizierte Sektionen: Immobilienaufstellung und Darlehensaufstellung
3. Demo-Daten fuer das eigengenutzte Darlehen (miety_loans) werden angelegt

---

## 1. Zuhause-Akte: Breiteres Layout mit Miet-/Darlehensverhältnis

### Ist-Zustand
`MietyHomeDossierInline.tsx` hat ein 2-Spalten-Layout: Links Dokumentenbaum (280px), rechts Accordion-Sektionen. Das Miet-/Darlehensverhältnis ist als Accordion-Eintrag versteckt.

### Neues Layout (3-Spalten)
```text
+-------------------+---------------------------+-------------------------+
| Dokumentenbaum    | Zuhause-Akte              | Miet-/Darlehensverhältnis|
| (250px)           | (Gebaeude, Vertraege,     | (Loan- ODER Tenancy-    |
|                   |  Zaehler, Versicherungen) |  Sektion, je nach       |
|                   |                           |  ownership_type)        |
+-------------------+---------------------------+-------------------------+
```

### Aenderungen in `MietyHomeDossierInline.tsx`
- Grid von `lg:grid-cols-[280px_1fr]` auf `lg:grid-cols-[250px_1fr_380px]` aendern
- Die dritte Spalte zeigt konditional:
  - Bei `ownership_type === 'eigentum'`: `LoanSection` in einer Card mit Titel "Finanzierung"
  - Bei `ownership_type === 'miete'`: `TenancySection` in einer Card mit Titel "Mietverhaeltnis"
- Die bisherigen Accordion-Items "Darlehen" und "Mietverhaeltnis" aus dem mittleren Bereich entfernen (da jetzt rechts)
- `PageShell` mit `fullWidth` Prop verwenden, damit die volle Breite genutzt wird

### Gleiche Aenderung in `MietyHomeDossier.tsx` (Standalone-Route)
- Ebenfalls auf 3-Spalten-Layout umstellen
- Rechte Spalte mit Loan/Tenancy-Section

---

## 2. Finanzbericht: Immobilienaufstellung und Darlehensaufstellung

### Ist-Zustand
Der Finanzbericht zeigt Immobilien und Darlehen nur als aggregierte Summen (z.B. "Immobilienportfolio: 995.000 EUR", "Portfolio-Darlehen: 710.000 EUR"). Es fehlt eine detaillierte Aufschluesselung.

### Neue Sektionen im `FinanzberichtSection.tsx`

**Sektion "Immobilienaufstellung" (zwischen Vermoegen/Verbindlichkeiten und KPIs):**
- Tabelle mit allen Immobilien (Portfolio + eigengenutzt)
- Spalten: Bezeichnung, Stadt, Typ, Marktwert, Kaufpreis, Eigenanteil
- Summenzeile am Ende

**Sektion "Darlehensaufstellung" (direkt nach Immobilienaufstellung):**
- Tabelle mit allen Darlehen (Portfolio-Darlehen + Zuhause-Darlehen + PV-Darlehen)
- Spalten: Bank/Kreditgeber, Zuordnung, Darlehenssumme, Restschuld, Zinssatz, Monatsrate
- Summenzeile am Ende

### Erweiterung `useFinanzberichtData.ts`
- Neue Return-Felder: `propertyList` (Array mit allen Immobilien-Details) und `loanList` (Array mit allen Darlehen-Details)
- Portfolio-Properties Query erweitern um: `code, city, address, market_value, purchase_price, property_type`
- Portfolio-Loans erweitern um: Bank-Name (falls vorhanden), Zuordnung zum Objekt
- Zuhause-Daten (miety_homes) ebenfalls als Zeile einfuegen
- Miety-Loans mit Zuordnung "Eigengenutzt" kennzeichnen
- PV-Darlehen mit Zuordnung "Photovoltaik" kennzeichnen

---

## 3. Demo-Daten: Eigengenutztes Darlehen

### DB-Migration
Neuer Eintrag in `miety_loans` fuer die Villa Mustermann:
- home_id: `da78ca31-7456-44a8-980c-3e374818b49e`
- tenant_id: `a0000000-0000-4000-a000-000000000001`
- bank_name: "Sparkasse Muenchen"
- loan_amount: 650000
- remaining_balance: 520000
- interest_rate: 2.85
- monthly_rate: 2450
- loan_type: "annuitaet"
- start_date: 2020-03-01
- end_date: 2030-03-01

---

## 4. Build-Warning Fix
`ManifestRouter.tsx` importiert `PortalDashboard` sowohl statisch (Zeile 94) als auch dynamisch (Zeile 291). Der dynamische Import wird entfernt, da er nicht im `portalModulePageMap` verwendet wird (der statische Import auf Zeile 547 genuegt).

---

## 5. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/miety/MietyHomeDossierInline.tsx` | 3-Spalten-Layout, Loan/Tenancy rechts |
| `src/pages/portal/miety/MietyHomeDossier.tsx` | 3-Spalten-Layout, Loan/Tenancy rechts |
| `src/hooks/useFinanzberichtData.ts` | `propertyList` und `loanList` als neue Return-Felder |
| `src/components/finanzanalyse/FinanzberichtSection.tsx` | Neue Sektionen: Immobilienaufstellung, Darlehensaufstellung |
| `src/router/ManifestRouter.tsx` | Doppelten PortalDashboard-Import entfernen |
| DB-Migration | Demo-Darlehen fuer Villa Mustermann |

## 6. Technische Details

### Property-List Typ
```text
interface PropertyListItem {
  id: string;
  label: string;       // Code oder Name
  city: string;
  type: string;        // "Kapitalanlage" | "Eigengenutzt"
  marketValue: number;
  purchasePrice: number;
}
```

### Loan-List Typ
```text
interface LoanListItem {
  id: string;
  bank: string;
  assignment: string;  // "BER-01 Berlin" | "Eigengenutzt" | "PV-Anlage"
  loanAmount: number;
  remainingBalance: number;
  interestRate: number;
  monthlyRate: number;
}
```

### Aggregation im Hook
- `propertyList` = Portfolio-Properties + miety_homes (ownership_type = eigentum)
- `loanList` = Portfolio-Loans + miety_loans + PV-Loans (mit loan_bank)
