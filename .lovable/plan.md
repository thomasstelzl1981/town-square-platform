
# Komplettanalyse: Stale Data bei ausgeschaltetem Demo-Button

## Befund

Bei ausgeschaltetem Demo-Toggle bleiben **6 verwaiste Datensaetze** sichtbar, die NICHT als Demo-IDs erkannt werden und daher vom `isDemoId()`-Filter nicht erfasst werden.

### Stale (Nicht-Demo) Records in der Datenbank

| # | Tabelle | ID | Beschreibung | Ursache |
|---|---------|----|--------------|---------| 
| 1 | `household_persons` | `b1f6d204-...` | "Max Mustermann, hauptperson" | Auto-Create durch FMUebersichtTab |
| 2 | `pension_records` | `2618b959-...` | Verknuepft mit Person b1f6d204 | Automatisch mit Person erstellt |
| 3 | `miety_homes` | `da78ca31-...` | "Villa Mustermann, Muenchen" | Auto-Create durch UebersichtTile |
| 4 | `finance_requests` | `32695673-...` | Status: draft | Manuell erstellt (Test) |
| 5 | `applicant_profiles` | `703e1648-...`, `a23366ab-...` | 2 Selbstauskunft-Profile | Manuell erstellt (Test) |
| 6 | `miety_loans` | `6db3e303-...` | Kredit-Eintrag | Manuell erstellt (Test) |

### Korrekte Demo-Daten (funktionieren bereits richtig)

Alle Datensaetze mit Demo-IDs (`d0000000...`, `e0000000...`, `00000000...`) werden korrekt erkannt und bei ausgeschaltetem Toggle ausgeblendet. Betrifft:
- 3 Properties, 3 Leases, 5 Contacts, 5 Pets, 7 Versicherungen, 4 KV-Vertraege, 2 Privatkredite, 2 Fahrzeuge, 3 Listings, 41 Dokumente, 1 PV-Anlage, 1 Finance Request, 1 Akquise-Mandat, 1 Akquise-Angebot, 1 Pet-Provider

## Ursachen

### Problem 1: Auto-Create erzeugt nicht-Demo-Daten
Zwei Stellen erzeugen automatisch Datensaetze mit realen UUIDs (die nicht in `ALL_DEMO_IDS` stehen):
- **`UebersichtTile.tsx`** (Zeile 89-105): Erstellt automatisch ein Home aus dem Profil wenn keins existiert
- **`FMUebersichtTab.tsx`** (Zeile 207-220): Erstellt automatisch eine `household_person` aus dem Profil

### Problem 2: Test-Daten aus manuellen Tests
Finance-Request (draft), Applicant-Profiles und Miety-Loans wurden waehrend der Entwicklung manuell erstellt und nie aufgeraeumt.

## Fix-Plan

### Schritt 1: DB-Bereinigung (Migration)
Alle 6 stale Records loeschen:

```text
DELETE household_persons   WHERE id = 'b1f6d204-...'
DELETE pension_records     WHERE id = '2618b959-...'
DELETE miety_homes         WHERE id = 'da78ca31-...'  (Villa Mustermann auto-create)
DELETE finance_requests    WHERE id = '32695673-...'
DELETE applicant_profiles  WHERE id IN ('703e1648-...', 'a23366ab-...')
DELETE miety_loans         WHERE id = '6db3e303-...'
```

### Schritt 2: Auto-Create nur bei Demo-AN
**`UebersichtTile.tsx`**: Auto-Create nur ausfuehren wenn `demoEnabled === true` -- bei ausgeschaltetem Demo soll kein Home automatisch erzeugt werden. Der User soll dann ein leeres Modul sehen.

**`FMUebersichtTab.tsx`**: Auto-Create fuer `household_persons` nur wenn Demo aktiv ist. Bei Demo-OFF soll der Finanzierungsmanager leer sein.

### Schritt 3: Sicherheitscheck in weiteren Modulen
Pruefen ob andere Stellen auch bei Demo-OFF Daten anzeigen (Vorsorge, Finanzanalyse). Die Pension-Records und Applicant-Profiles sind bereits durch die DB-Bereinigung geloest, aber die Auto-Create-Logik muss in allen betroffenen Modulen Demo-aware sein.

## Geaenderte/Neue Dateien

1. **SQL-Migration** -- 6 stale Records loeschen
2. **`src/pages/portal/miety/tiles/UebersichtTile.tsx`** -- Auto-Create nur bei demoEnabled
3. **`src/pages/portal/finanzierungsmanager/FMUebersichtTab.tsx`** -- Auto-Create nur bei demoEnabled

## Ergebnis nach Fix

Bei ausgeschaltetem Demo-Button: Alle Module zeigen leere Zustaende (Empty States). Nur Login, E-Mail und Kennwort bleiben bestehen. Keine Phantom-Daten mehr.
