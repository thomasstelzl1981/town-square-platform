
# Sprint 3: Final Cleanup Round

## Ziel
Alle verbleibenden Code-Qualitaets-Issues aus den Backlogs schliessen und die aktuellen Console-Fehler beheben. Danach ist das System "sauber" und nur noch Feature-Roadmap-Items bleiben uebrig.

## Umfang (7 Fixes)

### 1. forwardRef-Warnung beheben (Console-Fehler)
- **Datei:** `src/components/portal/cars/VehicleCreateDialog.tsx`
- **Problem:** React warnt, dass Function Components keine Refs erhalten koennen
- **Fix:** Dialog-Komponente korrekt wrappen oder Ref-Weitergabe entfernen
- **Betrifft auch:** `src/components/ui/dialog.tsx` (DialogContent forwardRef)

### 2. AUD-013 abschliessen: Mobile Tile h-[260px] Audit
- **Problem:** Noch als "open" markiert im Backlog
- **Fix:** Systematisch alle 21 Module pruefen ob Dashboard-Widgets den MOBILE Standard einhalten, Backlog-Eintrag auf "done" setzen

### 3. MOB-030: FM Finanzierungsakte Mobile-Layout (P2)
- **Problem:** Dual-Column Selbstauskunft auf Mobile schwer bedienbar
- **Fix:** Responsive Stack-Layout (flex-col auf Mobile, flex-row auf Desktop)

### 4. MOB-031: PV AnlagenTab Spalten (P2)
- **Problem:** Zu viele Spalten auf Mobile sichtbar
- **Fix:** Weitere Spalten mit `hidden md:table-cell` versehen

### 5. AUD-032: SelfieAds Flat-Routes dokumentieren (deferred)
- **Fix:** Status auf "accepted" aendern mit Begruendung (kein Breaking Change)

### 6. AUD-041: FutureRoom Bonitaet als "accepted" markieren
- **Fix:** Visueller Test ist bestanden, E2E mit Testdaten ist Feature-Arbeit

### 7. Backlog-Konsolidierung
- Beide JSON-Dateien aktualisieren: alle "deferred" Items entweder als "accepted" oder in roadmap_carried_forward verschieben
- Finale Statistik: 0 offene Cleanup-Items

## Was NICHT in diesem Sprint ist
Diese Items sind bewusst Feature-Arbeit und kein Cleanup:
- ROAD-001: Leads Stubs implementieren (L)
- ROAD-002: 15 Modul-Specs erstellen (L)
- ROAD-003: Investment Favorites DB (M)
- ROAD-004: DMS Storage Edge Function (M)
- ROAD-005: Mandat Wizard (M)
- AUD-050: Bundle-Analyse (M)

## Technische Details

### forwardRef Fix (Punkt 1)
Die Warnung entsteht weil Radix Dialog einen Ref an eine Function Component weitergibt. Loesung:
- `VehicleCreateDialog` mit `React.forwardRef` wrappen, oder
- Den Dialog-Trigger so umstrukturieren, dass kein Ref an die aeussere Komponente noetig ist

### Mobile FM-Layout (Punkt 3)
```text
Desktop:          Mobile:
+------+------+   +------+
| AS1  | AS2  |   | AS1  |
+------+------+   +------+
                  | AS2  |
                  +------+
```

### Ergebnis nach Sprint 3
- 0 offene Cleanup-Issues in backlog.json
- 0 offene Issues in mobile-backlog.json
- 0 Console-Warnungen
- Nur Feature-Roadmap bleibt uebrig
