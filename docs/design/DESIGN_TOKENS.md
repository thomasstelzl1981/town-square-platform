# Design Tokens — System of a Town

**Version:** 1.0.0  
**Status:** ACTIVE  
**Datum:** 2026-01-25  
**Referenz:** `src/index.css`, `tailwind.config.ts`

---

## Übersicht

Dieses Dokument definiert alle Design-Tokens für das CI/UI Design System. 
Alle Tokens sind in `src/index.css` implementiert und über `tailwind.config.ts` als Tailwind-Klassen verfügbar.

---

## Farbsystem

### Core Backgrounds

| Token | HSL-Wert (Dark) | Verwendung |
|-------|-----------------|------------|
| `--background` | 222 47% 6% | App-Hintergrund |
| `--card` | 222 30% 10% | Card-Oberfläche |
| `--popover` | 222 35% 9% | Popovers, Dropdowns |
| `--surface` | 222 30% 10% | Generische Oberfläche |
| `--surface-2` | 222 35% 8% | Sidebar, sekundäre Flächen |

### Primary & Accent

| Token | HSL-Wert (Dark) | Verwendung |
|-------|-----------------|------------|
| `--primary` | 217 91% 60% | Primäre Aktionen, Links |
| `--primary-foreground` | 222 47% 6% | Text auf Primary |
| `--accent-primary` | 217 91% 60% | CI-Akzentfarbe |
| `--accent-primary-hover` | 217 91% 70% | Hover-State |

### Secondary & Muted

| Token | HSL-Wert (Dark) | Verwendung |
|-------|-----------------|------------|
| `--secondary` | 222 30% 14% | Sekundäre Buttons |
| `--muted` | 222 25% 16% | Gedämpfte Hintergründe |
| `--muted-foreground` | 215 20% 65% | Sekundärer Text |

### Status Colors

| Token | HSL-Wert | Tailwind-Klasse |
|-------|----------|-----------------|
| `--status-success` | 142 71% 45% | `text-status-success`, `bg-status-success` |
| `--status-warn` | 38 92% 50% | `text-status-warn`, `bg-status-warn` |
| `--status-error` | 0 84% 60% | `text-status-error`, `bg-status-error` |
| `--status-info` | 199 89% 48% | `text-status-info`, `bg-status-info` |

### Text Hierarchy

| Token | HSL-Wert (Dark) | Utility-Klasse |
|-------|-----------------|----------------|
| `--text-primary` | 210 40% 98% | `text-hierarchy-primary` |
| `--text-secondary` | 215 20% 65% | `text-hierarchy-secondary` |
| `--text-dimmed` | 215 15% 45% | `text-hierarchy-dimmed` |

### Borders

| Token | HSL-Wert (Dark) | Verwendung |
|-------|-----------------|------------|
| `--border` | 222 20% 18% | Standard-Border |
| `--border-subtle` | 222 20% 18% | Low-contrast |
| `--border-glow` | 217 50% 35% | Hover-Glow |

---

## Spacing System

Basiert auf 8px-Grid:

| Token | Wert | Tailwind |
|-------|------|----------|
| `--spacing-xs` | 4px (0.25rem) | `p-spacing-xs`, `m-spacing-xs` |
| `--spacing-sm` | 8px (0.5rem) | `p-spacing-sm`, `m-spacing-sm` |
| `--spacing-md` | 16px (1rem) | `p-spacing-md`, `m-spacing-md` |
| `--spacing-lg` | 24px (1.5rem) | `p-spacing-lg`, `m-spacing-lg` |
| `--spacing-xl` | 32px (2rem) | `p-spacing-xl`, `m-spacing-xl` |
| `--spacing-2xl` | 48px (3rem) | `p-spacing-2xl`, `m-spacing-2xl` |

---

## Radius System

| Token | Wert | Tailwind |
|-------|------|----------|
| `--radius-sm` | 8px (0.5rem) | `rounded-sm` |
| `--radius` | 12px (0.75rem) | `rounded-md` |
| `--radius-lg` | 16px (1rem) | `rounded-lg` |

---

## Shadow System

Subtile Schatten für Layer-Trennung:

| Token | Wert | Tailwind |
|-------|------|----------|
| `--shadow-sm` | Leichter Schatten | `shadow-sm` |
| `--shadow-card` | Card-Schatten | `shadow-card` |
| `--shadow-elevated` | Erhöhte Elemente | `shadow-elevated` |
| `--shadow-glow` | Akzent-Glow | `shadow-glow` |

---

## Layout Variables

| Token | Wert | Verwendung |
|-------|------|------------|
| `--sidebar-width` | 260px | Volle Sidebar-Breite |
| `--sidebar-collapsed-width` | 56px | Collapsed Sidebar |
| `--chat-panel-width` | 380px | AI Assistant Panel |
| `--header-height` | 56px | Main Header Höhe |

**Tailwind-Klassen:**
- `w-sidebar`, `w-sidebar-collapsed`
- `w-chat-panel`
- `h-header`

---

## Typografie

### KPI-Werte

```css
.text-kpi {
  font-size: 1.75rem;
  line-height: 2rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.text-kpi-lg {
  font-size: 2rem;
  line-height: 2.25rem;
  font-weight: 700;
}
```

**Tailwind:** `text-kpi`, `text-kpi-lg`, `tabular-nums`

### Hierarchie

| Ebene | Größe | Gewicht |
|-------|-------|---------|
| Page Title | 20-24px | Semibold |
| Card Title | 14-16px | Semibold |
| Body | 13-14px | Regular |
| Caption | 12px | Regular |

---

## Animationen

| Animation | Dauer | Tailwind |
|-----------|-------|----------|
| `accordion-down` | 0.2s | `animate-accordion-down` |
| `accordion-up` | 0.2s | `animate-accordion-up` |
| `fade-in` | 0.2s | `animate-fade-in` |
| `slide-in-right` | 0.3s | `animate-slide-in-right` |
| `slide-in-bottom` | 0.3s | `animate-slide-in-bottom` |

---

## Sidebar Colors

Spezielle Tokens für Sidebar-Komponenten:

| Token | HSL-Wert (Dark) |
|-------|-----------------|
| `--sidebar-background` | 222 47% 5% |
| `--sidebar-foreground` | 210 30% 85% |
| `--sidebar-primary` | 217 91% 60% |
| `--sidebar-accent` | 222 30% 12% |
| `--sidebar-border` | 222 20% 15% |

---

## Verwendungsbeispiele

### Card mit korrekten Tokens

```tsx
<div className="bg-card rounded-lg border shadow-card p-spacing-md">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-hierarchy-secondary">Description text</p>
</div>
```

### KPI-Anzeige

```tsx
<div className="bg-surface rounded-lg p-spacing-md">
  <span className="text-hierarchy-dimmed text-sm">Total Revenue</span>
  <p className="text-kpi-lg tabular-nums">€1,234,567</p>
  <span className="text-status-success text-sm">+12.5%</span>
</div>
```

### Status Badge

```tsx
<span className="bg-status-success/20 text-status-success px-2 py-1 rounded-sm text-sm">
  Active
</span>
```

---

## Migration Notes

Wenn du Legacy-Code mit hartcodierten Farben findest:

| Legacy | Ersatz |
|--------|--------|
| `bg-gray-900` | `bg-background` |
| `text-gray-400` | `text-muted-foreground` |
| `text-white` | `text-foreground` |
| `border-gray-700` | `border` |
| `bg-blue-600` | `bg-primary` |
