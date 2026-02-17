
# Dashboard Redesign: Sticky Full-Page Sections + Notizzettel-Widget

## Konzept

Das Dashboard wird in **zwei vollbildgrosse, vertikal gestapelte Sektionen** aufgeteilt, die per **CSS Scroll-Snap** einrasten. Der User scrollt nach unten und "landet" sanft auf der zweiten Seite -- kein freies Scrollen, sondern ein seitenweises Umschalten wie bei einer nativen App.

```text
+================================+
|  Sektion 1: WELCOME ON BOARD  |
|                                |
|  [Armstrong] [Wetter] [Globe] |
|  [Finance]   [News]   [...]   |
|  (max 8 System-Widgets)       |
|                                |
|         Scroll-Indikator ↓     |
+================================+
|  Sektion 2: ARMSTRONG          |
|                                |
|  [Notizzettel] [Task1] [Task2]|
|  [Task3]       [Task4] [...]  |
|                                |
|  Armstrong erstellt hier       |
|  automatisch Widgets           |
+================================+
```

---

## 1. Sticky Scroll-Snap Container

**Datei:** `src/pages/portal/PortalDashboard.tsx`

Der aeussere Container wird zu einem `snap-y snap-mandatory` Scroll-Container mit `h-screen`. Jede Sektion bekommt `snap-start` und `min-h-screen`, sodass sie beim Scrollen einrasten.

- Sektion 1: "WELCOME ON BOARD" mit max. 8 System-Widgets
- Sektion 2: "ARMSTRONG" mit Task-Widgets und dem neuen Notizzettel
- Ein dezenter Scroll-Indikator (Chevron nach unten) am Ende von Sektion 1 signalisiert, dass es weitergeht

---

## 2. Max. 8 System-Widgets

Die `visibleSystemIds` werden auf maximal 8 Eintraege begrenzt (Armstrong zaehlt mit). Wenn ein User in den Widget-Einstellungen mehr als 7 System-Widgets aktiviert hat, werden nur die ersten 7 plus Armstrong angezeigt. Das haelt die erste Seite kompakt und verhindert, dass sie ueber den Viewport hinauswachest.

---

## 3. Armstrong-Ueberschrift anpassen

Die Ueberschrift der zweiten Sektion wird von dem schlichten `text-lg tracking-widest text-muted-foreground` auf den gleichen Stil wie "WELCOME ON BOARD" umgestellt:

- `text-lg md:text-h1 text-center tracking-widest text-foreground`
- Zentriert, gleiche Groesse, gleiche Praesenz

---

## 4. Notizzettel-Widget (Neues Widget)

**Neue Datei:** `src/components/dashboard/widgets/NotesWidget.tsx`

Ein quadratisches Widget im Armstrong-Bereich, das dem User eigene Notizen ermoeglicht:

- **Design:** Gleiche Groesse wie alle anderen Widgets (aspect-square), mit StickyNote-Icon und gelbem/amber Akzent
- **Klick:** Oeffnet ein Sheet/Dialog mit einem Textfeld
- **Funktionen:**
  - Notiz schreiben und speichern (localStorage Phase 1, spaeter DB)
  - Mehrere Notizen als Liste
  - Einzelne Notizen loeschen (mit Bestaetigung)
  - Letzte Notiz wird als Vorschau im Widget angezeigt
- **Platzierung:** Erstes Widget in der Armstrong-Sektion, vor den Task-Widgets
- Der bisherige leere Platzhalter ("Keine aktiven Aufgaben") wird durch dieses Widget ersetzt -- der Hinweistext wandert als dezente Zeile unter die Ueberschrift

---

## 5. Empty-State der Armstrong-Sektion

Wenn keine Task-Widgets vorhanden sind, zeigt die Sektion trotzdem den Notizzettel plus einen dezenten einzeiligen Hinweis unter der Ueberschrift:

```text
ARMSTRONG
Deine Arbeitsoberflaeche — Armstrong erstellt hier automatisch Widgets
```

Statt des grossen leeren Platzhalter-Blocks mit Icon.

---

## Technische Umsetzung

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/PortalDashboard.tsx` | Scroll-Snap-Container, zwei Sektionen, max 8 System-Widgets, Notizzettel einbinden, Armstrong-Headline anpassen |
| `src/components/dashboard/DashboardGrid.tsx` | Keine Aenderung noetig (Grid bleibt gleich) |

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/components/dashboard/widgets/NotesWidget.tsx` | Quadratisches Notizzettel-Widget mit Sheet-Dialog, CRUD auf localStorage |

### CSS-Details

- Aeusserer Container: `h-[calc(100dvh-<header-height>)] overflow-y-auto snap-y snap-mandatory`
- Jede Sektion: `min-h-[calc(100dvh-<header-height>)] snap-start flex flex-col`
- Scroll-Indikator: Animierter Chevron-Down am unteren Rand von Sektion 1, verschwindet nach erstem Scroll
- Mobile: Gleiche Snap-Logik, Widgets in 1-Spalte, Sektion 2 erreichbar durch Wischen

### Notizzettel-Widget Struktur

- State: `notes: Array<{ id, text, createdAt }>` in localStorage unter `sot-user-notes`
- Widget zeigt: StickyNote-Icon, Titel "Notizen", Anzahl, Vorschau der letzten Notiz
- Sheet enthaelt: Liste aller Notizen, Eingabefeld unten, Loeschen per Swipe oder Trash-Icon
- Amber/Gelb-Gradient passend zum bestehenden `note`-Widget-Typ im Design-System
