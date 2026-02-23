
Ziel: Demo-Seeding für Finanzierung stabil machen und sicherstellen, dass die Daten im MOD-11 tatsächlich sichtbar sind (Dashboard, Finanzierungsakte-Kontext, Einreichung).

## Was ich bereits eindeutig verifiziert habe

1. Seed läuft an, aber Finance-Datensätze werden wegen DB-Constraints verworfen.
   - `finance_requests_status_check` erlaubt nur: `draft | collecting | ready | submitted`
   - CSV nutzt aktuell u. a. `ready_for_submission` (ungültig)
   - `finance_mandates_status_check` erlaubt nur: `new | triage | delegated | accepted | rejected`
   - CSV nutzt aktuell `open` (ungültig)
   - `applicant_profiles_employment_type_check` erlaubt u. a. `unbefristet | befristet | beamter | selbststaendig | rente | sonstiges`
   - CSV nutzt aktuell `angestellt` (ungültig)
   - `applicant_profiles_party_role_check` erlaubt nur `primary | co_applicant`
   - CSV nutzt teilweise `applicant` (ungültig)

2. Zusätzlich ist MOD-11 Datenanzeige teilweise abgekoppelt:
   - In `src/pages/portal/FinanzierungsmanagerPage.tsx` werden `FMDashboard`, `FMEinreichung`, `FMArchiv` aktuell mit `cases={[]}` gerendert.
   - Ergebnis: selbst bei vorhandenen Fällen bleibt die Liste auf den Haupt-Tiles leer.

3. Aktueller DB-Zustand (Tenant): `finance_requests/applicant_profiles/finance_mandates` im Demo-ID-Bereich sind 0.

## Umsetzungsplan (konkret)

### 1) CSV-Werte auf gültige Enum-Werte korrigieren (harte Ursache beheben)

Dateien:
- `public/demo-data/demo_finance_requests.csv`
- `public/demo-data/demo_finance_mandates.csv`
- `public/demo-data/demo_applicant_profiles.csv`

Änderungen:
- `finance_requests.status`: `ready_for_submission` -> `ready`
- `finance_mandates.status`: `open` -> `new` oder `delegated` (ich setze gezielt `delegated`, damit es im Dashboard unter „Neue Mandate“ sofort sichtbar ist)
- `applicant_profiles.party_role`: `applicant` -> `primary`
- `applicant_profiles.employment_type`:
  - `angestellt` -> `unbefristet`
  - `selbstaendig` -> `selbststaendig`

Wichtig:
- ID-Struktur bleibt exakt im reservierten Bereich `d0000000-...-07xx`
- keine neuen Hardcoded-Daten im Code, nur CSV-SSOT.

### 2) Seed-Fehler nicht mehr „silent“ laufen lassen

Datei:
- `src/hooks/useDemoSeedEngine.ts`

Änderungen:
- `seedFromCSV(...)` wirft bei Chunk-Fehlern für betroffene Entität einen Fehler (statt nur Console-Log).
- `seed(...)` sammelt Fehler weiterhin, aber markiert Entität explizit als fehlgeschlagen.
- Rückgabe von `seedDemoData(...)` bleibt mit `success/errors`, wird aber zuverlässig bei echten Insert-/Constraint-Fehlern negativ.

Datei:
- `src/hooks/useDemoToggles.ts`

Änderungen:
- Nach `seedDemoData(...)` Ergebnis prüfen:
  - bei `success=false`: sichtbare Fehlermeldung mit erster/n relevanter Fehlursache(n) statt stillschweigend „fertig“.
- Fortschrittsanzeige bleibt aktiv wie umgesetzt, ergänzt um Failure-Hinweis.

### 3) MOD-11 Hauptseiten korrekt an echte Cases anbinden

Datei:
- `src/pages/portal/FinanzierungsmanagerPage.tsx`

Änderungen:
- `useFutureRoomCases()` im Page-Container nutzen.
- `cases` + `isLoading` an folgende Routen durchreichen:
  - `dashboard`
  - `einreichung`
  - `archiv`
- Dadurch verschwinden die statischen leeren Arrays `cases={[]}`.

### 4) Sichtbarkeit im MOD-11-Flow sofort sicherstellen

Dateien:
- `public/demo-data/demo_finance_mandates.csv` (Status wie oben auf `delegated`)
- optional/ergänzend `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx`

Änderungen:
- `READY_STATUSES` um DB-konforme Status ergänzen (`ready`, `submitted`), damit eingespielte Fälle nicht am Frontend-Filter vorbeifallen.
- Legacy-Status können als Fallback drin bleiben, aber DB-konforme Werte müssen priorisiert sein.

Hinweis:
- Damit sind Demo-Mandate auf Dashboard sichtbar.
- Einreichung bekommt nach korrekter Case-Anbindung + Status-Mapping die erwarteten Karten.

### 5) Cleanup-/Registry-Konsistenz prüfen und ggf. nachziehen

Dateien:
- `src/hooks/useDemoCleanup.ts`
- `src/config/demoDataRegistry.ts`
- `public/demo-data/demo_manifest.json`

Änderungen:
- Sicherstellen, dass alle Finance-Entitäten weiterhin vollständig registriert und bereinigbar sind.
- Falls für die Sichtbarkeit ein zusätzlicher Case-Seed nötig ist, wird die Entität ebenfalls vollständig in Registry + Cleanup aufgenommen (child-first cleanup bleibt gewahrt).

## Test- und Abnahmeplan (End-to-End)

1. Demo-Seed auslösen (Toggle OFF -> ON).
2. In der UI:
   - Fortschritt läuft sichtbar durch.
   - Bei Fehlern erscheint explizite Meldung (nicht nur Konsole).
3. DB-Checks:
   - `finance_requests` (2 Demo-Zeilen),
   - `applicant_profiles` (3 Demo-Zeilen),
   - `finance_mandates` (2 Demo-Zeilen).
4. MOD-11 prüfen:
   - Dashboard: „Neue Mandate“ zeigt Demo-Mandate.
   - Einreichung: Cases/Karten erscheinen nach Statusfilter.
   - Keine Constraint-Fehler mehr in Logs.

## Warum das dein aktuelles Problem direkt löst

- Der Seed „funktioniert nicht“ aktuell primär wegen ungültiger CSV-Status-/Enumwerte (harte DB-Blocker).
- Selbst wenn Daten vorhanden wären, sahst du in zentralen MOD-11-Routen teils nichts wegen `cases={[]}`.
- Mit beiden Fix-Blöcken (Datenvalidität + Datenbindung im Routing) wird der Prozess robust und sichtbar, inklusive sauberer Fehlerrückmeldung statt Blindflug.
