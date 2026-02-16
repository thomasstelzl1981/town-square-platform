# Demo Engine Backlog

> Systematische Pruefung aller Module. Status wird nach jeder Reparatur aktualisiert.

## Legende

- ⬜ = Offen
- 🔧 = Bug gefunden
- ✅ = OK / Repariert

---

## Phase A — Demo AN

| Nr | Modul | Tab/Bereich | Erwartung | Status | Notizen |
|---|---|---|---|---|---|
| A1 | MOD-19 PV | Anlagen | 1 Demo-Widget (gruen) + CTA, keine Duplikate | 🔧 | Bug 1: Duplikat durch DB-Eintrag — Filter repariert |
| A2 | MOD-12 Akquise | Mandate | 1 Demo-Widget (gruen) + CTA, Text = Mustermann Projektentwicklung | 🔧 | Bug 2+3: Duplikat + falscher Widget-Text — repariert |
| A3 | MOD-13 Projekte | Dashboard | 1 Demo-Projekt "Residenz am Stadtpark" | ⬜ | |
| A4 | MOD-04 Immobilien | Portfolio | 3 Properties (BER, MUC, HH) mit Demo-Badge | ⬜ | |
| A5 | MOD-17 Fahrzeuge | Dashboard | 2 Fahrzeuge (Porsche, BMW) mit Demo-Badge | ⬜ | |
| A6 | MOD-05 Pets | Dashboard | Luna + Bello mit Demo-Badge | ⬜ | |
| A7 | MOD-18 Uebersicht | Finanzanalyse | Demo-Bankkonto + 4 Personen-Widgets | ⬜ | |
| A8 | MOD-18 Vorsorge | Sub-Tab | 6 Vertraege (Ruerup, bAV, Riester/Fonds, ETF, 2x BU) | ⬜ | |
| A9 | MOD-18 Sachversicherungen | Sub-Tab | 7 Vertraege | ⬜ | |
| A10 | MOD-18 Krankenversicherung | Sub-Tab | 4 KV-Eintraege (PKV Max, GKV Lisa, 2x familienversichert) | ⬜ | |
| A11 | MOD-18 Abonnements | Sub-Tab | 8 Abos mit korrekten Betraegen | ⬜ | |
| A12 | MOD-18 Darlehen | Sub-Tab | 2 Kredite (BMW Bank 520€, Santander 250€) | ⬜ | |
| A13 | MOD-18 Investment | Sub-Tab | Depot-Widgets pro Person | ⬜ | |
| A14 | MOD-18 Vorsorgedokumente | Sub-Tab | Lueckenrechner | ⬜ | |

---

## Phase B — Demo AUS

| Nr | Modul | Erwartung | Status | Notizen |
|---|---|---|---|---|
| B1 | MOD-19 PV | Kein Demo-Widget, nur CTA | ⬜ | |
| B2 | MOD-12 Akquise | Kein Demo-Widget, keine DB-Demo-Mandate | ⬜ | |
| B3 | MOD-13 Projekte | Kein Demo-Projekt | ⬜ | |
| B4 | MOD-04 Immobilien | Keine Demo-Properties | ⬜ | |
| B5 | MOD-17 Fahrzeuge | Keine Demo-Fahrzeuge | ⬜ | |
| B6 | MOD-05 Pets | Keine Demo-Pets | ⬜ | |
| B7 | MOD-18 Uebersicht | Keine Demo-Finanz-Daten | ⬜ | |
| B8 | MOD-18 Vorsorge | Keine Demo-Vertraege | ⬜ | |
| B9 | MOD-18 Sachversicherungen | Keine Demo-Versicherungen | ⬜ | |
| B10 | MOD-18 Krankenversicherung | Keine Demo-KV | ⬜ | |
| B11 | MOD-18 Abonnements | Keine Demo-Abos | ⬜ | |
| B12 | MOD-18 Darlehen | Keine Demo-Kredite | ⬜ | |
| B13 | MOD-18 Investment | Keine Demo-Depots | ⬜ | |
| B14 | MOD-18 Vorsorgedokumente | Leerer Zustand, kein Crash | ⬜ | |

---

## Reparatur-Log

| Datum | Bug | Datei | Aenderung | Status |
|---|---|---|---|---|
| 2026-02-16 | PV-Duplikat | AnlagenTab.tsx:263 | Filter invertiert: `!(demoEnabled && isDemoId)` | ✅ |
| 2026-02-16 | Akquise-Duplikat | AkquiseMandate.tsx:550 | Filter invertiert: `!(demoEnabled && isDemoId)` | ✅ |
| 2026-02-16 | Akquise-Widget-Text | AkquiseMandate.tsx:532-538 | An SSOT (Mustermann Projektentwicklung) angeglichen | ✅ |
