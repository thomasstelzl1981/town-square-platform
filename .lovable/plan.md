

# Performance-Analyse: Gesamtsystem

## Status nach letzter Optimierung

Die Massnahmen aus der vorherigen Runde sind umgesetzt:
- Zentraler Image-Cache (`imageCache.ts`) mit TTL und Request-Deduplizierung: aktiv
- Zone-3-Websites und Zone-2-Module: alle via `React.lazy()` geladen
- `CachedImage`-Komponente mit Skeleton: vorhanden
- `fetchPropertyImages` nutzt den Cache: ja

Das bedeutet: Die groessten Engpaesse (fehlender Cache, fehlende Code-Splits) sind behoben.

---

## Verbleibende Performance-Probleme

### 1. QueryClient ohne globale Defaults (HOCH)

```text
Datei: src/App.tsx, Zeile 32
const queryClient = new QueryClient();
```

Ohne globale `staleTime` und `gcTime` refetcht TanStack Query bei **jedem Tab-Wechsel und jedem Remount** alle Daten neu. Von 66+ Dateien mit `useQuery` haben nur 17 eine eigene `staleTime`. Die restlichen ~49 Queries refetchen bei jeder Navigation — das erzeugt hunderte unnoetige DB-Requests.

**Loesung:** Globale Defaults setzen:
```text
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 Minuten
      gcTime: 10 * 60 * 1000,     // 10 Minuten
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

**Erwartete Wirkung:** 50-70% weniger DB-Requests bei Navigation zwischen Tabs/Modulen.

---

### 2. ProfilTab: createSignedUrl ausserhalb des Caches (MITTEL)

```text
Datei: src/pages/portal/stammdaten/ProfilTab.tsx, Zeilen 216 + 233
```

Zwei Stellen nutzen noch direkt `createSignedUrl` mit 1-Jahres-TTL (31536000s) statt des zentralen Caches. Dies ist kein grosser Performance-Impact (nur beim Upload), aber bricht das Muster.

**Loesung:** Nach dem Upload `getCachedSignedUrl` verwenden.

---

### 3. useUniversalUpload: createSignedUrl ausserhalb des Caches (NIEDRIG)

```text
Datei: src/hooks/useUniversalUpload.ts, Zeile 124
```

Gleiche Situation — direkter `createSignedUrl`-Aufruf, der den Cache umgeht.

---

### 4. Zone-1 Admin: ~20 direkte Imports (MITTEL)

```text
Datei: src/router/ManifestRouter.tsx, Zeilen 57-93
```

Waehrend Zone 2 und Zone 3 vollstaendig lazy-loaded sind, werden ~20 Zone-1-Admin-Komponenten (Dashboard, Organizations, Users, MasterTemplates, Armstrong-Suite etc.) noch direkt importiert. Da Zone 1 nur fuer Admins relevant ist, vergroessert dies das initiale Bundle fuer alle User.

**Loesung:** Alle Zone-1-Imports auf `React.lazy()` umstellen, da sie hinter Auth-Gates liegen und nie beim ersten Laden gebraucht werden.

---

### 5. Schwere Bibliotheken ohne Lazy-Import (MITTEL)

- **recharts**: In 18 Dateien direkt importiert. Die Bibliothek ist ~200KB gzipped. Da die meisten Charts in Tabs liegen, die nicht sofort sichtbar sind, koennten sie lazy-loaded werden.
- **mermaid**: Installiert aber nur in wenigen Stellen genutzt — sollte nur bei Bedarf geladen werden.
- **react-globe.gl**: Bereits lazy-loaded via dynamischem `import()` in `EarthGlobeCard.tsx` — gut.

---

### 6. Bilder: Kein Prefetching (NIEDRIG)

Der aktuelle Cache ist reaktiv — er laedt URLs erst, wenn eine Komponente sie anfordert. Fuer Listen-Seiten (Kaufy Home, SucheTab) koennten Bild-URLs im Query zusammen mit den Listings vorgeladen werden, statt in einem zweiten Durchlauf.

---

## Zusammenfassung nach Prioritaet

| Prio | Problem | Erwarteter Impact |
|------|---------|-------------------|
| HOCH | QueryClient ohne globale staleTime | 50-70% weniger DB-Requests |
| MITTEL | Zone-1 Imports nicht lazy | ~100-200KB weniger im initialen Bundle |
| MITTEL | recharts nicht lazy-loaded | ~200KB weniger fuer Nicht-Chart-Seiten |
| NIEDRIG | ProfilTab/useUniversalUpload umgehen Cache | Konsistenz, minimaler Performance-Impact |
| NIEDRIG | Kein Image-Prefetching | Geringfuegig schnellere Bildanzeige |

## Empfohlene naechste Schritte

### Schritt 1: QueryClient globale Defaults (groesster Hebel)

Aenderung in `src/App.tsx`: `new QueryClient()` erhaelt `defaultOptions` mit `staleTime: 5 * 60 * 1000` und `refetchOnWindowFocus: false`.

### Schritt 2: Zone-1-Imports lazy-loaden

Alle ~20 direkten Imports in `ManifestRouter.tsx` Zeilen 57-93 auf `React.lazy()` umstellen.

### Schritt 3: Verbleibende createSignedUrl-Stellen migrieren

`ProfilTab.tsx` und `useUniversalUpload.ts` auf den zentralen Cache umstellen.

### Keine Datenbank-Aenderungen noetig

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/App.tsx` | QueryClient globale Defaults |
| `src/router/ManifestRouter.tsx` | Zone-1 Lazy-Loading |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Cache-Migration |
| `src/hooks/useUniversalUpload.ts` | Cache-Migration |

