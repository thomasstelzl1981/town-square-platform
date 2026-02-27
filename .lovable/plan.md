

# Otto² Advisory Datenschutz — Vollstaendige Neufassung

## Ist-Zustand
Die aktuelle `OttoDatenschutz.tsx` enthaelt veraltete Daten: falsche Adresse (Deisenhofen statt Bogen), falscher Firmenname ("Komplett ZL"), kein IONOS-Hosting, keine TTDSG-Referenz, unvollstaendige Betroffenenrechte, fehlende Rechtsgrundlagen.

## Aenderung: `src/pages/zone3/otto/OttoDatenschutz.tsx` — Komplett neu

Struktur gemaess Aufgabe:

1. **Einleitung mit 5 offenen Fragen** (als Hinweisbox am Seitenanfang):
   - Cookie-Consent-Banner/Tool?
   - Webanalyse/Tracking?
   - Marketing-Pixel?
   - Kontaktformular — wohin Daten?
   - Externe Inhalte (Fonts, Maps, reCAPTCHA, Embeds)?

2. **Pflichtbausteine** (13 Sektionen):
   - §1 Verantwortlicher: ZL Finanzdienstleistungen GmbH, Ruselstrasse 16, 94327 Bogen, +49 (0)9422 4845, otto.stelzl@otto2advisory.com
   - §2 Hosting bei IONOS SE: AVV Art. 28, Server-Logfiles (IP, Zeitstempel, Request, Referrer, User-Agent), Art. 6(1)(f), Speicherdauer 14 Tage (als pruefbar markiert)
   - §3 Zugriffsdaten/Serverlogs: Datenarten, Zweck Betrieb/Sicherheit, Rechtsgrundlage, Speicherdauer
   - §4 Kontaktaufnahme per E-Mail/Telefon: Art. 6(1)(b)/(f)
   - §5 Kontaktformular/Finanzierungsanfragen: Art. 6(1)(b), Daten intern verarbeitet
   - §6 Cookies: nur technisch notwendig, §25 Abs. 2 TTDSG, kein Banner noetig
   - §7-§9 **Optionale Module** (klar als "NUR WENN GENUTZT — sonst entfernen" markiert):
     - Webanalyse/Tracking
     - Marketing-Pixel
     - Externe Inhalte (Fonts/Maps/Captcha/Embeds)
   - §10 Empfaenger/Kategorien
   - §11 Drittlandtransfer (Art. 44 ff.) — nur falls Tools ausserhalb EU
   - §12 Speicherdauer allgemein
   - §13 Betroffenenrechte: Art. 15-21 + Widerruf Art. 7(3)
   - §14 Beschwerderecht: zustaendige Aufsichtsbehoerde am Sitz (BayLDA als Beispiel)
   - §15 Sicherheitsmassnahmen (TOMs)
   - §16 Stand: 27.02.2026

### Nur eine Datei betroffen
Keine weiteren Aenderungen noetig.

