

# Fix: Pet Manager Navigation und Admin-Desk korrigieren

## Problem 1: Falsche Routen in moduleContents (MOD-22)

Die subTiles in `moduleContents.ts` zeigen auf nicht-existierende Pfade (`/portal/pet-manager/dashboard` etc.). Die tatsaechlichen Routen aus `routesManifest.ts` sind:

- `/portal/petmanager/buchungen`
- `/portal/petmanager/leistungen`
- `/portal/petmanager/zahlungen`
- `/portal/petmanager/kunden`
- `/portal/petmanager/uebersicht`

**Aenderung in `src/components/portal/HowItWorks/moduleContents.ts`** (Zeilen 785-790):

Die subTiles muessen die echten Tile-Titel und Routen widerspiegeln:

```text
Vorher:
  { title: 'Dashboard', route: '/portal/pet-manager/dashboard', ... }
  { title: 'Partner',   route: '/portal/pet-manager/partner', ... }
  { title: 'Services',  route: '/portal/pet-manager/services', ... }
  { title: 'Netzwerk',  route: '/portal/pet-manager/netzwerk', ... }

Nachher:
  { title: 'Kalender & Buchungen',          route: '/portal/petmanager/buchungen', ... }
  { title: 'Leistungen & Verfuegbarkeit',   route: '/portal/petmanager/leistungen', ... }
  { title: 'Zahlungen & Rechnungen',        route: '/portal/petmanager/zahlungen', ... }
  { title: 'Kunden & Tiere',                route: '/portal/petmanager/kunden', ... }
  { title: 'Uebersicht',                    route: '/portal/petmanager/uebersicht', ... }
```

## Problem 2: Zone 1 Admin-Desk aktualisieren

`src/pages/admin/desks/PetmanagerDesk.tsx` referenziert noch MOD-05 und zeigt nur einen Platzhalter. Er soll als Governance-Desk fuer das gesamte PET-Vertical dienen (MOD-05 Pets + MOD-22 Pet Manager).

**Aenderung in `PetmanagerDesk.tsx`**:
- `moduleCode` von `"MOD-05"` auf `"MOD-05"` belassen (Zone 1 ueberwacht das Client-Modul Pets)
- Subtitle und Inhalt aktualisieren, um die Governance-Rolle klarer zu machen (Uebersicht ueber Provider, Umsaetze, offene Forderungen)

**Aenderung in `src/manifests/operativeDeskManifest.ts`** (Zeile 65-78):
- `displayName` von `'Petmanager'` zu `'Pet Governance'` oder passend umbenennen
- Responsibilities aktualisieren um Zahlungs-Governance und Provider-Uebersicht zu reflektieren

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/HowItWorks/moduleContents.ts` | subTiles-Routen und Titel an routesManifest angleichen |
| `src/pages/admin/desks/PetmanagerDesk.tsx` | Inhalt und Beschreibung aktualisieren |
| `src/manifests/operativeDeskManifest.ts` | displayName und responsibilities aktualisieren |

