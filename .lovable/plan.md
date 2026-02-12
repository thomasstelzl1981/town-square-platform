
# Website-Links im Admin Dashboard aktualisieren

## Problem

Die Zone 3 Website-Routen wurden auf das Praefix `/website/*` umgestellt (definiert in `routesManifest.ts`), aber die Quick-Action-Buttons im Admin Dashboard (`src/pages/admin/Dashboard.tsx`) verweisen noch auf die alten Routen:

| Button | Aktuell (kaputt) | Korrekt (neu) |
|---|---|---|
| Kaufy | `/kaufy2026` | `/website/kaufy` |
| System of a Town | `/sot` | `/website/sot` |
| Miety | `/miety` | `/website/miety` |
| Future Room | `/futureroom` | `/website/futureroom` |
| Acquiary | `/acquiary` | `/website/acquiary` |
| Kaufy Preview | `/kaufy2026` (window.open) | `/website/kaufy` |

## Aenderung

**Datei:** `src/pages/admin/Dashboard.tsx`

6 navigate/window.open-Aufrufe werden aktualisiert:

- Zeile 183: `navigate('/kaufy2026')` wird zu `navigate('/website/kaufy')`
- Zeile 191: `navigate('/sot')` wird zu `navigate('/website/sot')`
- Zeile 199: `navigate('/miety')` wird zu `navigate('/website/miety')`
- Zeile 207: `navigate('/futureroom')` wird zu `navigate('/website/futureroom')`
- Zeile 215: `navigate('/acquiary')` wird zu `navigate('/website/acquiary')`
- Zeile 233: `window.open(...'/kaufy2026', ...)` wird zu `window.open(...'/website/kaufy', ...)`

Keine weiteren Dateien betroffen -- nur das Admin Dashboard hat diese direkten Links.
