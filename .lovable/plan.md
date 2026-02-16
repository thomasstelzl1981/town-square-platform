

# Demo Engine — Deep Test und Reparaturplan

## Ziel

Systematische Pruefung ALLER Module mit Demo-Daten (Demo AN und Demo AUS), Duplikate beseitigen, Konsistenz sicherstellen. Ergebnisse werden in einer Backlog-Datei dokumentiert, an der wir uns Schritt fuer Schritt entlangarbeiten.

---

## Schritt 1: Backlog-Datei anlegen

Neue Datei: `DEMO_ENGINE_BACKLOG.md`

Enthaelt:
- Alle Pruefpunkte als Checkliste
- Status pro Modul (OK / BUG / REPARIERT)
- Screenshot-Referenzen
- Wird nach jeder Reparatur aktualisiert

---

## Schritt 2: Bekannte Bugs sofort reparieren

### Bug 1: PV-Anlage erscheint doppelt (MOD-19)

**Datei:** `src/pages/portal/photovoltaik/AnlagenTab.tsx`, Zeile 263

**Problem:** Filter `demoEnabled || !isDemoId(plant.id)` zeigt den DB-Eintrag (ID `...0901`) IMMER wenn Demo aktiv ist — zusaetzlich zum hardcoded Demo-Widget darueber.

**Fix:** Wenn Demo aktiv, DB-Eintraege mit Demo-ID herausfiltern:
```
plants.filter(plant => !isDemoId(plant.id) || !demoEnabled)
```

### Bug 2: Akquise-Mandat erscheint doppelt (MOD-12)

**Datei:** `src/pages/portal/akquise-manager/AkquiseMandate.tsx`, Zeile 550

**Problem:** Identisches Muster — DB-Mandat (ID `e0000000-...0001`) erscheint neben dem hardcoded Widget.

**Fix:** Gleicher Filter-Ansatz wie bei PV.

### Bug 3: Akquise Demo-Widget zeigt falschen Inhalt

**Datei:** `src/pages/portal/akquise-manager/AkquiseMandate.tsx`, Zeilen 532-538

**Problem:** Widget zeigt "MFH-Akquise Rheinland / Investoren GbR Rhein", aber die SSOT in `data.ts` sagt "Mustermann Projektentwicklung GmbH / Muenchen / Oberbayern".

**Fix:** Widget-Text an DEMO_ACQ_MANDATE angleichen:
- Titel: "Mustermann Projektentwicklung GmbH"
- Region: "Muenchen / Oberbayern"
- Asset: "MFH, Aufteiler"
- Budget: "1-5 Mio Euro"

---

## Schritt 3: Systematische Pruefung (Screenshots)

### Phase A — Demo AN

| Nr | Modul | Tab/Bereich | Erwartung | Pruefpunkt |
|---|---|---|---|---|
| A1 | MOD-19 PV | Anlagen | 1 Demo-Widget (gruen) + CTA | Keine Duplikate |
| A2 | MOD-12 Akquise | Mandate | 1 Demo-Widget (gruen) + CTA | Text = Mustermann Projektentwicklung |
| A3 | MOD-13 Projekte | Dashboard | 1 Demo-Projekt "Residenz am Stadtpark" | Keine Duplikate |
| A4 | MOD-04 Immobilien | Portfolio | 3 Properties (BER, MUC, HH) mit Demo-Badge | Keine Duplikate |
| A5 | MOD-17 Fahrzeuge | Dashboard | 2 Fahrzeuge (Porsche, BMW) mit Demo-Badge | Keine Duplikate |
| A6 | MOD-05 Pets | Dashboard | Luna + Bello mit Demo-Badge | Keine Duplikate |
| A7 | MOD-18 Uebersicht | Finanzanalyse | Demo-Bankkonto + 4 Personen-Widgets | Vollstaendig |
| A8 | MOD-18 Vorsorge | Sub-Tab | 6 Vertraege (Ruerup, bAV, Riester/Fonds, ETF, 2x BU) | Alle sichtbar |
| A9 | MOD-18 Sachversicherungen | Sub-Tab | 7 Vertraege | Alle sichtbar |
| A10 | MOD-18 Krankenversicherung | Sub-Tab | 4 KV-Eintraege (PKV Max, GKV Lisa, 2x familienversichert) | Alle sichtbar |
| A11 | MOD-18 Abonnements | Sub-Tab | 8 Abos mit korrekten Betraegen | Alle sichtbar |
| A12 | MOD-18 Darlehen | Sub-Tab | 2 Kredite (BMW Bank 520 Euro, Santander 250 Euro) | Betraege korrekt |
| A13 | MOD-18 Investment | Sub-Tab | Depot-Widgets pro Person | Dargestellt |
| A14 | MOD-18 Vorsorgedokumente | Sub-Tab | Lueckenrechner | Funktional |

### Phase B — Demo AUS

| Nr | Modul | Erwartung | Pruefpunkt |
|---|---|---|---|
| B1 | MOD-19 PV | Kein Demo-Widget, nur CTA | Keine Reste |
| B2 | MOD-12 Akquise | Kein Demo-Widget, nur CTA | Keine DB-Demo-Mandate sichtbar |
| B3 | MOD-13 Projekte | Kein Demo-Projekt | Keine Reste |
| B4 | MOD-04 Immobilien | Keine Demo-Properties | Leerer Zustand oder nur echte Daten |
| B5 | MOD-17 Fahrzeuge | Keine Demo-Fahrzeuge | Leerer Zustand |
| B6 | MOD-05 Pets | Keine Demo-Pets | Leerer Zustand |
| B7-B14 | MOD-18 alle Tabs | Keine Demo-Finanz-Daten | Leere Zustaende, kein Crash |

---

## Schritt 4: Reparaturen nach Pruefung

Alle bei der Pruefung gefundenen zusaetzlichen Bugs werden in die Backlog-Datei eingetragen und einzeln abgearbeitet.

## Schritt 5: Regressionstest

Nach allen Reparaturen die komplette Pruefung (Phase A + B) wiederholen.

---

## Betroffene Dateien (bekannte Fixes)

| Datei | Aenderung |
|---|---|
| `DEMO_ENGINE_BACKLOG.md` | Neu: Backlog-Checkliste fuer alle Pruefpunkte |
| `src/pages/portal/photovoltaik/AnlagenTab.tsx` | Zeile 263: Filter invertieren um Duplikate zu verhindern |
| `src/pages/portal/akquise-manager/AkquiseMandate.tsx` | Zeile 550: Filter invertieren + Zeilen 532-538: Widget-Text an SSOT angleichen |

Weitere Dateien koennen hinzukommen, sobald die Screenshot-Pruefung zusaetzliche Bugs aufdeckt.

