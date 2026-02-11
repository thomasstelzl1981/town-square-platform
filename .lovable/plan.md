

# MOD-11 Restructuring: Finanzierungsakte als leeres Formular

## Problem

1. **"Neuer Fall"-Button** im Dashboard und in der Faelle-Liste verlinkt auf `/portal/finanzierung` (MOD-07 = Kundenmodul). Das ist falsch — der Finanzierungsmanager soll eigenstaendig Faelle anlegen koennen, nicht ueber das Kundenmodul gehen.

2. **"Finanzierungsakte"-Tile** zeigt aktuell die FMFaelle-Tabelle (Fallliste), nicht ein leeres befuellbares Formular. Erwartet wird: Ein leeres Formular analog zur Selbstauskunft, das der Manager manuell befuellt und mit "Finanzierungsakte erstellen" abspeichert.

3. **MOD-07 Selbstauskunft**: Die persistenten Profile (ohne `finance_request_id`) sind bereits leer — die befuellten Daten (Max Mustermann) haengen am Demo-Request (`00000000-...-04`). Keine DB-Bereinigung noetig.

---

## Loesung

### 1. Neue Seite: `FMFinanzierungsakte.tsx` (leeres Formular)

Eine neue Seite erstellen, die ein **leeres, befuellbares Formular** zeigt — strukturiert nach dem bestehenden FMFallDetail-Muster (Selbstauskunft-Sektionen: Person, Beschaeftigung, Bank, Einkommen, Ausgaben, Vermoegen), aber **ohne vorhandene Daten**.

Am Ende des Formulars ein Button **"Finanzierungsakte erstellen"**, der:
- Einen neuen `finance_request` Datensatz erstellt (status: `draft`, tenant_id des Managers)
- Ein neues `applicant_profile` erstellt (party_role: `primary`, verknuepft mit dem finance_request)
- Die eingegebenen Formulardaten in das applicant_profile speichert
- Eine public_id (SOT-F-...) generiert wird (via DB-Trigger)
- Nach Erstellung: Weiterleitung auf `faelle/:requestId` (den bestehenden FMFallDetail)

Das Formular verwendet die bestehenden Komponenten `PersonSection`, `EmploymentSection`, `BankSection`, `IncomeSection`, `ExpensesSection`, `AssetsSection` aus `ApplicantPersonFields.tsx`.

### 2. Dashboard-Button aendern

**Datei:** `FMDashboard.tsx` (Zeile 74)

- "Neuer Fall"-Button navigiert nicht mehr zu `/portal/finanzierung`
- Stattdessen: Navigation zu `/portal/finanzierungsmanager/finanzierungsakte`

### 3. FMFaelle-Button aendern

**Datei:** `FMFaelle.tsx` (Zeile 110)

- "Eigenen Fall anlegen"-Button navigiert ebenfalls zu `/portal/finanzierungsmanager/finanzierungsakte` statt `/portal/finanzierung`

### 4. Routing anpassen

**Datei:** `FinanzierungsmanagerPage.tsx`

Neue Route hinzufuegen:
```text
/portal/finanzierungsmanager/finanzierungsakte → FMFinanzierungsakte (neues leeres Formular)
```

### 5. Routes Manifest anpassen

**Datei:** `routesManifest.ts` (Zeile 366-371)

Tiles aktualisieren:
```text
Vorher:
  Dashboard | Finanzierungsakte (=FMFaelle) | Einreichung | Faelle (=Archiv)

Nachher:
  Dashboard | Finanzierungsakte (=FMFinanzierungsakte, neues Formular) | Einreichung | Faelle (=FMFaelle, Fallliste) | Archiv
```

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | **NEU** — Leeres befuellbares Formular mit "Erstellen"-Button |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | "Neuer Fall"-Button → navigiert zu `finanzierungsakte` |
| `src/pages/portal/finanzierungsmanager/FMFaelle.tsx` | Button-Link korrigieren, Titel zu "Faelle" |
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | Neue Route `finanzierungsakte` |
| `src/manifests/routesManifest.ts` | Tiles-Array anpassen (5 Tiles statt 4) |
| `src/pages/portal/finanzierungsmanager/index.ts` | Export fuer FMFinanzierungsakte hinzufuegen |

## Keine DB-Migration noetig

Die bestehenden Tabellen (`finance_requests`, `applicant_profiles`) und Trigger (`generate_public_id`) genuegen. Das Formular erzeugt Datensaetze ueber die bestehende Supabase-SDK-Logik.

## MOD-07 Selbstauskunft

Kein Reset noetig — die persistenten Profile (`finance_request_id IS NULL`) sind bereits leer. Die befuellten Demo-Daten (Max Mustermann, completion_score: 85) gehoeren zum Demo-Request `SOT-F-DEMO001` und werden korrekt nur dort angezeigt.
