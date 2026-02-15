
# Dashboard-Refactoring, Task-Widget-Loeschung und PV-Widget-Aktivierung

## 1. Dashboard-Layout einschraenken (PortalDashboard.tsx)

**Problem:** Der aeussere Container nutzt keine max-width Begrenzung (`max-w-7xl`), obwohl das Design-Manifest dies vorschreibt.

**Loesung:**
- Die Zeile `<div className="px-2 py-3 md:p-6 lg:p-8">` wird ersetzt durch `<div className="max-w-7xl mx-auto px-2 py-3 md:p-6 lg:p-8">`
- Dadurch wird die Breite auf das Manifest-konforme Maximum (`max-w-7xl` = 1280px) begrenzt

## 2. Armstrong-Ueberschrift und Trennung System-/Aufgaben-Widgets

**Problem:** Systemwidgets und Aufgabenwidgets werden aktuell in einem einzigen Grid vermischt — ohne visuelle Trennung.

**Loesung:**
- `visibleWidgetIds` wird in zwei Arrays aufgeteilt: `systemWidgetIds` (Armstrong + SYS.*) und `taskWidgetIds`
- Nach dem System-Grid wird eine Ueberschrift eingefuegt: `ARMSTRONG` (text-lg tracking-widest, text-muted-foreground)
- Darunter folgt ein zweites `DashboardGrid` fuer Task-Widgets
- Wenn keine Task-Widgets vorhanden sind, wird ein dezenter Platzhalter angezeigt ("Keine aktiven Aufgaben — Armstrong erstellt hier automatisch Widgets")

## 3. Demo-Daten im KI-Office loeschen (WidgetsTab.tsx)

**Problem:** `DEMO_COMPLETED_WIDGETS` ist ein hartcodiertes Array mit 3 Demo-Eintraegen, die den Aufgaben-Tab fuellen.

**Loesung:**
- `DEMO_COMPLETED_WIDGETS` wird geloescht
- `TaskWidgetsContent` wird auf echte DB-Daten umgestellt: ein neuer `useCompletedTaskWidgets`-Hook laedt abgeschlossene/abgebrochene Widgets aus `task_widgets`
- Wenn leer: leerer Zustand ("Keine erledigten Widgets")

## 4. Loeschfunktion fuer Aufgaben-Widgets

**Problem:** Task-Widgets koennen aktuell nur bestaetigt oder abgebrochen werden, aber nicht geloescht (hard delete).

**Loesung:**
- In `useTaskWidgets.ts`: Neue Funktion `handleDelete` hinzufuegen, die den Datensatz per `supabase.from('task_widgets').delete().eq('id', widgetId)` entfernt
- In `TaskWidget.tsx`: Ein drittes Icon (Trash2) wird als kleine Schaltflaeche oben rechts platziert, die per AlertDialog eine Bestaetigung einholt
- In der `WidgetsTab` (erledigte Widgets) ebenfalls eine Loeschoption pro Zeile hinzufuegen

## 5. PV-Widget: Analyse und Toggle-Aktivierung

**Kernproblem identifiziert:** 
Das `PVLiveWidget` rendert `return null` wenn `plants.length === 0`. Das bedeutet: Selbst wenn der Nutzer das Widget in den Systemwidgets aktiviert, bleibt die Kachel unsichtbar, weil noch keine PV-Anlage in der DB existiert. Das Widget ist also technisch korrekt verlinkt (`SYS.PV.LIVE` → `system_pv_live` → `PVLiveWidget`), aber die Logik blendet es aus.

**Loesung — Zweistufiger Ansatz:**

### 5a. PVLiveWidget: Leerzustand statt `return null`
- Wenn `plants.length === 0`: Anstatt `null` eine leere Kachel rendern mit Sun-Icon, "PV Live" Titel und CTA "Anlage anlegen" (Link zu `/portal/photovoltaik/neu`)
- Dadurch wird das Widget sichtbar, sobald es in den Systemwidgets aktiviert ist

### 5b. PV-Akte: Toggle fuer Widget-Aktivierung (pro Anlage)
- Im `PVPlantDossier` wird eine neue Sektion "Dashboard-Widget" eingefuegt (nach dem Monitoring-Bereich)
- Ein Switch/Toggle: "Widget auf Dashboard anzeigen"
- Toggle-Logik:
  - ON: Aktiviert `SYS.PV.LIVE` in den Widget-Preferences des Users (via `useWidgetPreferences().toggleWidget`)
  - OFF: Deaktiviert das Widget
- Fuer Nutzer mit mehreren Anlagen: Das PVLiveWidget aggregiert bereits ueber alle aktiven Anlagen (`usePvMonitoring(plants)` → `totalPowerW`, `totalEnergyTodayKwh`), daher reicht ein einzelnes Dashboard-Widget. Der Toggle in der Akte steuert global die Sichtbarkeit

## Technische Uebersicht

| Datei | Aenderung |
|---|---|
| `src/pages/portal/PortalDashboard.tsx` | max-w-7xl Container, Armstrong-Sektion, getrennte Grids |
| `src/hooks/useTaskWidgets.ts` | `handleDelete` Funktion hinzufuegen |
| `src/components/dashboard/TaskWidget.tsx` | Trash2-Button mit AlertDialog |
| `src/pages/portal/office/WidgetsTab.tsx` | Demo-Daten entfernen, DB-Hook, Loeschen pro Widget |
| `src/hooks/useCompletedTaskWidgets.ts` | Neuer Hook fuer erledigte Task-Widgets |
| `src/components/dashboard/widgets/PVLiveWidget.tsx` | Leerzustand statt `return null` |
| `src/pages/portal/photovoltaik/PVPlantDossier.tsx` | Toggle "Widget auf Dashboard anzeigen" |

Keine Datenbank-Aenderungen erforderlich — alle Tabellen (`task_widgets`, `pv_plants`, `widget_preferences`) existieren bereits.
