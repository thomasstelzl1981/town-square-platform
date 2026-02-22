

## Plan: Demo-Account fixen, Marchner Super-User anlegen, Rollen-Anzeige korrigieren

### 1. Rollen-Anzeige in Zone 1 Users fixen

**Problem:** In `Users.tsx` (Zeile 85-86) werden die ROLES nach `membershipRole` dedupliziert. Da `super_user` und `client_user` beide `org_admin` als `membershipRole` haben und `super_user` zuerst im ROLES_CATALOG steht, wird jeder `org_admin` als "Super-User" angezeigt -- auch der Demo-Account, der nur ein Standardkunde ist.

**DB-Befund:** Der Demo-Account (`demo@systemofatown.com`) hat:
- `memberships.role = org_admin` (korrekt fuer Standardkunde)
- `user_roles` = leer (kein `super_user` Eintrag)

Er IST also korrekt ein Standardkunde. Nur die Anzeige ist falsch.

**Loesung:** Die Users-Seite muss zusaetzlich die `user_roles`-Tabelle abfragen. Bei `org_admin` wird geprueft, ob ein `super_user`-Eintrag in `user_roles` existiert:
- Ja: "Super-User" anzeigen
- Nein: "Standardkunde" anzeigen

Ausserdem werden E-Mail und Display-Name aus der `profiles`-Tabelle geladen, damit Accounts identifizierbar sind (statt nur User-ID).

### 2. Marchner Super-User Account anlegen

**Daten:**
- E-Mail: `bernhard.marchner@systemofatown.com`
- Password: Wird ueber `sot-create-test-user` Edge Function gesetzt (Standard-Passwort, das er dann aendert)
- Display-Name: "Bernhard Marchner"

**Schritte:**
1. Account anlegen via `sot-create-test-user` Edge Function
2. Nach Erstellung: `user_roles`-Eintrag mit `role = 'super_user'` einfuegen (per DB-Migration)
3. Damit bekommt er Zugriff auf alle 21 Module und wird korrekt als "Super-User" angezeigt

### 3. Technische Aenderungen

| Nr | Datei / Aktion | Beschreibung |
|----|----------------|-------------|
| 1 | `src/pages/admin/Users.tsx` | `fetchData()` erweitern: zusaetzlich `profiles` und `user_roles` Tabellen abfragen. Rollen-Anzeige korrigieren: bei `org_admin` + `user_roles.super_user` = "Super-User", bei `org_admin` ohne `user_roles` = "Standardkunde". E-Mail und Display-Name in Tabelle anzeigen statt nur User-ID. |
| 2 | Edge Function Call | `sot-create-test-user` aufrufen mit `bernhard.marchner@systemofatown.com`, Passwort, "Bernhard Marchner" |
| 3 | DB Insert | `user_roles` Eintrag: `user_id = [neue ID], role = 'super_user'` |

### 4. Rollen-Aufloesung (neue Logik in Users.tsx)

```text
membership.role === 'platform_admin'                                  --> "Platform Admin"
membership.role === 'org_admin' + user_roles enthält 'super_user'     --> "Super-User"
membership.role === 'org_admin' + user_roles leer                     --> "Standardkunde"
membership.role === 'sales_partner'                                   --> "Vertriebspartner"
membership.role === 'finance_manager'                                 --> "Finanzierungsmanager"
membership.role === 'akquise_manager'                                 --> "Akquise-Manager"
membership.role === 'project_manager'                                 --> "Projektmanager"
membership.role === 'pet_manager'                                     --> "Pet Manager"
```

### 5. Kein Onboarding-Drift

Der `handle_new_user()` Trigger erstellt automatisch Profil + Org + Membership bei jedem neuen Auth-User. Das funktioniert korrekt. Der einzige manuelle Schritt ist das Einfuegen des `super_user`-Eintrags in `user_roles` -- das ist by design, weil Super-User-Rechte nicht automatisch vergeben werden sollen (Sicherheit). Die Zone-1-UI sollte diesen Schritt kuenftig ueber den "Edit Role"-Dialog ermoeglichen, indem beim Setzen auf "Super-User" automatisch ein `user_roles`-Eintrag erstellt wird.

