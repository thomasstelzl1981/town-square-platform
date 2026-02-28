
Ziel: Root-Domain-Redirect für ZL Wohnbau stabil machen und /portal auf Brand-Domains verhindern.

1) Verifiziert (Live-Test)
- `https://zl-wohnbau.de` → landet auf Portal-Login
- `https://zl-wohnbau.de/website/zl-wohnbau` → ZL Wohnbau Website lädt korrekt
- `https://zl-gruppe.com` → ZL Wohnbau Website lädt korrekt
- Interne Route für die Website: `/website/zl-wohnbau` (Home), plus z. B. `/website/zl-wohnbau/leistungen`, `/portfolio`, `/kontakt`

2) Fehlerbild eingrenzen
- `domainMap.ts` enthält `zl-wohnbau.de` korrekt.
- Zone-3-Routen für `zlwohnbau` sind vorhanden.
- Das Problem ist nicht die Zielroute, sondern der Einstieg über `/` (Root), der bei `zl-wohnbau.de` in `/portal` endet.

3) Umsetzungsplan (Code-Fix, robust)
- In `App.tsx` Root-Redirect robust machen:
  - Hostname normalisieren (`trim`, lowercase, trailing dot entfernen).
  - Domain-Auflösung über normalisierten Host.
- Zusätzlich Guard einbauen:
  - Wenn Brand-Domain erkannt und Pfad mit `/portal` startet, sofort auf `domainEntry.base` (`/website/zl-wohnbau`) umleiten.
  - Damit wird Fehlrouting auf Login zuverlässig abgefangen, selbst wenn extern `/portal` angesprungen wird.
- Optional in `useDomainRouter.ts`:
  - zentrale `normalizeHostname()` Funktion ergänzen und in Hook + Non-Hook-Version verwenden.

4) Verifikation nach Umsetzung
- Test 1: `https://zl-wohnbau.de` → muss direkt Website-Home zeigen
- Test 2: `https://zl-wohnbau.de/portal` → muss automatisch auf `/website/zl-wohnbau` gehen
- Test 3: `https://www.zl-wohnbau.de` dito
- Test 4: Regression-Check für `zl-gruppe.com` und `systemofatown.com`
- Test 5: Deep links wie `/website/zl-wohnbau/portfolio` bleiben funktionsfähig

5) Technische Details
- Betroffene Dateien:
  - `src/App.tsx`
  - `src/hooks/useDomainRouter.ts`
- Keine Datenbankänderung erforderlich.
- Keine Backend-Funktion erforderlich.
