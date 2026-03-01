

## Problem

Google's OAuth Branding-Verification scheitert aus einem klaren Grund: **Die PIN-Sperre (Code 2710) blockiert Google's Crawler.**

Wenn Google `systemofatown.com` crawlt, sieht der Bot:
1. **Homepage** → PIN-Gate-Screen (kein Footer mit Datenschutz-Link sichtbar)
2. **`/datenschutz`** → derselbe PIN-Gate-Screen

Beide URLs liefern identischen Content (das PIN-Eingabeformular) → Google meldet "URLs sind identisch".

## Lösung

Legal-Seiten (`/impressum`, `/datenschutz`) müssen die PIN-Sperre **umgehen**, damit Google sie crawlen kann.

### Änderung in `src/pages/zone3/sot/SotLayout.tsx`

Die PIN-Gate-Logik (Zeile 41-43) wird um eine Pfad-Prüfung erweitert:

```typescript
const legalPaths = ['/website/sot/impressum', '/website/sot/datenschutz'];
const isLegalPage = legalPaths.some(p => location.pathname.endsWith(p));

if (pinGateEnabled && !pinVerified && !isLegalPage) {
  return <WebsitePinGate ... />;
}
```

Dasselbe Muster wird für die anderen 4 Brand-Layouts angewendet (Kaufy, FutureRoom, Acquiary, Lennox), damit alle Legal-Seiten crawlbar bleiben.

### Betroffene Dateien
1. `src/pages/zone3/sot/SotLayout.tsx` — PIN-Bypass für `/impressum` + `/datenschutz`
2. `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` — gleicher Bypass
3. `src/pages/zone3/futureroom/FutureRoomLayout.tsx` — gleicher Bypass
4. `src/pages/zone3/acquiary/AcquiaryLayout.tsx` — gleicher Bypass
5. `src/pages/zone3/lennox/LennoxLayout.tsx` — gleicher Bypass

### Google Cloud Console

Nach dem Deploy:
- **Homepage URL:** `https://systemofatown.com` (Footer zeigt Datenschutz-Link)
- **Privacy Policy URL:** `https://systemofatown.com/datenschutz` (zeigt tatsächlichen Datenschutztext)
- Branding-Verification erneut einreichen

