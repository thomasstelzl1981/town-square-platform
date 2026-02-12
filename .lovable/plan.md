
# Seitenumbau: Eckdaten + Finanzierung nach oben, neue Struktur

## Neuer Gesamtaufbau der Seite (von oben nach unten)

```text
+------------------------------------------------------------------+
|  Header: "Neue Finanzierungsakte" + Zurueck-Button               |
+------------------------------------------------------------------+

+--- Objekt aus Marktplatz uebernehmen (Suchfeld, volle Breite) ---+

+--- 2-spaltiges Grid -------------------------------------------- +
|                                |                                  |
|  ECKDATEN (konsolidierte       |  FINANZIERUNGSKALKULATOR         |
|  Karte im bisherigen           |  (wie bisher, plus neuer         |
|  FinanceRequestCard-Design)    |  Button "Eckdaten uebernehmen")  |
|                                |                                  |
|  - Finanzierungszweck          |  - Darlehensbetrag               |
|  - Objektart (neu)             |  - Beleihungsauslauf             |
|  - Nutzungsart (neu)           |  - Zinsbindung                   |
|  - Mieteinnahmen mtl. (neu)    |  - Zinssatz p.a.                 |
|  ----                          |  - Tilgung p.a.                  |
|  Kostenzusammenstellung        |  ----                            |
|  - Kaufpreis                   |  - Monatsrate                    |
|  - Modernisierung              |  - Jahresrate                    |
|  - Notar                       |  - Restschuld                    |
|  - Grunderwerbsteuer           |  ----                            |
|  - Makler                      |  [Eckdaten in Antrag             |
|  = Gesamtkosten                |   uebernehmen] Button            |
|  ----                          |                                  |
|  Finanzierungsplan             |                                  |
|  - Eigenkapital [Berechnen]    |                                  |
|  - Darlehenswunsch             |                                  |
|  - Max. Monatsrate             |                                  |
|  = Finanzierungsbedarf         |                                  |
|                                |                                  |
+--------------------------------+----------------------------------+

+------------------------------------------------------------------+
|  Ueberschrift: FINANZIERUNGSANTRAG                               |
|  Untertitel: Detaillierte Angaben fuer die Bankeinreichung       |
+------------------------------------------------------------------+

+--- Selbstauskunft (wie bisher, volle Breite) --------------------+

+--- Ueberschrift: Finanzierungsobjekt ----------------------------+
+--- FinanceObjectCard (wie bisher, volle Breite) -----------------+

+--- Floating Save Button (rechts unten) --------------------------+
```

---

## Technische Umsetzung

### 1. FinanceRequestCard.tsx — Felder ergaenzen

Neue Props:
- `showObjectFields?: boolean` — wenn true, werden vor der Kostenzusammenstellung drei neue Zeilen angezeigt

Neue Felder (nur bei `showObjectFields=true`, oberhalb von "Kostenzusammenstellung"):
- **Objektart** (Select: ETW, EFH, ZFH, MFH, Grundstueck, Gewerbe)
- **Nutzungsart** (Select: Eigengenutzt / Vermietet)
- **Mieteinnahmen mtl. (EUR)** (Number-Input)

Dazu wird `FinanceFormData` um drei Felder erweitert:
- `objectType: string`
- `usage: string`
- `rentalIncome: string`

Die Karten-Ueberschrift wird ueber eine neue Prop `title?: string` steuerbar (Default: "Beantragte Finanzierung", MOD-11 setzt "Eckdaten").

### 2. FinanceCalculatorCard.tsx — Button hinzufuegen

Neue Prop:
- `onTransferToApplication?: () => void`

Am Ende der Karte (nach Restschuld) wird ein Button angezeigt:
- Text: "Eckdaten in Antrag uebernehmen"
- Icon: ArrowDown oder Copy
- Klick ruft `onTransferToApplication()` im Parent auf

### 3. FMFinanzierungsakte.tsx — Umbau der Seitenstruktur

Aenderungen:
- **Alte Eckdaten-Karte** (Zeilen 152-213) wird komplett entfernt
- **Listing-Suche** wird an den Anfang verschoben (direkt nach Header)
- **2-spaltiges Grid** (FinanceRequestCard + FinanceCalculatorCard) kommt direkt nach der Suche
- FinanceRequestCard erhaelt `showObjectFields={true}` und `title="Eckdaten"`
- **Neue Ueberschrift** "Finanzierungsantrag" vor dem Selbstauskunft-Block
- Die alte Ueberschrift "Finanzierungsobjekt" bleibt vor der FinanceObjectCard
- Der `onTransferToApplication`-Callback befuellt die Selbstauskunft- und ObjectCard-Felder aus den Eckdaten (z.B. Objektart, Nutzungsart, Mieteinnahmen)

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FinanceRequestCard.tsx` | 3 neue Felder in Interface + UI, neue Props `showObjectFields` und `title` |
| `FinanceCalculatorCard.tsx` | Neuer Button "Eckdaten in Antrag uebernehmen" |
| `FMFinanzierungsakte.tsx` | Seitenstruktur umbauen, alte Eckdaten-Karte entfernen, Transfer-Callback implementieren |

MOD-07 (`AnfrageTab.tsx`) bleibt unveraendert — dort wird `showObjectFields` nicht gesetzt.
