

# Fix: Menden Living Properties nicht erstellt — Fehlende Spalten

## Root Cause

Die Funktion `createPropertyFromUnit` versucht 6 Spalten zu schreiben, die in der `properties`-Tabelle **nicht existieren**:

| Code schreibt | Existiert? | Loesung |
|---|---|---|
| `hausgeld_monthly` | Nein | Entfernen (Hausgeld gehoert in `units` / `property_accounting`) |
| `rooms` | Nein | Entfernen (Raum-Info liegt auf Unit-Ebene) |
| `floor` | Nein | Entfernen (Etage ist Unit-spezifisch) |
| `units_count` | Nein | Entfernen (ergibt sich aus `units`-Tabelle) |
| `energy_cert_type` | Nein | Entfernen (nicht in Schema) |
| `energy_class` | Nein | Entfernen (nicht in Schema) |

Jeder INSERT auf `properties` schlaegt mit PostgREST-Fehler `"Could not find column"` fehl. Da `createPropertyFromUnit` den Fehler abfaengt und `{ success: false }` zurueckgibt, werden alle 72 Einheiten uebersprungen. Die verbesserte Fehlerbehandlung in `SalesApprovalSection` zeigt zwar einen Toast, aber das eigentliche Problem sind die nicht existierenden Spalten.

## Loesung

### Datei: `src/lib/createPropertyFromUnit.ts`

Alle 6 nicht existierenden Spalten aus dem INSERT entfernen:
- `hausgeld_monthly` entfernen
- `rooms` entfernen
- `floor` entfernen
- `units_count` entfernen
- `energy_cert_type` entfernen
- `energy_class` entfernen

Das ist eine reine Code-Aenderung — keine DB-Migration noetig. Die verbleibenden Spalten (`tenant_id`, `public_id`, `code`, `address`, `city`, `postal_code`, `property_type`, `usage_type`, `status`, `is_demo`, `total_area_sqm`, `purchase_price`, `annual_income`, `year_built`, `description`, `heating_type`, `energy_source`, `renovation_year`) existieren alle.

### Erwartetes Ergebnis nach Fix

1. User widerruft Vertriebsauftrag in MOD-13
2. User aktiviert erneut
3. 72 Properties + 72 Listings + 72 Publikationen werden erstellt
4. MOD-08 und MOD-09 zeigen die Menden-Living-Einheiten

