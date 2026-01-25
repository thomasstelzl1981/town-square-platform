# CI/UI MASTER-PROMPT — KAUFY / ACQUIARY / FUTUREROOM

**Version:** 1.0.0  
**Status:** ACTIVE  
**Datum:** 2026-01-25

---

## Ziel

Erzeuge ein konsistentes, modernes Dark-UI-Layout im Stil des Enterprise-Dashboard-Referenzbilds:
- Links: Sidebar-Menü
- Oben: 4 KPI-Kacheln
- Darunter: Modulare Cards
- Rechts: AI Assistant Panel

UI muss für Zone 1 (Admin) und Zone 2 (Produkt/Immobilien) nutzbar sein, inkl. Chatbot-Panel.

**Ergebnis:** Klickbarer Prototyp / UI-Screens + wiederverwendbare Komponenten + Design-Tokens.

---

## 1) DESIGNSPRACHE / LOOK & FEEL

- **Dark Theme**, hochwertig, ruhig, "Enterprise Dashboard"
- **Flächen:** Dunkler App-Hintergrund, Cards als leicht hellere Oberflächen mit sehr subtilen Borders/Glow
- **Typografie:** Klar, KPI-Zahlen prominent, sekundäre Texte gedimmt
- **Keine visuelle Unruhe:** Striktes Card-Prinzip, konsistente Abstände, einheitliche Radien
- **Akzentfarbe:** 1 CI-Akzent (Primary) für Active States, Highlights, Badges (später konfigurierbar)
- **Responsiv:** Mobile-first responsive, aber Desktop-Dashboard bleibt primär

---

## 2) LAYOUT (DESKTOP) — MASTER SHELL

### A) 3-Spalten-Grundlayout

| Element | Breite |
|---------|--------|
| Left Sidebar | fixed 260px (collapsed: 56px) |
| Main Content | fluid |
| Right Assistant Panel | 380px docked ODER Drawer |

### B) Main Header (oben im Main Content)

- Page Title links
- Global Search (mittig/rechts)
- Quick Actions, Notifications, User Avatar rechts
- Optional Breadcrumbs unter Titel (bei tieferen Ebenen)

### C) KPI-Row

- 4 KPI Cards in einer Reihe (bei großen Screens)
- Mit Name, Wert, Subtext/Trend

### D) Content Grid (Cards)

- Standard: 2 Spalten im Main Content (Desktop)
- Cards modular (Charts, Tabellen, Listen)
- Card-Größen: Small, Medium, Large
- **Alles ist eine Card** — keine "freien" Layout-Ausnahmen

---

## 3) RESPONSIVE REGELN

| Breakpoint | Sidebar | ChatPanel | KPI-Row |
|------------|---------|-----------|---------|
| >=1280px | Full (260px) | Docked | 4 Spalten |
| 1024–1279px | Icon-only (56px) | Drawer | 4 Spalten |
| <=768px | Hamburger Drawer | Bottom Sheet | 2×2 Grid |

**Mobile-spezifisch:**
- Sidebar als Hamburger Drawer
- Chat als Bottom Sheet (Swipe) oder Fullscreen Modal

---

## 4) DESIGN-TOKENS (VARIABLEN)

### Farben (semantisch)

```css
/* App Backgrounds */
--bg-app: 222 47% 6%;           /* Near-black */
--bg-surface: 222 30% 10%;      /* Card surface */
--bg-surface-2: 222 35% 8%;     /* Sidebar/Secondary */

/* Borders */
--border: 222 20% 18%;          /* Standard */
--border-subtle: 222 20% 18%;   /* Low-contrast outline */
--border-glow: 217 50% 35%;     /* Hover glow */

/* Text */
--text-primary: 210 40% 98%;
--text-secondary: 215 20% 65%;
--text-dimmed: 215 15% 45%;

/* Accent (CI Primary) */
--accent-primary: 217 91% 60%;
--accent-primary-hover: 217 91% 70%;

/* Status */
--status-success: 142 71% 45%;
--status-warn: 38 92% 50%;
--status-error: 0 84% 60%;
--status-info: 199 89% 48%;
```

### Typografie

| Element | Größe | Gewicht |
|---------|-------|---------|
| Page Title | 20–24px | Semibold |
| Card Title | 14–16px | Semibold |
| Body | 13–14px | Regular |
| KPI Value | 24–32px | Bold/Semibold (tabular-nums) |

### Spacing/Radii

- **Basis:** 8px System
- **Card Padding:** 16–20px
- **Gaps:** 12–16px
- **Radius:** 12–16px

### Shadows

- Sehr subtil, nur zur Layer-Trennung
- Keine harten Dropshadows

---

## 5) KOMPONENTEN (WIEDERVERWENDBAR)

### Core Components

| Component | Beschreibung |
|-----------|--------------|
| `AppShell` | Sidebar + Header + Main + ChatPanel |
| `SidebarNav` | Top: Logo/Workspace; Middle: Menüs; Bottom: Settings/Help |
| `Subnav` | 4 Unterpunkte pro Hauptpunkt (Accordion oder Tabs) |
| `StatCard` | KPI-Anzeige mit Trend-Indikator |
| `BaseCard` | Header (Titel + Actions), Body, optional Footer |
| `TableCard` | Sticky Header, Sorting, Row Actions |
| `ChartCard` | Wrapper für Charts |
| `ChatPanel` | AI Assistant mit Context und Quick Actions |

### Utility Components

| Component | Beschreibung |
|-----------|--------------|
| `Badge/Chip` | Status-Anzeige |
| `SearchInput` | Global Search |
| `EmptyState` | Leerzustand-Anzeige |
| `LoadingSkeleton` | Ladezustand |
| `ErrorState` | Fehlerzustand |

---

## 6) NAVIGATION / INFORMATIONSARCHITEKTUR

### Zone 1 (ADMIN/CORE)

Dashboard + 12 Hauptsektionen, jede mit 4 Unterpunkten.

### Zone 2 (PRODUKT/IMMOBILIEN)

Dashboard + 9 Module (FROZEN), jedes mit 4-5 Sub-Routes.

**Siehe:** `docs/architecture/A2_Zone1_Admin_Governance.md` und `A3_Zone2_ModuleStructure.md`

### WICHTIGE PRODUKTREGEL (FROZEN)

- In MOD-04 **KEINE** Mietstatus-/Mietdaten-Ansicht
- Mietdetails (Mieter, Warm/Kalt etc.) sind **ausschließlich** MOD-05
- MOD-04 braucht zwei Flags für Routing/Listen:
  - `sale_enabled` (Verkauf)
  - `msv_included` (MSV/Vermietung)

---

## 7) DASHBOARD-INHALTE (MOCKS)

### Zone 1 Dashboard

- **KPI-Row:** Mandanten, Aktive Nutzer, API-Aufrufe, Support-Tickets
- **Cards:** System Health, Recent Activity, Alerts, Revenue

### Zone 2 Dashboard

- **KPI-Row:** Portfolio-Wert, Aktive Objekte, Cashflow, Offene Tasks
- **Cards:** Performance Chart, Regionale Verteilung, Aktivitäten, Aufgaben

---

## 8) CHATBOT / AI ASSISTANT

### Desktop
- Rechts docked Panel (Standard, 380px)
- Titel "AI Assistant"
- Kontextanzeige (z.B. "Zone 2 > Objekte > Objekt XYZ")
- Quick Actions (3–5 Vorschläge)
- Chatverlauf + Inputzeile

### Tablet
- Chat als Drawer

### Mobile
- Chat als Bottom Sheet oder Fullscreen Modal

---

## 9) INTERAKTIONEN (MINDESTENS)

- **Sidebar:** Active State, Hover, Collapse (Icon-only)
- **Subnav:** 4 Unterpunkte pro Hauptpunkt
- **Global Search:** Fokuszustand + Ergebnisliste (Mock)
- **KPI Cards:** Mini-Trend-Indikator (Mock)
- **TableCard:** Sorting UI (Mock), Row Actions (Mock)
- **Chat:** Quick Actions klicken füllt Input/Send (Mock)

---

## 10) OUTPUT-ERWARTUNG

### Screens zu liefern

1. Zone 1 Dashboard
2. Zone 2 Dashboard
3. Zone 2 > Objekte (MOD-04) Übersicht
4. Zone 2 > Mietsonderverwaltung (MOD-05) Einheitenliste

### Technische Lieferung

- Wiederverwendbares Template: AppShell + Komponenten + Tokens
- Keine Feature-Überfrachtung
- Fokus auf CI, Layout, Wiederverwendbarkeit, saubere Navigation

---

## 11) QUALITÄTSKRITERIEN (HART)

- ✅ Einheitliche Abstände, Radien, Typo — keine "freien" Ausnahmen
- ✅ Gute Lesbarkeit im Dark Mode (Kontrast, Sekundärtext)
- ✅ Mobile wirklich bedienbar (Drawer/BottomSheet korrekt)
- ✅ Strict Card-System: Dashboard skalierbar für viele Module
- ✅ MOD-04/MOD-05 Trennung strikt einhalten
