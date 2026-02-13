
# MOD-20 (Haus) als Sub-Tab unter MOD-04 (Immobilien) einordnen

## Ueberblick

MOD-20 (Haus/Miety) wird aus der Level-2-Navigation (Missions-Area) entfernt und als zusaetzlicher Sub-Tab in der Level-3-Navigation von MOD-04 (Immobilien) angezeigt. Die Routen, Komponenten und Datenbank-Architektur bleiben vollstaendig unveraendert.

## Aenderungen

### 1. `src/manifests/areaConfig.ts` — MOD-20 aus Missions entfernen

Zeile 29: `'MOD-20'` aus dem `modules`-Array der Missions-Area entfernen.

Vorher: `modules: ['MOD-20', 'MOD-04', 'MOD-07', 'MOD-06', 'MOD-08']`
Nachher: `modules: ['MOD-04', 'MOD-07', 'MOD-06', 'MOD-08']`

MOD-20 wird keiner Area mehr zugeordnet — es ist nur noch ueber Immobilien erreichbar.

### 2. `src/manifests/routesManifest.ts` — MOD-04 Tiles erweitern

Ein neuer Tile-Eintrag wird zu MOD-04 hinzugefuegt, der auf die bestehende Miety-Route verlinkt:

```text
{ path: "haus", component: "MietyRedirect", title: "Haus" }
```

Dieser Eintrag erscheint als letzter Tab in der SubTabs-Leiste von Immobilien: Portfolio | Sanierung | Bewertung | Verwaltung | **Haus**

### 3. `src/pages/portal/ImmobilienPage.tsx` — Redirect-Route hinzufuegen

Eine neue Route wird hinzugefuegt, die `/portal/immobilien/haus` auf `/portal/miety` weiterleitet:

```text
<Route path="haus" element={<Navigate to="/portal/miety" replace />} />
```

### 4. Keine weiteren Aenderungen

- **MOD-20 Manifest-Eintrag** bleibt bestehen (eigene Routen, eigene Tiles)
- **MietyPortalPage.tsx** bleibt unveraendert
- **tile_catalog / Datenbank** bleibt unveraendert
- **Rollen-Logik** bleibt unveraendert

## Auswirkung

```text
Level 2 (Missions):    Immobilien | Finanzierung | Verkauf | Immo Suche
                       (Haus ist hier NICHT mehr sichtbar)

Level 3 (Immobilien):  Portfolio | Sanierung | Bewertung | Verwaltung | Haus
                       (Klick auf "Haus" leitet zu /portal/miety weiter)
```

## Risiken

- Wenn ein User direkt auf `/portal/miety` navigiert, funktioniert das weiterhin — MOD-20 ist als Modul nicht geloescht
- Die SubTabs-Leiste wechselt nach dem Redirect auf die Miety-eigenen Tabs (Uebersicht, Versorgung, etc.) — das ist korrektes Verhalten
- Die `deriveAreaFromPath`-Funktion findet fuer `/portal/miety` keine Area mehr, was bedeutet, dass keine Area in der Navigation aktiv hervorgehoben wird. Das ist akzeptabel, da Miety jetzt ein "eingebettetes" Modul ist.

