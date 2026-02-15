
# Demo-Daten fuer V+V: Vermietereinheit + Property-Zuweisung

## Problem

Die V+V-Ansicht zeigt "Keine Vermietereinheiten mit Objekten gefunden", weil:
1. Es existieren **keine `landlord_contexts`** in der Datenbank fuer den Demo-Tenant
2. Die 3 Demo-Properties (BER-01, MUC-01, HH-01) haben `landlord_context_id = NULL`

## Loesung

### 1. SQL-Migration: Demo-Vermietereinheit anlegen + Properties zuweisen

Eine Migration, die:
- Eine **private Vermietereinheit** "Familie Mustermann" fuer den Demo-Tenant (`a0000000-0000-4000-a000-000000000001`) anlegt (mit fester UUID fuer Idempotenz)
- Alle 3 Demo-Properties (`BER-01`, `MUC-01`, `HH-01`) dieser VE zuweist via `landlord_context_id`
- Demo-Steuerdaten setzt: `tax_reference_number`, `ownership_share_percent`
- Optional: einen `vv_annual_data`-Eintrag fuer 2025 mit Beispielwerten fuer BER-01 anlegt

```sql
-- Demo Landlord Context (Privat)
INSERT INTO landlord_contexts (id, tenant_id, name, context_type, tax_regime, tax_number, ...)
VALUES ('d0000000-0000-4000-a000-000000000010', 'a0000000-...', 'Familie Demo', 'PRIVATE', 'VERMÖGENSVERWALTUNG', '123/456/78901', ...)
ON CONFLICT (id) DO NOTHING;

-- Properties zuweisen
UPDATE properties SET landlord_context_id = 'd0000000-...-000000000010'
WHERE id IN ('d0000000-...-01', 'd0000000-...-02', 'd0000000-...-03');

-- Steuerfelder setzen
UPDATE properties SET tax_reference_number = '12-345-6789/01', ownership_share_percent = 100 WHERE ...;
```

### 2. Build-Error beheben: Unused Import in VVErklaerungView

- `usePdfContentRef` wird importiert aber nicht verwendet — Import entfernen

### 3. Ueberpruefung der `property_accounting` Demo-Daten

Pruefen ob fuer die 3 Demo-Properties bereits `property_accounting`-Eintraege mit `building_share_percent` und `afa_rate_percent` existieren. Falls nicht: via Migration anlegen.

## Dateien

| Datei | Aenderung |
|---|---|
| SQL-Migration | Demo landlord_context + Property-Zuweisung + Steuerfelder |
| `src/components/vv/VVErklaerungView.tsx` | Unused Import `usePdfContentRef` entfernen |

## Ergebnis

Nach der Migration zeigt der V+V-Tab:
- **1 Widget**: "Familie Demo" (Typ: PRIVATE, 3 Objekte)
- Bei Klick: 3 Objekt-Widgets (BER-01, MUC-01, HH-01)
- Jedes Objekt mit vorausgefuellten Werten aus bestehenden Leases, Loans und NK-Daten
