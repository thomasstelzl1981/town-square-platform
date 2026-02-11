
# Zwischenueberschrift + Listing-Auswahl fuer MOD-11

## Aenderungen

### 1. Zwischenueberschrift in FMFinanzierungsakte.tsx (MOD-11)

Zwischen dem Selbstauskunft-Block (Zeile 157) und dem FinanceObjectCard (Zeile 160) wird eine CI-konforme Ueberschrift eingefuegt:

```text
Finanzierungsobjekt
Hier erfassen Sie Ihr Finanzierungsobjekt.
```

Im gleichen Stil wie die bestehende Seiten-Headline (`text-2xl font-bold tracking-tight uppercase` + `text-sm text-muted-foreground`).

### 2. Listing-Auswahl aus Kaufy-Marktplatz (nur MOD-11)

Unterhalb der neuen Ueberschrift wird eine optionale Auswahlleiste eingefuegt — ein kompakter Balken mit:
- Text: "Objekt aus Marktplatz uebernehmen"
- Ein Select/Combobox das `v_public_listings` laedt (title, city, asking_price)
- Bei Auswahl: FinanceObjectCard wird automatisch befuellt (city, postal_code, property_type, year_built, total_area_sqm, asking_price)
- Alternativ: Keine Auswahl = manuell befuellen wie bisher

Die Daten aus `v_public_listings` werden per Supabase-Query geladen:
- `title` → Anzeige im Dropdown
- `city` → city
- `postal_code` → postalCode
- `property_type` → objectType (Mapping noetig)
- `year_built` → yearBuilt
- `total_area_sqm` → livingArea
- `asking_price` → Kaufpreis in FinanceRequestCard

Um die Befuellung zu ermoeglichen, erhaelt `FinanceObjectCard` eine neue optionale Prop `externalData` — wenn gesetzt, wird der State ueberschrieben. Gleiches gilt fuer `FinanceRequestCard` (fuer den Kaufpreis).

### 3. MOD-07 AnfrageTab — Keine Aenderung

MOD-07 bekommt **keine** Listing-Auswahl. Der bestehende Flow (manuell befuellen, Objekt aus Portfolio bei Einreichung) bleibt unveraendert. Es wird lediglich die gleiche Zwischenueberschrift ergaenzt:

```text
Finanzierungsobjekt
Hier erfassen Sie Ihr Finanzierungsobjekt.
```

---

## Technische Details

### FinanceObjectCard.tsx — Neue Prop `externalData`

```typescript
interface Props {
  storageKey: string;
  initialData?: Partial<ObjectFormData>;
  externalData?: Partial<ObjectFormData>; // NEU: ueberschreibt State bei Aenderung
  readOnly?: boolean;
}
```

Ein `useEffect` reagiert auf `externalData`-Aenderungen und merged die Werte in den lokalen State.

### FinanceRequestCard.tsx — Neue Prop `externalPurchasePrice`

```typescript
interface Props {
  storageKey: string;
  externalPurchasePrice?: string; // NEU: setzt Kaufpreis aus Listing
  readOnly?: boolean;
}
```

### FMFinanzierungsakte.tsx — Listing-Query + Mapping

- `useQuery` laedt alle `v_public_listings` Eintraege
- Bei Auswahl eines Listings wird ein Mapping erstellt:
  - `city` → `city`
  - `postal_code` → `postalCode`
  - `property_type` → `objectType` (z.B. "apartment" → "eigentumswohnung")
  - `year_built` → `yearBuilt`
  - `total_area_sqm` → `livingArea`
  - `asking_price` → wird an FinanceRequestCard weitergegeben

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FMFinanzierungsakte.tsx` | Zwischenueberschrift + Listing-Select + externalData-Weiterleitung |
| `FinanceObjectCard.tsx` | Neue Prop `externalData` mit useEffect-Merge |
| `FinanceRequestCard.tsx` | Neue Prop `externalPurchasePrice` |
| `AnfrageTab.tsx` | Zwischenueberschrift ergaenzen (keine Listing-Auswahl) |

## Keine DB-Migration

`v_public_listings` existiert bereits als View.
