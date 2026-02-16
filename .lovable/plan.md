

# E-Mail-Adresse aendern — Implementierung mit Admin-API

## Hintergrund

Die Login-E-Mail ist falsch (`systemofadown.com` statt `systemofatown.com`). Das Lovable Cloud Backend ist nicht ueber ein externes Dashboard erreichbar, daher muss die Aenderung ueber eine Backend-Funktion im Code erfolgen.

## Ablauf fuer den Nutzer

```text
1. Sicherheit-Tab oeffnen (bereits dort)
2. Karte aufklappen, "Aendern" neben Login-E-Mail klicken
3. Neue E-Mail eingeben (thomas.stelzl@systemofatown.com)
4. "E-Mail aendern" klicken
5. Backend aendert die E-Mail sofort (Admin-API, keine Bestaetigung an alte Adresse noetig)
6. Automatischer Logout nach 2 Sekunden
7. Neuer Login mit der korrekten E-Mail
```

## Technische Umsetzung

### 1. Neue Backend-Funktion: `sot-auth-change-email`

Datei: `supabase/functions/sot-auth-change-email/index.ts`

- POST-Endpunkt, erwartet `{ newEmail }` im Body
- Liest den Authorization-Header (JWT) und extrahiert die User-ID
- Erstellt einen Admin-Client mit `SUPABASE_SERVICE_ROLE_KEY` (automatisch in Edge Functions verfuegbar)
- Ruft `auth.admin.updateUserById(userId, { email: newEmail, email_confirm: true })` auf
- `email_confirm: true` markiert die neue Adresse sofort als verifiziert — keine Bestaetigung an die alte Adresse noetig
- CORS-Headers fuer Browser-Zugriff
- Eingabevalidierung (E-Mail-Format)

### 2. UI-Erweiterung: `src/pages/portal/stammdaten/SicherheitTab.tsx`

Im geoeffneten Zustand der Portalzugang-Card:

- Neuer State: `isEditingEmail`, `newEmail`, `emailLoading`
- "Aendern"-Button neben der aktuellen Login-E-Mail
- Nach Klick: Eingabefeld fuer neue E-Mail mit "E-Mail aendern" und "Abbrechen" Buttons
- Hinweistext: "Nach der Aenderung werden Sie abgemeldet und muessen sich mit der neuen Adresse anmelden."
- Handler ruft die Edge Function auf, zeigt Toast bei Erfolg/Fehler
- Bei Erfolg: `supabase.auth.signOut()` nach 2 Sekunden, Redirect zur Login-Seite

### 3. Hint-Text: `src/pages/portal/stammdaten/ProfilTab.tsx`

Das E-Mail-Feld im Profil-Tab: Hint von "Login-Identitaet -- nicht aenderbar" zu "Aenderbar unter Sicherheit" aendern.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-auth-change-email/index.ts` | Neue Backend-Funktion mit Admin-API |
| `src/pages/portal/stammdaten/SicherheitTab.tsx` | E-Mail-Aenderungs-UI |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Hint-Text anpassen |

Keine Datenbank-Migration noetig. Keine neuen Abhaengigkeiten.

