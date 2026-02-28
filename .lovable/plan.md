

## Plan: Preview-Kombi-Härtung (nur Preview-Umgebung)

### Ursache

Die Preview crasht alle ~20s weil das Dashboard gleichzeitig betreibt:
- **3D Globe** (Three.js/WebGL — massiver GPU+RAM-Verbrauch)
- **PV Monitoring** (`setInterval` alle 7s mit Recharts-Sparkline)
- **Weather Animations** (40+ animierte DOM-Elemente bei Regen/Schnee)
- **Radio Audio** (Audio-Element + Sound-Visualisierung)
- **4+ Edge Function Calls** (Finance, News, APOD, Quote) beim Dashboard-Mount
- **PortalLayout `preloadModules`** lädt 5 weitere Module nach 1s
- Nach jedem Prompt: Vite HMR invalidiert den Module Graph → Reload → alles startet gleichzeitig neu

### Lösung: `isPreview`-gesteuerter Safe Mode (nur Preview)

**1 neue Datei erstellen:**

| Datei | Zweck |
|-------|-------|
| `src/hooks/usePreviewSafeMode.ts` | Erkennt Preview-Umgebung, exportiert `isPreview` Flag + gedrosselte Konfiguration |

Preview-Erkennung: `window.location.hostname.includes('-preview--')` oder `window.location.hostname.includes('lovable.app') && import.meta.env.DEV`

**4 Dateien editieren:**

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/PortalDashboard.tsx` | Widgets nur rendern wenn im Viewport (IntersectionObserver). Globe, PV, Radio im Preview deaktiviert → Platzhalter-Card |
| `src/hooks/usePvMonitoring.ts` | `refreshInterval` von 7s auf 60s wenn `isPreview` |
| `src/components/portal/PortalLayout.tsx` | `preloadModules` im Preview deaktivieren (spart 5 lazy imports beim Start) |
| `src/components/dashboard/WeatherCard.tsx` | `WeatherEffects` (animierte DOM-Elemente) im Preview nicht rendern |

### Technische Details

**`usePreviewSafeMode.ts`:**
```typescript
export function usePreviewSafeMode() {
  const isPreview = useMemo(() => {
    const host = window.location.hostname;
    return host.includes('-preview--') || 
           (host.includes('lovable.app') && import.meta.env.DEV);
  }, []);
  
  return { isPreview, safeRefreshInterval: isPreview ? 60000 : 7000 };
}
```

**Dashboard-Änderung:** Widgets die im Preview deaktiviert werden:
- `system_globe` → ersetzt durch statische Card "Globe (Preview deaktiviert)"
- `system_pv_live` → ersetzt durch statische Card
- `system_radio` → ersetzt durch statische Card

Widgets die gedrosselt werden:
- `system_weather` → ohne `WeatherEffects` Overlay
- `system_finance` / `system_news` → unverändert (einmalige API-Calls, kein Polling)

**PortalLayout-Änderung:** 
```typescript
// Zeile 82-86: preloadModules nur in Published
useEffect(() => {
  if (isPreview) return; // Skip in preview
  const timer = setTimeout(preloadModules, 1000);
  return () => clearTimeout(timer);
}, []);
```

### Erwarteter Effekt

- **RAM-Einsparung:** ~40-60MB weniger (kein Three.js, kein WebGL-Kontext, keine Preloads)
- **CPU-Einsparung:** Keine 7s-Timer, keine CSS-Animationen, keine Audio-Elemente
- **Netzwerk:** 5 weniger parallele Requests beim Start
- **Published Version:** Null Änderung — alle Widgets laufen wie bisher

