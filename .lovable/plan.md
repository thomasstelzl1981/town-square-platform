

# Analyse: Demo-Modul — Luecken, Timing-Probleme und fehlende Datenketten

## Zusammenfassung der gefundenen Probleme

Es gibt **3 strukturelle Luecken** und **2 Daten-Probleme**, die erklaeren, warum der Demo-Flow an mehreren Stellen abbricht.

---

## Problem 1: Fehlende `future_room_cases` — Datenkette bricht ab

**Kern-Bug:** Die Demo-Daten seeden `finance_requests` → `applicant_profiles` → `finance_mandates`, aber es werden **keine `future_room_cases` angelegt**. Die `future_room_cases`-Tabelle ist im Demo-Tenant komplett leer (DB-Abfrage bestaetigt: `[]`).

**Auswirkung:**
- `useFutureRoomCases()` liefert ein leeres Array
- FMDashboard zeigt **keine echten Faelle** — nur den hartcodierten Demo-Widget ("Max Muster, 450k")
- FMEinreichung hat `readyCases = []` → kein Fall auswaehlbar → Selbstauskunft nicht erreichbar

**Ursache:** `useAcceptMandate()` erstellt `future_room_cases` erst wenn ein Manager ein Mandat **manuell annimmt**. Die Demo-Mandates haben Status `delegated`/`new` und `assigned_manager_id = NULL`. Ohne Annahme entsteht kein FutureRoom-Case.

**Fix:** Entweder:
- (A) CSV `demo_future_room_cases.csv` anlegen und im Seed-Engine seeden, ODER
- (B) Den Seed-Engine erweitern: nach dem Seeden der `finance_mandates` automatisch das erste Mandat "annehmen" (Status → `accepted`, `future_room_cases` INSERT)

Empfehlung: **Option A** (CSV), weil konsistent mit dem SSOT-Prinzip.

---

## Problem 2: `assigned_manager_id = NULL` bei Demo-Mandaten

**DB-Stand:**
- `d0000000-...-0721`: status=`delegated`, `assigned_manager_id=NULL`
- `d0000000-...-0722`: status=`new`, `assigned_manager_id=NULL`

**Auswirkung:** Der FMDashboard-Filter fuer "Pending Mandates" prueft `m.assigned_manager_id === user?.id`. Da `assigned_manager_id` NULL ist, erscheinen die Mandate **nicht** in der Annahme-Box. Der Manager kann sie nicht annehmen.

**Fix:** Im `demo_finance_mandates.csv` ist keine `assigned_manager_id`-Spalte definiert. Der Seed-Engine setzt zwar `{ assigned_manager_id: userId }` als Override, aber das CSV hat bereits eine `id`-Spalte und `seedFromCSV` merged die Overrides korrekt. **Der Bug liegt darin, dass die DB-Werte NULL zeigen** — das deutet darauf hin, dass der Seed entweder noch nicht gelaufen ist oder der Override nicht greift.

**Fix:** CSV erweitern oder Seed-Engine debuggen, warum der `assigned_manager_id`-Override nicht in der DB ankommt.

---

## Problem 3: Hardcodiertes Demo-Widget im Dashboard

**Zeilen 325-343 in FMDashboard.tsx:** Es gibt ein hartcodiertes Demo-Widget ("Max Muster", "Friedrichstr. 100, Berlin", 450k, 1580/Monat) das ueber `demoEnabled` gesteuert wird. Das ist eine **DEMO DATA VIOLATION** — diese Daten sollten aus der DB kommen, nicht inline.

**Fix:** Dieses Widget entfernen und durch echte DB-Faelle ersetzen (sobald Problem 1 geloest ist).

---

## Problem 4: MOD-04 Zahlungsverkehr — Kontenabgleich

Die Suche nach `Kontenabgleich`, `sot-rent-match` und `Zuordnung` in `src/components/immobilien/` und `src/pages/portal/immobilien/` liefert **keine Treffer**. Das bedeutet:
- Der Zahlungsverkehr-Tab existiert konzeptionell (Memory beschreibt 4 Zonen), aber die **Abgleich-Aktivierung** ist moeglicherweise in einer anderen Datei implementiert oder noch nicht vollstaendig.
- Fuer die Demo muessen Demo-Banktransaktionen (existieren: 100 Stueck) korrekt den Demo-Mietvertraegen zugeordnet werden koennen.

**Weitere Analyse noetig:** Die Zahlungsverkehr-Implementierung muss geprueft werden, um den genauen Aktivierungs-Mechanismus zu finden.

---

## Problem 5: Zins-Ticker mit hardcodierten Raten

**Zeilen 94-99 in FMDashboard.tsx:** `mortgageRates` ist ein hardcodiertes Array mit Zinswerten. Das ist formal eine Demo-Data-Violation, aber als reine UI-Simulation (Storybook-Ausnahme) akzeptabel, solange es keine Business-Entity abbildet.

---

## Vorgeschlagener Umsetzungsplan

### Schritt 1: CSV `demo_future_room_cases.csv` erstellen
```
id;manager_tenant_id;finance_mandate_id;status;first_action_at
d0000000-0000-4000-a000-000000000731;{tenant};d0000000-0000-4000-a000-000000000721;active;2026-02-15T10:00:00Z
```

### Schritt 2: Seed-Engine erweitern
- Neuen Seed-Step `future_room_cases` nach `finance_mandates` einfuegen
- `demo_manifest.json` aktualisieren

### Schritt 3: Demo-Mandate fixen
- `demo_finance_mandates.csv` um Spalte `accepted_at` erweitern
- Status des ersten Mandats auf `accepted` setzen
- `assigned_manager_id` Uebertragung debuggen/fixen

### Schritt 4: Hardcodiertes Demo-Widget entfernen
- Zeilen 325-343 in FMDashboard.tsx entfernen (DEMO DATA VIOLATION)

### Schritt 5: Demo-Manifest und Cleanup aktualisieren
- `demo_manifest.json`: `future_room_cases` Entity hinzufuegen
- `useDemoCleanup.ts`: Cleanup-Logik fuer `future_room_cases` ergaenzen

### Schritt 6: MOD-04 Zahlungsverkehr pruefen
- Genauere Analyse der Zahlungsverkehr-Komponente, um den Abgleich-Mechanismus zu identifizieren

