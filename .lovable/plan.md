

## Problem

Google's Branding-Verification hat **zwei** Befunde:
1. "Homepage enthält keinen Link zur Datenschutzerklärung" — weil der Crawler auf der Homepage das PIN-Gate sieht, nicht den Footer mit dem Datenschutz-Link
2. "Datenschutz-URL ist identisch mit Homepage" — weil beide das PIN-Gate anzeigen (dieser Punkt ist durch den Legal-Bypass jetzt gelöst)

**Punkt 1 bleibt offen:** Die Homepage (`systemofatown.com`) zeigt dem Crawler immer noch das PIN-Gate, also keinen Footer mit Datenschutz-Link.

## Optionen

### Option A: PIN-Sperre komplett deaktivieren (für SoT)
- Einfachste Lösung
- Google kann alles crawlen
- Webseite ist dann öffentlich zugänglich

### Option B: PIN-Sperre nur für die Homepage zusätzlich aufheben
- Homepage wird ohne PIN angezeigt → Footer mit Datenschutz-Link sichtbar
- Alle anderen Seiten (Plattform, Module, Preise, etc.) bleiben hinter dem PIN-Gate
- Google kann Homepage + Legal-Seiten crawlen

### Option C: PIN-Sperre über die Admin-Toggle komplett ausschalten
- Im Zone 1 Admin Dashboard den Toggle `pin_gate_enabled` auf `false` setzen
- Keine Code-Änderung nötig — rein konfigurativ
- Alle Seiten sofort öffentlich

## Empfehlung

**Option C** ist am saubersten: Die PIN-Sperre war für die Beta-Phase gedacht. Für die Google-Verification einfach den Toggle in der Admin-Oberfläche auf `false` setzen, Verification durchlaufen lassen, danach bei Bedarf wieder aktivieren.

Falls die PIN dauerhaft bleiben soll, dann **Option B**: Homepage zusätzlich vom PIN-Gate ausnehmen. Änderung in `SotLayout.tsx`:

```typescript
const legalPaths = ['/impressum', '/datenschutz'];
const isLegalPage = legalPaths.some(p => location.pathname.endsWith(p));
const isHomePage = location.pathname === '/' || location.pathname === '/website/sot' || location.pathname === '/website/sot/';

if (pinGateEnabled && !pinVerified && !isLegalPage && !isHomePage) {
  return <WebsitePinGate ... />;
}
```

## Betroffene Datei
- `src/pages/zone3/sot/SotLayout.tsx` — Homepage-Bypass hinzufügen (nur bei Option B)

## AGB-Seite
Es gibt aktuell **keine AGB-Seite** für SoT. Falls Google diese verlangt, muss sie separat erstellt werden (eigener Task).

