

# Haushaltsrechnung: Korrektur Platzierung, Struktur und Verhalten

## 1. Platzierung: Ganz nach unten

Die `HouseholdCalculationCard` wird in `FMFinanzierungsakte.tsx` von ihrer aktuellen Position (Zeile 242, oberhalb "Finanzierungsantrag") ans Ende der Seite verschoben -- nach dem `FinanceObjectCard`-Block, also als letztes Element vor dem Floating-Save-Button.

## 2. Struktur: Exakt wie Selbstauskunft

Die aktuelle 2-spaltige Tabellen-Struktur (Einnahmen links | Ausgaben rechts) wird komplett ersetzt durch die identische Gitter-Tabellenstruktur der Selbstauskunft:

- **3-Spalten-Layout**: `Label | Wert | (leer oder Summe)` -- analog zu `TR`, `DualHeader`, `SectionHeaderRow` aus `ApplicantPersonFields.tsx`
- **Einnahmen-Block oben**, dann **Ausgaben-Block darunter** (vertikal, nicht nebeneinander)
- Summenzeilen wie in der Selbstauskunft (`bg-muted/30`, fett)

### Aufbau der Kachel

```text
+--- glass-card ------------------------------------------------+
| [Calculator] HAUSHALTSRECHNUNG INKL. FINANZIERUNGSOBJEKT       |
| Simulation der monatl. Einnahmen/Ausgaben nach Finanzierung    |
+----------------------------------------------------------------+
|                                                                |
| Feld                       | Wert                              |
|----------------------------+-----------------------------------|
| MONATLICHE EINNAHMEN       | (SectionHeaderRow)                |
| Nettoeinkommen             | [editierbar]                      |
| Aus selbstst. Taetigkeit   | [editierbar]                      |
| Nebentaetigkeit            | [editierbar]                      |
| Mieteinnahmen (bestehend)  | [editierbar]                      |
| Kindergeld                 | [editierbar]                      |
| Unterhaltseinnahmen        | [editierbar]                      |
| Sonstiges                  | [editierbar]                      |
|                            |                                   |
| NEUE FINANZIERUNG (grau)   | (SectionHeaderRow, hellgrau)      |
| Mieteinnahmen (neu)        | [editierbar, hellgrau Hintergrund]|
| Steuervorteil (KA)         | [editierbar, hellgrau Hintergrund]|
|                            |                                   |
| Summe Einnahmen            | X.XXX,XX EUR  (fett)             |
|----------------------------+-----------------------------------|
| MONATLICHE AUSGABEN        | (SectionHeaderRow)                |
| Lebenshaltungskosten       | [editierbar]                      |
| Aktuelle Warmmiete         | [0 bei Eigennutzung, disabled]    |
| Priv. Krankenversicherung  | [editierbar]                      |
| Unterhaltsverpflichtungen  | [editierbar]                      |
| Leasing (Kfz)              | [editierbar]                      |
| Sonstige Fixkosten         | [editierbar]                      |
|                            |                                   |
| NEUE FINANZIERUNG (grau)   | (SectionHeaderRow, hellgrau)      |
| Neue Darlehensrate         | [editierbar, hellgrau Hintergrund]|
| Nebenkosten (3 EUR/qm)     | [editierbar, hellgrau Hintergrund]|
|                            |                                   |
| Summe Ausgaben             | X.XXX,XX EUR  (fett, rot)        |
|----------------------------+-----------------------------------|
| ERGEBNIS                   |                                   |
| Verfuegbares Einkommen     | +/- X.XXX EUR (gruen/rot, fett)  |
| Kapitaldienstfaehigkeit    | Tragfaehig / Nicht tragfaehig    |
+----------------------------------------------------------------+
| [ Haushaltsrechnung berechnen ]                                |
+----------------------------------------------------------------+
```

## 3. Verhalten: Struktur immer sichtbar

- Die gesamte Tabelle mit allen Zeilen wird **immer angezeigt** (kein leerer Zustand mehr)
- Alle Felder sind initial leer (Wert 0 oder leer)
- Der Button "Haushaltsrechnung berechnen" **befuellt** die Felder mit den Daten aus Selbstauskunft und Kalkulator
- Alle Felder bleiben jederzeit editierbar (ausser Summenzeilen und bei Eigennutzung: Warmmiete = 0, disabled)

## 4. Farbliche Differenzierung "Neue Finanzierung"

- Die Section-Header-Zeilen "Neue Finanzierung" erhalten `bg-blue-50/50 dark:bg-blue-950/20` statt `bg-muted/40`
- Die Datenzeilen der neuen Finanzierung erhalten `bg-muted/15` als Hintergrund, um sie dezent vom Rest abzuheben

## Technische Umsetzung

### Datei: `HouseholdCalculationCard.tsx` -- Komplett-Rewrite

- Verwendet dieselben Table-Komponenten aus `@/components/ui/table`
- Einspaltige Tabelle (Label | Wert), NICHT die 3-Spalten AS1/AS2 Form (da hier keine zwei Antragsteller, sondern konsolidierte Haushaltswerte)
- `SectionHeaderRow`-artige Zeilen fuer Abschnitte
- Summenzeilen analog zur Selbstauskunft
- State wird initial mit Nullwerten befuellt, "Berechnen"-Button ueberschreibt mit echten Daten
- Ergebnisblock (Verfuegbares Einkommen + Kapitaldienstfaehigkeit) am Ende der Tabelle integriert

### Datei: `FMFinanzierungsakte.tsx` -- Verschiebung

- `HouseholdCalculationCard` wird von Zeile 242 nach unten verschoben: nach dem FinanceObjectCard-Block (nach Zeile 290), als letztes inhaltliches Element

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `HouseholdCalculationCard.tsx` | Komplett-Rewrite: Selbstauskunft-Tabellenstruktur, immer sichtbar, Button befuellt nur |
| `FMFinanzierungsakte.tsx` | Verschiebung der Kachel ans Seitenende |

