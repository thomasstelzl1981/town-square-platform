

## Quick Actions aufräumen — Admin Dashboard

### Was wird geändert

**1. "Published Preview" Abschnitt entfernen** (Zeilen 273–289 in `src/pages/admin/Dashboard.tsx`)

Der gesamte Block mit "Kaufy Preview (Published)" wird gelöscht. Er ist redundant, da der Kaufy-Link bereits oben unter "Zone 3 – Websites" existiert.

**2. Zone 3 Links — Prüfergebnis**

Alle 5 Links sind korrekt und stimmen mit der `zone3_sites.json` Registrierung überein:

| Button | Route | Registrierung | Status |
|--------|-------|---------------|--------|
| Kaufy | `/website/kaufy` | `kaufy` | Korrekt |
| System of a Town | `/website/sot` | `sot` | Korrekt |
| Lennox and Friends | `/website/tierservice` | `lennox` | Korrekt |
| Future Room | `/website/futureroom` | `futureroom` | Korrekt |
| Acquiary | `/website/acquiary` | `acquiary` | Korrekt |

Keine Linkänderungen nötig.

### Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/pages/admin/Dashboard.tsx` | Zeilen 273–289 (Published Preview Block) entfernen |

### Ergebnis

Die Quick Actions zeigen nur noch drei Abschnitte:
- Zone 2 – Portal (Button)
- Zone 3 – Websites (5 Buttons, alle korrekt verlinkt)
- Dokumentation (Export-Buttons)

