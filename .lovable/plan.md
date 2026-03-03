

# Lennox & Friends — "Doc" bereinigen + neuer Menuepunkt "Lennox" (Founders)

## Blocker

**`src/manifests/routesManifest.ts` ist FROZEN (INFRA-manifests)**. Die neue Route `lennox` (Founders-Seite) muss dort registriert werden. Bitte sage **"UNFREEZE INFRA-manifests"**, damit ich starten kann.

## Aenderungen

### 1. Zahnzusatzversicherung entfernen (LennoxDoc.tsx)
- `INSURANCE_PRODUCTS` Array: 4. Eintrag (`Zahnzusatzversicherung`) loeschen
- Grid aendert sich von `lg:grid-cols-4` zu `lg:grid-cols-3`

### 2. "Unser Team" + "Gruenderin & Lennox" Sektionen aus Doc entfernen (LennoxDoc.tsx)
- Komplette Sektion "Pet Manager Vorstellung" (Zeilen 436-508) loeschen
- Komplette Sektion "Gruenderin & Lennox" (Zeilen 510-573) loeschen
- Doc behaelt nur: Hero → Tierarztsuche → Versicherungen (3 Kacheln) → CTA

### 3. Neue Seite `LennoxLennox.tsx` erstellen (Founders-Seite)
- Neuer Menuepunkt "Lennox" mit der Founders-Story
- Hero-Section im gleichen Format wie die anderen Lennox-Seiten
- **Sektion "Founders"**: Robyn + Lennox als Gruender praesentiert
- Robyn-Profilkarte (aus Doc uebernommen, angepasst als "Founder")
- Lennox-Profilkarte (als Co-Founder / Namensgeber)
- Foto-Galerie: 3 Bilder (See-Bild nur einmal, NICHT abgeschnitten — als grosses Hero oder Einzelbild)
  - `gruenderin_lennox.jpeg` (Robyn mit Lennox)
  - `gruenderin_pferd.jpeg` (Robyn mit Pferd)
  - `lennox_portrait.jpeg` (Lennox Portrait)
- `gruenderin_see.jpeg` wird als Hero-Bild der Seite verwendet (nicht im 3er-Grid, wo es abgeschnitten war)
- Story-Text (aus Doc uebernommen)

### 4. Navigation anpassen (LennoxLayout.tsx)
Neue Reihenfolge:
```text
Partner finden | Shop | Doc | Lennox | Partner werden | Login
```
- Neuer Link: `{ path: '/website/tierservice/lennox', label: 'Lennox', icon: PawPrint }`

### 5. Route registrieren (routesManifest.ts + Zone3Router.tsx)
- `routesManifest.ts`: Neue Route `{ path: "lennox", component: "LennoxLennox", title: "Lennox — Founders" }`
- `Zone3Router.tsx`: `LennoxLennox` lazy import + in `zone3ComponentMaps.lennox` registrieren

## Datei-Matrix

| Datei | Aenderung |
|---|---|
| `src/pages/zone3/lennox/LennoxDoc.tsx` | Zahnzusatz loeschen, Team+Gruenderin Sektionen entfernen |
| `src/pages/zone3/lennox/LennoxLennox.tsx` | NEU — Founders-Seite |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | Nav um "Lennox" erweitern |
| `src/manifests/routesManifest.ts` | Route hinzufuegen (NEEDS UNFREEZE) |
| `src/router/Zone3Router.tsx` | Lazy import + component map |

