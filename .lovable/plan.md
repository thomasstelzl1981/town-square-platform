

# Magic Intake Center — Sichtbarkeit auf Area Base verbessern

## Problem

Das Magic Intake Center wurde als Sub-Tile innerhalb von MOD-03 (DMS) unter `/portal/dms/intake` angelegt. Auf der Area-Uebersichtsseite `/portal/area/base` erscheinen nur die 3 Modul-Karten (Dokumente, Stammdaten, Armstrong). Der Nutzer findet das Intake Center nicht ohne den Umweg ueber DMS.

## Aktueller Zugriffspfad

```text
/portal/area/base → "Dokumente" klicken → DMS oeffnet sich → Tile "Magic Intake" waehlen
```

## Loesungsvorschlag: Intake als eigene Karte auf Area Base

### Option A — Eigener Eintrag in moduleContents + areaConfig (empfohlen)

Das Magic Intake Center bekommt einen eigenen Pseudo-Modul-Eintrag in `moduleContents.ts` (z.B. unter dem Key `INTAKE`) und wird in `areaConfig.ts` zur Area `base` hinzugefuegt. Dadurch erscheint es als eigene Karte neben Dokumente, Stammdaten und Armstrong.

**Aenderungen:**

1. **`src/components/portal/HowItWorks/moduleContents.ts`** — Neuer Eintrag `INTAKE` mit Titel "Magic Intake Center", oneLiner, benefits, und subTiles (die auf `/portal/dms/intake` verweisen)

2. **`src/manifests/areaConfig.ts`** — `INTAKE` in die Area `base` aufnehmen:
   ```
   modules: ['MOD-03', 'MOD-01', 'ARMSTRONG', 'INTAKE']
   ```

3. **`src/pages/portal/AreaOverviewPage.tsx`** — Im `defaultRoute`-Mapping einen Sonderfall fuer `INTAKE` ergaenzen, der auf `/portal/dms/intake` zeigt (aehnlich wie `ARMSTRONG` auf `/portal/armstrong` zeigt)

**Vorteile:**
- Sofort sichtbar auf Area Base als eigene Karte
- Kein neuer MOD-Code noetig (wie ARMSTRONG auch keinen hat)
- Bestehende Route `/portal/dms/intake` bleibt unveraendert
- AreaOverviewPage rendert die Karte automatisch

**Nachteile:**
- INTAKE ist kein echtes Modul, sondern ein Pseudo-Eintrag (aber ARMSTRONG funktioniert genauso)

### Option B — Nur einen Deep-Link in der MOD-03-Karte (minimal)

Die bestehende MOD-03 "Dokumente"-Karte bekommt in ihren `subTiles` einen prominenten Eintrag "Magic Intake". Kein neuer Eintrag auf der Area-Seite.

### Empfehlung

**Option A** — Das Intake Center verdient eine eigene Karte auf Area Base, da es ein zentraler Einstiegspunkt fuer alle Uploads ist und nicht hinter dem DMS versteckt sein sollte.

## Technische Details

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/components/portal/HowItWorks/moduleContents.ts` | Neuer Eintrag `INTAKE` mit Beschreibung und subTiles |
| `src/manifests/areaConfig.ts` | `'INTAKE'` zur Area `base` modules-Liste hinzufuegen |
| `src/pages/portal/AreaOverviewPage.tsx` | Sonderfall `INTAKE` im defaultRoute-Mapping (zeigt auf `/portal/dms/intake`) |

### Keine strukturellen Aenderungen

- Kein neuer MOD-Code
- Keine neuen Routen (bestehende Route wird wiederverwendet)
- Keine Aenderung an routesManifest.ts
- Keine DB-Aenderungen

