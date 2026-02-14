
# Modulbeschreibungen korrigieren: MOD-05 und MOD-16

## Aenderungen

### 1. MOD-05 (Pets) — Kachel-Titel und Beschreibung

In `src/components/portal/HowItWorks/moduleContents.ts`:
- Zeile 192: `title: 'Website Builder'` wird zu `title: 'Haustiere'`
- Zeile 193: `oneLiner` wird geaendert zu einer Haustier-Beschreibung, z.B. "Verwalten Sie Ihre Haustiere — Tierakten, Pflege, Fotoalbum und Shop."
- `benefits`, `whatYouDo` und `flows` werden entsprechend auf Haustier-Inhalte aktualisiert

Der Sub-Tab-Name "Pets" in `routesManifest.ts` (Zeile 263) bleibt unveraendert — das ist korrekt.

### 2. MOD-16 (Shops zu Shop)

**`src/components/portal/HowItWorks/moduleContents.ts`:**
- Zeile 582: `title: 'Shops'` wird zu `title: 'Shop'`

**`src/manifests/routesManifest.ts`:**
- Zeile 468: `name: "Shops"` wird zu `name: "Shop"`

### 3. Area-Beschreibung

In `src/pages/portal/AreaOverviewPage.tsx`, Zeile 25:
- Die services-Beschreibung wird ggf. angepasst, falls "Shops" dort vorkommt (aktuell nicht der Fall — kein Handlungsbedarf).

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/HowItWorks/moduleContents.ts` | MOD-05: Titel "Haustiere", neue Beschreibung; MOD-16: "Shop" statt "Shops" |
| `src/manifests/routesManifest.ts` | MOD-16: name "Shop" statt "Shops" |

## Was sich NICHT aendert

- MOD-05 `name: "Pets"` in routesManifest bleibt (Sub-Tab-Label)
- Routen-Pfade bleiben identisch
- Area-Beschreibung in AreaOverviewPage muss nicht geaendert werden
