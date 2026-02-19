

# Neue AfA-Kachel fuer die Immobilienakte + Erwerbsnebenkosten entfernen

## Ist-Zustand: Woher kommen die AfA-Werte fuer V+V?

Die V+V-Engine (`src/engines/vvSteuer/engine.ts`) berechnet die Abschreibung so:

```text
AfA-Basis = (Kaufpreis + Erwerbsnebenkosten) x Gebaeudeanteil%
AfA-Betrag = AfA-Basis x AfA-Satz%
```

Die Daten kommen aus dem Interface `VVAfaStammdaten` (spec.ts), das folgende Felder hat:
- `buildingSharePercent` (Gebaeudeanteil %)
- `landSharePercent` (Grundstuecksanteil %)
- `afaRatePercent` (AfA-Satz %)
- `afaStartDate` (AfA-Beginn)
- `afaMethod` (linear | degressiv)
- `modernizationCostsEur`, `modernizationYear`

Diese Daten werden aus der DB-Tabelle `property_accounting` gelesen, die bereits existiert. **Aber:** Es gibt in der Immobilienakte (MOD-04) **keine UI-Kachel** zum Erfassen dieser Werte. Alle Felder im Master-Template sind als "UI pending (no editable block in MOD-04)" markiert.

Zusaetzlich existiert bereits eine Tabelle `msv_book_values` mit erweiterten Feldern:
- `ak_building` (Anschaffungskosten Gebaeude)
- `ak_ground` (Anschaffungskosten Grundstueck)
- `ak_ancillary` (Erwerbsnebenkosten)
- `book_value_estimate` (Buchwert)
- `book_value_date` (Stichtag)
- `cumulative_afa` (bisher abgeschriebene AfA)
- `afa_rate_percent`, `afa_begin_date`

## Problem

1. **Keine Eingabemoeglichkeit** fuer AfA-Stammdaten in der Immobilienakte
2. **Erwerbsnebenkosten** stehen als eigenes Feld im "Grundbuch & Erwerb"-Block — nicht sinnvoll fuer den Nutzer, da diese steuerlich relevant sind und in die AfA-Kachel gehoeren
3. **Kein Buchwert-Feld** bei Anlage einer Immobilie
4. **AfA-Modelle** nach deutschem Steuerrecht fehlen komplett als Auswahl

## Deutsche AfA-Modelle (Rechtsstand 2025/2026)

| Paragraph | Bezeichnung | Satz | Anwendungsbereich |
|-----------|-------------|------|-------------------|
| Paragraph 7 Abs. 4 Nr. 1 | Linear (Wohnen, ab 2023) | 3,0 % | Wohngebaeude, Bauantrag/Kaufvertrag ab 01.01.2023 |
| Paragraph 7 Abs. 4 Nr. 2a | Linear (Wohnen, vor 1925) | 2,5 % | Wohngebaeude fertiggestellt vor 01.01.1925 |
| Paragraph 7 Abs. 4 Nr. 2b | Linear (Wohnen, 1925-2022) | 2,0 % | Wohngebaeude fertiggestellt 01.01.1925 bis 31.12.2022 |
| Paragraph 7 Abs. 4 Nr. 2c | Linear (Gewerblich) | 3,0 % | Nicht-Wohngebaeude (Gewerbe, Buero) |
| Paragraph 7 Abs. 5a | Degressiv (Neubau ab 10/2023) | 5,0 % (vom Restwert) | Neubau-Wohnungen, Baubeginn ab 01.10.2023, Fertigstellung bis 2029 |
| Paragraph 7b | Sonder-AfA Mietwohnungsbau | 5,0 % (4 Jahre) | Neubau-Mietwohnungen, Baukosten max. 5.200 EUR/qm |
| Paragraph 7h | Sanierung (Sanierungsgebiet) | bis 9 % (8 J.) + 7 % (4 J.) | Modernisierung im foermlichen Sanierungsgebiet |
| Paragraph 7i | Denkmal-AfA | bis 9 % (8 J.) + 7 % (4 J.) | Baudenkmal gemaess Denkmalschutzbescheinigung |
| Paragraph 7 Abs. 4 S. 2 | Restnutzungsdauer (Gutachten) | individuell | Verkuerzte Nutzungsdauer per Gutachten nachgewiesen |

## Loesung: Neue "EditableAfaBlock" Kachel

### 1. Erwerbsnebenkosten-Feld aus EditableLegalBlock entfernen

**Datei: `src/components/immobilienakte/editable/EditableLegalBlock.tsx`**

Das Feld "Erwerbsnebenkosten" (Zeilen 142-150) wird entfernt. Der Kaufpreis bleibt in "Grundbuch & Erwerb", die steuerlichen Aufgliederungen wandern in die neue AfA-Kachel.

### 2. Neue Komponente: EditableAfaBlock

**Neue Datei: `src/components/immobilienakte/editable/EditableAfaBlock.tsx`**

Eine kompakte Card mit folgenden Sektionen:

**Sektion A: Anschaffungskosten-Aufteilung**
- Anschaffungskosten Grundstueck (EUR) — `ak_ground` / `landSharePercent`
- Anschaffungskosten Gebaeude (EUR) — `ak_building` / `buildingSharePercent`  
- Erwerbsnebenkosten (EUR) — `acquisitionCosts` / `ak_ancillary`
- Grundstuecksanteil (%) und Gebaeudeanteil (%) — automatisch berechnet aus den Werten oder manuell eingebbar
- Berechnete AfA-Bemessungsgrundlage (readonly, grau) = (AK Gebaeude + anteilige ENK) 

**Sektion B: AfA-Modell**
- Dropdown "AfA-Modell" mit den oben genannten Optionen (Paragraph 7 Abs. 4 Nr. 1/2a/2b/2c, Paragraph 7 Abs. 5a, Paragraph 7b, Paragraph 7h, Paragraph 7i, Restnutzungsdauer)
- AfA-Satz (%) — wird automatisch vorbelegt je nach Modell, aber manuell ueberschreibbar
- AfA-Beginn (Datum)
- Restnutzungsdauer (Jahre) — nur sichtbar bei Modell "Restnutzungsdauer"

**Sektion C: Buchwert (Stichtag)**
- Buchwert zum Stichtag (EUR) — z.B. 31.12. des Vorjahres
- Stichtag (Datum) — default: letzter 31.12.
- Bisherige kumulierte AfA (EUR)

**Sektion D: Sonder-AfA / Denkmal (optional, Collapsible)**
- Sonder-AfA Betrag p.a. (EUR) — fuer Paragraph 7b
- Denkmal-/Sanierungs-AfA Betrag p.a. (EUR) — fuer Paragraph 7h/7i
- Modernisierungskosten (EUR)
- Modernisierungsjahr

### 3. Datenbank-Migration erweitern

Die bestehende Tabelle `property_accounting` wird um Felder erweitert:

```text
ALTER TABLE property_accounting ADD COLUMN IF NOT EXISTS
  afa_model text DEFAULT '7_4_2b',        -- Paragraph-Referenz als Enum-Key
  ak_ground numeric DEFAULT 0,            -- AK Grundstueck
  ak_building numeric DEFAULT 0,          -- AK Gebaeude  
  book_value_date date,                   -- Buchwert-Stichtag
  book_value_eur numeric DEFAULT 0,       -- (existiert bereits, pruefen)
  cumulative_afa numeric DEFAULT 0,       -- bisher abgeschrieben
  sonder_afa_annual numeric DEFAULT 0,    -- Paragraph 7b jaehrlich
  denkmal_afa_annual numeric DEFAULT 0;   -- Paragraph 7h/7i jaehrlich
```

Hinweis: Einige dieser Felder existieren bereits in `msv_book_values`. Wir pruefen bei der Implementierung, ob wir `property_accounting` erweitern oder `msv_book_values` als fuehrende Tabelle nutzen. Da `property_accounting` bereits von der V+V-Engine gelesen wird, ist die Erweiterung dort sinnvoller.

### 4. Integration in EditableUnitDossierView

**Datei: `src/components/immobilienakte/EditableUnitDossierView.tsx`**

Die neue Kachel wird in ROW 2 eingefuegt — neben oder anstelle der bisherigen Anordnung:

```text
ROW 1: Identitaet | Gebaeude
ROW 2: Grundbuch & Erwerb | AfA & Steuer (NEU)
ROW 3: Finanzierung | WEG
ROW 4: Mietverhaeltnis | Dokumente  
ROW 5: Lage & Beschreibung
```

### 5. V+V Engine anpassen

**Datei: `src/engines/vvSteuer/spec.ts`**

Das Interface `VVAfaStammdaten` wird erweitert um:

```text
afaModel: string          -- Paragraph-Referenz
akGround: number          -- AK Grundstueck  
akBuilding: number        -- AK Gebaeude
sonderAfaAnnual: number   -- Paragraph 7b
denkmalAfaAnnual: number  -- Paragraph 7h/7i
bookValueEur: number      -- aktueller Buchwert
cumulativeAfa: number     -- bisher abgeschrieben
```

**Datei: `src/engines/vvSteuer/engine.ts`**

Die Berechnung wird angepasst:
- AfA-Basis nutzt jetzt `akBuilding` + anteilige ENK statt `purchasePrice * buildingShare%`
- Sonder-AfA und Denkmal-AfA werden als separate Posten addiert
- Degressive AfA (Paragraph 7 Abs. 5a) rechnet vom Restwert statt von der Basis

### 6. Export + Master-Template aktualisieren

**Datei: `src/components/immobilienakte/editable/index.ts`** — Export der neuen Komponente
**Datei: `src/pages/admin/MasterTemplatesImmobilienakte.tsx`** — "UI pending" Notes aktualisieren

## Betroffene Dateien (Zusammenfassung)

| Datei | Aenderung |
|-------|-----------|
| `src/components/immobilienakte/editable/EditableAfaBlock.tsx` | NEU — komplette AfA-Kachel |
| `src/components/immobilienakte/editable/EditableLegalBlock.tsx` | Erwerbsnebenkosten-Feld entfernen |
| `src/components/immobilienakte/editable/index.ts` | Export hinzufuegen |
| `src/components/immobilienakte/EditableUnitDossierView.tsx` | Neue Kachel einbinden |
| `src/engines/vvSteuer/spec.ts` | VVAfaStammdaten erweitern |
| `src/engines/vvSteuer/engine.ts` | Berechnung fuer neue Modelle |
| `src/types/immobilienakte.ts` | AccountingData erweitern |
| `src/hooks/useDossierForm.ts` | Neue Felder im Formular |
| `src/hooks/useDossierMutations.ts` | Accounting-Speicherung erweitern |
| DB-Migration | `property_accounting` um neue Spalten erweitern |

## Reihenfolge der Implementierung

1. DB-Migration (neue Spalten in `property_accounting`)
2. Types erweitern (`immobilienakte.ts`, `vvSteuer/spec.ts`)
3. Neue Komponente `EditableAfaBlock.tsx` bauen
4. `EditableLegalBlock.tsx` bereinigen (Erwerbsnebenkosten raus)
5. `EditableUnitDossierView.tsx` anpassen (neue Kachel einsetzen)
6. Hooks anpassen (Form + Mutations)
7. V+V Engine Berechnung anpassen

