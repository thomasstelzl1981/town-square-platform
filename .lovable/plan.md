

# MOD-00 Dashboard + Widget-System — Vollständiger Implementierungsplan

## 1. Projektstruktur & Dokumentation

### 1.1 Neuer Spec-Ordner: MOD-00 Dashboard

**Neue Datei:** `spec/current/02_modules/mod-00_dashboard.md`

Dieser Spec dokumentiert das Dashboard als eigenständiges Modul mit Armstrong-Integration und Widget-System:

```markdown
# MOD-00 — DASHBOARD (Widget-Basierte Startseite)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-07  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal`  
> **SSOT-Rolle**: Source of Truth für Widget-Anordnung und Dashboard-Konfiguration

## 1. Executive Summary

MOD-00 "Dashboard" ist die zentrale Startseite des Portals. Es zeigt personalisierte Widgets 
in einem flexiblen, per Drag & Drop sortierbaren Grid. Widgets werden ausschließlich durch 
Armstrong erstellt und verwaltet.

## 2. FROZEN RULES (Non-Negotiable)

| ID | Regel |
|----|-------|
| **R1** | Alle Widgets sind quadratisch (aspect-square) und gleich groß |
| **R2** | Widgets werden NUR durch Armstrong erstellt (kein manueller Add-Button) |
| **R3** | Widget-Reihenfolge ist per Drag & Drop frei konfigurierbar |
| **R4** | System-Widgets (Armstrong, Wetter, Globe) sind nicht löschbar |
| **R5** | Task-Widgets (Brief, Erinnerung, etc.) entstehen durch Armstrong-Aktionen |

## 3. Widget-Typen

### 3.1 System-Widgets (fest)
- **armstrong**: KI-Begrüßung mit Kontext (Wetter, Termine)
- **weather**: Aktuelles Wetter am Standort
- **globe**: 3D-Erdkugel mit Standort-Anzeige

### 3.2 Task-Widgets (dynamisch via Armstrong)
- **letter**: Brief zur Freigabe
- **email**: E-Mail-Entwurf
- **reminder**: Erinnerung
- **task**: Aufgabe/To-Do
- **research**: Web-Recherche Ergebnis
- **note**: Schnelle Notiz
- **project**: Projekt-Tracker
- **idea**: Kreative Idee

## 4. Drag & Drop Spezifikation

- Bibliothek: @dnd-kit/core, @dnd-kit/sortable
- Strategie: rectSortingStrategy (Grid-basiert)
- Touch: Long-Press 250ms zum Aktivieren
- Persistenz: localStorage (Phase 1), später DB

## 5. Armstrong-Integration

Jede Aktion mit `requires_confirmation: true` erzeugt ein Widget im Dashboard.
User gibt frei oder bricht ab. Nach Ausführung wandert Widget in "Erledigt"-Liste.
```

### 1.2 KI-Office Spec erweitern

**Neue Datei:** `spec/current/02_modules/mod-02_ki-office.md`

Ergänzung um den Menüpunkt "Widgets":

```markdown
# MOD-02 — KI OFFICE

## Sub-Tiles (5 statt 4 — Sonderregelung)

| # | Titel | Route | Icon |
|---|-------|-------|------|
| 1 | E-Mail | /portal/office/email | Mail |
| 2 | Brief | /portal/office/brief | FileText |
| 3 | Kontakte | /portal/office/kontakte | Users |
| 4 | Kalender | /portal/office/kalender | Calendar |
| 5 | **Widgets** | /portal/office/widgets | Layers |

### Widgets Tab Spezifikation

Zeigt alle erledigten/archivierten Widgets in kompakter Listenform:
- Filter nach Widget-Typ
- Filter nach Status (completed, cancelled)
- Zeitstempel der Erledigung
- Option zur Wiederholung (falls anwendbar)
```

---

## 2. Manifest & Katalog Updates

### 2.1 tile_catalog.yaml — MOD-00 hinzufügen

**Datei:** `manifests/tile_catalog.yaml`

Neuer Eintrag für MOD-00 (vor MOD-01):

```yaml
# ============================================================================
# MOD-00: DASHBOARD (NEU)
# ============================================================================
MOD-00:
  code: "MOD-00"
  title: "Dashboard"
  icon: "LayoutDashboard"
  main_route: "/portal"
  display_order: 0
  is_active: true
  
  visibility:
    default: true
    org_types:
      - client
      - partner
      - subpartner
  
  sub_tiles: []  # Dashboard hat keine Sub-Tiles, es IST die Startseite
  
  features:
    - widget_grid
    - drag_drop
    - armstrong_integration
```

### 2.2 tile_catalog.yaml — MOD-02 erweitern

5. Sub-Tile "Widgets" hinzufügen:

```yaml
MOD-02:
  # ... existing config ...
  sub_tiles:
    - title: "E-Mail"
      route: "/portal/office/email"
      icon: "Mail"
      
    - title: "Brief"
      route: "/portal/office/brief"
      icon: "FileText"
      
    - title: "Kontakte"
      route: "/portal/office/kontakte"
      icon: "Users"
      
    - title: "Kalender"
      route: "/portal/office/kalender"
      icon: "Calendar"
    
    # NEU:
    - title: "Widgets"
      route: "/portal/office/widgets"
      icon: "Layers"
      description: "Erledigte Widgets & Aufgaben-Archiv"
```

### 2.3 armstrongManifest.ts — Widget-Aktionen erweitern

**Datei:** `src/manifests/armstrongManifest.ts`

Neue Aktionen für alle Widget-Typen:

```typescript
// MOD-00: DASHBOARD WIDGET ACTIONS
{
  action_code: 'ARM.MOD00.CREATE_REMINDER',
  title_de: 'Erinnerung erstellen',
  description_de: 'Erstellt eine zeitbasierte Erinnerung als Widget',
  zones: ['Z2'],
  module: 'MOD-00',
  risk_level: 'low',
  requires_confirmation: true,
  data_scopes_read: [],
  data_scopes_write: ['widgets'],
  cost_model: 'free',
  api_contract: { type: 'internal', endpoint: null },
  ui_entrypoints: ['/portal'],
  status: 'active',
},
{
  action_code: 'ARM.MOD00.CREATE_NOTE',
  title_de: 'Notiz erstellen',
  description_de: 'Erstellt eine schnelle Notiz als Widget',
  // ...
},
{
  action_code: 'ARM.MOD00.CREATE_IDEA',
  title_de: 'Idee festhalten',
  description_de: 'Speichert eine kreative Idee als Widget',
  // ...
},
{
  action_code: 'ARM.MOD00.CREATE_PROJECT',
  title_de: 'Projekt anlegen',
  description_de: 'Erstellt einen Projekt-Tracker als Widget',
  // ...
},
{
  action_code: 'ARM.MOD00.CREATE_TASK',
  title_de: 'Aufgabe erstellen',
  description_de: 'Erstellt eine To-Do-Aufgabe als Widget',
  // ...
},
```

---

## 3. Technische Implementierung

### 3.1 Neue Abhängigkeiten

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3.2 Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/types/widget.ts` | TypeScript Definitionen für Widget-System |
| `src/components/dashboard/DashboardGrid.tsx` | DnD Context + Grid Container |
| `src/components/dashboard/SortableWidget.tsx` | Wrapper für drag-fähige Widgets |
| `src/components/dashboard/TaskWidget.tsx` | Quadratische Task-Widget-Kachel |
| `src/hooks/useWidgetOrder.ts` | Persistenz der Widget-Reihenfolge |
| `src/pages/portal/office/WidgetsTab.tsx` | Erledigte Widgets Archiv-Liste |
| `spec/current/02_modules/mod-00_dashboard.md` | Modul-Spezifikation |
| `spec/current/02_modules/mod-02_ki-office.md` | Erweiterte Spezifikation |

### 3.3 Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | Icon entfernen, `aspect-square` hinzufügen |
| `src/components/dashboard/PendingActionsWidget.tsx` | **Entfernen** — ersetzt durch TaskWidget |
| `src/components/dashboard/PendingActionCard.tsx` | **Entfernen** — ersetzt durch TaskWidget |
| `src/pages/portal/PortalDashboard.tsx` | DashboardGrid integrieren, flexibles Layout |
| `src/pages/portal/OfficePage.tsx` | Route für `/widgets` hinzufügen |
| `manifests/tile_catalog.yaml` | MOD-00 + MOD-02 Widgets Sub-Tile |
| `src/manifests/armstrongManifest.ts` | Widget-Aktionen für MOD-00 |

---

## 4. Komponenten-Details

### 4.1 Widget-Typen Definition

**`src/types/widget.ts`**

```typescript
export type WidgetType = 
  | 'system_armstrong' 
  | 'system_weather' 
  | 'system_globe'
  | 'letter' 
  | 'email' 
  | 'reminder' 
  | 'task' 
  | 'research' 
  | 'note' 
  | 'project' 
  | 'idea';

export type WidgetStatus = 
  | 'pending' 
  | 'executing' 
  | 'completed' 
  | 'cancelled';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  status: WidgetStatus;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  parameters?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
}

export interface WidgetConfig {
  type: WidgetType;
  icon: string;
  label_de: string;
  gradient: string;
  deletable: boolean;
}

export const WIDGET_CONFIGS: Record<WidgetType, WidgetConfig> = {
  system_armstrong: { icon: 'Rocket', label_de: 'Armstrong', gradient: 'from-primary/10', deletable: false },
  system_weather: { icon: 'Cloud', label_de: 'Wetter', gradient: 'from-blue-500/10', deletable: false },
  system_globe: { icon: 'Globe', label_de: 'Globus', gradient: 'from-green-500/10', deletable: false },
  letter: { icon: 'Mail', label_de: 'Brief', gradient: 'from-blue-500/10', deletable: true },
  email: { icon: 'MailOpen', label_de: 'E-Mail', gradient: 'from-purple-500/10', deletable: true },
  reminder: { icon: 'Bell', label_de: 'Erinnerung', gradient: 'from-amber-500/10', deletable: true },
  task: { icon: 'CheckSquare', label_de: 'Aufgabe', gradient: 'from-green-500/10', deletable: true },
  research: { icon: 'Search', label_de: 'Recherche', gradient: 'from-cyan-500/10', deletable: true },
  note: { icon: 'StickyNote', label_de: 'Notiz', gradient: 'from-yellow-500/10', deletable: true },
  project: { icon: 'FolderKanban', label_de: 'Projekt', gradient: 'from-indigo-500/10', deletable: true },
  idea: { icon: 'Lightbulb', label_de: 'Idee', gradient: 'from-pink-500/10', deletable: true },
};
```

### 4.2 DashboardGrid mit Drag & Drop

**`src/components/dashboard/DashboardGrid.tsx`**

- `DndContext` als Wrapper für alle Widgets
- `SortableContext` mit `rectSortingStrategy` für Grid-Layout
- `onDragEnd` Handler speichert neue Reihenfolge
- Sensoren: PointerSensor (8px Aktivierung) + TouchSensor (250ms Delay)

### 4.3 SortableWidget Wrapper

**`src/components/dashboard/SortableWidget.tsx`**

- `useSortable` Hook von @dnd-kit
- CSS Transform für smooth Drag-Animation
- Opacity 0.5 beim Ziehen
- Cursor: grab / grabbing

### 4.4 TaskWidget (quadratisch)

**`src/components/dashboard/TaskWidget.tsx`**

Ersetzt PendingActionsWidget + PendingActionCard:
- `aspect-square` für quadratische Form
- Icon + Typ-Label oben
- Titel + Beschreibung mittig
- Risiko-Badge + Kosten
- Freigeben/Abbrechen Buttons vertikal
- Typ-spezifischer Farbgradient

### 4.5 ArmstrongGreetingCard Update

**Änderungen:**
- **Entfernt:** Avatar-Block (Zeilen 162-173) mit Raketen-Icon
- **Hinzugefügt:** `aspect-square` Klasse an Card
- **Angepasst:** Layout für quadratische Form
- Text bekommt volle Breite für cleaneren Look

### 4.6 useWidgetOrder Hook

**`src/hooks/useWidgetOrder.ts`**

```typescript
export function useWidgetOrder(defaultOrder: string[]) {
  const [order, setOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard-widget-order');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge: Bestehende behalten, neue ans Ende
      const merged = parsed.filter((id: string) => defaultOrder.includes(id));
      const newIds = defaultOrder.filter(id => !parsed.includes(id));
      return [...merged, ...newIds];
    }
    return defaultOrder;
  });

  const updateOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    localStorage.setItem('dashboard-widget-order', JSON.stringify(newOrder));
  }, []);

  return { order, updateOrder };
}
```

### 4.7 WidgetsTab (Archiv)

**`src/pages/portal/office/WidgetsTab.tsx`**

Kompakte Listenansicht aller erledigten Widgets:
- Filter nach Typ (Dropdown)
- Filter nach Status (completed/cancelled)
- Zeitstempel der Erledigung
- Widget-Icon + Titel + Status-Badge
- "Wiederholen"-Button für wiederkehrende Aktionen

---

## 5. Dashboard Layout

### 5.1 Responsives Grid

**`src/pages/portal/PortalDashboard.tsx`**

```tsx
<DashboardGrid widgetIds={order} onReorder={updateOrder}>
  <div 
    className="grid gap-4 md:gap-6"
    style={{
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 320px))',
      justifyContent: 'center'
    }}
  >
    {order.map(widgetId => (
      <SortableWidget key={widgetId} id={widgetId}>
        {renderWidget(widgetId)}
      </SortableWidget>
    ))}
  </div>
</DashboardGrid>
```

### 5.2 Responsive Verhalten

| Viewport | Spalten | Widget-Größe |
|----------|---------|--------------|
| Mobile (< 640px) | 1 | 100% Breite |
| Tablet (640-1024px) | 2-3 | 280-320px |
| Desktop (1024-1536px) | 3-4 | 280-320px |
| Wide (> 1536px) | 5-6+ | 280-320px |

---

## 6. OfficePage Route-Erweiterung

**`src/pages/portal/OfficePage.tsx`**

```tsx
import { WidgetsTab } from './office/WidgetsTab';

// In Routes:
<Route path="widgets" element={<WidgetsTab />} />
```

---

## 7. Visuelles Design

### 7.1 Widget-Farben nach Typ

| Typ | Gradient | Icon |
|-----|----------|------|
| Armstrong | `from-primary/10` | Rocket |
| Wetter | `from-blue-500/10` | Cloud |
| Globe | `from-green-500/10` | Globe |
| Brief | `from-blue-500/10` | Mail |
| E-Mail | `from-purple-500/10` | MailOpen |
| Erinnerung | `from-amber-500/10` | Bell |
| Aufgabe | `from-green-500/10` | CheckSquare |
| Recherche | `from-cyan-500/10` | Search |
| Notiz | `from-yellow-500/10` | StickyNote |
| Projekt | `from-indigo-500/10` | FolderKanban |
| Idee | `from-pink-500/10` | Lightbulb |

### 7.2 Drag & Drop Feedback

- **Hover:** Cursor `grab`
- **Dragging:** Cursor `grabbing`, Opacity 0.5, Shadow
- **Drop-Zone:** Andere Widgets weichen sanft zur Seite
- **Touch:** Vibration bei Aktivierung (optional)

---

## 8. Demo-Daten (für Entwicklung)

```typescript
const demoWidgets: Widget[] = [
  {
    id: 'demo-letter-1',
    type: 'letter',
    title: 'Brief an Max Müller',
    description: 'Mieterhöhung zum 01.04.2026',
    status: 'pending',
    risk_level: 'medium',
    cost_model: 'free',
    parameters: { recipient: 'Max Müller', channel: 'email' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-reminder-1',
    type: 'reminder',
    title: 'Vertrag prüfen',
    description: 'Mietvertrag Hauptstr. 5 endet am 31.03',
    status: 'pending',
    risk_level: 'low',
    cost_model: 'free',
    created_at: new Date().toISOString(),
  },
];
```

---

## 9. Zusammenfassung: Alle Änderungen

### 9.1 Neue Dateien (8)

1. `spec/current/02_modules/mod-00_dashboard.md`
2. `spec/current/02_modules/mod-02_ki-office.md`
3. `src/types/widget.ts`
4. `src/components/dashboard/DashboardGrid.tsx`
5. `src/components/dashboard/SortableWidget.tsx`
6. `src/components/dashboard/TaskWidget.tsx`
7. `src/hooks/useWidgetOrder.ts`
8. `src/pages/portal/office/WidgetsTab.tsx`

### 9.2 Geänderte Dateien (6)

1. `src/components/dashboard/ArmstrongGreetingCard.tsx` — Icon entfernen, aspect-square
2. `src/pages/portal/PortalDashboard.tsx` — DashboardGrid, flexibles Layout
3. `src/pages/portal/OfficePage.tsx` — Widgets Route
4. `manifests/tile_catalog.yaml` — MOD-00 + MOD-02 Widgets
5. `src/manifests/armstrongManifest.ts` — Widget-Aktionen
6. `package.json` — @dnd-kit Dependencies

### 9.3 Gelöschte Dateien (2)

1. `src/components/dashboard/PendingActionsWidget.tsx`
2. `src/components/dashboard/PendingActionCard.tsx`

---

## 10. Nächste Schritte (nach Implementierung)

1. **Datenbank-Tabelle** `widgets` erstellen (ersetzt Demo-Daten)
2. **useWidgets Hook** mit React Query für Echtzeit-Synchronisation
3. **Armstrong Chat Integration** — Widgets direkt aus Chat erstellen
4. **Widget-Reihenfolge in DB** — Geräte-übergreifende Synchronisation
5. **Push-Benachrichtigungen** — Für neue Widgets von Armstrong

