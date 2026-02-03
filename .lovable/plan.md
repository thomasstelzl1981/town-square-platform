
# Performance-Optimierungsplan

## Problemzusammenfassung

Die App leidet unter extrem langen Ladezeiten aus folgenden Gründen:

| Problem | Ursache | Impact |
|---------|---------|--------|
| Race Condition | `AuthContext` ruft `fetchUserData` doppelt auf (onAuthStateChange + getSession) | 2x DB-Requests |
| Redundante Org-Fetches | `useOrgContext.ts` holt Organizations erneut obwohl AuthContext sie schon hat | +1-3x Requests |
| PortalNav DB-Calls | Eigener Fetch für `tenant_tile_activation` und `memberships` | +2x Requests |
| Fehlende Query-Caching | React Query hat keine `staleTime`, re-fetcht bei jedem Mount | N x Requests |
| forwardRef-Warning | ArmstrongSheet/Sheet erzeugt React-Warnungen und Re-Renders | UI-Flicker |

**Gesamt-Impact:** 12+ redundante API-Requests beim initialen Laden.

---

## Phasenplan

### Phase 1: AuthContext Race Condition beheben
**Datei:** `src/contexts/AuthContext.tsx`

**Problem (Zeilen 248-285):**
```typescript
// Gleichzeitige Aufrufe:
supabase.auth.onAuthStateChange() → fetchUserData()
supabase.auth.getSession()        → fetchUserData() // DOPPELT!
```

**Lösung:**
- Flag einführen (`hasInitialized`), das verhindert, dass `getSession()` nochmal fetcht, wenn `onAuthStateChange` bereits gefeuert hat.
- Alternativ: `getSession()` nur als Fallback, wenn `onAuthStateChange` nach 500ms nicht feuert.

```typescript
// Neuer Ablauf:
const [hasInitialized, setHasInitialized] = useState(false);

useEffect(() => {
  const { subscription } = supabase.auth.onAuthStateChange((event, session) => {
    if (!hasInitialized) {
      setHasInitialized(true);
      // ... fetch data
    }
  });

  // Fallback nur wenn nach 500ms noch nichts passiert
  const timeout = setTimeout(() => {
    if (!hasInitialized) {
      supabase.auth.getSession().then(...);
    }
  }, 500);

  return () => { subscription.unsubscribe(); clearTimeout(timeout); };
}, []);
```

---

### Phase 2: useOrgContext redundante Fetches eliminieren
**Datei:** `src/hooks/useOrgContext.ts`

**Problem (Zeilen 51-73):**
```typescript
// Holt Organizations erneut, obwohl AuthContext sie schon hat:
const { data: orgs } = await supabase
  .from('organizations')
  .select('id, name, org_type')
  .in('id', tenantIds);
```

**Lösung:**
- AuthContext liefert bereits `activeOrganization` mit `name` und `org_type`.
- Für Multi-Org-Szenarien: Cache im AuthContext erweitern, nicht im Hook.
- Im Single-Org-Modus: Fetch komplett entfernen.

```typescript
// Vereinfacht:
const availableOrgs = useMemo(() => {
  if (!activeOrganization) return [];
  return [{
    id: activeOrganization.id,
    name: activeOrganization.name,
    type: activeOrganization.org_type as OrgType,
    isActive: true,
  }];
}, [activeOrganization]);
```

---

### Phase 3: PortalNav Fetches konsolidieren
**Datei:** `src/components/portal/PortalNav.tsx`

**Problem (Zeilen 89-118):**
```typescript
// Eigene Fetches für:
fetchActiveTileCodes(tenantId)  // tenant_tile_activation
fetchUserRoles(userId)          // memberships
```

**Lösung:**
- `memberships` kommen bereits aus `useAuth()` (Zeile 154).
- `tenant_tile_activation` in AuthContext integrieren ODER React Query mit `staleTime`.

**Option A (schneller):** React Query mit Caching:
```typescript
const { data: activeTileCodes } = useQuery({
  queryKey: ['tile-activations', activeOrganization?.id],
  queryFn: () => fetchActiveTileCodes(activeOrganization!.id),
  enabled: !!activeOrganization?.id,
  staleTime: 5 * 60 * 1000, // 5 Minuten
  cacheTime: 10 * 60 * 1000,
});
```

**Option B (sauberer):** In AuthContext verschieben und im Context mitliefern.

---

### Phase 4: React Query Global Defaults setzen
**Datei:** `src/App.tsx`

**Problem (Zeile 30):**
```typescript
const queryClient = new QueryClient(); // Keine Defaults!
```

**Lösung:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 Minuten default
      cacheTime: 5 * 60 * 1000, // 5 Minuten cache
      refetchOnWindowFocus: false, // Kein Re-Fetch bei Tab-Wechsel
      retry: 1, // Max 1 Retry
    },
  },
});
```

---

### Phase 5: forwardRef-Warnung beheben
**Datei:** `src/components/portal/ArmstrongSheet.tsx`

**Problem:**
React warnt, dass Function Components keine refs erhalten können. Das Sheet aus Radix gibt einen ref weiter, den `ArmstrongSheet` nicht handled.

**Lösung:**
```typescript
import { forwardRef } from 'react';

export const ArmstrongSheet = forwardRef<HTMLDivElement, ArmstrongSheetProps>(
  ({ open, onOpenChange }, ref) => {
    // ... rest
  }
);
ArmstrongSheet.displayName = 'ArmstrongSheet';
```

---

### Phase 6: Lazy Loading mit Preload (Optional)
**Problem:** Erste Klicks auf Module laden erst dann die Chunks.

**Lösung:** Preload der häufigsten Module:
```typescript
// In PortalLayout.tsx oder App.tsx
useEffect(() => {
  // Preload häufig genutzte Module
  import('./pages/portal/ImmobilienPage');
  import('./pages/portal/StammdatenPage');
  import('./pages/portal/OfficePage');
}, []);
```

---

## Zusammenfassung der Änderungen

| Datei | Änderung |
|-------|----------|
| `AuthContext.tsx` | Race Condition mit Flag beheben |
| `useOrgContext.ts` | Redundante Org-Fetches entfernen |
| `PortalNav.tsx` | Fetches durch AuthContext-Daten ersetzen oder cachen |
| `App.tsx` | QueryClient mit staleTime/cacheTime konfigurieren |
| `ArmstrongSheet.tsx` | forwardRef hinzufügen |

## Erwartetes Ergebnis

| Vorher | Nachher |
|--------|---------|
| 12+ API-Requests beim Load | 3-4 Requests |
| ~3-5s Ladezeit | <1s Ladezeit |
| Console-Warnungen | Keine Warnungen |
| Re-Fetch bei jedem Tab-Wechsel | Cached für 2 Minuten |

---

## Technische Details

### Reihenfolge der Implementierung
1. **Phase 4 zuerst** (QueryClient Defaults) — schnellster Impact
2. **Phase 1** (AuthContext Race Condition) — verhindert doppelte Initialisierung
3. **Phase 2 + 3** (Hooks konsolidieren) — eliminiert redundante Fetches
4. **Phase 5** (forwardRef) — eliminiert Console-Noise
5. **Phase 6** (Preload) — optional, für "erster Klick"-Optimierung

### Rollback-Strategie
Jede Phase ist unabhängig und kann einzeln reverted werden, falls Probleme auftreten.
