

## Feature: Preisvorschlag-Rechner im Acquiary Objekteingang

### Idee

Direkt in der Schnellanalyse (QuickAnalysisBanner) wird ein editierbares Kaufpreis-Feld eingebaut. Der Nutzer kann den Angebotspreis ueberschreiben, um zu pruefen, bei welchem Preis sich das Objekt rechnet. Der angepasste Preis kann als `price_counter` auf dem Offer gespeichert werden.

### Wie es funktioniert

1. Die Schnellanalyse zeigt den aktuellen Kaufpreis als **editierbares Feld** an
2. Daneben steht klein der Original-Angebotspreis als Referenz
3. Aendert der Nutzer den Preis, berechnen sich alle KPIs in Echtzeit neu (Bruttorendite, Cashflow, Flip-Gewinn, Marge)
4. Ein "Speichern"-Button schreibt den Gegenvorschlag in die DB (`price_counter`-Spalte)
5. Der angepasste Preis fliesst auch in die Bestand- und Aufteiler-Tabs als `initialData.purchasePrice`

### Aenderungen

**1. Datenbank: Neue Spalte `price_counter`**

```text
ALTER TABLE acq_offers ADD COLUMN price_counter numeric DEFAULT NULL;
```

Nullable — nur gesetzt, wenn der Nutzer einen Gegenvorschlag eingibt. RLS bleibt unveraendert (tenant_id-basiert).

**2. ObjekteingangDetail.tsx — Preis-Override-State**

- Neuer State: `priceOverride` (initialisiert mit `offer.price_counter ?? offer.price_asking`)
- Dieser Override-Preis wird an `QuickAnalysisBanner`, `BestandCalculation` und `AufteilerCalculation` weitergegeben statt `offer.price_asking`
- Wenn `price_counter` bereits in der DB steht, wird dieser beim Laden angezeigt

**3. QuickAnalysisBanner — Editierbarer Kaufpreis**

Aktuell: Kaufpreis ist nur eine Anzeige-KPI.

Neu:
- Erste KPI-Position wird ein Input-Feld mit dem aktuellen Preis
- Darunter klein: "Angebot: X EUR" als Referenz (grau, durchgestrichen wenn abweichend)
- Alle 7 KPIs rechnen sich live mit dem neuen Preis
- Kleiner "Speichern"-Button erscheint, wenn der Preis vom Original abweicht
- Speichern schreibt `price_counter` in die `acq_offers`-Tabelle
- Visueller Hinweis: Badge "Gegenvorschlag" wenn price_counter != price_asking

**4. Bestand- und Aufteiler-Tabs — Override-Preis nutzen**

- `initialData.purchasePrice` bekommt den Override-Preis statt `offer.price_asking`
- Innerhalb der Tabs kann der Kaufpreis weiterhin NICHT geaendert werden (nur ueber den Banner oben)
- Die Tabs reflektieren automatisch den angepassten Preis

### Dateien

| Datei | Aktion |
|-------|--------|
| DB Migration | `ALTER TABLE acq_offers ADD COLUMN price_counter numeric;` |
| `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` | State fuer Override-Preis, Weitergabe an alle Komponenten |
| Kein Engine-Change noetig | Die Engines nehmen `purchasePrice` als Parameter — der Wert wird einfach anders gesetzt |

### Was NICHT geaendert wird

- Engine-Dateien (calcBestandQuick, calcAufteilerFull etc.) — bereits parametrisch
- BestandCalculation.tsx / AufteilerCalculation.tsx — nur `initialData` aendert sich
- PreisvorschlagDialog — bleibt fuer die formelle Kommunikation an den Makler

### UX-Flow

```text
Nutzer oeffnet Objekteingang
  → sieht Schnellanalyse mit Kaufpreis 850.000 EUR
  → Cashflow ist negativ, Flip-Marge 8% (zu wenig)
  → Nutzer aendert Preis auf 720.000 EUR
  → Sofort: Cashflow wird positiv, Marge steigt auf 22%
  → Nutzer klickt "Speichern"
  → price_counter = 720.000 wird in DB geschrieben
  → Badge "Gegenvorschlag: 720.000 EUR" erscheint
  → Bestand- und Aufteiler-Tabs rechnen ebenfalls mit 720.000
```

