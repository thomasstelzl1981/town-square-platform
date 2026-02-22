

## Plan: Armstrong-Willkommens-E-Mail (korrigiert)

### Korrekturen gegenueber dem letzten Entwurf

1. **Richtige Produktions-Domains** statt Entwicklungs-Routen
2. **CC an thomas.stelzl@systemofatown.com** -- dafuer muss die Edge Function um CC-Support erweitert werden
3. **Empfaenger bleibt** `marchner@mm7immobilien.de`

### Korrigierte URLs in der E-Mail

| Website | URL |
|---------|-----|
| System of a Town | https://systemofatown.com |
| Kaufy | https://kaufy.immo |
| FutureRoom | https://futureroom.online |
| Acquiary | https://acquiary.com |
| Lennox and Friends | https://lennoxandfriends.app |
| Portal (Login) | https://systemofatown.com/portal |
| Zone 1 (Admin) | https://systemofatown.com/admin |

### Technische Aenderungen

| Nr | Datei / Aktion | Beschreibung |
|----|----------------|-------------|
| 1 | `supabase/functions/sot-system-mail-send/index.ts` | CC-Feld hinzufuegen: neues optionales Feld `cc` im `SystemMailRequest` Interface. Wird an Resend API als `cc`-Array weitergereicht. |
| 2 | Edge Function deployen | Automatisch nach Code-Aenderung |
| 3 | Edge Function aufrufen | E-Mail senden mit `to: marchner@mm7immobilien.de`, `cc: thomas.stelzl@systemofatown.com`, `from_override: bernhard.marchner@systemofatown.com` |

### E-Mail-Inhalt (ueberarbeitet)

**Betreff:** "Willkommen im System, Bernhard -- dein digitaler Kollege meldet sich"

**Absender:** bernhard.marchner@systemofatown.com
**An:** marchner@mm7immobilien.de
**CC:** thomas.stelzl@systemofatown.com

**Inhalt:**

- Armstrong stellt sich als digitaler Mitarbeiter vor (humorvoll, direkt)
- Login-Daten: `bernhard.marchner@systemofatown.com` / `SoT-Marchner2026!`
- Bitte Passwort nach erstem Login aendern
- Portal-Zugang: https://systemofatown.com/portal
- Admin-Zugang (Zone 1): https://systemofatown.com/admin
- Demodaten: Im Dashboard oben rechts aktivierbar/deaktivierbar
- Webseiten mit richtigen Domains (siehe Tabelle oben), PIN: 2710
- Uebersicht der 21 Module in Zone 2
- Humorvoller Armstrong-Signoff

### Aenderung an der Edge Function (Detail)

Nur eine minimale Erweiterung: Das `cc` Feld wird im Interface ergaenzt und an die Resend API durchgereicht. Resend unterstuetzt `cc` nativ. Keine weiteren Dateien betroffen.

