# MOD-00 — Dashboard (Widget-basierte Startseite)

> **Version**: 2.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-09  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal` (Portal-Index) + `/portal/dashboard/*` (Tile-Routen)  
> **SSOT-Rolle**: Source of Truth für Widget-Anordnung und Dashboard-Konfiguration

---

## 1. Executive Summary

MOD-00 "Dashboard" ist die zentrale Startseite des Portals. Es zeigt personalisierte Widgets 
in einem flexiblen, per Drag & Drop sortierbaren Grid. Widgets werden ausschließlich durch 
Armstrong erstellt und verwaltet — es gibt keinen manuellen "Hinzufügen"-Button.

**Besonderheit:** MOD-00 ist gleichzeitig der Portal-Index (`/portal`) und ein eigenständiges
Modul mit 4 Tiles im Manifest. Die `PortalDashboard.tsx`-Komponente rendert das Widget-Grid
und wird sowohl als Portal-Index als auch als MOD-00 Page verwendet.

---

## 2. FROZEN RULES (Non-Negotiable)

| ID | Regel |
|----|-------|
| **R1** | Alle Widgets sind quadratisch (aspect-square) und gleich groß |
| **R2** | Widgets werden NUR durch Armstrong erstellt (kein manueller Add-Button) |
| **R3** | Widget-Reihenfolge ist per Drag & Drop frei konfigurierbar |
| **R4** | System-Widgets werden über KI-Office → Widgets konfiguriert |
| **R5** | Task-Widgets entstehen durch Armstrong-Aktionen |
| **R6** | Armstrong-Begrüßung ist immer sichtbar (nicht deaktivierbar) |

---

## 3. Widget-Typen

### 3.1 System-Widgets (konfigurierbar via KI-Office)

| Code | Widget | Beschreibung |
|------|--------|--------------|
| `SYS.GLOBE.EARTH` | Globus | 3D-Erdkugel mit Standort-Anzeige |
| `SYS.WEATHER.SUMMARY` | Wetter | Aktuelles Wetter am Standort |
| `SYS.FIN.MARKETS` | Finanzmärkte | Marktdaten-Überblick |
| `SYS.NEWS.BRIEFING` | Nachrichten | Tages-Briefing |
| `SYS.SPACE.DAILY` | Weltraum | NASA APOD / Raumfahrt |
| `SYS.MINDSET.QUOTE` | Zitat des Tages | Motivationszitat |
| `SYS.AUDIO.RADIO` | Radio | Web-Radio-Player |
| `SYS.PV.LIVE` | PV Live | Photovoltaik-Echtzeit-Daten |

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
- **Mobile**: Drag & Drop ist auf Mobile DEAKTIVIERT für bessere UX
- **Pointer-Aktivierung**: 8px Bewegung
- **Persistenz**: localStorage (Key: `widget-order-v2`)

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
grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
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

## 6. Manifest-Tiles

MOD-00 deklariert 4 Tiles im routesManifest.ts:

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Widgets | `/portal/dashboard/widgets` | Widget-Grid (Hauptansicht) |
| Shortcuts | `/portal/dashboard/shortcuts` | Schnellzugriffe |
| Aktivität | `/portal/dashboard/aktivitaet` | Aktivitäts-Feed |
| Einstellungen | `/portal/dashboard/einstellungen` | Dashboard-Konfiguration |

**Hinweis:** Die Tile-Routing-Logik wird intern von PortalDashboard gehandhabt.

---

## 7. Area-Zuordnung

MOD-00 gehört zur Area **"Base"** in `areaConfig.ts` und ist das einzige Modul in dieser Area.

---

## 8. Technische Komponenten

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/PortalDashboard.tsx` | Haupt-Dashboard (Portal-Index + MOD-00 Page) |
| `src/types/widget.ts` | TypeScript-Definitionen |
| `src/components/dashboard/DashboardGrid.tsx` | DnD-Context + Grid |
| `src/components/dashboard/SortableWidget.tsx` | Sortable Wrapper |
| `src/components/dashboard/TaskWidget.tsx` | Quadratische Task-Kachel |
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | KI-Begrüßung |
| `src/components/dashboard/WeatherCard.tsx` | Wetter-Widget |
| `src/components/dashboard/EarthGlobeCard.tsx` | 3D-Globus |
| `src/components/dashboard/widgets/*.tsx` | Weitere System-Widgets |
| `src/hooks/useWidgetOrder.ts` | Reihenfolge-Persistenz (localStorage) |
| `src/hooks/useWidgetPreferences.ts` | Widget-Aktivierung (KI-Office) |

---

## 9. Armstrong Actions (MOD-00)

| Action Code | Titel | Risk | Cost |
|-------------|-------|------|------|
| `ARM.MOD00.CREATE_REMINDER` | Erinnerung erstellen | low | free |
| `ARM.MOD00.CREATE_NOTE` | Notiz erstellen | low | free |
| `ARM.MOD00.CREATE_IDEA` | Idee festhalten | low | free |
| `ARM.MOD00.CREATE_PROJECT` | Projekt anlegen | low | free |
| `ARM.MOD00.CREATE_TASK` | Aufgabe erstellen | low | free |

---

## 10. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-07 | Initial Release |
| 2.0.0 | 2026-02-09 | Widget-Preferences, 8 System-Widgets, Area-Zuordnung, Tile-Routing dokumentiert |
