

# Plan: Snapshot snake_case → camelCase Mapping fix + Nummerierung

## Problem

1. **Leere Kacheln**: Die Edge Function speichert den Snapshot mit **snake_case** Keys (`living_area_sqm`, `object_type`, `postal_code`, `year_built`, `net_cold_rent_monthly`, etc.), aber der Reader liest **camelCase** (`livingAreaSqm`, `objectType`, `postalCode`, `yearBuilt`, `netColdRentMonthly`). Im `fetchResult` (useValuationCase.ts Zeile 360-368) wird nur `...rawSnapshot` gespreizt + 6 neue Felder gemappt. Die Kernfelder werden nicht konvertiert.

2. **Fehlende Nummerierung**: Der SectionHeader für "Objektdaten & Gebäudeangaben" hat kein `number={1}` Prop.

## Lösung

### 1. `src/hooks/useValuationCase.ts` — Vollständiges Snapshot-Mapping

Im `fetchResult` (Zeile 360-368) den `mappedSnapshot` Block erweitern, um ALLE Kernfelder von snake_case auf camelCase zu mappen:

```typescript
const mappedSnapshot = rawSnapshot ? {
  sourceMode: rawSnapshot.source_mode ?? rawSnapshot.sourceMode ?? 'DRAFT_INTAKE',
  address: rawSnapshot.address ?? null,
  postalCode: rawSnapshot.postal_code ?? rawSnapshot.postalCode ?? null,
  city: rawSnapshot.city ?? null,
  lat: rawSnapshot.lat ?? null,
  lng: rawSnapshot.lng ?? null,
  objectType: rawSnapshot.object_type ?? rawSnapshot.objectType ?? null,
  livingAreaSqm: rawSnapshot.living_area_sqm ?? rawSnapshot.livingAreaSqm ?? null,
  plotAreaSqm: rawSnapshot.plot_area_sqm ?? rawSnapshot.plotAreaSqm ?? null,
  usableAreaSqm: rawSnapshot.usable_area_sqm ?? rawSnapshot.usableAreaSqm ?? null,
  commercialAreaSqm: rawSnapshot.commercial_area_sqm ?? rawSnapshot.commercialAreaSqm ?? null,
  rooms: rawSnapshot.rooms ?? null,
  units: rawSnapshot.units_count ?? rawSnapshot.unit_count_actual ?? rawSnapshot.units ?? null,
  floors: rawSnapshot.floors ?? null,
  parkingSpots: rawSnapshot.parking_spots ?? rawSnapshot.parkingSpots ?? null,
  yearBuilt: rawSnapshot.year_built ?? rawSnapshot.yearBuilt ?? null,
  condition: rawSnapshot.condition ?? null,
  energyClass: rawSnapshot.energy_class ?? rawSnapshot.energyClass ?? null,
  modernizations: rawSnapshot.modernizations ?? [],
  askingPrice: rawSnapshot.asking_price ?? rawSnapshot.askingPrice ?? null,
  netColdRentMonthly: rawSnapshot.net_cold_rent_monthly ?? rawSnapshot.netColdRentMonthly ?? null,
  netColdRentPerSqm: rawSnapshot.net_cold_rent_per_sqm ?? rawSnapshot.netColdRentPerSqm ?? null,
  hausgeldMonthly: rawSnapshot.hausgeld_monthly ?? rawSnapshot.hausgeldMonthly ?? null,
  vacancyRate: rawSnapshot.vacancy_rate ?? rawSnapshot.vacancyRate ?? null,
  rentalStatus: rawSnapshot.rental_status ?? rawSnapshot.rentalStatus ?? null,
  purchasePrice: rawSnapshot.purchase_price ?? rawSnapshot.purchasePrice ?? null,
  acquisitionCosts: rawSnapshot.acquisition_costs ?? rawSnapshot.acquisitionCosts ?? null,
  // Extended fields (V9.4)
  heatingType: rawSnapshot.heating_type ?? rawSnapshot.heatingType ?? null,
  energySource: rawSnapshot.energy_source ?? rawSnapshot.energySource ?? null,
  coreRenovated: rawSnapshot.core_renovated ?? rawSnapshot.coreRenovated ?? null,
  renovationYear: rawSnapshot.renovation_year ?? rawSnapshot.renovationYear ?? null,
  ownershipSharePercent: rawSnapshot.ownership_share_percent ?? rawSnapshot.ownershipSharePercent ?? null,
  energyCertificateValue: rawSnapshot.energy_certificate_value ?? rawSnapshot.energyCertificateValue ?? null,
} : null;
```

### 2. `ValuationReportReader.tsx` — Nummerierung

Zeile 355: `number={1}` zum SectionHeader hinzufügen:
```tsx
<SectionHeader icon={Building2} number={1} title="Objektdaten & Gebäudeangaben" ... />
```

### 3. Edge Function — fehlende Felder ergänzen

In der `buildSsotSnapshot` Funktion die fehlenden Felder hinzufügen, die aktuell nicht gemappt werden:
- `heating_type: p.heating_type || null`
- `energy_source: p.energy_source || null`  
- `ownership_share_percent: p.ownership_share_percent || null`
- `usable_area_sqm` (aus units)
- `floors` (nicht vorhanden in properties — ignorieren)

Dafür muss `INFRA-edge_functions` unfreezed werden.

## Dateien

| Datei | Änderung |
|-------|----------|
| `src/hooks/useValuationCase.ts` | Vollständiges snake→camelCase Mapping im fetchResult |
| `src/components/shared/valuation/ValuationReportReader.tsx` | `number={1}` ergänzen |
| `supabase/functions/sot-valuation-engine/index.ts` | Fehlende Felder in buildSsotSnapshot (UNFREEZE INFRA-edge_functions nötig) |

