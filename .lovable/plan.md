
# Implementierungsplan: KI-Office Systemwidgets (ON/OFF)

## Übersicht

Dieses Feature ermöglicht Nutzern, ihre Dashboard-Systemwidgets über KI-Office → Widgets zentral zu verwalten (aktivieren/deaktivieren, sortieren). MOD-00 Dashboard rendert dann nur die aktivierten Widgets.

---

## A) Architektur-Überblick

```text
┌──────────────────────────────────────────────────────────────────┐
│                     KI-OFFICE (MOD-02)                          │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Tab 1:         │    │  Tab 2:                             │ │
│  │  Systemwidgets  │    │  Aufgabenwidgets (bestehend)        │ │
│  │  ─────────────  │    │                                     │ │
│  │  [✓] Globe      │    │  Erledigte Armstrong-Widgets        │ │
│  │  [✓] Wetter     │    │                                     │ │
│  │  [ ] Finanzen   │    │                                     │ │
│  │  [✓] News       │    │                                     │ │
│  │  ...            │    │                                     │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   DATENBANK (widget_preferences)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ user_id │ widget_code    │ enabled │ sort_order │ config  │ │
│  │─────────│────────────────│─────────│────────────│─────────│ │
│  │ u1      │ SYS.GLOBE      │ true    │ 1          │ {}      │ │
│  │ u1      │ SYS.WEATHER    │ true    │ 2          │ {}      │ │
│  │ u1      │ SYS.FIN.MARKET │ false   │ 3          │ {}      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MOD-00 DASHBOARD                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ SYSTEMWIDGETS (enabled=true, nach sort_order)               ││
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        ││
│  │ │Globe │ │Wetter│ │News  │ │Space │                        ││
│  │ └──────┘ └──────┘ └──────┘ └──────┘                        ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AUFGABENWIDGETS (Armstrong Tasks)                           ││
│  │ ┌──────┐ ┌──────┐                                          ││
│  │ │Brief │ │Remind│                                          ││
│  │ └──────┘ └──────┘                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## B) Systemwidget-Katalog (7 Widgets)

| Code | Name | Status | Quelle | Cache |
|------|------|--------|--------|-------|
| `SYS.GLOBE.EARTH` | Google Earth | LIVE | Google Maps 3D | - |
| `SYS.WEATHER.SUMMARY` | Wetter | LIVE | Open-Meteo | 30min |
| `SYS.FIN.MARKETS` | Finanzüberblick | STUB | Finnhub (geplant) | 30min |
| `SYS.NEWS.BRIEFING` | News | STUB | RSS/NewsAPI | 60min |
| `SYS.SPACE.DAILY` | Space/Weltall | STUB | NASA APOD / ISS | 24h/15min |
| `SYS.MINDSET.QUOTE` | Zitat/Fokus | STUB | ZenQuotes | 24h |
| `SYS.AUDIO.RADIO` | Radio/Musik | STUB | Radio Browser | - |

---

## C) Datenbank-Schema

### Neue Tabelle: `widget_preferences`

```sql
CREATE TABLE public.widget_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_code TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_widget UNIQUE (user_id, widget_code)
);

-- RLS Policies
ALTER TABLE widget_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON widget_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON widget_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON widget_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON widget_preferences FOR DELETE
  USING (auth.uid() = user_id);
```

---

## D) Implementierungsschritte

### Phase 1: Datenmodell & Hook

**1.1 Datenbank-Migration**
- Tabelle `widget_preferences` anlegen mit RLS-Policies

**1.2 Systemwidget-Registry (`src/config/systemWidgets.ts`)**
```typescript
export interface SystemWidgetDefinition {
  code: string;
  name_de: string;
  description_de: string;
  icon: string;
  gradient: string;
  data_source: string;
  cache_interval_min: number;
  cost_model: 'free' | 'metered';
  status: 'live' | 'stub';
  has_autoplay: boolean;
  privacy_note?: string;
}

export const SYSTEM_WIDGETS: SystemWidgetDefinition[] = [
  {
    code: 'SYS.GLOBE.EARTH',
    name_de: 'Google Earth',
    description_de: '3D-Globus mit Ihrem Standort',
    icon: 'Globe',
    gradient: 'from-green-500/10 to-green-600/5',
    data_source: 'Google Maps 3D API',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
  },
  // ... weitere 6 Widgets
];
```

**1.3 Hook: `useWidgetPreferences`**
```typescript
export function useWidgetPreferences() {
  // Lädt Preferences aus DB
  // Fallback: localStorage wenn nicht eingeloggt
  // CRUD-Operationen mit Optimistic Updates
  return {
    preferences: SystemWidgetPreference[],
    enabledWidgets: string[],
    isLoading: boolean,
    toggleWidget: (code: string, enabled: boolean) => Promise<void>,
    updateOrder: (newOrder: string[]) => Promise<void>,
    resetToDefaults: () => Promise<void>,
  };
}
```

### Phase 2: KI-Office Widgets-Tab Refactoring

**2.1 WidgetsTab mit Tabs-Component**
- Tab 1: **Systemwidgets** (NEU)
- Tab 2: **Aufgabenwidgets** (bestehender Code)

**2.2 SystemWidgetsTab-Component**
- Liste aller 7 Systemwidgets mit:
  - Toggle ON/OFF (Switch)
  - Drag-Handle für Sortierung
  - Info-Button → öffnet Detail-Drawer
- Sortierung via @dnd-kit (bereits installiert)

**2.3 SystemWidgetDetailDrawer**
- Zeigt: Beschreibung, Datenquelle, Cache-Hinweis, Kostenmodell, Status
- Read-only für Nutzer

### Phase 3: MOD-00 Dashboard Integration

**3.1 PortalDashboard.tsx anpassen**
```typescript
// Statt hardcoded SYSTEM_WIDGET_IDS:
const { enabledWidgets, preferences } = useWidgetPreferences();

// Systemwidgets nach sort_order sortieren
const systemWidgetIds = preferences
  .filter(p => p.enabled)
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(p => p.widget_code);

// Dann Task-Widgets hinten anhängen
const allWidgetIds = [...systemWidgetIds, ...taskWidgetIds];
```

**3.2 Widget-Rendering Map erweitern**
- Mapping von `widget_code` → React-Component
- Neue Stub-Components für C3-C7

### Phase 4: Stub-Widgets (UI-Platzhalter)

Für die noch nicht angebundenen APIs (Finanzen, News, Space, Quote, Radio):

```typescript
// src/components/dashboard/widgets/FinanceWidget.tsx (Stub)
export function FinanceWidget() {
  return (
    <Card className="aspect-square bg-gradient-to-br from-amber-500/10 to-amber-600/5">
      <CardContent className="h-full flex flex-col items-center justify-center">
        <TrendingUp className="h-10 w-10 text-amber-500/50 mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          Finanzüberblick
        </p>
        <Badge variant="outline" className="mt-2">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}
```

### Phase 5: Zone 1 — Widget-Registry Viewer

**5.1 Neue Page: `/admin/armstrong/integrations`**
- Read-only Übersicht aller Systemwidgets
- Zeigt: Code, Name, Datenquelle, Status, Kostenmodell
- Quelle: Static JSON (SYSTEM_WIDGETS Registry)

**5.2 Navigation in ArmstrongDashboard.tsx erweitern**
- Quick-Link "Integrations/Widgets"

---

## E) Dateien-Übersicht

### Neue Dateien

| Pfad | Beschreibung |
|------|--------------|
| `src/config/systemWidgets.ts` | Widget-Registry (alle 7 Widgets) |
| `src/hooks/useWidgetPreferences.ts` | DB-Hook für Preferences |
| `src/pages/portal/office/SystemWidgetsTab.tsx` | Tab für Systemwidget-Verwaltung |
| `src/components/office/SystemWidgetCard.tsx` | Widget-Karte mit Toggle |
| `src/components/office/SystemWidgetDetailDrawer.tsx` | Detail-Drawer |
| `src/components/dashboard/widgets/FinanceWidget.tsx` | Stub |
| `src/components/dashboard/widgets/NewsWidget.tsx` | Stub |
| `src/components/dashboard/widgets/SpaceWidget.tsx` | Stub |
| `src/components/dashboard/widgets/QuoteWidget.tsx` | Stub |
| `src/components/dashboard/widgets/RadioWidget.tsx` | Stub |
| `src/pages/admin/armstrong/ArmstrongIntegrations.tsx` | Zone 1 Registry Viewer |

### Zu modifizierende Dateien

| Pfad | Änderungen |
|------|------------|
| `src/pages/portal/office/WidgetsTab.tsx` | Tabs-Struktur mit 2 Tabs |
| `src/pages/portal/PortalDashboard.tsx` | Integration von useWidgetPreferences |
| `src/types/widget.ts` | SystemWidgetType erweitern |
| `src/router/ManifestRouter.tsx` | Route für Integrations-Page |
| `src/pages/admin/armstrong/ArmstrongDashboard.tsx` | Quick-Link hinzufügen |

---

## F) API-Adapter Blueprint (Zukunft)

Für Phase 2 (echte API-Anbindung) werden Edge Functions benötigt:

```text
supabase/functions/
├── widget-finance/      # Finnhub/Alpha Vantage Proxy
├── widget-news/         # RSS/NewsAPI Aggregator
├── widget-space/        # NASA APOD / ISS Location
├── widget-quote/        # ZenQuotes Proxy
└── widget-radio/        # Radio Browser API Proxy
```

**Wichtig:** Keine API-Keys im Client. Alle Requests über Edge Functions.

---

## G) Akzeptanzkriterien

| # | Kriterium | Test |
|---|-----------|------|
| 1 | KI-Office → Widgets zeigt 2 Tabs | Klick auf Menüpunkt |
| 2 | Systemwidgets-Tab listet alle 7 Widgets | Visuelle Prüfung |
| 3 | Toggle speichert in DB | Toggle → Page Reload → Zustand bleibt |
| 4 | Sortierung per Drag & Drop funktioniert | Widgets umsortieren |
| 5 | MOD-00 zeigt nur aktivierte Widgets | Widget deaktivieren → verschwindet |
| 6 | Reihenfolge in MOD-00 entspricht sort_order | Umsortieren → Dashboard prüfen |
| 7 | Stub-Widgets zeigen "Coming Soon" | Prüfung der Platzhalter |
| 8 | Zone 1 Registry Viewer zeigt alle Widgets | /admin/armstrong/integrations |
| 9 | Kein Autoplay bei Radio-Widget | Widget aktivieren, prüfen |
| 10 | Empty State wenn alle deaktiviert | Alle Toggles aus → Hinweis |

---

## H) Governance-Regeln (Eingehalten)

- Keine Write-Aktionen in SSOT durch Systemwidgets
- Keine Autoplay-Funktionen
- Externe API-Calls nur über Edge Functions (Blueprints angelegt)
- Kostenmodell dokumentiert (aktuell alle "free" im MVP)
- Datenschutz-Hinweise in Registry

---

## I) Zusammenfassung: Was ist Live vs Stub?

| Widget | Status |
|--------|--------|
| Globe (Earth) | LIVE |
| Wetter | LIVE |
| Finanzen | STUB (UI-Platzhalter) |
| News | STUB (UI-Platzhalter) |
| Space | STUB (UI-Platzhalter) |
| Zitat | STUB (UI-Platzhalter) |
| Radio | STUB (UI-Platzhalter) |

Die Stub-Widgets zeigen einen eleganten "Coming Soon" Platzhalter und können aktiviert/deaktiviert werden, um die Sortierung vorzubereiten.

---

## J) Technischer Hinweis

Die bestehende `useWidgetOrder` Hook wird für die **Aufgabenwidgets** (Armstrong Tasks) weiterverwendet. Die neue `useWidgetPreferences` Hook ist nur für **Systemwidgets** zuständig. Beide werden in `PortalDashboard.tsx` kombiniert.
