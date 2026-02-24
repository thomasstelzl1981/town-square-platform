
# Website Hosting bereinigen — ABGESCHLOSSEN ✅

## Durchgeführte Änderungen

1. **Route entfernt**: `website-hosting` aus `routesManifest.ts` gelöscht
2. **Lazy-Import entfernt**: `WebHostingDashboard` aus `ManifestRouter.tsx` adminComponentMap gelöscht
3. **Navigation bereinigt**: `website-hosting` aus `AdminSidebar.tsx` (shouldShowInNav + getGroupKey + ICON_MAP) entfernt
4. **Orphan-Dateien gelöscht**: `WebHostingDashboard.tsx` (Ordner) + `AdminLandingPages.tsx`
5. **Audit aktualisiert**: `zone1_routes.json` — 100 → 99 Routen
6. **DB-Tabelle belassen**: `hosting_contracts` bleibt als Schema-Reserve (leer, keine RLS-Kosten)
7. **SSOT bestätigt**: Projekt Desk Tab "Landing Pages" ist einziger Ort für Landing-Page-Governance
