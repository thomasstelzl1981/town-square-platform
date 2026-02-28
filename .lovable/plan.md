

## Plan: 3D Globe Widget entfernen

### Befund

Das Globe Widget (`EarthGlobeCard`) importiert `react-globe.gl`, das **Three.js** als Dependency mitbringt — eine der größten JavaScript-Libraries überhaupt (~600KB gzipped + WebGL-Kontext). Allein der Import erzeugt erheblichen Speicherdruck, selbst wenn lazy-loaded. Dazu kommt: WebGL-Kontexte werden beim HMR-Reload nicht sauber freigegeben, was den akkumulierenden Memory Leak erklärt.

### Änderungen

| Aktion | Datei | Was |
|--------|-------|-----|
| **Edit** | `src/pages/portal/PortalDashboard.tsx` | `system_globe` rendert immer `CSSGlobeFallback` statt `EarthGlobeCard`. Import von `EarthGlobeCard` entfernen |
| **Delete** | `src/components/dashboard/EarthGlobeCard.tsx` | Komplette Datei löschen |
| **Delete** | `src/components/dashboard/earth-globe/CSSGlobeFallback.tsx` | Wird nach `src/components/dashboard/GlobeWidget.tsx` verschoben (eigenständige Widget-Card) |
| **Neu** | `src/components/dashboard/GlobeWidget.tsx` | Leichtgewichtiges CSS-Globe-Widget mit Koordinaten-Overlay (aus CSSGlobeFallback + CardContent-Overlay von EarthGlobeCard) |
| **Edit** | `package.json` | `react-globe.gl` Dependency entfernen |
| **Edit** | `src/types/widget.ts` | `system_globe` bleibt als Widget-Typ (keine Breaking Change) |

### Erwarteter Effekt

- **~600KB+ weniger im Bundle** (Three.js + react-globe.gl + three-globe)
- **Kein WebGL-Kontext mehr** → kein GPU-Memory-Leak bei HMR
- **CSSGlobeFallback existiert bereits** und sieht visuell gut aus — wird zum Standard-Widget
- Published Version bekommt das gleiche leichtgewichtige Widget (kein Funktionsverlust, da der 3D-Globe rein dekorativ ist)

