

## Fix: Mouse-Over von Zeile 2 auf Zeile 1 verschieben

### Problem

```text
┌─────────────────────────────────────────────────────┐
│  Base | Missions | Operations | Services            │  <-- Zeile 1: AreaTabs (KEIN hover)
├─────────────────────────────────────────────────────┤
│  Dashboard | Pension | Services | Mitarbeiter | ... │  <-- Zeile 2: SubTabs (hover HIER -- FALSCH)
└─────────────────────────────────────────────────────┘
         ↓ onMouseEnter oeffnet:
┌─────────────────────────────────────────────────────┐
│  Stammdaten | Kunden | Mitarbeiter | Services | ... │  <-- Floating Module Switcher
└─────────────────────────────────────────────────────┘
```

Der `onMouseEnter`/`onMouseLeave` Handler sitzt auf dem `<div>` um die SubTabs (Zeile 108-117). Er sollte auf dem `<div>` um die AreaTabs sitzen (Zeile 103-105).

### Loesung

```text
┌─────────────────────────────────────────────────────┐
│  Base | Missions | Operations | Services            │  <-- Zeile 1: AreaTabs (hover HIER -- RICHTIG)
├─────────────────────────────────────────────────────┤
│  Dashboard | Pension | Services | Mitarbeiter | ... │  <-- Zeile 2: SubTabs (kein hover)
└─────────────────────────────────────────────────────┘
         ↓ onMouseEnter oeffnet:
┌─────────────────────────────────────────────────────┐
│  Stammdaten | Kunden | Mitarbeiter | Services | ... │  <-- Floating Module Switcher
└─────────────────────────────────────────────────────┘
```

### Technische Aenderung

**Datei:** `src/components/portal/TopNavigation.tsx`

1. Den `ref={triggerRef}`, `onMouseEnter={showSwitcher}`, `onMouseLeave={hideSwitcher}` vom SubTabs-Wrapper (Zeile 109-113) **entfernen**
2. Diese Attribute auf den AreaTabs-Wrapper (Zeile 103-105) **verschieben**

Vorher (Zeilen 102-117):
```typescript
{/* Level 1: Area Tabs */}
<div className="border-b">
  <AreaTabs />
</div>

{/* Level 2: Sub Tabs */}
{activeModule && ... && (
  <div
    ref={triggerRef}
    className="relative"
    onMouseEnter={showSwitcher}
    onMouseLeave={hideSwitcher}
  >
    <SubTabs ... />
  </div>
)}
```

Nachher:
```typescript
{/* Level 1: Area Tabs — Hover oeffnet Module Switcher */}
<div
  ref={triggerRef}
  className="border-b"
  onMouseEnter={showSwitcher}
  onMouseLeave={hideSwitcher}
>
  <AreaTabs />
</div>

{/* Level 2: Sub Tabs — kein Hover hier */}
{activeModule && ... && (
  <div className="relative">
    <SubTabs ... />
  </div>
)}
```

Eine Datei, 4 Zeilen verschoben. Keine weiteren Aenderungen noetig.

