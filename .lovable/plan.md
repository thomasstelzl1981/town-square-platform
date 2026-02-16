
# Landing Page Untermenuepunkte entfernen (MOD-09, MOD-11, MOD-12)

## Aenderungen

Die "Landing Page"-Eintraege werden aus drei Modulen entfernt:

| Modul | Route | Komponenten-Datei |
|---|---|---|
| MOD-09 Immomanager | `landing-page` → `VMPartnerLandingPage` | `src/pages/portal/vertriebspartner/VMPartnerLandingPage.tsx` |
| MOD-11 Finanzierungsmanager | `landing-page` → `FMLandingPage` | `src/pages/portal/finanzierungsmanager/FMLandingPage.tsx` |
| MOD-12 Akquise-Manager | `landing-page` → `AkquiseLandingPage` | `src/pages/portal/akquise-manager/AkquiseLandingPage.tsx` |

**Hinweis**: MOD-13 (Projektmanager) behaelt seinen Landing Page Tab, da dieser dort als funktionale Projekt-Website dient.

## Technische Schritte

### 1. Routes Manifest bereinigen (`src/manifests/routesManifest.ts`)

Drei Zeilen entfernen:
- Zeile 349: `{ path: "landing-page", component: "VMPartnerLandingPage", title: "Landing Page" }`
- Zeile 389: `{ path: "landing-page", component: "FMLandingPage", title: "Landing Page" }`
- Zeile 416: `{ path: "landing-page", component: "AkquiseLandingPage", title: "Landing Page" }`

### 2. Komponenten-Dateien loeschen

Drei Dateien entfernen:
- `src/pages/portal/vertriebspartner/VMPartnerLandingPage.tsx`
- `src/pages/portal/finanzierungsmanager/FMLandingPage.tsx`
- `src/pages/portal/akquise-manager/AkquiseLandingPage.tsx`

### 3. Index-Export bereinigen (falls vorhanden)

Pruefen ob `FMLandingPage` in `src/pages/portal/finanzierungsmanager/index.ts` exportiert wird und ggf. entfernen.

Keine DB-Aenderungen noetig. Keine weiteren Abhaengigkeiten betroffen.
