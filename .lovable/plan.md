
# Aufspaltung Finanzierungskalkulator + neues "Ueberschlaegiges Finanzierungsangebot"

## Neuer Aufbau (Block 1, oberhalb Finanzierungsantrag)

```text
+--- Listing-Suche (volle Breite) --------------------------------+

+--- 2-spaltiges Grid (gleiche Hoehe) ----------------------------+
|                                |                                  |
|  ECKDATEN                      |  FINANZIERUNGSKALKULATOR         |
|  (FinanceRequestCard)          |  (verschlankt)                   |
|                                |                                  |
|  - Finanzierungszweck          |  - Darlehensbetrag               |
|  - Objektart                   |  - Beleihungsauslauf             |
|  - Nutzungsart                 |  - Zinsbindung (Select)          |
|  - Mieteinnahmen               |  - Zinssatz p.a.                 |
|  ----                          |  - Tilgung p.a. (Input)          |
|  Kostenzusammenstellung        |  ----                            |
|  - Kaufpreis                   |  - Monatsrate                    |
|  - Modernisierung              |  - Restschuld (X J.)             |
|  - Notar                       |                                  |
|  - Grunderwerbsteuer           |  (KEINE Jahresrate mehr)         |
|  - Makler                      |  (KEIN Transfer-Button mehr)     |
|  = Gesamtkosten                |                                  |
|  ----                          |                                  |
|  Finanzierungsplan             |                                  |
|  - Eigenkapital                |                                  |
|  - Darlehenswunsch             |                                  |
|  - Max. Monatsrate             |                                  |
|  = Finanzierungsbedarf         |                                  |
+--------------------------------+----------------------------------+

+--- Neue Karte (volle Breite) -----------------------------------+
|                                                                   |
|  UEBERSCHLAEGIGES FINANZIERUNGSANGEBOT                           |
|                                                                   |
|  Darlehensbetrag     250.000,00 EUR                              |
|  Zinssatz nominal    3,50 %                                      |
|  Zinssatz effektiv   3,57 %    (berechnet)                       |
|  Tilgung             1,50 %                                      |
|  Darlehensrate       1.041,67 EUR / Monat                        |
|  Laufzeit            ca. 28 Jahre                                |
|                                                                   |
|  [ Eckdaten in Antrag uebernehmen ]  [ Tilgungsplan anzeigen ]   |
+-------------------------------------------------------------------+

+--- Tilgungsplan (nur sichtbar nach Klick) -----------------------+
|                                                                   |
|  Zins- und Tilgungsplan                                          |
|                                                                   |
|  Jahr | Restschuld   | Zinsen    | Tilgung   | Annuitaet         |
|  1    | 246.250,00   | 8.750,00  | 3.750,00  | 12.500,00         |
|  2    | 242.368,75   | 8.618,75  | 3.881,25  | 12.500,00         |
|  ...  | ...          | ...       | ...       | ...               |
|                                                                   |
|  [ Als PDF exportieren ]                                         |
+-------------------------------------------------------------------+
```

## Technische Umsetzung

### 1. FinanceCalculatorCard.tsx — verschlanken

- Zeile "Jahresrate" entfernen
- Prop `onTransferToApplication` und den zugehoerigen Button entfernen
- Neue Props exportieren: Die berechneten Werte (interestRate, monthlyRate, remainingDebt, termYears, repaymentRate) muessen dem Parent zugaenglich gemacht werden, damit die neue Angebots-Karte sie nutzen kann
- Loesung: Neuer Callback-Prop `onCalcUpdate?: (data: CalcData) => void`, der bei jeder Neuberechnung die aktuellen Werte nach oben meldet

```typescript
export interface CalcData {
  interestRate: number;
  repaymentRate: number;
  termYears: number;
  monthlyRate: number;
  remainingDebt: number;
  loanAmount: number;
}
```

### 2. Neue Komponente: FinanceOfferCard.tsx

Pfad: `src/components/finanzierung/FinanceOfferCard.tsx`

Visuelle Darstellung NICHT im Excel-Tabellenstil, sondern als professionelle Angebots-Karte:
- Groessere Zahlen, klare Abschnitte, etwas grosszuegigerer Abstand
- Effektivzins wird berechnet (Naeherungsformel: `nominal * (1 + nominal / (4 * 100))` oder exakte Berechnung mit Gebuehren)
- Geschaetzte Gesamtlaufzeit bis Volltilgung (iterativ berechnet)
- Zwei Buttons nebeneinander am unteren Rand:
  - "Eckdaten in Antrag uebernehmen" (uebernimmt den bisherigen Callback)
  - "Tilgungsplan anzeigen" (toggelt die Sichtbarkeit der Tilgungsplan-Karte)

Props:
```typescript
interface FinanceOfferCardProps {
  calcData: CalcData | null;
  onTransferToApplication?: () => void;
  onShowAmortization?: () => void;
  showAmortizationActive?: boolean;
}
```

### 3. Neue Komponente: AmortizationScheduleCard.tsx

Pfad: `src/components/finanzierung/AmortizationScheduleCard.tsx`

- Wird nur gerendert wenn der Nutzer "Tilgungsplan anzeigen" klickt
- Tabellarische Darstellung: Jahr | Restschuld Anfang | Zinsen | Tilgung | Annuitaet | Restschuld Ende
- Berechnung bis Volltilgung (oder max. 40 Jahre)
- Button "Als PDF exportieren" nutzt das bestehende PDF-Export-System (`usePdfExport` Hook)
- Da noch keine Kundendaten vorliegen, wird das PDF als "Ueberschlaegiges Finanzierungsangebot" ohne Personendaten erstellt — nur Darlehensdaten und Tilgungstabelle
- PDF enthaelt: Header mit "System of a Town", Angebotszusammenfassung und die vollstaendige Tilgungstabelle

### 4. FMFinanzierungsakte.tsx — Layout anpassen

- State fuer CalcData: `const [calcData, setCalcData] = useState<CalcData | null>(null)`
- State fuer Tilgungsplan-Sichtbarkeit: `const [showAmortization, setShowAmortization] = useState(false)`
- FinanceCalculatorCard erhaelt neuen `onCalcUpdate`-Prop, verliert `onTransferToApplication`
- Neue FinanceOfferCard unterhalb des 2-spaltigen Grids (volle Breite)
- AmortizationScheduleCard darunter, conditional gerendert
- `handleTransferToApplication` Callback bleibt, wird aber an FinanceOfferCard statt FinanceCalculatorCard uebergeben

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FinanceCalculatorCard.tsx` | Jahresrate entfernen, Transfer-Button entfernen, neuer `onCalcUpdate` Callback |
| `FinanceOfferCard.tsx` | **Neue Datei** — Angebots-Karte mit Effektivzins, Laufzeit, 2 Buttons |
| `AmortizationScheduleCard.tsx` | **Neue Datei** — Tilgungstabelle mit PDF-Export |
| `FMFinanzierungsakte.tsx` | Layout anpassen, neue Komponenten einbinden, State-Management |
