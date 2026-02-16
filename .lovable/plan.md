

# Test-User anlegen und Zone 1 absichern

## Was aendert sich fuer dich?

**Nichts.** Der Entwicklungsmodus (`VITE_FORCE_DEV_TENANT`) bleibt aktiv. Du arbeitest genau wie bisher weiter. Die Aenderungen wirken sich nur auf die publizierte Version aus, in der sich echte Nutzer einloggen muessen.

## Was wird gebaut?

### 1. Backend-Funktion: `sot-create-test-user`

Eine neue Backend-Funktion, die nur von Platform Admins aufgerufen werden kann. Sie erstellt einen neuen User-Account mit:
- E-Mail + Passwort (vorgegeben)
- Sofort verifiziert (kein Bestaetigungslink noetig)
- Der bestehende DB-Trigger (`on_auth_user_created`) erstellt automatisch Profil, Organisation und Membership

**Sicherheit:**
- JWT-Pruefung: Nur eingeloggte User
- Rollen-Pruefung: Nur `platform_admin` darf Accounts anlegen
- Validierung: E-Mail-Format, Passwort-Mindestlaenge

### 2. UI-Erweiterung: Users-Seite in Zone 1

Die bestehende Users-Seite (`/admin/users`) bekommt einen zusaetzlichen Button **"Neuen Benutzer anlegen"**. Dieser oeffnet einen Dialog mit:

```text
E-Mail-Adresse:    [                              ]
Passwort:          [                              ]
Anzeigename:       [                              ]

Hinweis: Der Benutzer erhaelt automatisch einen eigenen
Mandanten und kann sich sofort mit diesen Daten einloggen.

[Benutzer anlegen]  [Abbrechen]
```

Nach erfolgreichem Anlegen wird die Mitgliederliste neu geladen und der neue User erscheint.

### 3. AdminLayout Guard verstaerken

Aktuell prueft der Guard in `AdminLayout.tsx` nur, ob der User eingeloggt ist. Fuer die publizierte Version wird eine zusaetzliche Pruefung eingebaut:

```text
VORHER:  Eingeloggt? -> Zone 1 zugaenglich
NACHHER: Eingeloggt UND (platform_admin ODER org_admin ODER internal_ops)? -> Zone 1
         Sonst: Weiterleitung zu /portal
```

Wichtig: Im Entwicklungsmodus (`isDevelopmentMode`) greift dieser Guard NICHT — du kommst weiterhin ueberall rein.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-create-test-user/index.ts` | Neue Backend-Funktion mit Admin-API |
| `src/pages/admin/Users.tsx` | Neuer "Benutzer anlegen"-Dialog mit Edge-Function-Aufruf |
| `src/components/admin/AdminLayout.tsx` | Guard: Nicht-Admins werden zu `/portal` weitergeleitet (nur published) |

Keine Datenbank-Migration noetig. Der bestehende `on_auth_user_created`-Trigger kuemmert sich um Profil und Mandanten-Erstellung.

## Ablauf zum Testen

1. Diese Aenderungen implementieren
2. Du pruefst alles in der Vorschau (fuer dich aendert sich nichts)
3. Wenn alles passt: Publish
4. In der publizierten Version: Zone 1 aufrufen, 2 Tester-Accounts anlegen
5. Tester erhalten E-Mail + Passwort, loggen sich ein, landen in Zone 2

