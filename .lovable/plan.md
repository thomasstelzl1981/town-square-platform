
# Homogenisierung der MOD-18 Widgets auf Abo-Standard

## Analyse

Das Abo-Tab ist der Referenz-Standard: `RecordCard` im `RECORD_CARD.GRID` (2-spaltig), geschlossener Zustand mit Avatar-Initialen, Titel, Subtitle, 1-2 Summary-Zeilen und optionalem Glow. Beim Klick oeffnet sich die volle Akte.

### Ist-Zustand pro Tab

| Tab | Aktuelles Layout | Problem |
|---|---|---|
| **Abos** | RecordCard in RECORD_CARD.GRID | Referenz — keine Aenderung |
| **Versicherungen** | RecordCard in RECORD_CARD.GRID | Bereits identisch zum Abo-Standard — keine Aenderung |
| **Vorsorge** | RecordCard in RECORD_CARD.GRID | Bereits identisch zum Abo-Standard — keine Aenderung |
| **KV** | Eigene Card in WidgetGrid (4-spaltig) | Komplett anderes Layout, kein RecordCard, keine Akte |
| **Investment** | Eigene Person-Cards in WidgetGrid + grosses Dashboard | Komplett anderes Layout, keine RecordCard |

Versicherungen, Vorsorge und Abos sind bereits homogen (alle nutzen RecordCard im gleichen Grid). Die beiden Ausreisser sind **KV** und **Investment**.

## Aenderungen

### 1. KrankenversicherungTab — Auf RecordCard umstellen

Aktuell: 4 einzelne Cards mit manuell gebauter Darstellung (PKV/GKV pro Person).

Neu: `RECORD_CARD.GRID` mit `RecordCard` pro Person, gleicher Closed-State wie Abos:
- **title**: Personenname (z.B. "Max Mustermann")
- **subtitle**: KV-Typ (z.B. "PKV" oder "GKV")
- **badges**: DEMO-Badge + Typ-Badge
- **summary**: 2 Eintraege max (Versicherer, Monatsbeitrag)
- **glowVariant**: `primary` (da Demo-Daten)
- **Open State**: Alle KV-Details (Versicherer, Beitrag, AG-Anteil, Zusatzdetails) als Formularfelder

### 2. InvestmentTab — Person-Widgets auf RecordCard umstellen

Aktuell: Eigenes WidgetGrid mit handgebauten Person-Cards (Icon, Name, Depot-Status/Wert).

Neu: `RECORD_CARD.GRID` mit `RecordCard` pro Person:
- **title**: Personenname
- **subtitle**: Depot-Status ("Depot aktiv" / "Kein Depot")
- **badges**: Status-Badge (aktiv/inaktiv)
- **summary**: 1-2 Eintraege (Depotwert wenn aktiv)
- **glowVariant**: `primary` wenn Depot aktiv (Demo)
- **Klick-Verhalten**: Statt Akte oeffnen wird die Person selektiert (bestehende Logik bleibt). Der `onToggle` setzt `selectedPersonId`. Es wird KEINE offene RecordCard gezeigt — stattdessen erscheint das Depot-Dashboard unterhalb des Grids wie bisher.

Das Depot-Dashboard (DepotPortfolio, PerformanceChart, Positionen, Transaktionen, SteuerReport) bleibt unveraendert unterhalb des Person-Grids.

## Technische Details

### Dateien

| Datei | Aktion | Beschreibung |
|---|---|---|
| `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx` | REWRITE | Von WidgetGrid/Card auf RECORD_CARD.GRID/RecordCard umstellen |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | EDIT | Person-Widgets von WidgetGrid/WidgetCell auf RECORD_CARD.GRID/RecordCard umstellen |

### KrankenversicherungTab — Neue Struktur

- Import `RecordCard`, `RECORD_CARD` statt `WidgetGrid`, `WidgetCell`, `Card`
- State: `openCardId` fuer Akte-Toggle
- Jeder KV-Vertrag wird zu einem `RecordCard` mit `entityType="insurance"`
- Open-State zeigt die bisherigen Detail-Felder (Versicherer, Beitrag, AG-Anteil, Zusatzdetails) als Formular — allerdings read-only da Demo-Daten
- Summary auf max 2 Werte begrenzen: Versicherer + Monatsbeitrag

### InvestmentTab — Person-Grid anpassen

- `WidgetGrid` + `WidgetCell` durch `RECORD_CARD.GRID` mit `RecordCard` ersetzen
- Kein offener State (isOpen bleibt false), da Klick = Person selektieren
- `onToggle` ruft `setSelectedPersonId(person.id)` auf
- RecordCard bekommt `isOpen={false}` permanent
- Visueller Selektionsstatus: `className` mit `ring-2 ring-primary` wenn selektiert (via RecordCard className prop)

## Ergebnis

Alle 5 Tabs in MOD-18 Finanzanalyse verwenden dann einheitlich:
- `RECORD_CARD.GRID` (2-spaltig) fuer die Kachel-Darstellung
- `RecordCard` mit klassischem quadratischem Closed-State (Avatar + Titel + Summary)
- Gleiche Glow-Logik (primary fuer Demo, emerald fuer manuell)
- Konsistentes Klick-Verhalten (Akte oeffnen oder Person selektieren)
