

# Fehleranalyse: Speichern funktioniert, Werte verschwinden nach Reload

## Root Cause

Die `useUnitDossier` Query (Zeile 42-65) selektiert **nur 17 explizite Spalten** aus der `properties`-Tabelle:

```
id, tenant_id, code, address, city, postal_code, property_type, year_built,
market_value, purchase_price, weg_flag, land_register_refs, manager_contact,
total_area_sqm, energy_source, heating_type, description
```

Aber der Dossier-Builder (Zeile 250+) greift per `(property as any).XYZ` auf **~20 weitere Spalten** zu, die NICHT im SELECT stehen:

| Feld im Builder | DB-Spalte | Im SELECT? |
|---|---|---|
| `plotAreaSqm` | `plot_area_sqm` | NEU hinzugefügt, fehlt im SELECT |
| `address_house_no` | `address_house_no` | Fehlt |
| `location_label` | `location_label` | Fehlt |
| `location_notes` | `location_notes` | Fehlt |
| `latitude` | `latitude` | Fehlt |
| `longitude` | `longitude` | Fehlt |
| `category` | `category` | Fehlt |
| `status` | `status` | Fehlt |
| `sale_enabled` | `sale_enabled` | Fehlt |
| `rental_managed` | `rental_managed` | Fehlt |
| `landlord_context_id` | `landlord_context_id` | Fehlt |
| `reporting_regime` | `reporting_regime` | Fehlt |
| `usage_type` | `usage_type` | Fehlt |
| `land_register_court` | `land_register_court` | Fehlt |
| `land_register_sheet` | `land_register_sheet` | Fehlt |
| `land_register_volume` | `land_register_volume` | Fehlt |
| `parcel_number` | `parcel_number` | Fehlt |
| `te_number` | `te_number` | Fehlt |
| `notary_date` | `notary_date` | Fehlt |
| `acquisition_costs` | `acquisition_costs` | Fehlt |
| `mea_total` | `mea_total` | Fehlt |
| `allocation_key` | `allocation_key` | Fehlt |

**Flow:** User tippt Grundstücksfläche ein → Save-Mutation schreibt korrekt `plot_area_sqm` in DB → `invalidateQueries` triggert Re-Fetch → Re-Fetch SELECT enthält `plot_area_sqm` NICHT → Feld zeigt wieder leer.

Das betrifft **alle** oben gelisteten Felder, nicht nur `plot_area_sqm`.

## Fix

**Datei:** `src/hooks/useUnitDossier.ts` (Zeilen 44-64)

Den expliziten Spalten-SELECT durch `*` ersetzen (oder alle fehlenden Spalten ergänzen). Da der Builder ohnehin fast alle Spalten braucht, ist `*` die sauberste Lösung:

```typescript
.select(`
  *,
  properties!inner (*)
`)
```

Das behebt gleichzeitig alle 20+ fehlenden Felder-Mappings und eliminiert die `(property as any)`-Casts, da alle Spalten nun im Response enthalten sind.

**Betroffene Datei:** nur `src/hooks/useUnitDossier.ts` — eine Zeile ändern.

## Andere Aktenformulare

Die anderen Aktentypen (MOD-17 Fahrzeuge, MOD-18 Finanzanalyse, MOD-19 PV, MOD-20 Miety, MOD-22 Pets) verwenden separate Hooks mit eigenen Queries. Diese müssen **nicht** geändert werden, da sie eigene Tabellen haben und nicht die gleiche SELECT-Einschränkung aufweisen. Das Problem ist **spezifisch** für `useUnitDossier` und die `properties`-Tabelle.

