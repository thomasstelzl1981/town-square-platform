

# Plan: Armstrong-Begrüßungsmail an rr@unitys.com

## Vorhaben

Eine professionelle Begrüßungsmail von Armstrong (KI-Assistent) an Ralph Reinhold (rr@unitys.com) senden, über die System-E-Mail-Adresse `ralph.reinhold@systemofatown.com` via die Edge Function `sot-admin-mail-send`.

## Erkannte Daten

- **Empfänger:** rr@unitys.com (Ralph Reinhold)
- **Rolle:** super_manager bei UNITYS GmbH (Tenant 406f5f7a)
- **User-ID:** dd7f4f61-c423-4cac-8b51-d3420c77287a
- **Zugangsdaten:** E-Mail rr@unitys.com (Passwort muss aus DB/Auth bekannt sein — wir teilen die E-Mail-Adresse mit und weisen darauf hin, das Passwort NICHT zu ändern)

## Problem: Absender-Adresse

Die Edge Function `sot-admin-mail-send` sendet aktuell mit dem festen Absender `System of a Town <noreply@systemofatown.de>`. Die gewünschte Absenderadresse `ralph.reinhold@systemofatown.com` ist dort nicht konfiguriert. Zwei Optionen:

1. **Mail trotzdem über die bestehende Funktion senden** — Absender wird `noreply@systemofatown.de`, im Text wird klar, dass Armstrong im Auftrag von Ralph schreibt
2. **Absender in der Edge Function anpassen** — erfordert dass `ralph.reinhold@systemofatown.com` als verifizierte Domain/Adresse bei Resend hinterlegt ist

**Empfehlung:** Option 1 verwenden, da die Resend-Domain `systemofatown.de` bereits verifiziert ist. Im E-Mail-Text wird Armstrong sich im Auftrag von Ralph vorstellen.

## E-Mail-Inhalt (von Armstrong formuliert)

**Betreff:** Willkommen bei System of a Town — Dein neuer KI-Assistent Armstrong stellt sich vor

**Inhalt (gekürzte Zusammenfassung):**

Armstrong begrüßt Ralph herzlich im Team und stellt sich als persönlicher KI-Assistent vor. Die Mail enthält:

- Herzliche Begrüßung und Teamaufnahme
- Vorstellung von Armstrong als KI-Copilot
- **Links:** systemofatown.com + kaufy.immo
- **Zugangscode:** 2710 für die Website
- **Login-Daten:** rr@unitys.com + Hinweis, Passwort NICHT zu ändern
- **Modulübersicht** mit allen relevanten Modulen:
  - MOD-01 Stammdaten, MOD-02 KI Office (E-Mail, Brief, Kontakte, Kalender, Videocalls)
  - MOD-03 DMS, MOD-04 Immobilien, MOD-07 Finanzierung
  - MOD-08 Investment-Suche, MOD-18 Finanzen, MOD-19 Photovoltaik
  - MOD-16 Shop, MOD-15 Fortbildung, MOD-20 Miety (Home)
  - Partner-Module: MOD-09-14, MOD-17, MOD-21-22
- Abschluss mit Angebot zur Unterstützung

## Umsetzungsschritt

1. Edge Function `sot-admin-mail-send` aufrufen via `curl_edge_functions` mit dem fertigen HTML-Body
2. Die Funktion speichert die Mail in `admin_outbound_emails` und sendet sie über Resend

## Risiko

NIEDRIG — Kein Code-Change nötig, nur ein API-Call an die bestehende Edge Function.

