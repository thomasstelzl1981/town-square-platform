

# GitHub Optimierung: Post-Merge Audit

## Executive Summary

Der GitHub-Merge hat **1 kritischen Build-Fehler (P0)** eingeführt und ansonsten die Architektur intakt gelassen. Das Manifest-SSOT, die Zonen-Grenzen und die GoldenPath-Wiring sind nicht betroffen.

---

## 1. Kritischer Build-Fehler (P0)

**Datei:** `src/components/finanzierung/CaseDocumentRoom.tsx` (Zeile 140)

**Problem:** Der GitHub-Agent hat die Funktion `foldersWithDocs` in einen `useMemo`-Block verschoben (Zeile 111), wodurch sie nur innerhalb dieses Closures sichtbar ist. Die Verwendung auf Zeile 140 (`renderFolder`) greift ins Leere.

**Ursache:** Refactoring der Variable-Scope durch den KI-Agenten -- die Hilfsfunktion wurde fälschlicherweise in den Memo-Block "eingefangen".

**Fix:** Die `foldersWithDocs`-Funktion muss als eigenständige Funktion (oder `useCallback`) auf Komponenten-Ebene definiert werden, sodass sowohl `useMemo` als auch `renderFolder` darauf zugreifen können:

```typescript
// Vor useMemo definieren:
const getDocCount = useCallback(
  (folderId: string) => uploadedDocs.filter(d => d.folderId === folderId).length,
  [uploadedDocs]
);

// In useMemo verwenden:
const uploadedFolderCount = useMemo(() => {
  return visibleFolders.filter(f => getDocCount(f.id) >= f.required).length;
}, [visibleFolders, getDocCount]);

// In renderFolder verwenden:
const count = getDocCount(folder.id);
```

---

## 2. Manifest/Routing Audit

| Pruefpunkt | Status | Details |
|---|---|---|
| routesManifest.ts unveraendert | OK | Alle 21 Module (MOD-00 bis MOD-20) korrekt definiert |
| ManifestRouter.tsx Component Maps | OK | Alle Maps (admin, portal, Z3) vollstaendig |
| Legacy Redirects | OK | 22 Legacy-Routes korrekt konfiguriert |
| Rogue Routes (ausserhalb Manifest) | OK | Keine neuen nicht-manifest-Routen gefunden |
| Zone Boundaries | OK | Keine Cross-Zone-Imports (Z2 importiert nichts aus Z3) |

---

## 3. GoldenPath Wiring

| Pruefpunkt | Status |
|---|---|
| GoldenPathGuard Import in ManifestRouter | OK |
| goldenPath Config auf dynamischen Routen (MOD-04, MOD-07, MOD-12, MOD-13, MOD-19) | OK |
| Bypass Vectors | Keine gefunden |

---

## 4. Repo Hygiene

| Pruefpunkt | Status | Details |
|---|---|---|
| vite.config.ts | OK | PWA-Config unveraendert, maximumFileSizeToCacheInBytes korrekt |
| React.memo Optimierungen | Nicht angewendet | Keine React.memo-Aufrufe gefunden -- der Agent hat diese entweder nicht umgesetzt oder sie wurden reverted |
| Cross-Zone Imports | OK | Keine Verletzungen |
| Neue Orphan-Dateien | Keine gefunden | |

---

## 5. Risiko-Einschaetzung

| Finding | Prioritaet | Risiko | Aufwand |
|---|---|---|---|
| CaseDocumentRoom.tsx Build Error | P0 | Hoch -- Blockiert Build | 5 Minuten |
| Fehlende React.memo (nicht angewendet) | P3 | Niedrig -- Kein Bruch | Optional |

---

## 6. Reparaturplan

### Schritt 1 (P0 -- sofort)
`CaseDocumentRoom.tsx` fixen: `foldersWithDocs` aus dem `useMemo`-Closure herauslösen und als eigenstaendigen `useCallback` auf Komponenten-Ebene definieren.

### Schritt 2 (P1 -- nach Build-Fix)
Build verifizieren und Preview testen (Dashboard, MOD-04 Portfolio, MOD-07 Finanzierung).

### Schritt 3 (P2 -- Dokumentation)
Backlog-Datei `spec/audit/github_optimization_review_backlog.json` erstellen mit allen Findings.

---

## Technische Details

### Betroffene Datei

```text
src/components/finanzierung/CaseDocumentRoom.tsx
  Zeile 110-113: useMemo mit foldersWithDocs (Closure-Scope)
  Zeile 140: Aufruf von foldersWithDocs (ausserhalb Scope) --> TS2304
```

### Backlog-Datei Struktur (spec/audit/github_optimization_review_backlog.json)

```json
{
  "audit_type": "github_optimization_review",
  "audit_date": "2026-02-16",
  "trigger": "GitHub AI Agent Merge",
  "findings": [
    {
      "id": "GH-OPT-001",
      "priority": "P0",
      "status": "open",
      "category": "build_error",
      "file": "src/components/finanzierung/CaseDocumentRoom.tsx",
      "description": "foldersWithDocs scope error after useMemo refactor",
      "fix": "Extract foldersWithDocs as useCallback at component level"
    },
    {
      "id": "GH-OPT-002",
      "priority": "P3",
      "status": "info",
      "category": "optimization_gap",
      "description": "React.memo not applied despite being in optimization scope",
      "fix": "Optional: Apply React.memo to heavy leaf components"
    }
  ],
  "manifest_audit": {
    "routes_manifest_intact": true,
    "zone_boundaries_intact": true,
    "golden_path_wiring_intact": true,
    "legacy_redirects_intact": true,
    "rogue_routes_found": false
  },
  "verdict": "1 P0 build fix required, architecture intact"
}
```

