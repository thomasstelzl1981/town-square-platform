
# Privatkredit-Modul Redesign — Angleichung an Anfrage-Tab und Selbstauskunft

## Analyse: Ist-Zustand vs. Soll-Zustand

### Problem-Zusammenfassung

Der Privatkredit-Tab nutzt **keine** der systemweiten Design-Komponenten. Im Vergleich:

| Aspekt | Anfrage-Tab (Referenz) | Privatkredit (Ist) |
|--------|----------------------|-------------------|
| Container | `PageShell` (max-w-7xl, einheitliches Padding) | Rohes `div` mit `space-y-2` |
| Widget-Leiste | `WidgetGrid` + `WidgetCell` (4-Spalten, aspect-square) | Nicht vorhanden |
| Formulare | `DESIGN.FORM_GRID.FULL` (2-Spalten-Grid) | Ad-hoc `grid-cols-1 sm:grid-cols-3` |
| Karten | `glass-card` mit strukturiertem CardContent | Rohes `border + p-4` |
| Typografie | `DESIGN.TYPOGRAPHY.*` Manifest-Klassen | Ad-hoc `text-lg font-semibold` |
| Angebots-Liste | — | 4-Spalten-Grid mit kleinen Cards, keine Tabelle |
| Selbstauskunft-Daten | Integriert via shared Cards (FinanceObjectCard, HouseholdCalculationCard) | Eigene `ApplicationPreview` mit direktem DB-Query |

### Kern-Defizite

1. **Kein PageShell** — Breite und Spacing stimmen nicht mit dem Rest des Moduls ueberein
2. **Keine Widget-Leiste** — Bestehende Privatkredit-Faelle werden nicht als Kacheln angezeigt
3. **Vergleichsrechner zu klein** — Angebote als winzige 4-Spalten-Cards statt als uebersichtliche Liste/Tabelle
4. **Eingabefelder nicht im Manifest-Stil** — Kein `FORM_GRID`, keine `glass-card` Wrapper
5. **Employment Gate** ist eine nackte RadioGroup ohne Card-Wrapper
6. **Dokumente** und **Submit** haben keine Card-Wrapper

---

## Aenderungen

### 1. PrivatkreditTab.tsx — PageShell + Widget-Leiste + Manifest-Layout

**Was aendert sich:**
- `PageShell` als aeusserer Container (wie Anfrage/Selbstauskunft)
- Neue `ConsumerLoanWidgets` Widget-Leiste oben (zeigt bestehende Faelle + "Neuer Kredit" CTA)
- Alle Sektionen in `glass-card` Cards gewickelt
- `DESIGN.FORM_GRID.FULL` fuer 2-Spalten-Layouts
- `DESIGN.TYPOGRAPHY.*` fuer Ueberschriften

### 2. Neue Komponente: ConsumerLoanWidgets.tsx

Analog zu `FinanceRequestWidgets`:
- `WidgetGrid` + `WidgetCell` fuer bestehende `consumer_loan_cases`
- Jede Kachel zeigt: Status-Badge, Kreditbetrag, Laufzeit, Datum
- CTA-Kachel: "Neuer Privatkredit"
- Klick auf Kachel laedt den entsprechenden Fall

### 3. EmploymentGate.tsx — Card-Wrapper

- In `glass-card` (Card-Komponente) gewickelt
- Titel ueber `DESIGN.TYPOGRAPHY.CARD_TITLE`

### 4. LoanCalculator.tsx — Kompletter Umbau

**Eingabebereich:**
- 2-Spalten `FORM_GRID` statt 3-Spalten ad-hoc Grid
- Kreditbetrag und Laufzeit als zwei Cards nebeneinander (wie Eckdaten + Kalkulator in Anfrage)
- Button "Angebote berechnen" prominent in der zweiten Card

**Angebots-Liste (neu: Tabellenformat):**
- Statt 4 kleine Cards: Eine uebersichtliche **Tabelle** (`DESIGN.TABLE.*`)
- Spalten: Bank | Effektivzins | Monatliche Rate | Gesamtbetrag | Aktion
- "Empfohlen"-Badge in der Zeile
- Selektierte Zeile mit `ring-2 ring-primary` hervorgehoben
- Deutlich bessere Uebersicht fuer den Vergleich von 8 Angeboten

### 5. ApplicationPreview.tsx — Manifest-Klassen

- Card-Wrapper mit `glass-card`
- Grid-Bloecke mit `DESIGN.FORM_GRID.FULL` statt ad-hoc `grid-cols-4`
- Felder in der gleichen Darstellung wie Selbstauskunft (Label/Value Paare)

### 6. DocumentChecklist.tsx — Card-Wrapper

- In `glass-card` Card gewickelt
- Checklisten-Items mit `DESIGN.LIST.ROW` Klassen

### 7. SubmitSection.tsx — Card-Wrapper

- In `glass-card` Card gewickelt
- Konsistenter Look mit dem Finanzierungsauftrag-Block der Anfrage

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| NEU | `src/components/privatkredit/ConsumerLoanWidgets.tsx` — Widget-Leiste fuer Privatkredit-Faelle |
| EDIT | `src/pages/portal/finanzierung/PrivatkreditTab.tsx` — PageShell, Widget-Leiste, Manifest-Layout |
| EDIT | `src/components/privatkredit/EmploymentGate.tsx` — Card-Wrapper, Manifest-Typografie |
| EDIT | `src/components/privatkredit/LoanCalculator.tsx` — FORM_GRID, Tabellen-Angebotsliste |
| EDIT | `src/components/privatkredit/MockOfferCard.tsx` — Wird zur Tabellenzeile (MockOfferRow) oder entfaellt zugunsten inline-Rendering |
| EDIT | `src/components/privatkredit/ApplicationPreview.tsx` — Card-Wrapper, Manifest-Klassen |
| EDIT | `src/components/privatkredit/DocumentChecklist.tsx` — Card-Wrapper, LIST-Klassen |
| EDIT | `src/components/privatkredit/SubmitSection.tsx` — Card-Wrapper |

Keine Datenbank-Aenderungen noetig — die Tabellen sind bereits vorhanden.
