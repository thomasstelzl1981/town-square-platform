

# Haushaltsrechnung: T-Konto-Layout (Einnahmen | Ausgaben nebeneinander)

## Aenderung

Die aktuelle vertikale Darstellung (Einnahmen oben, Ausgaben darunter) wird durch ein klassisches **Buchhaltungs-T-Konto** ersetzt: Einnahmen links, Ausgaben rechts -- nebeneinander in zwei Spalten.

## Neues Layout

```text
+--- glass-card ------------------------------------------------------------------+
| [Calculator] HAUSHALTSRECHNUNG INKL. FINANZIERUNGSOBJEKT                         |
| Simulation der monatl. Einnahmen/Ausgaben nach Finanzierung                      |
+------------------------------------------+---------------------------------------+
| MONATLICHE EINNAHMEN                     | MONATLICHE AUSGABEN                   |
+------------------------------------------+---------------------------------------+
| Nettoeinkommen           [________] EUR  | Lebenshaltungskosten    [________] EUR|
| Aus selbstst. Taetigkeit [________] EUR  | Aktuelle Warmmiete      [________] EUR|
| Nebentaetigkeit          [________] EUR  | Priv. Krankenversich.   [________] EUR|
| Mieteinnahmen (best.)    [________] EUR  | Unterhaltsverpflicht.   [________] EUR|
| Kindergeld               [________] EUR  | Leasing (Kfz)           [________] EUR|
| Unterhaltseinnahmen      [________] EUR  | Sonstige Fixkosten      [________] EUR|
| Sonstiges                [________] EUR  |                                       |
+------------------------------------------+---------------------------------------+
| NEUE FINANZIERUNG (blau)                 | NEUE FINANZIERUNG (blau)              |
+------------------------------------------+---------------------------------------+
| Mieteinnahmen (neu)      [________] EUR  | Neue Darlehensrate      [________] EUR|
| Steuervorteil (KA)       [________] EUR  | Nebenkosten (3 EUR/qm)  [________] EUR|
+------------------------------------------+---------------------------------------+
| Summe Einnahmen       X.XXX,XX EUR (fett)| Summe Ausgaben       X.XXX,XX EUR(rot)|
+------------------------------------------+---------------------------------------+
| ERGEBNIS                                                                         |
| Verfuegbares Einkommen: +/- X.XXX EUR (gruen/rot)                               |
| Kapitaldienstfaehigkeit: Tragfaehig / Nicht tragfaehig                           |
+------------------------------------------+---------------------------------------+
| [ Haushaltsrechnung berechnen ]   [Info-Hinweis je nach Nutzungsart]             |
+----------------------------------------------------------------------------------+
```

## Technische Umsetzung

### Datei: `HouseholdCalculationCard.tsx` -- UI-Rewrite

Die Table-Struktur wird durch ein **CSS-Grid mit zwei Spalten** (`grid grid-cols-2`) ersetzt:

- **Linke Spalte**: Einnahmen-Block mit Section-Header, Datenzeilen, "Neue Finanzierung"-Bereich und Summenzeile
- **Rechte Spalte**: Ausgaben-Block mit identischer Struktur, getrennt durch `border-l`
- Jede Spalte nutzt intern weiterhin die kompakte `Table`-Komponente (Label | Input)
- Die kuerzere Spalte (Ausgaben hat weniger Zeilen) wird nach unten mit Leerraum aufgefuellt, damit beide Spalten gleich hoch sind
- **Ergebnis-Block** spannt ueber die volle Breite (`col-span-2`)

### Beibehaltene Logik

- Alle State-Felder, `handleCalculate`, Summenberechnung und Kapitaldienstfaehigkeit bleiben unveraendert
- Nur die Render-Struktur aendert sich von vertikal zu horizontal

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `HouseholdCalculationCard.tsx` | UI-Rewrite: 2-spaltiges T-Konto statt vertikaler Liste |

