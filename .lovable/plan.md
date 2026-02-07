

# Plan: Uppercase-Transformation für alle Überschriften (Zone 1 & Zone 2)

## Analyse-Ergebnis

### Schriftart-Status: ✅ D-DIN korrekt konfiguriert

| Ort | Status |
|-----|--------|
| `src/index.css` - @font-face | ✅ D-DIN Regular + Bold definiert |
| `src/index.css` - body | ✅ `font-family: 'D-DIN', system-ui...` |
| Tailwind Config | ✅ `font-sans` und `font-display` konfiguriert |

**D-DIN wird systemweit auf alle Texte angewendet.**

---

## Aktuelle Situation: Keine Uppercase-Transformation

Die Analyse zeigt: **Keine Navigation und keine Überschrift verwendet derzeit `uppercase`**.

### Zone 2 Navigation (3 Ebenen)

| Ebene | Komponente | Aktuelle Klassen | Status |
|-------|------------|------------------|--------|
| Level 1 | `AreaTabs.tsx` | `text-sm font-medium` | ❌ Kein uppercase |
| Level 2 | `ModuleTabs.tsx` | `text-sm font-medium` | ❌ Kein uppercase |
| Level 3 | `SubTabs.tsx` | `text-sm` | ❌ Kein uppercase |

### Zone 1 Navigation

| Komponente | Aktuelle Klassen | Status |
|------------|------------------|--------|
| `AdminLayout.tsx` Header | `text-lg font-semibold` | ❌ Kein uppercase |
| `AdminSidebar.tsx` Menu Items | Standard Sidebar-Klassen | ❌ Kein uppercase |
| `SidebarGroupLabel` (UI) | `text-xs font-medium` | ❌ Kein uppercase |

### Zone 2 Seiten-Headlines (h1, h2, h3)

| Datei | Element | Aktuelle Klassen |
|-------|---------|------------------|
| `PortalDashboard.tsx` | `<h1>` | `text-2xl font-bold` |
| `ModuleTilePage.tsx` | 4x `<h1>` | `text-2xl font-bold` |
| `ModuleHowItWorks.tsx` | `<h1>` | `text-2xl md:text-3xl font-bold` |
| `ModuleHowItWorks.tsx` | `<h2>` | `text-lg font-semibold` |
| Diverse Portal-Seiten | `<h2>`, `<h3>` | `text-xl font-semibold` / `text-lg font-semibold` |

### Zone 1 Seiten-Headlines

| Datei | Element | Aktuelle Klassen |
|-------|---------|------------------|
| `Dashboard.tsx` | `<h2>` | `text-2xl font-bold tracking-tight` |
| `TileCatalog.tsx` | `<h1>` | `text-2xl font-bold` |
| `MasterTemplates.tsx` | `<h1>` | `text-3xl font-bold` |
| `AuditLog.tsx` | `<h1>` | `text-2xl font-bold` |
| `CommissionApproval.tsx` | `<h1>` | `text-2xl font-bold` |
| `LeadPool.tsx` | `<h1>` | `text-2xl font-bold` |
| `FinanceDesk.tsx` | `<h1>`, `<h2>` | `text-2xl font-bold` / `text-xl font-semibold` |
| `SalesDesk.tsx` | `<h1>`, `<h2>` | `text-2xl font-bold` / `text-xl font-semibold` |

### UI-Komponenten (global)

| Komponente | Datei | Aktuelle Klassen |
|------------|-------|------------------|
| `CardTitle` | `card.tsx` | `text-2xl font-semibold leading-none tracking-tight` |
| `SidebarGroupLabel` | `sidebar.tsx` | `text-xs font-medium text-sidebar-foreground/70` |

---

## Geplante Änderungen

### 1. Globale Utility-Klasse hinzufügen

**Datei: `src/index.css`**

Eine neue Utility-Klasse für konsistente Headlines:

```css
@layer utilities {
  /* Uppercase Headlines mit leichtem Letter-Spacing */
  .text-headline {
    @apply uppercase tracking-wide;
  }
}
```

---

### 2. Zone 2 Navigation — Drei Ebenen

**Datei: `src/components/portal/AreaTabs.tsx` (Zeile 34)**

```tsx
// Vorher:
'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all',

// Nachher:
'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium uppercase tracking-wide transition-all',
```

**Datei: `src/components/portal/ModuleTabs.tsx` (Zeile 98)**

```tsx
// Vorher:
'flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-all whitespace-nowrap',

// Nachher:
'flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium uppercase tracking-wide transition-all whitespace-nowrap',
```

**Datei: `src/components/portal/SubTabs.tsx` (Zeile 38)**

```tsx
// Vorher:
'px-3 py-1 rounded-md text-sm transition-all whitespace-nowrap',

// Nachher:
'px-3 py-1 rounded-md text-sm uppercase tracking-wide transition-all whitespace-nowrap',
```

---

### 3. Zone 1 Navigation

**Datei: `src/components/admin/AdminLayout.tsx` (Zeile 79)**

```tsx
// Vorher:
<h1 className="text-lg font-semibold">Admin Portal</h1>

// Nachher:
<h1 className="text-lg font-semibold uppercase tracking-wide">Admin Portal</h1>
```

**Datei: `src/components/ui/sidebar.tsx` (Zeile 364)**

```tsx
// Vorher:
"flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70...",

// Nachher:
"flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/70...",
```

---

### 4. Zone 2 Seiten-Headlines

**Datei: `src/pages/portal/PortalDashboard.tsx` (Zeile 12)**

```tsx
// Vorher:
<h1 className="text-2xl font-bold">

// Nachher:
<h1 className="text-2xl font-bold uppercase">
```

**Datei: `src/components/shared/ModuleTilePage.tsx` (Zeilen 78, 93, 119, 189)**

```tsx
// Vorher:
<h1 className="text-2xl font-bold">{title}</h1>

// Nachher:
<h1 className="text-2xl font-bold uppercase">{title}</h1>
```

**Datei: `src/components/portal/HowItWorks/ModuleHowItWorks.tsx`**

```tsx
// Zeile 40 - Vorher:
<h1 className="text-2xl md:text-3xl font-bold">{content.title}</h1>

// Zeile 40 - Nachher:
<h1 className="text-2xl md:text-3xl font-bold uppercase">{content.title}</h1>

// Zeile 80 - Vorher:
<h2 className="text-lg font-semibold">Typische Abläufe</h2>

// Zeile 80 - Nachher:
<h2 className="text-lg font-semibold uppercase">Typische Abläufe</h2>
```

---

### 5. Zone 1 Seiten-Headlines

**Datei: `src/pages/admin/Dashboard.tsx` (Zeile 114)**

```tsx
// Vorher:
<h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

// Nachher:
<h2 className="text-2xl font-bold tracking-tight uppercase">Dashboard</h2>
```

**Datei: `src/pages/admin/TileCatalog.tsx` (Zeile 221)**

```tsx
<h1 className="text-2xl font-bold uppercase">Tile Catalog & Testdaten</h1>
```

**Datei: `src/pages/admin/MasterTemplates.tsx` (Zeile 63)**

```tsx
<h1 className="text-3xl font-bold uppercase">Master-Vorlagen</h1>
```

**Datei: `src/pages/admin/AuditLog.tsx` (Zeile 149)**

```tsx
<h1 className="text-2xl font-bold uppercase">Audit Log</h1>
```

**Datei: `src/pages/admin/CommissionApproval.tsx` (Zeile 142)**

```tsx
<h1 className="text-2xl font-bold uppercase">Provisionen</h1>
```

**Datei: `src/pages/admin/LeadPool.tsx`**

```tsx
<h1 className="text-2xl font-bold uppercase">Lead Pool</h1>
```

**Datei: `src/pages/admin/desks/FinanceDesk.tsx`**

```tsx
// Zeile 15:
<h1 className="text-2xl font-bold uppercase">Finance Desk</h1>

// Zeilen 136, 145, 154, 163 (alle <h2>):
<h2 className="text-xl font-semibold uppercase">...</h2>
```

**Datei: `src/pages/admin/desks/SalesDesk.tsx`**

```tsx
// Zeile 25:
<h1 className="text-2xl font-bold uppercase">Sales Desk</h1>

// Zeilen 172, 185, 283, 296, 309 (alle <h2>):
<h2 className="text-xl font-semibold uppercase">...</h2>
```

---

### 6. UI-Komponente CardTitle (global)

**Datei: `src/components/ui/card.tsx` (Zeile 19)**

```tsx
// Vorher:
className={cn("text-2xl font-semibold leading-none tracking-tight", className)}

// Nachher:
className={cn("text-2xl font-semibold leading-none tracking-tight uppercase", className)}
```

> **Hinweis:** Dies betrifft alle CardTitle-Instanzen systemweit. Da CardTitle primär für Überschriften verwendet wird, ist dies gewünscht.

---

## Übersicht aller Dateiänderungen

| Nr. | Datei | Zone | Änderungstyp |
|-----|-------|------|--------------|
| 1 | `src/index.css` | Global | + `.text-headline` Utility |
| 2 | `src/components/portal/AreaTabs.tsx` | Zone 2 | + `uppercase tracking-wide` |
| 3 | `src/components/portal/ModuleTabs.tsx` | Zone 2 | + `uppercase tracking-wide` |
| 4 | `src/components/portal/SubTabs.tsx` | Zone 2 | + `uppercase tracking-wide` |
| 5 | `src/components/admin/AdminLayout.tsx` | Zone 1 | + `uppercase tracking-wide` |
| 6 | `src/components/ui/sidebar.tsx` | Zone 1 | + `uppercase tracking-wide` |
| 7 | `src/pages/portal/PortalDashboard.tsx` | Zone 2 | h1 + `uppercase` |
| 8 | `src/components/shared/ModuleTilePage.tsx` | Zone 2 | 4x h1 + `uppercase` |
| 9 | `src/components/portal/HowItWorks/ModuleHowItWorks.tsx` | Zone 2 | h1, h2 + `uppercase` |
| 10 | `src/pages/admin/Dashboard.tsx` | Zone 1 | h2 + `uppercase` |
| 11 | `src/pages/admin/TileCatalog.tsx` | Zone 1 | h1 + `uppercase` |
| 12 | `src/pages/admin/MasterTemplates.tsx` | Zone 1 | h1 + `uppercase` |
| 13 | `src/pages/admin/AuditLog.tsx` | Zone 1 | h1 + `uppercase` |
| 14 | `src/pages/admin/CommissionApproval.tsx` | Zone 1 | h1 + `uppercase` |
| 15 | `src/pages/admin/LeadPool.tsx` | Zone 1 | h1 + `uppercase` |
| 16 | `src/pages/admin/desks/FinanceDesk.tsx` | Zone 1 | h1, 4x h2 + `uppercase` |
| 17 | `src/pages/admin/desks/SalesDesk.tsx` | Zone 1 | h1, 5x h2 + `uppercase` |
| 18 | `src/components/ui/card.tsx` | Global | CardTitle + `uppercase` |

---

## Visuelles Ergebnis

### Zone 2 Navigation (vorher / nachher)

```text
Vorher:
┌──────────────────────────────────────────────────┐
│  Base   Missions   Operations   Services         │ ← Level 1
├──────────────────────────────────────────────────┤
│  Stammdaten  KI Office  Dokumente  Services      │ ← Level 2
├──────────────────────────────────────────────────┤
│  Übersicht  Kontakte  Dokumente  Finanzen        │ ← Level 3
└──────────────────────────────────────────────────┘

Nachher:
┌──────────────────────────────────────────────────┐
│  BASE   MISSIONS   OPERATIONS   SERVICES         │ ← Level 1
├──────────────────────────────────────────────────┤
│  STAMMDATEN  KI OFFICE  DOKUMENTE  SERVICES      │ ← Level 2
├──────────────────────────────────────────────────┤
│  ÜBERSICHT  KONTAKTE  DOKUMENTE  FINANZEN        │ ← Level 3
└──────────────────────────────────────────────────┘
```

### Zone 1 Sidebar (vorher / nachher)

```text
Vorher:                        Nachher:
┌───────────────────┐          ┌───────────────────┐
│ Tenants & Access  │          │ TENANTS & ACCESS  │
│   Dashboard       │          │   Dashboard       │
│   Organizations   │          │   Organizations   │
├───────────────────┤          ├───────────────────┤
│ Master Data       │          │ MASTER DATA       │
│   Master Contacts │          │   Master Contacts │
└───────────────────┘          └───────────────────┘
```

### Seiten-Headlines (vorher / nachher)

```text
Vorher:                        Nachher:
┌───────────────────────┐      ┌───────────────────────┐
│ Dashboard             │      │ DASHBOARD             │
│ Welcome to the...     │      │ Welcome to the...     │
└───────────────────────┘      └───────────────────────┘

┌───────────────────────┐      ┌───────────────────────┐
│ Willkommen, Max       │      │ WILLKOMMEN, MAX       │
│ Muster-Kunde GmbH     │      │ Muster-Kunde GmbH     │
└───────────────────────┘      └───────────────────────┘
```

---

## Wichtige Hinweise

1. **Nur Styling-Änderungen** — Keine Logik oder Funktionalität wird verändert
2. **CSS `text-transform: uppercase`** — Die eigentlichen Daten bleiben unverändert (z.B. Profilnamen aus der Datenbank)
3. **Zone 3 bleibt unberührt** — Wie gewünscht werden keine Website-Komponenten geändert
4. **`tracking-wide`** — Erhöht den Buchstabenabstand für bessere Lesbarkeit bei Großbuchstaben

