# MOD-00 — DASHBOARD (Widget-Basierte Startseite)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-07  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal`  
> **SSOT-Rolle**: Source of Truth für Widget-Anordnung und Dashboard-Konfiguration

---

## 1. Executive Summary

MOD-00 "Dashboard" ist die zentrale Startseite des Portals. Es zeigt personalisierte Widgets 
in einem flexiblen, per Drag & Drop sortierbaren Grid. Widgets werden ausschließlich durch 
Armstrong erstellt und verwaltet — es gibt keinen manuellen "Hinzufügen"-Button.

---

## 2. FROZEN RULES (Non-Negotiable)

| ID | Regel |
|----|-------|
| **R1** | Alle Widgets sind quadratisch (aspect-square) und gleich groß |
| **R2** | Widgets werden NUR durch Armstrong erstellt (kein manueller Add-Button) |
| **R3** | Widget-Reihenfolge ist per Drag & Drop frei konfigurierbar |
| **R4** | System-Widgets (Armstrong, Wetter, Globe) sind nicht löschbar |
| **R5** | Task-Widgets (Brief, Erinnerung, etc.) entstehen durch Armstrong-Aktionen |

---

## 3. Widget-Typen

### 3.1 System-Widgets (fest)

| ID | Widget | Beschreibung |
|----|--------|--------------|
| `system_armstrong` | Armstrong Begrüßung | KI-Begrüßung mit Kontext (Wetter, Termine) |
| `system_weather` | Wetter | Aktuelles Wetter am Standort |
| `system_globe` | Globus | 3D-Erdkugel mit Standort-Anzeige |

### 3.2 Task-Widgets (dynamisch via Armstrong)

| ID | Widget | Icon | Gradient |
|----|--------|------|----------|
| `letter` | Brief zur Freigabe | Mail | blue-500 |
| `email` | E-Mail-Entwurf | MailOpen | purple-500 |
| `reminder` | Erinnerung | Bell | amber-500 |
| `task` | Aufgabe/To-Do | CheckSquare | green-500 |
| `research` | Web-Recherche Ergebnis | Search | cyan-500 |
| `note` | Schnelle Notiz | StickyNote | yellow-500 |
| `project` | Projekt-Tracker | FolderKanban | indigo-500 |
| `idea` | Kreative Idee | Lightbulb | pink-500 |

---

## 4. Drag & Drop Spezifikation

- **Bibliothek**: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- **Strategie**: rectSortingStrategy (Grid-basiert)
- **Touch-Aktivierung**: Long-Press 250ms
- **Pointer-Aktivierung**: 8px Bewegung
- **Persistenz Phase 1**: localStorage
- **Persistenz Phase 2**: Datenbank-Tabelle `user_widget_preferences`

### 4.1 Visuelles Feedback

| State | Cursor | Opacity | Extras |
|-------|--------|---------|--------|
| Hover | `grab` | 1.0 | — |
| Dragging | `grabbing` | 0.5 | Shadow verstärkt |
| Drop-Zone | — | — | Andere Widgets weichen zur Seite |

---

## 5. Layout Spezifikation

### 5.1 Grid-Konfiguration

```css
grid-template-columns: repeat(auto-fill, minmax(280px, 320px));
justify-content: center;
gap: 1rem (mobile) / 1.5rem (desktop);
```

### 5.2 Responsive Verhalten

| Viewport | Spalten | Widget-Größe |
|----------|---------|--------------|
| Mobile (< 640px) | 1 | 100% Breite |
| Tablet (640-1024px) | 2-3 | 280-320px |
| Desktop (1024-1536px) | 3-4 | 280-320px |
| Wide (> 1536px) | 5-6+ | 280-320px |

---

## 6. Armstrong-Integration

### 6.1 Widget-Erstellung

1. User gibt Befehl: "Armstrong, erinnere mich morgen an die Mieterhöhung"
2. Armstrong interpretiert Befehl und ermittelt Action-Code
3. Widget wird mit `status: 'pending'` erstellt
4. Widget erscheint automatisch im Dashboard-Grid
5. User sieht Freigeben/Abbrechen Buttons

### 6.2 Widget-Lebenszyklus

```
PENDING → (Freigeben) → EXECUTING → COMPLETED
    ↓
(Abbrechen) → CANCELLED
```

### 6.3 Archivierung

Nach Ausführung wandert Widget in "Erledigt"-Liste (MOD-02 Widgets Tab).

---

## 7. Technische Komponenten

### 7.1 Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/types/widget.ts` | TypeScript-Definitionen |
| `src/components/dashboard/DashboardGrid.tsx` | DnD-Context + Grid |
| `src/components/dashboard/SortableWidget.tsx` | Sortable Wrapper |
| `src/components/dashboard/TaskWidget.tsx` | Quadratische Task-Kachel |
| `src/hooks/useWidgetOrder.ts` | Reihenfolge-Persistenz |

### 7.2 Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `ArmstrongGreetingCard.tsx` | Icon entfernen, aspect-square |
| `PortalDashboard.tsx` | DashboardGrid integrieren |

### 7.3 Gelöschte Dateien

- `PendingActionsWidget.tsx` (ersetzt durch TaskWidget)
- `PendingActionCard.tsx` (ersetzt durch TaskWidget)

---

## 8. Armstrong Actions (MOD-00)

| Action Code | Titel | Risk | Cost |
|-------------|-------|------|------|
| `ARM.MOD00.CREATE_REMINDER` | Erinnerung erstellen | low | free |
| `ARM.MOD00.CREATE_NOTE` | Notiz erstellen | low | free |
| `ARM.MOD00.CREATE_IDEA` | Idee festhalten | low | free |
| `ARM.MOD00.CREATE_PROJECT` | Projekt anlegen | low | free |
| `ARM.MOD00.CREATE_TASK` | Aufgabe erstellen | low | free |

---

## 9. Tile-Catalog Eintrag

```yaml
MOD-00:
  code: "MOD-00"
  title: "Dashboard"
  icon: "LayoutDashboard"
  main_route: "/portal"
  display_order: 0
  is_active: true
  sub_tiles: []  # Dashboard ist die Startseite
  features:
    - widget_grid
    - drag_drop
    - armstrong_integration
```

---

## 10. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-07 | Initial Release |
