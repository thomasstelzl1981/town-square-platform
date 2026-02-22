

## Demo-Modus fuer systemofatown.com -- Verfeinert

### Konzept

Ein Besucher klickt auf der SoT-Website "Demo starten" und landet **ohne sichtbaren Login** direkt im Portal. Im Hintergrund passiert Folgendes:

1. **Stiller Auto-Login** mit einem festen Demo-Account (`demo@systemofatown.com`)
2. **Demo-Daten werden bei jedem Start frisch geseedet** (Clean-Slate-Prinzip: erst Cleanup, dann Seed)
3. **Manager-Module (Area "operations") sind komplett ausgeblendet** -- nur die 14 Basis-Module
4. **Beim Verlassen wird aufraeumen**: Logout + Cleanup der Demo-Daten

### Lebenszyklus einer Demo-Session

```text
Besucher klickt "Demo starten"
         |
         v
  /portal?mode=demo
         |
         v
  useDemoAutoLogin Hook:
    1. signInWithPassword(demo@..., geheimesPasswort)
    2. cleanupDemoData(tenantId)   -- altes entfernen
    3. seedDemoData(tenantId)      -- frisch befuellen
         |
         v
  Portal laedt:
    - Area "operations" (Manager-Module) ausgeblendet
    - Demo-Banner oben: "Demo-Modus | Eigenen Account erstellen"
         |
         v
  Besucher verlaesst (Tab schliessen, Navigation weg, "Account erstellen"):
    1. cleanupDemoData(tenantId)   -- Daten loeschen
    2. signOut()                   -- Session beenden
```

### Warum Cleanup beim Verlassen?

- Der Demo-Account wird von **allen Besuchern geteilt**
- Ohne Cleanup wuerden sich Aenderungen eines Besuchers akkumulieren
- Das Clean-Slate-Prinzip (Cleanup vor jedem Seed) faengt den Fall ab, wenn der Cleanup beim Verlassen fehlschlaegt (z.B. Browser-Tab wird hart geschlossen)
- **Doppelte Sicherheit**: Cleanup beim Start UND beim Verlassen

### Schritte

**1. Demo-Account in der Datenbank anlegen (SQL Migration)**
- User `demo@systemofatown.com` mit festem Passwort erstellen
- Profil: "Demo Benutzer", verknuepft mit Demo-Tenant (`a0000000-0000-4000-a000-000000000001`)
- Mitgliedschaft: Rolle `viewer` (kein Admin, kein Manager)
- Nur die 14 Basis-Module aktiviert (keine Manager-Module MOD-09 bis MOD-13, MOD-22)

**2. Neue Datei: `src/config/demoAccountConfig.ts`**
- `DEMO_EMAIL` und `DEMO_PASSWORD` als Konstanten
- `DEMO_HIDDEN_AREAS = ['operations']` -- filtert die gesamte Manager-Area raus
- `isDemoSession(user)` -- prueft anhand der User-Email ob es der Demo-Account ist
- Sicherheitshinweis: Credentials sind bewusst im Client -- der Account ist read-only und enthaelt nur Demo-Daten

**3. Neuer Hook: `src/hooks/useDemoAutoLogin.ts`**
- Erkennt `?mode=demo` in der URL
- Fuehrt `signInWithPassword` still aus (Lade-Spinner waehrenddessen)
- Nach erfolgreichem Login: `cleanupDemoData()` dann `seedDemoData()` ausfuehren
- Speichert `demo_mode=true` in `sessionStorage`
- Registriert Cleanup-Handler:
  - `beforeunload` Event: Cleanup + Logout (best-effort, funktioniert nicht immer)
  - `visibilitychange` zu `hidden`: Cleanup + Logout als Backup
  - Expliziter "Verlassen"-Button im Demo-Banner: zuverlaessigster Weg
- Bei Fehler: Redirect zu `/auth`

**4. Aenderung: `src/components/portal/PortalLayout.tsx`**
- `useDemoAutoLogin()` Hook einbinden
- Wenn Demo-Session aktiv (`isDemoSession(user)`):
  - Area `operations` aus Navigation herausfiltern (kein Rendering der Manager-Module)
  - Demo-Banner am oberen Rand: "Demo-Modus -- Eigenen Account erstellen" (Link zu `/auth?mode=register&source=sot`)
  - "Demo beenden"-Button im Banner, der explizit Cleanup + Logout ausfuehrt

**5. Aenderung: `src/pages/zone3/sot/SotDemo.tsx`**
- Alle "Demo starten" Links aendern: `/portal` wird zu `/portal?mode=demo`
- Modul-Direktlinks ebenfalls mit `?mode=demo` versehen

### Was passiert wenn der Browser einfach geschlossen wird?

- `beforeunload` und `visibilitychange` versuchen den Cleanup -- aber Browser garantieren das nicht
- **Deshalb der doppelte Schutz**: Beim naechsten "Demo starten" wird ZUERST `cleanupDemoData()` ausgefuehrt, bevor neu geseedet wird
- Das bestehende Clean-Slate-Prinzip aus `useDemoToggles.ts` wird hier wiederverwendet

### Betroffene Dateien

| Datei | Art | Aenderung |
|-------|-----|-----------|
| `src/config/demoAccountConfig.ts` | Neu | Demo-Credentials, isDemoSession(), DEMO_HIDDEN_AREAS |
| `src/hooks/useDemoAutoLogin.ts` | Neu | Auto-Login, Seed, Cleanup-on-Leave |
| `src/components/portal/PortalLayout.tsx` | Edit | Demo-Banner, Area-Filter, Hook-Einbindung |
| `src/pages/zone3/sot/SotDemo.tsx` | Edit | Links auf `?mode=demo` umstellen |
| Backend: SQL Migration | Neu | Demo-User, Profil, Membership, Module anlegen |

### Nicht betroffen

- AuthContext (nutzt normalen signIn-Flow, keine Aenderung)
- RLS-Policies (Demo-User nutzt bestehende Tenant-Isolation)
- Demo-Seed-Engine und Demo-Cleanup (werden wiederverwendet, nicht veraendert)
- Andere Brand-Websites (kaufy.immo etc.) bleiben komplett unveraendert
- Resend / Email-Provider wird nicht benoetigt (kein OTP, nur Password-Login)

