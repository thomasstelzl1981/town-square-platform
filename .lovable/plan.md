

# MOD-22 (Pet Manager) im Bereich "Manager" sichtbar machen

## Problem

MOD-22 wurde als Route und Page angelegt, aber nie in die Area-Navigation eingetragen. Deshalb erscheint der Pet Manager weder im Bereich "Manager" noch auf irgendeiner Area-Uebersichtsseite.

Zwei Luecken muessen geschlossen werden:

## Aenderung 1: `src/manifests/areaConfig.ts`

MOD-22 zum `operations` (Manager) Array hinzufuegen:

```text
Vorher:  modules: ['MOD-13', 'MOD-09', 'MOD-11', 'MOD-12', 'MOD-10']
Nachher: modules: ['MOD-13', 'MOD-09', 'MOD-11', 'MOD-12', 'MOD-10', 'MOD-22']
```

Zusaetzlich einen Label-Override hinzufuegen:

```text
'MOD-22': 'Pet Manager'
```

## Aenderung 2: `src/components/portal/HowItWorks/moduleContents.ts`

Neuen Eintrag fuer MOD-22 anlegen (analog zu den anderen Modulen), damit die AreaOverviewPage eine Karte rendern kann:

```text
'MOD-22': {
  moduleCode: 'MOD-22',
  title: 'Pet Manager',
  oneLiner: 'Franchise-Partner Portal fuer Haustier-Dienstleistungen',
  ...
}
```

## Keine weiteren Aenderungen noetig

- Routen sind bereits in `routesManifest.ts` korrekt definiert
- `ManifestRouter.tsx` hat die Lazy Imports bereits
- `PetManagerPage.tsx` und alle Sub-Pages existieren bereits
- Es fehlt ausschliesslich die Praesentation in der Area-Navigation

