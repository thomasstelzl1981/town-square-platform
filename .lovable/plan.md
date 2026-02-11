

# Fix: Listing-Lifecycle bei Deaktivierung/Reaktivierung

## Problem

Der aktuelle Deaktivierungsprozess setzt Listings auf `withdrawn` und Publikationen auf `paused`. Bei einer erneuten Aktivierung sucht der Code aber nur nach Listings mit Status `draft`, `active` oder `reserved` — das `withdrawn` Listing wird nicht gefunden, und es wird ein **neues** erstellt. So entstehen verwaiste Datensaetze (genau das Problem, das wir gerade manuell bereinigen mussten).

```text
Aktivierung:    Listing A erstellt (active) + Publikationen (active)
Deaktivierung:  Listing A → withdrawn, Publikationen → paused
Reaktivierung:  Listing A wird NICHT gefunden → Listing B erstellt (active)
                Listing A bleibt als Datenmuell liegen
```

## Loesung: Hard-Delete bei Deaktivierung

Bei Deaktivierung werden Listings und Publikationen **komplett geloescht** statt nur auf `withdrawn`/`paused` gesetzt. Bei Reaktivierung wird dann immer ein frisches Listing mit frischen Publikationen erstellt.

```text
Aktivierung:    Listing A erstellt (active) + Publikationen (active)
Deaktivierung:  Listing A + Publikationen GELOESCHT
Reaktivierung:  Listing B erstellt (active) + Publikationen (active) — sauber
```

## Aenderungen

### 1. `src/components/portfolio/VerkaufsauftragTab.tsx` — `deactivateVerkaufsauftrag()`

**Vorher (Zeilen 431-454):**
- Listings werden auf `status: 'withdrawn'` gesetzt
- Publikationen werden auf `status: 'paused'` gesetzt

**Nachher:**
- Alle `listing_publications` fuer die Property-Listings werden per `DELETE` entfernt
- Alle `listings` fuer die Property werden per `DELETE` entfernt (nicht nur status-update)
- Reihenfolge: erst Publikationen loeschen (FK), dann Listings

### 2. `src/pages/admin/desks/SalesDesk.tsx` — `handleDeactivateProject()`

Gleiche Anpassung fuer die Zone-1-seitige Deaktivierung:
- Publikationen per `DELETE` entfernen
- Listings per `DELETE` entfernen (statt `withdrawn`-Update)

### 3. `src/components/projekte/SalesApprovalSection.tsx` — `withdrawListingsForProject()`

Gleiche Anpassung:
- Publikationen per `DELETE` entfernen
- Listings per `DELETE` entfernen

### 4. Golden Path Update: `src/manifests/goldenPaths/MOD_04.ts`

Phase 11 (`deactivate_mandate`): Die Completion-Flags anpassen:
- `listing_withdrawn` aendern zu `listing_deleted` mit `check: 'not_exists'` (kein aktives Listing mehr vorhanden)
- `publications_paused` aendern zu `publications_deleted` mit `check: 'not_exists'`

### 5. `src/goldenpath/contextResolvers.ts`

Neues Flag hinzufuegen:
- `listing_deleted`: `true` wenn KEIN aktives Listing fuer die Property existiert (Umkehr-Check)

## Keine strukturellen Aenderungen

- Keine neuen Dateien
- Keine neuen Hooks oder Edge Functions
- Keine DB-Migration noetig (nur Loesch-Logik im Frontend)
- Die Aktivierungslogik (Zeilen 180-325) bleibt unveraendert — sie erstellt ohnehin ein neues Listing wenn keins gefunden wird

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/portfolio/VerkaufsauftragTab.tsx` | `deactivateVerkaufsauftrag()`: DELETE statt UPDATE |
| `src/pages/admin/desks/SalesDesk.tsx` | `handleDeactivateProject()`: DELETE statt UPDATE |
| `src/components/projekte/SalesApprovalSection.tsx` | `withdrawListingsForProject()`: DELETE statt UPDATE |
| `src/manifests/goldenPaths/MOD_04.ts` | Phase 11 Completion-Flags anpassen |
| `src/goldenpath/contextResolvers.ts` | `listing_deleted` Flag ergaenzen |

