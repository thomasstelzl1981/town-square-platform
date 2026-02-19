

# Fix: Doppeltes Bankkonto in MOD-18 Konten

## Befund

Es gibt **zwei Quellen** fuer dasselbe Konto "Girokonto Sparkasse":

### Quelle 1: Client-seitige Demo (GRUEN)
- Definiert in `src/constants/demoKontoData.ts` als `DEMO_KONTO` (id: `__demo_konto__`)
- Wird in `KontenTab.tsx` (Zeile 329-357) als Demo-Widget mit gruenem Glow angezeigt wenn GP-KONTEN aktiv ist
- IBAN: DE89370400440532013000 — **korrekt, das ist das offizielle Demo-Konto**

### Quelle 2: DB-Record (ROT/ROSE)
- ID: `00000000-0000-4000-a000-000000000300` in Tabelle `msv_bank_accounts`
- Wurde irgendwann in die DB geschrieben (keine Migration mehr vorhanden — wahrscheinlich aus einer frueheren, geloeschten Seed-Migration)
- Gleiche IBAN, gleicher Bankname, gleicher BIC
- `owner_id`: `d0000000-0000-4000-a000-000000000010` (= Demo-Property aus MOD-04)
- **Problem**: Die ID ist NICHT in `ALL_DEMO_IDS` registriert, daher wird sie vom `isDemoId()`-Filter nicht erkannt
- Der `KontenTab` filtert DB-Records auch gar nicht nach Demo-IDs — er zeigt einfach ALLE Konten des Tenants

### Verbindung zu Modul 4 und CSV
- Das DB-Konto (`...000300`) ist ueber `owner_id` mit der Demo-Property `d0000000-...-000000000010` verknuepft (MOD-04 Vermietereinheit)
- Die CSV-Datei `public/demo-data/demo_bank_accounts.csv` enthaelt dieselben Daten (IBAN, Bank, Kontoinhaber) — sie ist die Quelle fuer die clientseitige Demo-Darstellung, NICHT fuer den DB-Record
- **Das DB-Konto ist das Duplikat und kann sicher geloescht werden**

## Fix-Plan

### Schritt 1: DB-Record loeschen (Migration)
Das verwaiste DB-Konto `00000000-0000-4000-a000-000000000300` per SQL-Migration loeschen. Es ist ein Phantom aus einer alten Seed-Migration.

```text
DELETE FROM msv_bank_accounts 
WHERE id = '00000000-0000-4000-a000-000000000300';
```

### Schritt 2: Demo-ID registrieren (Absicherung)
Die ID `00000000-0000-4000-a000-000000000300` in `ALL_DEMO_IDS` in `data.ts` aufnehmen, damit falls sie jemals wieder auftaucht (z.B. durch eine zukuenftige Migration), der `isDemoId()`-Filter sie erkennt.

### Schritt 3: KontenTab Demo-Filter ergaenzen
In `KontenTab.tsx` die DB-Ergebnisse durch `filterOutDemoIds()` filtern, damit DB-Records mit Demo-IDs bei ausgeschaltetem Toggle nicht angezeigt werden. Das ist eine Sicherheitsebene die in anderen Modulen bereits existiert.

```text
// Zeile nach bankAccounts-Query:
const filteredAccounts = showDemo 
  ? bankAccounts 
  : filterOutDemoIds(bankAccounts);
```

## Ergebnis

- Demo AN: 1x gruenes Demo-Widget "Girokonto Sparkasse" (clientseitig)
- Demo AUS: 0 Konten (leerer Zustand)
- Kein Duplikat mehr sichtbar

## Geaenderte/Neue Dateien

1. **Neue SQL-Migration** — DB-Record `...000300` loeschen
2. **`src/engines/demoData/data.ts`** — ID in ALL_DEMO_IDS aufnehmen
3. **`src/pages/portal/finanzanalyse/KontenTab.tsx`** — Demo-Filter fuer DB-Records
