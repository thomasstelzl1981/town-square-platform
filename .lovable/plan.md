
# MOD-11 Finanzierungsakte: Intelligente Suche + Finanzierungskalkulator

## Ueberblick

Drei Aenderungen am MOD-11 Finanzierungsmanager:

1. **Intelligente Suche** statt Select-Dropdown: Freitext-Suchfeld, das Listings per Objekt-ID, Ort oder Strasse filtert und Vorschlaege anzeigt. "Kein Listing — manuell eingeben" entfaellt — wer nichts eingibt, fuellt manuell.

2. **FinanceRequestCard vereinfachen**: "Zinsbindung" und "Anfaengliche Tilgung" entfernen. Stattdessen: Eigenkapital-Feld bekommt einen "Berechnen"-Button. Klick darauf berechnet automatisch Darlehenswunsch (= Gesamtkosten - EK) und Finanzierungsbedarf mit Standard-Zinsbindung 10 Jahre.

3. **Neue Kachel "Finanzierungskalkulator"**: Sitzt **neben** der FinanceRequestCard (2-spaltig, halbe Breite). Dort kann man Zinsbindung einstellen, sieht den Zinssatz aus dem `interest_rates`-Tableau (Zone 1), Tilgung ist auf 1,5% voreingestellt. Berechnung zeigt monatliche Rate, Gesamtkosten der Finanzierung und Restschuld am Ende der Zinsbindung.

---

## Aenderung 1: Intelligente Listing-Suche

**Datei:** `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`

Der bisherige Select-Block (Zeilen 218-239) wird ersetzt durch ein Combobox-artiges Suchfeld:

- Freitext-Input mit Lupe-Icon und Placeholder "Objekt suchen (ID, Ort, Strasse...)"
- `v_public_listings` werden weiterhin per `useQuery` geladen
- Eingabe filtert clientseitig (case-insensitive) ueber `public_id`, `title`, `city`, `postal_code`
- Unterhalb des Inputs erscheint eine Dropdown-Liste mit maximal 8 Treffern
- Jeder Treffer zeigt: Titel, Ort, Preis
- Klick auf einen Treffer fuellt die Karten (wie bisher ueber externalData)
- Kein Treffer / leeres Feld = manueller Modus, keine Meldung noetig
- Die Kachel ("Objekt aus Marktplatz uebernehmen") bleibt als Container, nur der Select wird durch die Suche ersetzt

---

## Aenderung 2: FinanceRequestCard anpassen (nur MOD-11 Variante)

**Datei:** `src/components/finanzierung/FinanceRequestCard.tsx`

Neue Props:
- `showCalculator?: boolean` — wenn true, werden "Zinsbindung" und "Anfaengliche Tilgung" ausgeblendet
- `onCalculate?: (finanzierungsbedarf: number) => void` — Callback wenn "Berechnen" geklickt wird

Aenderungen im Finanzierungsplan-Bereich:
- Zeilen "Zinsbindung" und "Anfaengliche Tilgung" werden ausgeblendet wenn `showCalculator=true`
- Beim Eigenkapital-Feld: rechts neben dem Input erscheint ein kleiner Button (Sparkles/Zap Icon) "Berechnen"
- Klick setzt `loanRequest = gesamtkosten - equity` und ruft `onCalculate(finanzierungsbedarf)` auf

MOD-07 nutzt weiterhin die Karte ohne `showCalculator` — dort bleiben alle Felder sichtbar.

---

## Aenderung 3: Neue Kachel "Finanzierungskalkulator"

**Neue Datei:** `src/components/finanzierung/FinanceCalculatorCard.tsx`

Eine kompakte Kachel die neben der FinanceRequestCard liegt (in einem `grid grid-cols-2 gap-4`-Layout).

**Props:**
- `finanzierungsbedarf: number` — der zu finanzierende Betrag
- `purchasePrice: number` — Kaufpreis fuer Beleihungsauslauf-Berechnung

**Inhalt (tabellarisch, gleicher Stil):**
- **Darlehensbetrag** (readonly, aus Finanzierungsbedarf uebernommen)
- **Zinsbindung** (Select: 5/10/15/20/25/30 Jahre, Default: 10)
- **Zinssatz p.a.** (readonly, automatisch aus `interest_rates` geladen basierend auf Zinsbindung + Beleihungsauslauf)
- **Tilgung p.a.** (Input, Default: 1,5%)
- **Beleihungsauslauf (LTV)** (readonly, berechnet: Darlehensbetrag / Kaufpreis * 100, gerundet auf naechste 10er-Stufe fuer Zins-Lookup)
- Trennlinie
- **Monatsrate** (berechnet, bold: `Darlehensbetrag * (Zins + Tilgung) / 12`)
- **Jahresrate** (berechnet: Monatsrate * 12)
- **Restschuld nach Zinsbindung** (berechnet nach Annuitaetenformel)

**Zins-Lookup:** Query auf `interest_rates` mit `term_years` und `ltv_percent`. LTV wird auf die naechste verfuegbare Stufe (60, 70, 80, 90, 100) aufgerundet. Beispiel: LTV 73% → Lookup mit ltv_percent=80.

**Datenbank-Werte (bereits vorhanden):**
```
term_years | ltv_percent | interest_rate
5          | 60          | 3.50
5          | 70          | 3.70
...
10         | 80          | 4.10
...
30         | 100         | 5.20
```

---

## Layout in FMFinanzierungsakte.tsx

Die beiden unteren Kacheln (FinanceRequestCard + FinanceCalculatorCard) liegen nebeneinander:

```
[Eckdaten — volle Breite]
[Selbstauskunft — volle Breite]
[Ueberschrift: Finanzierungsobjekt]
[Listing-Suche — volle Breite]
[FinanceObjectCard — volle Breite]
[FinanceRequestCard | FinanceCalculatorCard]  ← grid-cols-2
```

Das `grid-cols-2`-Layout liegt innerhalb des bestehenden `max-w-7xl`-Containers, sodass die Gesamtbreite gleich bleibt.

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FMFinanzierungsakte.tsx` | Listing-Select durch Freitext-Suche ersetzen, 2-spaltiges Layout fuer Request+Kalkulator, State fuer Finanzierungsbedarf |
| `FinanceRequestCard.tsx` | Neue Props `showCalculator` + `onCalculate`, Berechnen-Button am EK-Feld, Zinsbindung/Tilgung ausblendbar |
| `FinanceCalculatorCard.tsx` | **NEU** — Kalkulator mit Zins-Lookup, Annuitaetenberechnung, Monatsrate |

## Keine DB-Migration

`interest_rates`-Tabelle existiert bereits mit allen benoetigten Zinsbindungen und LTV-Stufen.
