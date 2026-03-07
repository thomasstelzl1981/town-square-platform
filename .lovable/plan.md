

# Plan: Mobile Dark Mode CI Overhaul — Graphite Neutral Compliance

## Status Quo

The mobile app is functional but has several CI inconsistencies after recent desktop-focused development:

| Issue | Current State | CI Target |
|-------|--------------|-----------|
| SystemBar mobile | `bg-card/70 backdrop-blur-lg` — doesn't use chrome variables | Should match desktop's `--chrome-bg` pattern or stay glass-dark consistently |
| MobileBottomBar | `bg-background/80 backdrop-blur-2xl` — generic background | Should use glass-card pattern with proper dark card color |
| MobileHomeModuleList rows | `hover:bg-accent/50` — no glass cards | Should use `bg-card/60 backdrop-blur-sm border border-border/30` like MobileModuleMenu |
| MobileModuleMenu title | `text-lg` — small for mobile | Should be `text-xl` for better mobile hierarchy |
| MobileHomeChatView | Loading spinner uses hardcoded gradient `from-[hsl(var(--primary)/0.2)]` | Fine, but empty state text too small |
| PageShell on mobile | `px-2 py-3` — tight padding, white bg in light mode bleeds on mobile | Dark mode: `bg-transparent` is correct but border shows `chrome-border` which clashes |
| MobileBottomBar input | `bg-muted/40 border-border/20` — low contrast in dark mode | Needs slightly more surface separation |
| Module page headers | `text-2xl` on mobile — adequate but action buttons hidden via DesktopOnly | Fine, no change needed |
| Glass button in SystemBar | Uses `bg-white/15 dark:bg-white/10` — correct dark CI | OK |

## Freeze Check

All files to edit are in `src/components/portal/` and `src/components/shared/` — NOT in any frozen module paths or infrastructure paths. These are layout/shell components, freely editable.

## Changes

### 1. SystemBar.tsx — Mobile header CI alignment

Line 145: Change mobile header from `bg-card/70 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60` to match the dark atmosphere better:
- Use `bg-background/80 backdrop-blur-xl` for consistent glass-over-atmosphere effect
- Add `border-border/20` (lighter border, currently using default which is too visible)

### 2. MobileBottomBar.tsx — Elevated glass input bar

Line 112: Strengthen the bottom bar's visual weight:
- Change `bg-background/80 backdrop-blur-2xl border-t border-border/10` to `bg-card/70 backdrop-blur-xl border-t border-border/20`
- Line 120: Input container `bg-muted/40 border border-border/20` → `bg-muted/30 border border-border/30` for slightly more defined edges in dark mode

### 3. MobileHomeModuleList.tsx — Glass card rows (consistency with MobileModuleMenu)

Line 58: The module list rows currently have no card styling, while MobileModuleMenu uses `bg-card/60 backdrop-blur-sm border border-border/30`. Unify:
- Change `hover:bg-accent/50 active:scale-[0.98] active:bg-accent` to `bg-card/40 backdrop-blur-sm border border-border/20 hover:bg-card/60 active:scale-[0.98]`
- This gives the home screen rows the same glass-card aesthetic as the tile menu

### 4. MobileModuleMenu.tsx — Title sizing + card polish

Line 33: `text-lg` → `text-xl` for module title (matches desktop hierarchy)
Line 47-48: Card buttons are already well-styled. Minor tweak: add `shadow-sm` for subtle depth separation in dark mode.

### 5. MobileHomeChatView.tsx — Empty state and loading refinement

Line 60: Empty state `text-sm` → `text-base` for better readability
Line 83: Loading bubble `text-sm` → `text-base` to match the recent MessageRenderer upgrade

### 6. PageShell.tsx — Mobile dark mode border cleanup

Line 21: The `border-[hsl(var(--chrome-border)/0.5)] dark:border-0` is correct for dark mode. But on mobile the white `bg-white` in light mode creates a jarring card. Add mobile-specific override:
- Change to `bg-white md:bg-white dark:bg-transparent` (keep existing) and add `border-0 md:border` to remove the border on mobile entirely (content fills screen edge-to-edge)

### 7. index.css — Mobile-specific dark mode refinements

Add a mobile dark mode section after line 399 (touch targets):
- Reduce `min-height: 44px` on items inside `.glass-card` to avoid oversized tap targets on card content
- No color variable changes needed — the existing dark palette (`220 10% 7%` background, `222 18% 12% / 0.92` card) is correct Graphite Neutral CI

| File | Action |
|------|--------|
| `src/components/portal/SystemBar.tsx` | Mobile header glass alignment |
| `src/components/portal/MobileBottomBar.tsx` | Input bar glass + border contrast |
| `src/components/portal/MobileHomeModuleList.tsx` | Glass card rows to match MobileModuleMenu |
| `src/components/portal/MobileModuleMenu.tsx` | Title size + card shadow |
| `src/components/portal/MobileHomeChatView.tsx` | Empty state + loading text size |
| `src/components/shared/PageShell.tsx` | Mobile border removal for edge-to-edge |
| `src/index.css` | Mobile tap target refinement inside cards |

