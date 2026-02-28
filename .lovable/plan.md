

# Diagnose: zl-wohnbau.de leitet auf /auth statt auf ZL Wohnbau Website

## Problem

Die Code-Logik ist korrekt:
- `domainMap.ts` enthält `zl-wohnbau.de` → `{ siteKey: 'zlwohnbau', base: '/website/zl-wohnbau' }`
- `App.tsx` Zeile 81-85: Wenn `getDomainEntry()` eine Domain findet → Redirect auf `/website/zl-wohnbau`
- Wenn `getDomainEntry()` **null** zurückgibt → Redirect auf `/portal` → Auth-Guard → `/auth`

**Das bedeutet:** Der Hostname, unter dem die App geladen wird, ist **nicht** `zl-wohnbau.de` (sonst würde die domainMap greifen). Das passiert, weil die Domain **noch nicht in den Lovable-Projekt-Settings als Custom Domain konfiguriert** ist.

## Ursache

Selbst wenn DNS (A-Record 185.158.133.1) korrekt gesetzt ist, muss die Domain **zusätzlich** in den Lovable-Projekt-Einstellungen unter **Domains** hinzugefügt werden. Ohne das leitet Lovable's Infrastruktur den Traffic nicht korrekt an die App weiter, oder der Hostname stimmt nicht überein.

## Lösung

1. **Lovable-Projekt-Settings → Domains → "Connect Domain"** öffnen
2. `zl-wohnbau.de` als Custom Domain hinzufügen
3. `www.zl-wohnbau.de` ebenfalls hinzufügen
4. DNS-Einträge bei IONOS verifizieren:
   - A-Record `@` → `185.158.133.1`
   - A-Record `www` → `185.158.133.1`
   - TXT-Record `_lovable` → den angezeigten Verify-Wert eintragen
5. Optional: `zl-gruppe.com` und `www.zl-gruppe.com` ebenfalls als Custom Domains hinzufügen
6. SSL-Zertifikat wird automatisch provisioniert (kann bis 72h dauern)

**Keine Code-Änderungen nötig** — die Routing-Logik im Code ist vollständig korrekt. Es ist rein eine Infrastruktur-Konfiguration in den Projekt-Settings.

