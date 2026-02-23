
# Fix: Demo-Daten Cleanup-Bug + Seed-Failures

## Problem 1: `miety_contracts` fehlt in CLEANUP_ORDER

Im letzten Edit wurde `miety_contracts` versehentlich aus der Cleanup-Liste entfernt (Zeile 37 ersetzt statt ergaenzt). Das fuehrt beim naechsten Cleanup zu FK-Fehlern, weil `miety_homes` nicht geloescht werden kann, solange `miety_contracts` noch existiert.

**Fix:** `miety_contracts` wieder in die CLEANUP_ORDER einfuegen, VOR `miety_homes`.

**Datei:** `src/hooks/useDemoCleanup.ts`

Neue Reihenfolge:
```
pet_providers → miety_contracts → miety_homes → user_subscriptions → ...
```

---

## Problem 2: Seed-Failures fuer 5 Entities

Die folgenden Entities werden von der Seed-Engine versucht, schlagen aber fehl:

### 2a: `listings` (Phase 2.5)
**Ursache:** Die RLS-Policy `listings_insert_member` erfordert die Rolle `org_admin` oder `internal_ops` in der `memberships`-Tabelle. Der Demo-User hat moeglicherweise keine dieser Rollen, wodurch das INSERT still fehlschlaegt.

**Fix:** In `seedFromCSV` fuer listings den Fehler explizit loggen. Alternativ: `listings`-Seed ueber eine DB-Funktion mit SECURITY DEFINER ausfuehren, oder die `created_by`-Spalte mit dem userId setzen (falls das die Policy erfuellt).

Pragmatischer Fix: Pruefen, ob der User die richtige Rolle hat. Falls nicht, die Listings-Seed-Funktion anpassen, um `created_by: userId` mitzugeben.

### 2b: `listing_publications` (Phase 2.5)
**Ursache:** Abhaengig von `listings`. Wenn listings nicht existiert, schlaegt die Upsert fuer listing_publications ebenfalls fehl (FK oder leere parent-Referenz).

### 2c: `pet_customers`, `pets`, `pet_bookings` (Phase 7)
**Ursache:** Moeglicherweise gleiches RLS-Problem oder ein Column-Mismatch. Die RLS-Policies sehen korrekt aus (`tenant_id = get_user_tenant_id()`). Die Seed-Engine wrapped Fehler in try/catch und loggt sie nur in DEV-Mode, weshalb in Production keine Fehlermeldung sichtbar ist.

**Fix:** Temporaer die console.error-Guards entfernen, um die Fehlerquelle zu identifizieren. Dann den konkreten Fehler beheben.

---

## Aktionsplan

### Schritt 1: CLEANUP_ORDER fixen
- `miety_contracts` zurueck in die Liste einfuegen (VOR `miety_homes`)
- Datei: `src/hooks/useDemoCleanup.ts`, 1 Zeile einfuegen

### Schritt 2: Seed-Fehler debuggen
- In `seedFromCSV` und den Phase-7-Funktionen die Fehler-Logs temporaer OHNE DEV-Guard ausgeben
- Seed erneut ausfuehren und Konsolenlogs lesen
- Den konkreten Fehler identifizieren und fixen

### Schritt 3: Listings-RLS pruefen
- Pruefen, ob der Demo-User die Rolle `org_admin` oder `internal_ops` hat
- Falls nicht: entweder die Rolle zuweisen oder die Seed-Funktion anpassen, um die Mitgliedschaft zu pruefen

### Schritt 4: Visuelle Verifikation
- Nach dem Fix: Demo-Daten deaktivieren, aktivieren, und alle Module im User-Browser pruefen
- Gruener Glow, Demo-Badge, keine Duplikate

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useDemoCleanup.ts` | `miety_contracts` zurueck in CLEANUP_ORDER |
| `src/hooks/useDemoSeedEngine.ts` | Fehler-Logging fuer Debug, ggf. listings-seed Fix |

## Aufwand

Schritt 1: 5 Minuten (1 Zeile)
Schritt 2-3: 30-60 Minuten (Debug + Fix)
Schritt 4: 15 Minuten (visuelle Pruefung)
