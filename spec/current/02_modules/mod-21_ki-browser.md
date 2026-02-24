# MOD-21 — KI-Browser (ENTFERNT)

## Status: DEAKTIVIERT

MOD-21 wurde am 24.02.2026 aus der Plattform entfernt.

### Grund
- Modul war experimentell und nicht in der Rollenlogik integriert
- Kein Tenant hatte das Modul aktiviert
- Feature wird vorerst nicht benötigt

### Entfernt aus
- routesManifest.ts
- areaConfig.ts
- armstrongManifest.ts (10 Browser-Actions)
- goldenPathProcesses.ts (GP-BROWSER-SESSION)
- contextResolvers.ts
- tile_catalog (is_active = false)
- modules_freeze.json

### Verbleibende Artefakte (nicht gelöscht, aber inaktiv)
- src/pages/portal/KiBrowserPage.tsx + Sub-Pages
- src/hooks/useKiBrowser.ts
- supabase/functions/sot-ki-browser/
- spec/current/06_engines/ENGINE_REGISTRY.md (Eintrag 18)
