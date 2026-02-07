
# UI Restructure Plan — Zone 2 Structure & Navigation Refactor

Du bist High End UI Designer und musst das System of a Town Nutzungserlebnis maximal steigern und optimieren. Das ist der Plan! Optimiere ihn bei Bedarf 

## Executive Summary

This plan transforms the Zone 2 (`/portal/*`) navigation from a left-sidebar model to a **3-level top navigation** with module grouping, while introducing a new **Armstrong (JetBot) container** with collapsed/expanded states. Mobile transitions to a **card-first** navigation pattern.

**Key Constraints Honored:**
- ✅ NO route changes (paths remain identical)
- ✅ NO visual design changes (colors, fonts, shadows unchanged)
- ✅ NO Zone 1 modifications
- ✅ NO business logic changes
- ✅ `routesManifest.ts` remains SSOT

---

## Part 1: Module Grouping Definition

### Area Mapping (Presentation Layer Only)

The manifest modules are grouped into 4 areas for navigation purposes. This is **UI-only** — no route or module identity changes.

```text
AREA A: "Base" (5 modules)
├── MOD-01 Stammdaten         → "Stammdaten"
├── MOD-02 KI Office          → "KI Office"
├── MOD-03 DMS                → "Dokumente" (label change)
├── MOD-16 Services           → "Services"
└── MOD-20 Miety              → "Miety" (6-tile exception)

AREA B: "Missions" (5 modules)
├── MOD-04 Immobilien         → "Immobilien"
├── MOD-05 MSV                → "Mietverwaltung" (label change)
├── MOD-06 Verkauf            → "Verkauf"
├── MOD-07 Finanzierung       → "Finanzierung"
└── MOD-08 Investment-Suche   → "Investment-Suche"

AREA C: "Operations" (5 modules)
├── MOD-12 Akquise-Manager    → "Akquise-Manager"
├── MOD-11 Finanzierungsmanager → "Finanzierungsmanager"
├── MOD-13 Projekte           → "Projekte"
├── MOD-09 Vertriebspartner   → "Vertriebspartner"
└── MOD-10 Leads              → "Leads"

AREA D: "Services" (5 modules)
├── MOD-14 Communication Pro  → "Kommunikation Pro" (label change)
├── MOD-15 Fortbildung        → "Fortbildung"
├── MOD-17 Car-Management     → "Fahrzeuge" (label change)
├── MOD-18 Finanzanalyse      → "Finanzanalyse"
└── MOD-19 Photovoltaik       → "Photovoltaik"
```

### Implementation: Area Configuration

New file: `src/manifests/areaConfig.ts`

```typescript
export type AreaKey = 'base' | 'missions' | 'operations' | 'servicemodule';

export interface AreaDefinition {
  key: AreaKey;
  label: string;
  modules: string[]; // Module codes: MOD-01, MOD-02, etc.
}

export const areaConfig: AreaDefinition[] = [
  {
    key: 'base',
    label: 'Base',
    modules: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-16', 'MOD-20'],
  },
  {
    key: 'missions',
    label: 'Missions',
    modules: ['MOD-04', 'MOD-05', 'MOD-06', 'MOD-07', 'MOD-08'],
  },
  {
    key: 'operations',
    label: 'Operations',
    modules: ['MOD-12', 'MOD-11', 'MOD-13', 'MOD-09', 'MOD-10'],
  },
  {
    key: 'services',
    label: 'Services',
    modules: ['MOD-14', 'MOD-15', 'MOD-17', 'MOD-18', 'MOD-19'],
  },
];

// UI-only label overrides (routes unchanged)
export const moduleLabelOverrides: Record<string, string> = {
  'MOD-03': 'Dokumente',           // DMS → Dokumente
  'MOD-05': 'Mietverwaltung',      // MSV → Mietverwaltung
  'MOD-14': 'Kommunikation Pro',   // Communication Pro → Kommunikation Pro
  'MOD-17': 'Fahrzeuge',           // Car-Management → Fahrzeuge
};
```

---

## Part 2: Desktop Layout Structure

### 2.1 New Component Architecture

```text
PortalLayout.tsx (refactored)
├── SystemBar.tsx (NEW) — Fixed top system bar
│   ├── Home button (→ /portal)
│   ├── Logo placeholder
│   ├── Local time indicator
│   ├── Armstrong toggle
│   └── User avatar (dropdown)
│
├── TopNavigation.tsx (NEW) — 3-level navigation
│   ├── Level 1: AreaTabs — Base | Missions | Operations | ServiceModule
│   ├── Level 2: ModuleTabs — 5 modules per area
│   └── Level 3: SubTabs — 4-6 tiles per module
│
├── main (content area)
│   └── <Outlet /> — Module pages
│
└── ArmstrongContainer.tsx (NEW)
    ├── Collapsed: Bottom-right overlay
    └── Expanded: Right-side stripe
```

### 2.2 SystemBar Component

New file: `src/components/portal/SystemBar.tsx`

**Structure:**
- Fixed height: 48px (`h-12`)
- Left section:
  - Home button (icon + optional "Portal" text)
  - Logo placeholder (neutral, no branding yet)
- Center section:
  - Local time display (HH:MM format)
- Right section:
  - Armstrong toggle button
  - User avatar with dropdown (existing menu logic)

**Key Changes from Current Header:**
- Remove duplicate organization name display
- Remove full username display
- Add visible clock
- Add Home button (currently only in logo)

### 2.3 TopNavigation Component

New file: `src/components/portal/TopNavigation.tsx`

**Level 1 — AreaTabs:**
- Horizontal tab row: `Base | Missions | Operations | ServiceModule`
- Switching areas does NOT navigate — only changes visible module tabs
- Area state stored in `usePortalLayout` context
- Visual: Pill-style tabs with active indicator

**Level 2 — ModuleTabs:**
- Shows 5 modules from active area
- Click navigates to module base route (`/portal/{base}`)
- Respects existing gating/activation logic from `PortalNav`
- Icons + labels

**Level 3 — SubTabs:**
- Appears when a module is active
- Shows 4-6 tiles from active module
- Click navigates to tile route
- Standard 4-tile pattern, Miety exception (6 tiles)

### 2.4 Layout State Updates

Update: `src/hooks/usePortalLayout.tsx`

Add:
```typescript
interface PortalLayoutState {
  // ... existing ...
  activeArea: AreaKey;
  setActiveArea: (area: AreaKey) => void;
}
```

Logic:
- Derive initial area from current route on mount
- Area selection persisted in state (not localStorage — ephemeral)

### 2.5 Remove Left Sidebar

**Changes to PortalLayout.tsx:**
- Remove `<PortalNav variant="sidebar" />` render
- Remove sidebar width calculations
- Remove sidebar toggle from header
- Main content uses full width

---

## Part 3: Armstrong (JetBot) Container

### 3.1 Base Requirement (Mandatory)

New file: `src/components/portal/ArmstrongContainer.tsx`

**Collapsed State:**
- Position: Fixed bottom-right (`bottom-6 right-6`)
- Size: Compact card (~200px width, ~120px height)
- Contents:
  - Small message preview area
  - Minimal input line
  - Expand button
- Drop target for drag-and-drop files

**Expanded State:**
- Position: Fixed right-side stripe
- Size: 320px width, full height (below SystemBar)
- Contents:
  - Header: "Armstrong" title + minimize button
  - Chat area (ScrollArea)
  - Input area with file upload chip placeholder
- No layout reflow (main content doesn't resize)

**State Management:**
```typescript
// usePortalLayout
armstrongExpanded: boolean;
toggleArmstrongExpanded: () => void;
```

### 3.2 Drag & Drop Behavior

**Both states act as drop targets:**
- Visual feedback on dragover (border highlight)
- On drop: Show file chip/placeholder in chat input
- NO file processing, NO storage, NO AI actions
- Just visual attachment indicator

### 3.3 Optional: Draggable Planet Mode (Evaluation)

**Technical Feasibility Analysis:**

| Aspect | Assessment |
|--------|------------|
| Implementation | Feasible using `react-draggable` or custom drag handlers |
| UX Risk | Medium — drag vs click disambiguation can be tricky |
| Accessibility | Concern — keyboard nav unclear for floating element |
| Mobile | Not applicable (mobile has dedicated FAB) |
| Recommendation | Implement as opt-in setting, not default |

**Proposed Approach:**
- Add `armstrongDraggable` boolean to layout state
- If enabled, render collapsed state as circular orb
- Use `pointerdown` duration to distinguish drag vs click:
  - Click: < 150ms without move → open
  - Drag: > 150ms or move > 5px → reposition
- Store position in localStorage
- Default: OFF (base rectangle behavior)

---

## Part 4: Mobile Structure (Card-First)

### 4.1 Layout Architecture

```text
MobilePortalLayout.tsx (NEW or refactored)
├── Content Area
│   └── Card-based navigation views
│
├── ArmstrongPod (Bottom Layer A)
│   └── Persistent entry point
│
└── BottomNav (Bottom Layer B)
    └── Home | Base | Missions | Operations | ServiceModule
```

### 4.2 BottomNav Component

New file: `src/components/portal/MobileBottomNav.tsx`

**Structure:**
- Fixed bottom position with safe-area-inset
- 5 buttons in row:
  - Home (icon: Home)
  - Base (icon: Layers)
  - Missions (icon: Target)
  - Operations (icon: Settings)
  - ServiceModule (icon: Grid)
- Tap sets active area context
- Does NOT navigate directly

### 4.3 Card Navigation Flow

**Area View (Default):**
- Active area shows 5 module cards
- Each card: Icon + Module name + brief description
- Tap → Slide transition to Module View

**Module View:**
- Header with back button + module name
- 4-6 tile cards (sub-routes)
- Tap card → Navigate to tile route

**Implementation:**
- Use `framer-motion` or CSS transitions for slide effects
- State machine: `area` → `module` → (actual route)

### 4.4 ArmstrongPod

New file: `src/components/portal/ArmstrongPod.tsx`

**Structure:**
- Position: Above BottomNav, left side
- Compact pill: Icon + "Armstrong"
- Tap → Opens `ArmstrongSheet` (existing component)

### 4.5 Remove Current Mobile Patterns

- Remove `MobileDrawer` hamburger menu
- Remove FAB for Armstrong (replaced by Pod)
- Keep `ArmstrongSheet` (bottom sheet behavior)

---

## Part 5: File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/manifests/areaConfig.ts` | Area grouping + label overrides |
| `src/components/portal/SystemBar.tsx` | System-level top bar |
| `src/components/portal/TopNavigation.tsx` | 3-level nav (desktop) |
| `src/components/portal/AreaTabs.tsx` | Level 1 tabs |
| `src/components/portal/ModuleTabs.tsx` | Level 2 tabs |
| `src/components/portal/SubTabs.tsx` | Level 3 tabs |
| `src/components/portal/ArmstrongContainer.tsx` | Desktop chat container |
| `src/components/portal/MobileBottomNav.tsx` | Mobile bottom nav |
| `src/components/portal/MobileCardView.tsx` | Card navigation |
| `src/components/portal/ArmstrongPod.tsx` | Mobile chat entry |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/portal/PortalLayout.tsx` | Major refactor: remove sidebar, add SystemBar + TopNav |
| `src/components/portal/PortalHeader.tsx` | Deprecated (replaced by SystemBar) |
| `src/components/portal/PortalNav.tsx` | Deprecated (replaced by TopNavigation) |
| `src/hooks/usePortalLayout.tsx` | Add: activeArea, armstrongExpanded states |
| `src/components/portal/MobileDrawer.tsx` | Deprecated (replaced by card nav) |

### Deprecated (Keep for Rollback)

- `PortalHeader.tsx` → Can be removed after verification
- `PortalNav.tsx` → Can be removed after verification
- `MobileDrawer.tsx` → Can be removed after verification

---

## Part 6: Implementation Phases

### Phase 1: Foundation (Est. 2-3 hours)
1. Create `areaConfig.ts` with groupings
2. Update `usePortalLayout.tsx` with new state
3. Create `SystemBar.tsx` (basic structure)

### Phase 2: Desktop Navigation (Est. 4-5 hours)
1. Create `TopNavigation.tsx` with 3 levels
2. Refactor `PortalLayout.tsx` to use new components
3. Remove sidebar rendering
4. Verify all routes still work

### Phase 3: Armstrong Container (Est. 3-4 hours)
1. Create `ArmstrongContainer.tsx`
2. Implement collapsed/expanded states
3. Add drag-drop visual feedback
4. Optional: Implement draggable orb mode

### Phase 4: Mobile Refactor (Est. 4-5 hours)
1. Create `MobileBottomNav.tsx`
2. Create `MobileCardView.tsx`
3. Create `ArmstrongPod.tsx`
4. Update `PortalLayout.tsx` for mobile
5. Remove MobileDrawer usage

### Phase 5: Polish & Verification (Est. 2 hours)
1. Test all 20 modules navigate correctly
2. Test deep links work
3. Verify gating/activation logic preserved
4. Test mobile card transitions
5. Cleanup deprecated files

---

## Part 7: Acceptance Criteria

### Must Pass

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | All 20 module routes accessible | Navigate to each `/portal/{base}` |
| 2 | All tile routes accessible | Navigate to each `/portal/{base}/{tile}` |
| 3 | Deep links work | Direct URL to any route loads correctly |
| 4 | No 404s on valid routes | Click through all nav elements |
| 5 | Area switching shows correct modules | Click each area tab |
| 6 | Armstrong collapsed/expanded works | Toggle and verify states |
| 7 | Mobile card navigation works | Tap through area → module → tile |
| 8 | Zone 1 unchanged | Verify `/admin/*` routes unaffected |
| 9 | Gating/activation preserved | Test with different org types |
| 10 | No styling changes | Visual comparison before/after |

### Smoke Test Script

```text
1. Desktop:
   a. Load /portal → Verify SystemBar + TopNav visible
   b. Click "Missions" area → Verify 5 modules shown
   c. Click "Immobilien" → Verify navigates to /portal/immobilien
   d. Verify SubTabs show 4 tiles
   e. Click "Portfolio" → Verify navigates to /portal/immobilien/portfolio
   f. Toggle Armstrong → Verify expand/collapse
   g. Drag file to Armstrong → Verify chip appears

2. Mobile (< 768px):
   a. Load /portal → Verify BottomNav + Pod visible
   b. Tap "Missions" → Verify 5 module cards shown
   c. Tap "Immobilien" card → Verify 4 tile cards shown
   d. Tap "Portfolio" card → Verify navigates
   e. Tap Armstrong Pod → Verify sheet opens
```

---

## Part 8: Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Route breakage | Low | High | Keep manifest unchanged, test all routes |
| Mobile UX regression | Medium | Medium | User testing, fallback to drawer |
| Armstrong state bugs | Low | Low | Thorough state management testing |
| Performance impact | Low | Low | Lazy load area content |
| Accessibility gaps | Medium | Medium | Ensure keyboard nav for all levels |

---

## Technical Notes

### Route Preservation Strategy

The entire navigation refactor is a **presentation layer change**. Routes are derived from `routesManifest.ts` exactly as before:

```typescript
// TopNavigation derives routes from manifest
const modules = getModulesSorted();
const areaModules = areaConfig.find(a => a.key === activeArea)?.modules || [];
const filtered = modules.filter(m => areaModules.includes(m.code));
```

No route strings are hardcoded in navigation components.

### State Flow

```text
URL Change
    ↓
useLocation()
    ↓
Derive activeArea from pathname
    ↓
TopNavigation renders correct tabs
    ↓
User clicks → navigate() → URL Change (loop)
```

### CSS Variables Preserved

All navigation components use existing tokens:
- `bg-background`, `bg-sidebar`, `bg-card`
- `text-foreground`, `text-muted-foreground`
- `border-border`
- No new colors introduced
