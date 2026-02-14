
# Modulbeschreibungen korrigieren (Area Overview)

## Aenderungen

Die Titel auf der Manager-Uebersichtsseite kommen aus `moduleContents.ts` und werden ueber `AreaModuleCard` angezeigt. Drei Titel muessen korrigiert werden:

| Modul | Aktuell | Neu |
|-------|---------|-----|
| MOD-13 | Projekte | Projektmanager |
| MOD-12 | Akquise-Manager | Akquise Manager |
| MOD-10 | Leads | Lead Manager |

Zusaetzlich muss die Area-Beschreibung im Header aktualisiert werden.

## Betroffene Dateien

### 1. `src/components/portal/HowItWorks/moduleContents.ts`
- MOD-13: `title: 'Projekte'` wird zu `title: 'Projektmanager'`
- MOD-12: `title: 'Akquise-Manager'` wird zu `title: 'Akquise Manager'` (Bindestrich entfernt)
- MOD-10: `title: 'Leads'` wird zu `title: 'Lead Manager'`

### 2. `src/pages/portal/AreaOverviewPage.tsx`
- Zeile 24: Die Area-Beschreibung fuer `operations` wird angepasst von "Akquise, Finanzierungsmanager, Projekte, Partner und Leads" zu "Projektmanager, Vertriebspartner, Finanzierungsmanager, Akquise Manager und Lead Manager"

### 3. `src/manifests/routesManifest.ts` (optional)
- MOD-10 `name: "Leadmanager"` zu `name: "Lead Manager"` — falls die Anzeige konsistent sein soll (wird aktuell in der Tab-Navigation angezeigt)

## Was sich NICHT aendert
- Routen-Pfade bleiben identisch
- Zone 1 / Admin-Seiten bleiben unveraendert
- `moduleLabelOverrides` in `areaConfig.ts` wird nicht benoetigt, da die Titel direkt aus `moduleContents.ts` kommen
