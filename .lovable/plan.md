
Ziel: Preview-Stabilität beim Routing-Wechsel (laut deiner Antwort: „Beim Routing-Wechsel“, „hängt dauerhaft“) nachhaltig fixen.

1) Diagnose (aus Code + Logs)
- Primärer technischer Fehler ist bestätigt:
  - `src/components/admin/AdminLayout.tsx` ruft `navigate('/portal')` direkt im Render-Pfad auf.
  - Das erzeugt exakt die geloggte Warnung „Cannot update a component while rendering a different component (BrowserRouter/AdminLayout)“ und kann bei Zonenwechseln Render-Loop/Freeze verursachen.
- Zweiter relevanter Warnhinweis:
  - „Function components cannot be given refs … LoadingFallback … ManifestRouter“.
  - Nicht immer fatal, aber in Kombination mit Suspense + vielen lazy-routes destabilisiert es den Dev-Preview zusätzlich.
- Verstärker im Preview:
  - In `src/App.tsx` laufen DEV-Validatoren beim Start immer (goldenpath + architecture), auch im Preview. Bei großem Projekt erhöht das Reload/HMR-Druck.
- Do I know what the issue is?
  - Ja: der Haupt-Trigger ist Navigation im Render (AdminLayout), plus zusätzliche Preview-Last (DEV-Validatoren, Suspense-Fallback-Setup).

2) Konkreter Umsetzungsplan (Code-Optimierung)
A. Render-Phase-Navigation entfernen (höchste Priorität)
- Datei: `src/components/admin/AdminLayout.tsx`
- Änderung:
  - Block `if (!isDevelopmentMode && !hasAdminAccess && memberships.length > 0) { navigate('/portal'); return null; }`
    wird ersetzt durch:
    - entweder `<Navigate to="/portal" replace />` im Return
    - oder `useEffect`-basierte Navigation mit Guard-Flag.
- Effekt:
  - Keine State/Router-Updates mehr während Render.
  - Beseitigt Hauptwarnung und reduziert Freeze-Risiko beim Wechsel `/admin ↔ /portal|/website`.

B. Suspense-Fallback ref-safe machen
- Dateien:
  - `src/router/ManifestRouter.tsx`
  - `src/router/Zone1Router.tsx`
  - `src/router/Zone2Router.tsx`
  - `src/router/Zone3Router.tsx`
- Änderung:
  - Gemeinsamen ref-kompatiblen Fallback verwenden (forwardRef) oder überall direkt DOM-Fallback statt Funktionskomponente.
- Effekt:
  - Entfernt „Function components cannot be given refs“-Warnung.
  - Stabilere Suspense-Transitions beim Lazy-Routing.

C. Preview-Last reduzieren (ohne Prod-Auswirkung)
- Datei: `src/App.tsx`
- Änderung:
  - DEV-Validatoren nur außerhalb Preview starten.
  - Kriterium über bestehende Preview-Detection (z. B. `isPreviewEnvironment()`).
- Effekt:
  - Weniger HMR-/Startup-Last im Preview, insbesondere bei häufigen Route-Wechseln.

D. Zone-3 Layouts gegen „hängenden Setting-Load“ absichern
- Datei: `src/pages/zone3/lennox/LennoxLayout.tsx` (optional gleiches Muster für weitere Zone3-Layouts)
- Änderung:
  - Wenn `pin_gate_enabled`-Query ungewöhnlich lange lädt, nicht dauerhaft Vollbild-Spinner blockieren; nach kurzer Deadline auf non-blocking Fallback gehen.
- Effekt:
  - Kein „permanent spinner“-Lock mehr bei temporär zähen Backend-Reads.

3) Reihenfolge der Umsetzung
1. AdminLayout-Navigation-Fix
2. Suspense-Fallback-Fix in Routern
3. Preview-Guard für DEV-Validatoren
4. Optional: Non-blocking PinGate-Ladepfad in LennoxLayout

4) Abnahmekriterien (muss erfüllt sein)
- Keine Console-Warnung mehr:
  - „Cannot update a component while rendering a different component“
  - „Function components cannot be given refs“
- Mehrfacher Wechsel funktioniert ohne Hänger:
  - `/website/lennox → /admin → /portal → /website/lennox`
- Preview bleibt bedienbar nach 5–10 Route-Wechseln hintereinander.
- Keine Regression in Auth-Redirects (nicht-admin weiterhin korrekt aus `/admin` rausgeleitet).

5) Kurz zu Governance/Frozen-Bereichen
- Für diese Stabilitätsfixes sind keine gesperrten MOD-Module nötig.
- Zone-3 Lennox ist laut Freeze-Status offen; Router/Admin/App liegen außerhalb der gesperrten Module.
