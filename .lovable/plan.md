

# Kalkulator + Preisliste: Ueberarbeitete Berechnungslogik

## Korrigiertes Berechnungsmodell

Die vorherige Logik war falsch. Hier die korrekten Wirkungsrichtungen:

```text
EINGABEN:
  1. Investitionskosten         (Eingabefeld + Sichern)     z.B. 4.800.000 EUR
  2. Provision brutto           (Slider, 5-15%)             z.B. 10%
  3. Preisanpassung             (+/- Stepper oder Slider)   z.B. +5%
  4. Einzelpreise pro Einheit   (Inline-Edit in Tabelle)    individuell

FESTE ANNAHME (nur fuer Anfangswert):
  Zielmarge = 20% → ergibt initialen Gesamtverkaufspreis
  Danach passt der Nutzer die Preise selbst an

BERECHNUNGSKETTE:
  Basis-Verkaufspreis_i   = Jahresnetto_i / 0.04   (Demo: 4% Rendite)
  Gesamtverkauf           = Summe aller Verkaufspreise
  Provision_abs           = Gesamtverkauf * Provision%
  Marge_abs               = Gesamtverkauf - Investitionskosten - Provision_abs
  Marge_%                 = Marge_abs / Gesamtverkauf * 100
  Endkundenrendite_i      = Jahresnetto_i / Verkaufspreis_i * 100
  Ø Endkundenrendite      = Durchschnitt aller Renditen
```

### Wie die Steuerungen wirken

**Provision-Slider aendert den Gesamtverkaufspreis:**
Provision wird als Anteil auf den Verkaufspreis aufgeschlagen. Steigt die Provision, steigen alle Verkaufspreise proportional. Sinkt sie, sinken sie. Die Marge bleibt gleich, der Endkunde zahlt mehr/weniger.

Formel: `Neuer_Preis_i = Alter_Preis_i * (1 + Delta_Provision)`

**Preisanpassung (+/- %) aendert alle Preise gleichmaessig:**
Alle Verkaufspreise werden prozentual erhoeht oder erniedrigt. Die Marge veraendert sich dadurch.

**Inline-Edit in der Tabelle ueberschreibt Einzelpreise:**
Manuell geaenderte Preise gelten als Override. Globale Anpassungen (Provision, +/-) wirken trotzdem proportional auf alle Einheiten.

**Endkundenrendite ist ein ERGEBNIS, kein Slider:**
Die Rendite berechnet sich rueckwaerts aus dem aktuellen Verkaufspreis: `Rendite = Jahresnetto / Verkaufspreis`. Sie wird in der Tabelle pro Einheit und als Durchschnitt im Kalkulator angezeigt.

---

## 1. Kalkulator — Neues Design

```text
+-------------------------------------------+
| [Calculator] Kalkulator          [Demo]   |
+-------------------------------------------+
|                                           |
| Investitionskosten                        |
| [ 4.800.000 EUR            ] [Sichern]   |
|                                           |
| Provision (brutto)             10,0 %    |
| ===========O============================ |
|              (5% — 15%, Step 0,5%)       |
|                                           |
| Preisanpassung                            |
|        [ - ]    0 %    [ + ]              |
|              (Step 1%, Range -20/+20%)   |
+-------------------------------------------+
|                                           |
|         +------------------+              |
|        /                    \             |
|       /   Investitions-      \            |
|      |    kosten 62%          |           |
|      |  +---------+          |            |
|      |  |Marge 28%|          |            |
|       \ +---------+         /             |
|        \ Provision 10%     /              |
|         +------------------+              |
|       (Recharts PieChart)                 |
|                                           |
+-------------------------------------------+
| Gesamtverkauf       7.200.000 EUR        |
| Investitionskosten  4.800.000 EUR        |
| Provision (10%)       720.000 EUR        |
| ---------------------------------------- |
| Marge            1.680.000 EUR (23,3%)   |
| Gewinn / Einheit      70.000 EUR        |
| Ø Endkundenrendite         3,87 %       |
+-------------------------------------------+
```

### Aenderungen gegenueber aktuellem Stand:

- **Zielmarge-Slider entfaellt komplett** — Marge ist berechnetes Ergebnis
- **Neues Eingabefeld "Investitionskosten"** mit "Sichern"-Button (kleiner Save-Icon-Button)
- **Provision-Slider bleibt** (5-15%, Step 0.5%, Default 10%), aber Aenderung wirkt jetzt auf Gesamtverkaufspreis
- **Neuer Preisanpassung-Stepper** mit Minus/Plus-Buttons und Prozentanzeige dazwischen. Range -20% bis +20%, Step 1%. Veraendert alle Verkaufspreise proportional
- **Balkendiagramm wird Recharts PieChart** mit 3 Segmenten (Investitionskosten, Provision, Marge)
- **Ø Endkundenrendite** wird als berechnete KPI unten angezeigt
- Neue Props: `units` (fuer Berechnung), `onProvisionChange`, `onPriceAdjustment`, Callbacks nach PortfolioTab

**Datei:** `src/components/projekte/StickyCalculatorPanel.tsx`

---

## 2. Preisliste — Inline-Bearbeitung

Zwei Spalten werden editierbar: **Verkaufspreis** und **EUR/m²**

- Klick auf Verkaufspreis-Zelle → Inline-Input
- Aenderung Verkaufspreis → EUR/m² berechnet sich automatisch (`Preis / Flaeche`)
- Klick auf EUR/m²-Zelle → Inline-Input
- Aenderung EUR/m² → Verkaufspreis berechnet sich automatisch (`EUR/m² * Flaeche`)
- Rendite berechnet sich rueckwaerts: `Jahresnetto / neuer_Preis * 100`
- Provision berechnet sich: `neuer_Preis * Provisionssatz`
- Enter oder Blur speichert den Wert
- Summenzeile aktualisiert sich sofort
- Editierbare Zellen bekommen einen dezenten Hover-Effekt und ein kleines Stift-Icon

Neue Props: `provisionRate`, `priceAdjustment`, `onUnitPriceChange(unitId, field, value)`, `unitOverrides`

**Datei:** `src/components/projekte/UnitPreislisteTable.tsx`

---

## 3. PortfolioTab — State-Koordination

Zentraler State:

```text
investmentCosts: number           Default: 4.800.000 (aus Projekt oder Demo)
provisionRate: number             Default: 0.10 (10%)
priceAdjustment: number           Default: 0 (in %)
unitOverrides: Record<string, {   Manuelle Preisaenderungen pro Einheit
  list_price?: number
}>
```

Die **effektiven Einheiten-Daten** werden als `useMemo` berechnet:
1. Basis: Demo-Units oder echte Units
2. Preisanpassung anwenden: `price * (1 + priceAdjustment/100)`
3. Provision-Anteil auf Preis: `price * (1 + provisionDelta)`
4. Override-Werte haben Vorrang
5. Rendite, EUR/m², Provision pro Einheit neu berechnen

Diese berechneten Units werden an Kalkulator UND Tabelle weitergegeben.

**Datei:** `src/pages/portal/projekte/PortfolioTab.tsx`

---

## Betroffene Dateien

| Aktion | Datei |
|--------|-------|
| Aendern | `src/components/projekte/StickyCalculatorPanel.tsx` |
| Aendern | `src/components/projekte/UnitPreislisteTable.tsx` |
| Aendern | `src/pages/portal/projekte/PortfolioTab.tsx` |

## Risiko

Mittel. Drei Dateien, neues Berechnungsmodell. Keine DB-Aenderungen. Recharts PieChart bereits als Dependency vorhanden.

