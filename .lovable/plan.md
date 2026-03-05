

# Fix: Post-Login Landing on Widget Screen

## Problem
After login, the user lands on `/portal` but the `snap-y snap-mandatory` CSS causes the browser to snap to Section 2 (Armstrong Workspace) instead of staying on Section 1 (Widgets). This happens because widgets load asynchronously, changing the layout height after initial render, which triggers the snap algorithm to jump.

## Desired Behavior
- **After login** → Section 1 (Widgets) is visible
- **Clicking Home while already in portal** → current behavior (Workspace visible) is fine

## Solution

### 1. Force scroll-to-top on fresh mount in `PortalDashboard.tsx`
Add a `useEffect` that scrolls the container to top on initial mount. This ensures that when the dashboard first renders after login, it always starts at Section 1.

```typescript
// Reset scroll to top on fresh mount (ensures widgets section visible after login)
useEffect(() => {
  const el = scrollRef.current;
  if (el) {
    el.scrollTo({ top: 0, behavior: 'instant' });
  }
}, []);
```

### 2. Delay snap activation
Change the snap behavior to only activate after initial content has settled. Use a short delay before adding `snap-y snap-mandatory`:

```typescript
const [snapReady, setSnapReady] = useState(false);

useEffect(() => {
  // Delay snap activation so async widget loading doesn't jump to section 2
  const timer = setTimeout(() => setSnapReady(true), 800);
  return () => clearTimeout(timer);
}, []);
```

Then conditionally apply the snap classes:
```tsx
className={`h-[calc(100dvh-4rem)] overflow-y-auto ${snapReady ? 'snap-y snap-mandatory' : ''}`}
```

This way, on fresh login the page renders at the top without snap, then after 800ms snap behavior activates for normal scrolling between sections.

### Files Changed
- `src/pages/portal/PortalDashboard.tsx` — Add scroll-to-top on mount + delayed snap activation

### No Database Changes
No freeze violations (MOD-00 is not frozen).

