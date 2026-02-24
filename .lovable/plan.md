
# Website Hosting bereinigen — Redundanz entfernen

## Befund

| Element | Status | Problem |
|---------|--------|---------|
| `WebHostingDashboard.tsx` Tab "Hosting-Verträge" | Leer (0 Einträge in `hosting_contracts`) | Kein Modul schreibt in diese Tabelle — kein Intake |
| `WebHostingDashboard.tsx` Tab "Projekt-Websites" | Funktional identisch mit Projekt Desk Landing Pages Tab | **Dopplung** |
| `AdminLandingPages.tsx` | Orphan — wird nirgends importiert | **Toter Code** |
| Projekt Desk Tab "Landing Pages" | Korrekt verortet, voll funktional | **SSOT** — hier gehoert es hin |

## Plan

### 1. Website Hosting aus Navigation entfernen

- `AdminSidebar.tsx`: `website-hosting` aus der Desk-Liste entfernen (shouldShowInNav, getNavGroup)
- `routesManifest.ts`: Route `website-hosting` entfernen oder als `deprecated` markieren
- `ManifestRouter.tsx`: Lazy-Import `WebHostingDashboard` entfernen

### 2. Orphan-Dateien loeschen

- `src/pages/admin/website-hosting/WebHostingDashboard.tsx` — entfernen
- `src/pages/admin/AdminLandingPages.tsx` — entfernen (Orphan, nicht referenziert)

### 3. Hosting-Contracts Tabelle belassen

Die Tabelle `hosting_contracts` wird **nicht** geloescht. Sie ist eine vorbereitete Struktur fuer ein zukuenftiges Feature (Tenant-Website-Hosting mit Vertraegen/Credits). Die Tabelle bleibt als Schema-Reserve bestehen — sie stoert nicht, da sie leer ist und keine RLS-Kosten verursacht.

### 4. Projekt Desk bleibt SSOT

Der Landing-Pages-Tab im Projekt Desk (`ProjektDesk.tsx` Tab 4) ist und bleibt der einzige Ort fuer Landing-Page-Governance. Keine Aenderung noetig.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Route `website-hosting` entfernen |
| `src/router/ManifestRouter.tsx` | Lazy-Import entfernen |
| `src/components/admin/AdminSidebar.tsx` | `website-hosting` aus Desk-Filter entfernen |
| `src/pages/admin/website-hosting/WebHostingDashboard.tsx` | Datei loeschen |
| `src/pages/admin/AdminLandingPages.tsx` | Datei loeschen |

## Modul-Freeze-Check

Alle Dateien liegen in `src/pages/admin/`, `src/manifests/`, `src/router/`, `src/components/admin/` — ausserhalb der Modul-Pfade. Kein Freeze betroffen.
