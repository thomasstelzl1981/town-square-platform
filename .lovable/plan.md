

# Umbau Steuer-Tab (Anlage V) + BWA im DATEV-Style (MOD-04)

## Teil 1: Steuer / Anlage V — Flow-Verbesserung

### Ist-Zustand & Probleme
- Der aktuelle Flow ist 3-stufig: (1) Vermietereinheit waehlen → (2) Objekt waehlen → (2b) Anlage V Form oeffnen → (3) Erklaerung anzeigen (nur wenn alle bestaetigt)
- **Problem**: Nach Bestaetigung eines Objekts muss man zurueck navigieren, ein anderes Objekt klicken, erneut bestaetigen — der Zustand ist unklar
- **Problem**: Die Erklaerung erscheint erst wenn ALLE Objekte bestaetigt sind, aber das wird nirgends erklaert
- **Problem**: Felder werden einzeln pro Objekt geoeffnet, statt alle sichtbar zu sein

### Loesung: Inline-Flow (alles auf einer Seite)

Nach Auswahl der Vermietereinheit klappt sich sofort alles auf:

```text
┌──────────────────────────────────────────┐
│ [VE-Widget: Muster GmbH]  [VE2] [VE3]   │  ← Stufe 1 (bleibt)
├──────────────────────────────────────────┤
│                                          │
│ ▼ Objekt 1: Musterstr. 10, Berlin        │  ← Accordion/Collapsible
│   ┌──────────────────────────────────┐   │
│   │ Sektion 1-6 (alle Felder offen)  │   │
│   │ Auto-Werte mit Badge "auto"      │   │
│   │ Manuelle Felder editierbar       │   │
│   │ Ergebnis: +3.450 €              │   │
│   │ [Bestaetigen ✓] [Plausibil.]    │   │
│   └──────────────────────────────────┘   │
│                                          │
│ ▼ Objekt 2: Parkweg 5, Hamburg           │  ← naechstes Accordion
│   ┌──────────────────────────────────┐   │
│   │ (identisch)                      │   │
│   └──────────────────────────────────┘   │
│                                          │
│ ═══ Gesamtergebnis ═══                   │  ← immer sichtbar
│ Einnahmen: 24.000 € | Kosten: 18.400 € │
│ Ueberschuss/Verlust: +5.600 €           │
│ Status: 2/3 bestaetigt                   │
│ [CSV Export] [Plausibilitaet alle]       │
│                                          │
│ ⚠ Hinweis: 1 Objekt noch offen.         │
│   Erst nach Bestaetigung aller Objekte   │
│   kann die Erklaerung generiert werden.  │
└──────────────────────────────────────────┘
```

### Konkrete Aenderungen

**Datei: `src/pages/portal/immobilien/VerwaltungTab.tsx`**
- Stufe 2 und 2b verschmelzen: Nach Klick auf VE werden ALLE Objekte als `Collapsible`-Accordions angezeigt (erstes standardmaessig offen)
- Jedes Accordion enthaelt die bestehende `VVAnlageVForm` als Inline-Content
- Unten: permanentes Gesamtergebnis mit Fortschrittsanzeige ("2/3 bestaetigt")
- Klarer Hinweis-Text wenn nicht alle bestaetigt
- Erklaerung-Button wird ausgegraut mit Tooltip "Alle Objekte muessen bestaetigt sein"

**Datei: `src/components/vv/VVAnlageVForm.tsx`**
- Keine strukturellen Aenderungen, Form bleibt wie sie ist
- Kleinere UX-Verbesserung: "Bestaetigen"-Switch wird prominenter (gruener Rahmen wenn aktiv)

---

## Teil 2: BWA im DATEV-Style mit SuSa

### Ist-Zustand & Probleme
- Die aktuelle BWA ist eine **grobe Schaetzung**: Kosten werden als Prozentsaetze vom Bruttoeinkommen geschaetzt (4% Verwaltung, 6% Instandhaltung usw.)
- Es existiert bereits ein **SKR04-Kontenplan** in `src/manifests/bwaKontenplan.ts` mit 7 BWA-Kategorien und 26 Konten — dieser wird aber NICHT genutzt
- Das System hat echte Daten: `nk_cost_items`, `property_financing`, `property_accounting`, `leases`, `rent_payments`, `bank_transactions`, `vv_annual_data`
- Es fehlt: Zeitraumauswahl, SuSa (Summen- und Saldenliste), DATEV-Layout

### Loesung: DATEV-konforme BWA + SuSa

#### A) Neues BWA-Layout (DATEV Standard-BWA Kurzform)

```text
┌─────────────────────────────────────────────────────────────┐
│  BWA — Muster GmbH                                         │
│  Zeitraum: [01.01.2024 - 31.12.2024 ▾]  [Vorjahr] [Q1-Q4] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BWA-10: Mietertraege                                       │
│  ├─ 4400 Mietertraege Wohnraum          18.000,00 €        │
│  ├─ 4410 Mietertraege Stellplaetze       2.400,00 €        │
│  ├─ 4490 Sonstige Ertraege                 120,00 €        │
│  └─ SUMME BWA-10                        20.520,00 €        │
│                                                             │
│  BWA-20: Nebenkosten/Umlagen                                │
│  ├─ 4420 NK-Vorauszahlungen              3.600,00 €        │
│  └─ SUMME BWA-20                         3.600,00 €        │
│                                                             │
│  ═══ GESAMTLEISTUNG                     24.120,00 €  ═══   │
│                                                             │
│  BWA-30: Betriebskosten (umlagefaehig)                      │
│  ├─ 6000 Grundsteuer                       480,00 €        │
│  ├─ 6020 Wasser/Abwasser                   960,00 €        │
│  ├─ ...                                                     │
│  └─ SUMME BWA-30                         3.120,00 €        │
│                                                             │
│  BWA-40: Instandhaltung                                     │
│  BWA-50: Verwaltung                                         │
│  BWA-60: Finanzierung                                       │
│  BWA-70: Abschreibungen                                     │
│                                                             │
│  ═══ GESAMTAUFWAND                      12.480,00 €  ═══   │
│  ═══ BETRIEBSERGEBNIS                   11.640,00 €  ═══   │
│                                                             │
│  [PDF Export]  [Zur SuSa ▸]                                 │
└─────────────────────────────────────────────────────────────┘
```

#### B) SuSa (Summen- und Saldenliste)

Zeigt pro Konto: Anfangsbestand, Soll-Buchungen, Haben-Buchungen, Saldo.
Wird aus denselben Datenquellen befuellt.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  SuSa — Muster GmbH  |  01.01.2024 - 31.12.2024                   │
├──────┬──────────────────────┬──────────┬──────────┬──────────┬──────┤
│ Kto  │ Bezeichnung          │ EB       │ Soll     │ Haben    │ Saldo│
├──────┼──────────────────────┼──────────┼──────────┼──────────┼──────┤
│ 4400 │ Mietertr. Wohnraum   │    0,00  │    0,00  │18.000,00 │  H   │
│ 4410 │ Mietertr. Stellpl.   │    0,00  │    0,00  │ 2.400,00 │  H   │
│ 4420 │ NK-Vorauszahlungen   │    0,00  │    0,00  │ 3.600,00 │  H   │
│ 6000 │ Grundsteuer          │    0,00  │  480,00  │    0,00  │  S   │
│ 6020 │ Wasser/Abwasser      │    0,00  │  960,00  │    0,00  │  S   │
│ ...  │ ...                  │   ...    │   ...    │   ...    │ ...  │
│ 7300 │ Zinsaufwand Darlehen │    0,00  │ 4.800,00 │    0,00  │  S   │
├──────┴──────────────────────┼──────────┼──────────┼──────────┼──────┤
│ SUMMEN                      │    0,00  │24.120,00 │24.120,00 │      │
└─────────────────────────────┴──────────┴──────────┴──────────┴──────┘
```

#### C) Daten-Mapping: SKR04-Konten ← Vorhandene Tabellen

Die echten Werte werden so befuellt (KEINE Prozent-Schaetzungen mehr):

| SKR04-Konto | Datenquelle | Aggregation |
|-------------|-------------|-------------|
| 4400 Mietertraege | `leases.rent_cold_eur` | SUM × 12 (aktive) |
| 4410 Stellplaetze | `leases` WHERE unit.type = 'stellplatz' | SUM × 12 |
| 4420 NK-Vorausz. | `leases.nk_advance_eur` | SUM × 12 |
| 4490 Sonstige | `vv_annual_data.income_other` | direkt |
| 4760 Versicherung | `vv_annual_data.income_insurance_payout` | direkt |
| 6000 Grundsteuer | `nk_cost_items` WHERE category = 'grundsteuer' | SUM |
| 6020-6110 Betr.K. | `nk_cost_items` per category_code | SUM per code |
| 6200 Instandhaltung | `vv_annual_data.cost_maintenance` | direkt |
| 6300 Verwaltung | `vv_annual_data.cost_management_fee` | direkt |
| 6310 Steuerberatung | (neu: optionales Feld oder aus cost_other) | direkt |
| 6330 Bankgebuehren | `vv_annual_data.cost_bank_fees` | direkt |
| 7300 Zinsen | `property_financing.annual_interest` | SUM (aktive) |
| 4830 AfA Gebaeude | Engine: `calculateAfaAmount()` | berechnet |

#### D) Zeitraum-Optionen
- **Vorjahr (Standard)**: 01.01. - 31.12. des Vorjahres
- **Laufendes Jahr bis letztes Quartal**: 01.01. - letzter Quartalsstichtag
- **Freie Eingabe**: Von/Bis Datum

### Technische Umsetzung

**Neue Datei: `src/engines/bewirtschaftung/bwaDatev.ts`** (Engine-Erweiterung)
- Neue pure Funktion `calcDatevBWA()` die den SKR04-Kontenplan (`BWA_KATEGORIEN`) als Struktur nimmt und echte Werte aus den Datenquellen eintraegt
- Neue pure Funktion `calcSuSa()` die die SuSa-Tabelle erzeugt
- Types: `DatevBWAResult`, `SuSaEntry`, `SuSaResult`

**Neue Datei: `src/engines/bewirtschaftung/bwaDatevSpec.ts`**
- Typen fuer DATEV-BWA und SuSa

**Umgeschrieben: `src/components/portfolio/BWATab.tsx`**
- Komplett neues Layout im DATEV-Stil
- Zeitraum-Selector (Vorjahr / Lfd. bis Q / Frei)
- BWA-Ansicht mit Kontenplan-Gliederung
- SuSa-Toggle/Tab
- PDF-Export via jsPDF (bereits installiert)

**Geaendert: `src/pages/portal/immobilien/VerwaltungTab.tsx`**
- BWA-Mode uebergibt alle Properties der VE (nicht nur die erste)
- Aggregation ueber alle Objekte einer Vermietereinheit
- Zeitraum-Parameter wird durchgereicht

**Geaendert: `src/hooks/useVVSteuerData.ts`**
- Optionaler Zeitraum-Parameter fuer BWA-Modus (default: Vorjahr)
- Evtl. separater Hook `useBWAData.ts` wenn zu komplex

### Was NICHT geaendert wird
- SKR04-Kontenplan (`bwaKontenplan.ts`) — bleibt SSOT, wird jetzt endlich genutzt
- V+V Engine (`vvSteuer/engine.ts`) — laeuft bereits korrekt
- Edge Functions — keine Aenderung noetig
- Tabellenstruktur — alle benoetigten Daten sind vorhanden

### Zusammenfassung der Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/immobilien/VerwaltungTab.tsx` | Umgebaut: Inline-Accordion fuer Anlage V + BWA mit Aggregation |
| `src/components/vv/VVAnlageVForm.tsx` | Kleine UX-Verbesserungen |
| `src/engines/bewirtschaftung/bwaDatevSpec.ts` | NEU: Types fuer DATEV-BWA + SuSa |
| `src/engines/bewirtschaftung/bwaDatev.ts` | NEU: Pure calc-Funktionen |
| `src/components/portfolio/BWATab.tsx` | Komplett umgebaut: DATEV-Layout + SuSa |
| `src/engines/bewirtschaftung/spec.ts` | Evtl. erweitert um DatevBWA-Export |
| `src/engines/index.ts` | Export der neuen Engine-Funktionen |

