

# Fix: Geldeingang-Tab nutzt Demo-Konto aus MOD-18

## Befund

| Modul | Datenquelle | Status |
|-------|-------------|--------|
| MOD-18 Konten | Clientseitig (`demoKontoData.ts`) | Funktioniert — Konto + 97 Transaktionen sichtbar |
| MOD-04 Geldeingang | Datenbank (`msv_bank_accounts`) | Leer — 0 Eintraege in der Tabelle |

Die Tabelle `msv_bank_accounts` hat 0 Eintraege. Die Demo-Daten in MOD-18 werden rein im Browser erzeugt (clientseitig) und nie in die Datenbank geschrieben. Deshalb sieht der Geldeingang-Tab in der Immobilienakte kein Konto.

## Loesung

Den Geldeingang-Tab (`src/components/portfolio/GeldeingangTab.tsx`) so erweitern, dass er -- analog zu MOD-18 -- die clientseitigen Demo-Daten nutzt, wenn der Demo-Toggle `GP-KONTEN` aktiv ist und keine echten Bankkonten in der Datenbank liegen.

### Aenderung in GeldeingangTab.tsx

1. **Import** der Demo-Daten und des Demo-Toggle-Hooks:
   - `DEMO_KONTO` aus `src/constants/demoKontoData.ts`
   - `useDemoToggles` aus dem bestehenden Demo-System

2. **Fallback-Logik** bei der Konto-Abfrage:
   - Wenn `msv_bank_accounts` leer ist UND `GP-KONTEN` aktiviert ist:
   - Das `DEMO_KONTO`-Objekt als einzelnes Element im `bankAccounts`-Array verwenden
   - Dadurch erscheint das Dropdown mit "Girokonto Sparkasse (DE89...)"

3. **Kein Schreiben in die Datenbank** — die Demo-Daten bleiben rein clientseitig, konsistent mit dem bestehenden Muster in MOD-18.

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/portfolio/GeldeingangTab.tsx` | Demo-Fallback fuer bankAccounts hinzufuegen wenn GP-KONTEN aktiv und DB leer |

### Was sich NICHT aendert

- `demoKontoData.ts` bleibt unveraendert
- Keine neuen Datenbank-Eintraege
- Keine Aenderungen an MOD-18

