
# Redirect-Fix: "Haus" wird "ZUHAUSE" — Einstieg in Immobilien korrigieren

## Problem

Wenn man im Seitenmenü auf "Haus" (Sub-Tile von MOD-04 Immobilien) klickt, navigiert der Browser zu `/portal/immobilien/haus`, was sofort nach `/portal/miety` weiterleitet. Das verlässt MOD-04 komplett und springt zu MOD-20 — die Navigation kollabiert, die Sidebar wechselt den aktiven Bereich, und es entsteht ein visueller Sprung.

Zusätzlich ist "Haus" als `default: true` markiert, aber der `index`-Route in ImmobilienPage leitet auf `portfolio` weiter — ein Widerspruch.

## Lösung

MOD-20 (Miety/Zuhause) wird direkt **innerhalb** von MOD-04 gerendert — kein Redirect mehr. Der "Haus"-Tab wird in "ZUHAUSE" umbenannt und bleibt der Einstiegspunkt von Immobilien.

---

## Änderung 1: Manifest — Tile umbenennen, Default beibehalten

**Datei:** `src/manifests/routesManifest.ts`

- Zeile 251: `title: "Haus"` wird zu `title: "ZUHAUSE"`, `path: "haus"` wird zu `path: "zuhause"`
- `default: true` bleibt — damit ist ZUHAUSE der Einstieg bei Klick auf "Immobilien"

**Datei:** `src/manifests/areaConfig.ts`

- Zeile 65: `'MOD-20': 'Haus'` wird zu `'MOD-20': 'ZUHAUSE'`

---

## Änderung 2: ImmobilienPage — Miety inline rendern statt Redirect

**Datei:** `src/pages/portal/ImmobilienPage.tsx`

- `index`-Route: Redirect von `portfolio` auf `zuhause` ändern
- Route `path="haus"` mit `<Navigate to="/portal/miety">` entfernen
- Neue Route `path="zuhause/*"` hinzufügen, die `MietyPortalPage` inline rendert (lazy-loaded)
- Redirect von `path="haus"` auf `zuhause` (Legacy-Kompatibilität)

```text
Routes (nach Umbau):
  index         -> Navigate to "zuhause"
  "zuhause/*"   -> MietyPortalPage (inline, kein Redirect)
  "haus"        -> Navigate to "zuhause" (Legacy)
  "portfolio"   -> PortfolioTab
  "verwaltung"  -> VerwaltungTab
  "sanierung/*" -> SanierungTab
  ...rest
```

---

## Änderung 3: Interne Miety-Links anpassen

Alle Navigationen innerhalb der Miety-Tiles (`/portal/miety/...`) müssen auf `/portal/immobilien/zuhause/...` umgestellt werden, damit die Navigation im MOD-04-Kontext bleibt:

**Dateien mit Änderungen (navigate/Link-Pfade):**
- `src/pages/portal/miety/tiles/UebersichtTile.tsx` — `/portal/miety/zuhause/:homeId` wird `/portal/immobilien/zuhause/zuhause/:homeId`
- `src/pages/portal/miety/tiles/VersorgungTile.tsx` — gleiche Anpassung
- `src/pages/portal/miety/tiles/VersicherungenTile.tsx` — gleiche Anpassung
- `src/pages/portal/miety/components/MietyCreateHomeForm.tsx` — gleiche Anpassung
- `src/pages/portal/miety/components/MietyDossierHeader.tsx` — Zurück-Link
- `src/pages/portal/miety/MietyHomeDossier.tsx` — Fallback-Redirect
- `src/pages/portal/MietyPortalPage.tsx` — Fallback-Redirect bei `zaehlerstaende`

---

## Änderung 4: ManifestRouter — MOD-20 Route beibehalten als Redirect

**Datei:** `src/router/ManifestRouter.tsx`

- `miety: MietyPortalPage` bleibt im `portalModulePageMap` für den Fall, dass jemand direkt `/portal/miety` aufruft
- Optional: Legacy-Redirect von `/portal/miety/*` auf `/portal/immobilien/zuhause/*` hinzufügen

---

## Dateien-Übersicht

| Aktion | Datei |
|--------|-------|
| EDIT | `src/manifests/routesManifest.ts` — "haus" -> "zuhause", Titel -> "ZUHAUSE" |
| EDIT | `src/manifests/areaConfig.ts` — Label-Override "Haus" -> "ZUHAUSE" |
| EDIT | `src/pages/portal/ImmobilienPage.tsx` — Index-Redirect auf "zuhause", MietyPortalPage inline |
| EDIT | `src/pages/portal/miety/tiles/UebersichtTile.tsx` — Pfad-Anpassung |
| EDIT | `src/pages/portal/miety/tiles/VersorgungTile.tsx` — Pfad-Anpassung |
| EDIT | `src/pages/portal/miety/tiles/VersicherungenTile.tsx` — Pfad-Anpassung |
| EDIT | `src/pages/portal/miety/components/MietyCreateHomeForm.tsx` — Pfad-Anpassung |
| EDIT | `src/pages/portal/miety/components/MietyDossierHeader.tsx` — Pfad-Anpassung |
| EDIT | `src/pages/portal/miety/MietyHomeDossier.tsx` — Pfad-Anpassung |
| EDIT | `src/pages/portal/MietyPortalPage.tsx` — Fallback-Pfad-Anpassung |

Keine Datenbank-Änderungen nötig.
