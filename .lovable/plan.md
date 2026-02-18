
# Armstrong-Erklaerseite im Portal unter Base

## Problem

Die Armstrong-Erklaerung existiert nur auf der oeffentlichen SoT-Website (Zone 3). Eingeloggte User im Portal sehen unter `/portal/area/base` nur zwei Kacheln (Dokumente, Stammdaten) — es fehlt ein eigener Bereich, der Armstrong intern erklaert: Was kann er, was kostet er, wie funktioniert er.

---

## Loesung

Eine neue **Armstrong-Kachel** in der Base-Area-Uebersicht, die auf eine eigene Portal-Seite `/portal/armstrong` fuehrt. Diese Seite ist eine interne Version der Zone-3-Seite — angepasst fuer eingeloggte User mit konkretem Bezug auf ihre Daten und Module.

---

## Aenderungen

### 1. AreaConfig: Armstrong als dritten Eintrag in Base

In `src/manifests/areaConfig.ts`:
- `modules` Array von `base` erweitern: `['MOD-03', 'MOD-01', 'ARMSTRONG']`

### 2. moduleContents.ts: Armstrong-Eintrag

Neuer Eintrag `ARMSTRONG` in `moduleContents` mit:
- `title`: "Armstrong"
- `oneLiner`: "Ihr KI-Co-Pilot — erklaert, analysiert und arbeitet fuer Sie."
- `subTiles`, `benefits`, `flows` entsprechend befuellt

### 3. AreaOverviewPage.tsx: Sonderbehandlung fuer ARMSTRONG

Da `ARMSTRONG` kein echtes Modul in `routesManifest` ist, braucht die Card-Generierung einen Fallback:
- `defaultRoute` fuer `ARMSTRONG` → `/portal/armstrong`
- `displayName` → "Armstrong — KI-Co-Pilot"

### 4. Neue Seite: `src/pages/portal/ArmstrongInfoPage.tsx`

Eigenstaendige Portal-Seite mit PageShell, angepasst fuer eingeloggte User:

**Sektionen:**
- **Hero**: "Armstrong — Ihr KI-Co-Pilot" mit Beschreibung
- **Was Armstrong kostenlos kann**: Liste der Free-Actions aus dem Manifest
- **Was Armstrong mit Credits kann**: Kategorien mit Preisen (aus Manifest)
- **Wie Armstrong arbeitet**: Plan → Bestaetigen → Ausfuehren (3-Schritte)
- **Was Armstrong besonders macht**: Kein Abo, Multi-Modul, Datenschutz
- **Direkt starten**: Button zum Armstrong-Chat oeffnen

### 5. Route registrieren

In `src/router/ManifestRouter.tsx`:
- Lazy import `ArmstrongInfoPage`
- Route `/portal/armstrong` hinzufuegen

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/areaConfig.ts` | `'ARMSTRONG'` in base.modules einfuegen |
| `src/components/portal/HowItWorks/moduleContents.ts` | Neuer Eintrag `ARMSTRONG` |
| `src/pages/portal/AreaOverviewPage.tsx` | Fallback-Route fuer ARMSTRONG |
| `src/pages/portal/ArmstrongInfoPage.tsx` | **NEU** — Interne Armstrong-Erklaerseite |
| `src/router/ManifestRouter.tsx` | Route `/portal/armstrong` registrieren |

### Nicht betroffen:
- `SotArmstrong.tsx` (Zone 3) bleibt bestehen — das ist die oeffentliche Version
- `armstrongManifest.ts` — wird nur gelesen, nicht veraendert
