

# Fix: Verwaister pet_providers Demo-Datensatz

## Problem

`pet_providers` fehlt in der Cleanup-Liste von `useDemoCleanup.ts`. Der Datensatz "Lennox & Friends Dog Resorts" (ID: `d0000000-0000-4000-a000-000000000050`) bleibt nach Deaktivierung der Demo-Daten in der Datenbank.

## Loesung

### Aenderung 1: `src/hooks/useDemoCleanup.ts`

`pet_providers` zur Cleanup-Reihenfolge hinzufuegen. Positionierung: NACH `pet_customers` (da `pet_bookings` und `pet_services` auf `pet_providers` verweisen koennen).

Aktuelle Reihenfolge:
```
bank_transactions → pet_bookings → pets → pet_customers → miety_contracts → miety_homes → ...
```

Neue Reihenfolge:
```
bank_transactions → pet_bookings → pets → pet_customers → pet_providers → miety_contracts → miety_homes → ...
```

Zusaetzlich: `pet_services` sollte ebenfalls geprueft und ggf. hinzugefuegt werden, da diese Tabelle einen FK auf `pet_providers` hat. Falls `pet_services` Demo-Daten enthaelt, muss sie VOR `pet_providers` in der Liste stehen.

### Aenderung 2: FK-Kommentar aktualisieren

Den Kommentarblock oben in der Datei um die fehlende Abhaengigkeit ergaenzen:
```
- pet_services → pet_providers (FK provider_id)
- pet_bookings → pet_services (FK)
```

### Verifizierung

Nach dem Fix: Demo-Daten aktivieren, dann deaktivieren, und pruefen, dass `pet_providers` Count = 0 ist.

## Betroffene Dateien

- `src/hooks/useDemoCleanup.ts` — `pet_providers` (und ggf. `pet_services`) in die Cleanup-Liste einfuegen

## Aufwand

Minimal — 2 Zeilen Aenderung in 1 Datei.

