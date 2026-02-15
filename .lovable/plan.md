
# Demo-Konto Widget + Kontoakte fuer MOD-18 Finanzanalyse Uebersicht

## Uebersicht

Die Finanzanalyse-Uebersicht (MOD-18) erhaelt ein emerald-gruenes Demo-Widget fuer ein Beispiel-Bankkonto. Beim Klick oeffnet sich darunter eine grosse "Kontoakte" mit Kategorisierung, Kontoanbindung und Kontobewegungen. Gleichzeitig werden die beiden bestehenden Dummy-Kacheln ("Kontoanbindung" in der Personenakte und auf der Uebersicht-Seite) entfernt, da die Kontoanbindung kuenftig ausschliesslich innerhalb der Kontoakte stattfindet.

---

## Teil 1: Entfernen der Dummy-Kacheln

### Block B in UebersichtTab.tsx (Zeilen 362-380)

Der bestehende "Bankkonten werden ueber FinAPI angebunden"-Platzhalter (Card mit dashed border und Link zum Finanzmanager) wird komplett entfernt. Er wird durch das neue Konto-Widget-Grid ersetzt.

### Block B in FMUebersichtTab.tsx (Zeilen 277-298)

Der "Konten"-Block im Finanzierungsmanager-Uebersicht, der ebenfalls ein Konten-Listing mit FinAPI-Hinweis zeigt, wird entfernt. Der Finanzierungsmanager verweist kuenftig per Link auf die Finanzanalyse-Uebersicht fuer die Kontoverwaltung.

---

## Teil 2: Golden Path Registrierung

### goldenPathProcesses.ts

Neuer Eintrag `GP-KONTEN` fuer MOD-18:

| Feld | Wert |
|------|------|
| id | `GP-KONTEN` |
| moduleCode | `MOD-18` |
| moduleName | `Finanzen` |
| tilePath | `/portal/finanzanalyse/dashboard` |
| processName | `Kontoverwaltung` |
| demoWidget.title | `Demo: Girokonto Sparkasse` |
| demoWidget.subtitle | `IBAN DE89 3704 ••••, Kategorie: Vermietung` |
| demoWidget.data | `{ bank: 'Sparkasse', iban: 'DE89370400440532013000', category: 'vermietung', balance: 12450.80 }` |

### demoDataManifest.ts

Neuer Eintrag fuer `GP-KONTEN` mit `scope: 'z2_only'`, consumer in `UebersichtTab.tsx`.

---

## Teil 3: Neues Widget-Grid in UebersichtTab.tsx

Der bestehende Block B ("Konten") wird ersetzt durch ein `WidgetGrid` mit:

1. **Demo-Widget an Position 0** — Emerald-gruenes Widget mit DEMO_WIDGET Styling aus dem designManifest:
   - Titel: "Demo: Girokonto Sparkasse"
   - Subtitle: "IBAN DE89 3704 ••••"
   - Badge: "Demo" (emerald)
   - Klick oeffnet die Kontoakte darunter

2. **Echte Konto-Widgets** — Fuer jedes vorhandene `msv_bank_accounts` Konto ein Widget:
   - Titel: account_name
   - Subtitle: IBAN (maskiert)
   - Badge: Kategorie (aus bank_account_meta)
   - Klick oeffnet die Kontoakte

3. **CTA-Widget "Konto hinzufuegen"** — Dashed Border, Plus-Icon, oeffnet AddBankAccountDialog

### Kontoakte (Inline-Detail unterhalb des Grids)

Wenn ein Konto (Demo oder echt) angeklickt wird, oeffnet sich darunter eine grosse Karte mit 3 Sektionen:

**Sektion 1: Kontodaten und Kategorisierung**
- Kontobezeichnung (editierbar)
- IBAN (anzeige/editierbar)
- Bank
- Kategorie-Dropdown: Privat, Vermietung, Photovoltaik, Tagesgeld, Sonstiges
  (Nutzt den bestehenden Enum `bank_account_category` mit Werten: privat, vermietung, tagesgeld, pv, sonstiges)

**Sektion 2: Kontoanbindung (FinAPI)**
- Status-Anzeige: Verbunden / Nicht verbunden
- Button "Konto anbinden" (Platzhalter fuer FinAPI-Integration)
- Bei Demo: Info-Text "Dies ist ein Demo-Konto. Kontoanbindung nicht verfuegbar."

**Sektion 3: Kontobewegungen**
- Beschriftete Tabelle mit Spalten: Datum | Buchungstext | Betrag | Saldo
- Fuer Demo: 10 synthetische Beispiel-Transaktionen (Mieteingaenge, Ueberweisungen, etc.)
- Fuer echte Konten: Platzhalter "Transaktionen werden nach FinAPI-Anbindung geladen"

---

## Teil 4: Demo-Daten (Client-seitig)

### armstrongCoachMessages.ts oder eigene Konstanten-Datei

Synthetische Demo-Transaktionen fuer das Demo-Konto:

| Datum | Buchungstext | Betrag | Saldo |
|-------|-------------|--------|-------|
| 01.02.2026 | Miete WE-01 Schmidt | +850,00 | 12.450,80 |
| 01.02.2026 | Miete WE-02 Mueller | +720,00 | 11.600,80 |
| 05.01.2026 | Grundsteuer Q1 | -380,00 | 10.880,80 |
| 01.01.2026 | Miete WE-01 Schmidt | +850,00 | 11.260,80 |
| 01.01.2026 | Miete WE-02 Mueller | +720,00 | 10.410,80 |
| 15.12.2025 | Hausverwaltung Dez | -195,00 | 9.690,80 |
| 01.12.2025 | Miete WE-01 Schmidt | +850,00 | 9.885,80 |
| 01.12.2025 | Miete WE-02 Mueller | +720,00 | 9.035,80 |
| 20.11.2025 | Reparatur Heizung | -450,00 | 8.315,80 |
| 01.11.2025 | Miete WE-01 Schmidt | +850,00 | 8.765,80 |

---

## Teil 5: Toggle-Anbindung

Das Demo-Widget wird ueber `useDemoToggles` mit dem Key `GP-KONTEN` gesteuert. Toggle OFF = Widget verschwindet. Die Steuerung erfolgt im Stammdaten-Tab "Demo-Daten" (MOD-01).

---

## Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/components/finanzanalyse/KontoAkteInline.tsx` | Inline-Detail: Kontodaten, Kategorisierung, Anbindung, Bewegungen |
| `src/constants/demoKontoData.ts` | Synthetische Demo-Transaktionen und Demo-Konto-Daten |

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Block B: Dummy-Card entfernen, WidgetGrid mit Demo-Widget + echten Konten + CTA einfuegen, Inline-Kontoakte bei Klick |
| `src/pages/portal/finanzierungsmanager/FMUebersichtTab.tsx` | Block B ("Konten") entfernen, durch Hinweis-Link zu Finanzanalyse ersetzen |
| `src/manifests/goldenPathProcesses.ts` | Neuer Eintrag `GP-KONTEN` fuer MOD-18 |
| `src/manifests/demoDataManifest.ts` | Neuer Eintrag fuer `GP-KONTEN` |

### Keine DB-Migration noetig

Die benoetigten Tabellen (`msv_bank_accounts`, `bank_account_meta` mit `bank_account_category` Enum) existieren bereits mit allen Kategorien (privat, vermietung, tagesgeld, pv, sonstiges).
