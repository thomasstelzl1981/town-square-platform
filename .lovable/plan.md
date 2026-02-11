

# MOD-07 Anfrage + MOD-11 Finanzierungsakte: Zwei-Kachel-Layout mit Zwischenspeichern

## Konzept

Beide Module (MOD-07 Anfrage und MOD-11 Finanzierungsakte) zeigen **identisch** zwei Kacheln:

1. **Kachel 1: Finanzierungsobjekt** — Alle Objektdaten (Adresse, Typ, Baujahr, Flaechen, Ausstattung, Lage, Zimmer, Stellplaetze)
2. **Kachel 2: Beantragte Finanzierung** — Kostenzusammenstellung (Kaufpreis, Nebenkosten, Gesamtkosten) und Finanzierungsplan (Eigenkapital, Darlehen, Zinsbindung, Tilgung, Monatsrate, Finanzierungsbedarf)

Es entsteht **keine** Finanzierungsakte/Anfrage-ID beim Befuellen. Die Daten werden nur lokal zwischengespeichert (localStorage), bis ein spaeterer Schritt den Datensatz tatsaechlich anlegt.

Jede Kachel hat unten einen **"Zwischenspeichern"**-Button, der die Eingaben in localStorage persistiert (Key: `mod07-anfrage-object` / `mod07-anfrage-finance` bzw. `mod11-akte-object` / `mod11-akte-finance`).

---

## Aenderung 1: Gemeinsame Komponente erstellen

**Neue Datei:** `src/components/finanzierung/FinanceObjectCard.tsx`

Eine wiederverwendbare Kachel-Komponente mit allen Objektfeldern im tabellarischen Stil (TR-Rows):
- Strasse, Hausnummer, PLZ, Ort
- Objektart (Select)
- Baujahr, Wohnflaeche, Grundstuecksflaeche
- Ausstattungsniveau, Wohnlage
- Anzahl Zimmer, Stellplaetze
- "Zwischenspeichern"-Button unten

**Neue Datei:** `src/components/finanzierung/FinanceRequestCard.tsx`

Zweite Kachel mit:
- Finanzierungszweck (Kauf/Neubau/Umschuldung/Modernisierung)
- **Kostenzusammenstellung**: Kaufpreis, Modernisierung, Notar, Grunderwerbsteuer, Makler, **Gesamtkosten** (berechnet)
- **Finanzierungsplan**: Eigenkapital, Darlehenswunsch, Zinsbindung, Tilgung, Max. Monatsrate, **Finanzierungsbedarf** (berechnet)
- "Zwischenspeichern"-Button unten

Beide Komponenten akzeptieren Props:
- `storageKey: string` (fuer localStorage-Prefix)
- `initialData?: object` (zum Vorbelegen)
- `readOnly?: boolean`

---

## Aenderung 2: MOD-07 AnfrageTab umbauen

**Datei:** `src/pages/portal/finanzierung/AnfrageTab.tsx`

Kompletter Umbau: Kein Draft-Laden, kein `finance_request` erstellen, kein AnfrageFormV2.

Stattdessen:
```
max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6

Headline: "Finanzierungsanfrage"
Subline: "Erfassen Sie die Objektdaten und Ihren Finanzierungswunsch"

[Kachel 1: FinanceObjectCard storageKey="mod07"]
[Kachel 2: FinanceRequestCard storageKey="mod07"]
```

Kein "Anfrage erstellen"-Button — das kommt in einem spaeteren Schritt.

---

## Aenderung 3: MOD-11 FMFinanzierungsakte anpassen

**Datei:** `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`

Die bestehende Seite wird vereinfacht. Die Eckdaten-Kachel und die Selbstauskunft-Kachel bleiben. Die bestehende "Finanzierungsobjekt"-Sektion wird durch die gleichen zwei Kacheln ersetzt:

```
[Bestehend: Eckdaten-Kachel]
[Bestehend: Selbstauskunft-Kachel]
[Kachel: FinanceObjectCard storageKey="mod11"]
[Kachel: FinanceRequestCard storageKey="mod11"]
```

Der "Finanzierungsakte erstellen"-Button bleibt vorerst entfernt — kommt spaeter.

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/finanzierung/FinanceObjectCard.tsx` | **NEU** — Wiederverwendbare Objekt-Kachel |
| `src/components/finanzierung/FinanceRequestCard.tsx` | **NEU** — Wiederverwendbare Finanzierungs-Kachel |
| `src/pages/portal/finanzierung/AnfrageTab.tsx` | Kompletter Umbau: Zwei Kacheln direkt, kein Draft-Flow |
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | Objekt-Sektion durch die zwei gemeinsamen Kacheln ersetzen |

## Stil

Beide Kacheln verwenden den bestehenden tabellarischen Stil (Table/TR mit Label|Wert, `h-7 text-xs` Inputs, `glass-card`). Berechnete Werte (Gesamtkosten, Finanzierungsbedarf) werden als fette Zeilen mit `bg-muted/30` dargestellt.

## Keine DB-Aenderung

Daten werden nur in localStorage zwischengespeichert. Kein `finance_request` wird angelegt.

