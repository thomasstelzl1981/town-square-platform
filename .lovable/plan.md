
# SubTab-Leisten und Seiten-Header Audit + Reparatur

## Analyse: Was stimmt nicht?

Ich habe die gesamte Kette geprueft: **Level-2-Modul-Tab** (moduleLabelOverrides) → **Level-3-SubTab** (routesManifest tiles.title) → **Seiten-Header** (ModulePageHeader title im Page-Component).

### Fehler 1: MOD-05 falsch als "Website Builder" gelabelt

In `areaConfig.ts` steht:
```
'MOD-05': 'Website Builder'
```

MOD-05 ist aber das **Pets**-Modul (base: "pets", tiles: Meine Tiere, Caring, Shop, Fotoalbum). Hier wurde der Label-Override falsch gesetzt.

### Fehler 2: Pets-Seiten haben keine ModulePageHeader

Die 4 Pets-Tabs (`PetsMeineTiere.tsx`, `PetsCaring.tsx`, `PetsShop.tsx`, `PetsFotoalbum.tsx`) nutzen **keine** `PageShell` + `ModulePageHeader`-Kombination. Stattdessen verwenden sie manuelle `<h2>`-Tags. Das widerspricht dem systemweiten Standard, den alle anderen Module einhalten.

### Fehler 3: Fehlende Konsistenz zwischen SubTab-Titel und Seiten-Header

Hier die vollstaendige Audit-Tabelle fuer Module mit Label-Overrides:

| Modul | Override-Label (Level 2) | SubTab-Titel (Level 3) | Page-Header (ModulePageHeader title) | Status |
|-------|--------------------------|------------------------|--------------------------------------|--------|
| MOD-03 "Dokumente" | Dokumente | Storage, Posteingang, Sortieren, Einstellungen | "Dateien", "Posteingang", "Sortieren", "Einstellungen" | SubTab sagt "Storage", Header sagt "Dateien" — inkonsistent |
| MOD-05 "Pets" | **Website Builder** (FALSCH!) | Meine Tiere, Caring, Shop, Fotoalbum | Manuelle h2-Tags, kein ModulePageHeader | 2 Fehler |
| MOD-17 "Fahrzeuge" | Fahrzeuge | Fahrzeuge, Boote, Privatjet, Angebote | "Fahrzeuge", "Boote & Yachten", "Privatjet", "Angebote" | OK (Boote vs "Boote & Yachten" = leichte Abweichung) |
| MOD-08 "Immo Suche" | Immo Suche | Suche, Favoriten, Mandat, Simulation | "OBJEKTSUCHE", ?, ?, "INVESTMENT-SIMULATION" | Page-Header passt nicht zu SubTab-Titeln |
| MOD-18 "Finanzen" | Finanzen | Uebersicht, Cashflow & Budget, Vertraege & Fixkosten, Risiko & Absicherung | Nicht geprueft (lazy-loaded) | Zu pruefen |
| MOD-19 "Photovoltaik" | (kein Override) | Anlagen, Enpal, Dokumente, Einstellungen | "ANLAGEN", "Einstellungen" | OK |

---

## Umsetzung

### 1. `areaConfig.ts` — MOD-05 Label-Override korrigieren

- `'MOD-05': 'Website Builder'` entfernen oder durch `'MOD-05': 'Pets'` ersetzen (damit der Manifest-Name "Pets" erhalten bleibt)

### 2. `routesManifest.ts` — SubTab-Titel korrigieren (MOD-03)

- MOD-03 tile "Storage" umbenennen zu "Dateien" (damit SubTab = Page-Header)

### 3. Pets-Seiten auf Standard umbauen (4 Dateien)

Alle 4 Pets-Tabs bekommen `PageShell` + `ModulePageHeader` statt manueller h2-Tags:

| Datei | Aenderung |
|-------|-----------|
| `PetsMeineTiere.tsx` | `<PageShell><ModulePageHeader title="MEINE TIERE" description="..." />` |
| `PetsCaring.tsx` | `<PageShell><ModulePageHeader title="CARING" description="..." />` |
| `PetsShop.tsx` | `<PageShell><ModulePageHeader title="SHOP" description="..." />` |
| `PetsFotoalbum.tsx` | `<PageShell><ModulePageHeader title="FOTOALBUM" description="..." />` |

### 4. MOD-08 Page-Header angleichen

Die Seiten nutzen Titel wie "OBJEKTSUCHE" und "INVESTMENT-SIMULATION", aber die SubTabs heissen "Suche" und "Simulation". Entweder SubTabs anpassen oder Page-Header — ich schlage vor, die Page-Header an die SubTab-Titel anzugleichen fuer Konsistenz.

### 5. MOD-17 Kleinigkeit: "Boote" SubTab vs "Boote & Yachten" Page-Header

SubTab sagt "Boote", Page sagt "Boote & Yachten" — einer der beiden sollte angepasst werden.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/areaConfig.ts` | MOD-05 Override entfernen/korrigieren |
| `src/manifests/routesManifest.ts` | MOD-03 tile title "Storage" → "Dateien" |
| `src/pages/portal/pets/PetsMeineTiere.tsx` | PageShell + ModulePageHeader einbauen |
| `src/pages/portal/pets/PetsCaring.tsx` | PageShell + ModulePageHeader einbauen |
| `src/pages/portal/pets/PetsShop.tsx` | PageShell + ModulePageHeader einbauen |
| `src/pages/portal/pets/PetsFotoalbum.tsx` | PageShell + ModulePageHeader einbauen |
| `src/pages/portal/investments/SucheTab.tsx` | Header "OBJEKTSUCHE" → "SUCHE" |
| `src/pages/portal/investments/SimulationTab.tsx` | Header "INVESTMENT-SIMULATION" → "SIMULATION" |
| `src/components/portal/cars/CarsBoote.tsx` | Header "Boote & Yachten" → "BOOTE" (oder SubTab anpassen) |
