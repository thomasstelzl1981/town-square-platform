
# P0/P1 Reparaturplan — System-of-a-Town Portal

## Bestätigung der Präambel

1. ✅ Musterdaten dienen ausschließlich der Entwicklung im Musterportal (Demo-Tenant).
2. ✅ Module sind getrennt und interagieren API-analog (Handoffs/Contracts), keine Cross-Writes.
3. ✅ Routing bleibt manifest-driven (routesManifest SSOT). Keine zusätzlichen Routes.
4. ✅ Umsetzung strikt in der Fix-Reihenfolge, mit Re-Audit Evidence nach jedem Schritt.

---

## Analyse-Ergebnis

### Root Cause des Infinite-Loader-Problems

Das Problem liegt **nicht** im AuthContext selbst — dieser setzt bereits korrekt den `DEV_TENANT_UUID` in dev mode. Das Problem liegt in der **Reihenfolge und den Fallbacks**:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  AuthContext.tsx (aktuell)                                          │
│  ─────────────────────────────────────────────────────────────────  │
│  1. fetchDevelopmentData() sucht org_type='internal'                │
│  2. Findet: "System of a Town" (a0000000-...-000000000001) ✓       │
│  3. Setzt: activeOrganization + activeTenantId ✓                   │
│                                                                     │
│  ABER: Race Condition beim Initial Render:                          │
│  ─────────────────────────────────────────────────────────────────  │
│  - isLoading=true während fetch                                     │
│  - Components rendern mit activeTenantId=null → Query disabled      │
│  - Nach Load: activeTenantId gesetzt, aber Query nicht retriggert   │
└─────────────────────────────────────────────────────────────────────┘
```

**Zusätzliches Problem in `useFinanceRequest.ts`:**
```typescript
const tenantId = activeOrganization?.id || 'dev-tenant';  // FALSCH!
// 'dev-tenant' ist nicht die DEV_TENANT_UUID (a000...001)
```

---

## FIX-REIHENFOLGE (VERBINDLICH)

### P0-1: TENANT-MISMATCH beheben (Portal Infinite Loader)

**Gewählte Option: A (empfohlen, minimaler Eingriff)**

**Begründung:**
- AuthContext ist der zentrale Punkt für Tenant-Logik
- Alle Hooks verwenden bereits `activeTenantId` oder `activeOrganization?.id`
- Ein Fix an einer Stelle behebt alle abhängigen Module

**devMode-Erkennung:**
- Bereits implementiert: `isDevelopmentEnvironment()` prüft hostname (lovable.app, localhost, preview, id-preview)
- Kein neuer env flag nötig

**Implementierung:**

```text
┌────────────────────────────────────────────────────────────────────────┐
│  DATEI: src/contexts/AuthContext.tsx                                   │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  ÄNDERUNG 1: DEV_TENANT_UUID Konstante hinzufügen (Zeile ~30)         │
│  ─────────────────────────────────────────────────────────────────    │
│  const DEV_TENANT_UUID = 'a0000000-0000-4000-a000-000000000001';       │
│                                                                        │
│  ÄNDERUNG 2: activeTenantId-Berechnung anpassen (Zeile ~52)           │
│  ─────────────────────────────────────────────────────────────────    │
│  VORHER:                                                               │
│    const activeTenantId = profile?.active_tenant_id                    │
│      || activeOrganization?.id                                         │
│      || activeMembership?.tenant_id                                    │
│      || null;                                                          │
│                                                                        │
│  NACHHER:                                                              │
│    const activeTenantId = isDevelopmentMode                            │
│      ? DEV_TENANT_UUID                                                 │
│      : (profile?.active_tenant_id                                      │
│          || activeOrganization?.id                                     │
│          || activeMembership?.tenant_id                                │
│          || null);                                                     │
│                                                                        │
│  ÄNDERUNG 3: activeOrganization frühzeitig setzen für devMode         │
│  ─────────────────────────────────────────────────────────────────    │
│  Im useEffect (Zeile ~248), vor dem async fetch:                      │
│                                                                        │
│  if (isDevelopmentMode && !session?.user) {                            │
│    // Sofort Mock-Org setzen, bevor async fetch                        │
│    const mockOrg: Organization = {                                     │
│      id: DEV_TENANT_UUID,                                              │
│      name: 'System of a Town',                                         │
│      slug: 'system-of-a-town',                                         │
│      public_id: 'SOT-T-INTERNAL01',                                    │
│      org_type: 'internal',                                             │
│      parent_id: null,                                                  │
│      materialized_path: '/',                                           │
│      depth: 0,                                                         │
│      parent_access_blocked: false,                                     │
│      settings: {},                                                     │
│      created_at: new Date().toISOString(),                             │
│      updated_at: new Date().toISOString(),                             │
│    };                                                                  │
│    setActiveOrganization(mockOrg);                                     │
│  }                                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

```text
┌────────────────────────────────────────────────────────────────────────┐
│  DATEI: src/hooks/useFinanceRequest.ts                                 │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  ÄNDERUNG 1: DEV_TENANT_UUID Import (Zeile ~1)                        │
│  ─────────────────────────────────────────────────────────────────    │
│  import { DEV_TENANT_UUID } from '@/hooks/useGoldenPathSeeds';         │
│                                                                        │
│  ÄNDERUNG 2: Fallback korrigieren (Zeile ~24)                         │
│  ─────────────────────────────────────────────────────────────────    │
│  VORHER:                                                               │
│    const tenantId = activeOrganization?.id || 'dev-tenant';            │
│                                                                        │
│  NACHHER:                                                              │
│    const tenantId = activeOrganization?.id                             │
│      || (isDevelopmentMode ? DEV_TENANT_UUID : null);                  │
│                                                                        │
│  ÄNDERUNG 3: Gleicher Fix für useCreateFinanceRequest (Zeile ~91)     │
│  ─────────────────────────────────────────────────────────────────    │
│    const tenantId = activeOrganization?.id                             │
│      || (isDevelopmentMode ? DEV_TENANT_UUID : 'missing-tenant');      │
└────────────────────────────────────────────────────────────────────────┘
```

**Rollback-Hinweis:**
- Falls Production-User betroffen: isDevelopmentMode prüft hostname, daher kein Risiko
- Git Revert möglich falls nötig

---

### P1-1: SEED-UI Initial-Counts anzeigen (ohne Klick)

**Implementierung:**

```text
┌────────────────────────────────────────────────────────────────────────┐
│  DATEI: src/hooks/useGoldenPathSeeds.ts                                │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  ÄNDERUNG 1: Neuer Export für getCounts Funktion                      │
│  ─────────────────────────────────────────────────────────────────    │
│  export async function fetchGoldenPathCounts(): Promise<SeedCounts>    │
│    return getCounts(DEV_TENANT_UUID);                                  │
│  }                                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

```text
┌────────────────────────────────────────────────────────────────────────┐
│  DATEI: src/components/admin/TestDataManager.tsx                       │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  ÄNDERUNG 1: Import erweitern (Zeile ~26)                             │
│  ─────────────────────────────────────────────────────────────────    │
│  import { useGoldenPathSeeds, SEED_IDS, DEV_TENANT_UUID,               │
│           fetchGoldenPathCounts, type SeedCounts }                     │
│    from '@/hooks/useGoldenPathSeeds';                                  │
│                                                                        │
│  ÄNDERUNG 2: Neuer State für Initial-Counts (nach Zeile ~90)          │
│  ─────────────────────────────────────────────────────────────────    │
│  const [initialCounts, setInitialCounts] = useState<SeedCounts|null>   │
│    (null);                                                             │
│  const [isLoadingCounts, setIsLoadingCounts] = useState(true);         │
│                                                                        │
│  ÄNDERUNG 3: useEffect für Mount-Load (nach Zeile ~98)                │
│  ─────────────────────────────────────────────────────────────────    │
│  useEffect(() => {                                                     │
│    fetchGoldenPathCounts()                                             │
│      .then(counts => {                                                 │
│        setInitialCounts(counts);                                       │
│        setIsLoadingCounts(false);                                      │
│      })                                                                │
│      .catch(() => setIsLoadingCounts(false));                          │
│  }, []);                                                               │
│                                                                        │
│  ÄNDERUNG 4: Status-Grid immer rendern (Zeile ~598-618)               │
│  ─────────────────────────────────────────────────────────────────    │
│  VORHER:                                                               │
│    {lastResult && ( <StatusGrid .../> )}                               │
│                                                                        │
│  NACHHER:                                                              │
│    // Merge: lastResult hat Vorrang, sonst initialCounts               │
│    const displayCounts = lastResult?.after || initialCounts;           │
│                                                                        │
│    {isLoadingCounts ? (                                                │
│      <div className="grid grid-cols-4 gap-2">                          │
│        {[1,2,3,4].map(i => (                                           │
│          <div key={i} className="p-2 bg-background rounded border      │
│               animate-pulse h-8" />                                    │
│        ))}                                                             │
│      </div>                                                            │
│    ) : displayCounts ? (                                               │
│      <StatusGrid counts={displayCounts} />                             │
│    ) : (                                                               │
│      <p className="text-sm text-muted-foreground">                     │
│        Keine Daten geladen                                             │
│      </p>                                                              │
│    )}                                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Evidence-Checkliste (nach Umsetzung)

### P0-1 Evidence

| Test | Erwartung | Screenshot/Log erforderlich |
|------|-----------|----------------------------|
| Öffne `/portal/immobilien/portfolio` | Network: Query mit `tenant_id=a0000..001` sichtbar | Ja (Network Tab) |
| Portfolio-UI | Property "Leipzig Kapitalanlage 62m²" angezeigt | Ja (Screenshot) |
| Öffne `/portal/dms/storage` | Storage Tree mit ≥19 Nodes | Ja (Screenshot) |
| Öffne `/portal/finanzierung` | How-It-Works lädt, keine Spinner in Daten-Bereichen | Ja (Screenshot) |
| Console | Keine unhandled promise rejections | Ja (Console Screenshot) |

### P1-1 Evidence

| Test | Erwartung | Screenshot erforderlich |
|------|-----------|------------------------|
| Page Refresh `/admin/tiles` → Testdaten | Status-Grid sichtbar OHNE Klick | Ja |
| Counts korrekt | 5 Kontakte, 1 Immobilie, 12 Dokumente | Ja |
| "Einspielen" klicken | Toast + Counts bleiben konsistent | Ja |

---

## Technische Zusammenfassung

### Betroffene Dateien

| Datei | Änderungstyp | Zeilen (ca.) |
|-------|-------------|--------------|
| `src/contexts/AuthContext.tsx` | Modify | ~15 Zeilen |
| `src/hooks/useFinanceRequest.ts` | Modify | ~6 Zeilen |
| `src/hooks/useGoldenPathSeeds.ts` | Modify | ~5 Zeilen (Export) |
| `src/components/admin/TestDataManager.tsx` | Modify | ~25 Zeilen |

### Nicht betroffene Dateien

- Keine neuen Routen
- Keine DB-Schema-Änderungen
- Keine UI-Styling-Änderungen
- Keine neuen Features

### Risiken

| Risiko | Mitigierung |
|--------|-------------|
| Production-User sieht Demo-Daten | `isDevelopmentMode` prüft hostname — Production hat andere Domain |
| Cached Tenant-ID in React Query | `queryClient.invalidateQueries` nach Auth-State-Change |
| Multi-Tenant später konfliktiert | DEV_TENANT_UUID nur in dev mode, echte Auth überschreibt |

---

## Sequenz

```text
Schritt 1 → P0-1: AuthContext + useFinanceRequest patchen
        ↓
Schritt 2 → Deployment + Browser Refresh
        ↓
Schritt 3 → Evidence sammeln (Network, Screenshots)
        ↓
Schritt 4 → P1-1: TestDataManager Initial-Counts
        ↓
Schritt 5 → Evidence sammeln
        ↓
Schritt 6 → Dokumentation im Commit
```
