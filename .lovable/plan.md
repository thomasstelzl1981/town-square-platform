

# Auth-Seite: Email + Passwort Login zurueckbringen

## Problem

Die Login-Seite (`Auth.tsx`) bietet aktuell **nur** OTP (Email-Code) an. Das `AuthContext` hat bereits eine funktionierende `signIn(email, password)` Methode, aber die UI nutzt sie nicht. Auf Mobilgeraeten ist der OTP-Flow umstaendlich (Email-App wechseln, Code kopieren), was den Login verhindert.

## Loesung

Die Auth-Seite erhaelt **zwei Login-Methoden** — Email+Passwort als primaeren Flow und OTP als Alternative:

1. **Standard-Login**: Email + Passwort Felder mit "Anmelden" Button
2. **OTP-Alternative**: Link "Stattdessen Code per E-Mail erhalten" wechselt zum bisherigen OTP-Flow
3. **Identisch auf Desktop und Mobile** — kein plattformspezifischer Auth-Code

## Technische Details

### Datei: `src/pages/Auth.tsx`

- Step-Typ erweitern: `'login' | 'email' | 'pin'` (login = Passwort, email/pin = OTP)
- Default-Step: `'login'` (Passwort-Flow zuerst)
- Passwort-Feld hinzufuegen mit `signIn(email, password)` aus AuthContext
- Toggle-Links zwischen Passwort- und OTP-Flow
- Bestehender OTP-Flow bleibt vollstaendig erhalten

### Keine weiteren Dateiaenderungen noetig

- `AuthContext.tsx`: `signIn` existiert bereits (Zeile 265-268)
- `PortalLayout.tsx`: Redirect zu `/auth` funktioniert bereits
- Keine mobile-spezifische Auth-Logik — eine einzige Auth-Seite fuer alle Geraete

## Nach der Implementierung

Manueller Test auf Mobile-Viewport:
1. `/auth` oeffnen — Passwort-Login sichtbar
2. Email + Passwort eingeben — Login erfolgreich
3. Portal laedt — MOD-08 und MOD-09 testen (Investment Engine)

