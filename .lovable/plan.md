

## Analyse & Korrektur: Demo-Daten-Inkonsistenz ueber alle Module

### Diagnose

Die Plattform zeigt in verschiedenen Ansichten **unterschiedliche Immobilien-Daten** fuer die gleichen drei Objekte (BER-01, MUC-01, HH-01). Die Ursache ist ein **Dual-SSOT-Problem**:

1. **Datenbank (properties-Tabelle)**: Enthaelt die echten Werte (Kaufpreis, Adresse, Miete via leases)
2. **useDemoListings.ts (hardcoded)**: Enthaelt komplett andere Werte, die nie mit der DB synchronisiert wurden

Jede Ansicht nutzt eine andere Quelle:
- **MOD-04 Portfolio/Verwaltung**: Liest direkt aus der DB -- zeigt korrekte Werte
- **MOD-08 Suche, MOD-09 Katalog, Zone 3 Kaufy**: Lesen aus `useDemoListings.ts` -- zeigen falsche Werte
- **MOD-08 Expose**: Mischt beide Quellen -- Demo-Listings liefern hardcoded Werte, DB-Listings liefern DB-Werte

### Konkrete Abweichungen

```text
Objekt    | Feld       | DB (SSOT)       | useDemoListings.ts | Differenz
----------|------------|-----------------|--------------------|-----------
BER-01    | Adresse    | Schadowstr.     | Prenzlauer Allee 88| komplett anders
BER-01    | Kaufpreis  | 280.000 EUR     | 320.000 EUR        | +40.000
BER-01    | Miete/Mo   | 1.150 EUR       | 850 EUR            | -300
MUC-01    | Adresse    | Leopoldstr.     | Leopoldstrasse 42  | abweichend
MUC-01    | Kaufpreis  | 420.000 EUR     | 480.000 EUR        | +60.000
MUC-01    | Miete/Mo   | 1.580 EUR       | 1.250 EUR          | -330
HH-01     | Adresse    | Osterstr.       | Grosse Elbstrasse 15| komplett anders
HH-01     | Kaufpreis  | 175.000 EUR     | 195.000 EUR        | +20.000
HH-01     | Miete/Mo   | 750 EUR         | 580 EUR            | -170
```

### Zweites Problem: Leere Vertriebspipeline

Die Tabellen `listings` und `listing_publications` sind **komplett leer**. Das bedeutet:
- `v_public_listings` (der offizielle Zone-3-Kanal) liefert null Ergebnisse
- Kaufy zeigt NUR hardcoded Demo-Daten, keine echten Listings
- MOD-08 Suche findet keine DB-Listings
- MOD-09 Katalog findet keine Partner-Listings

### Korrekturplan

#### Schritt 1: useDemoListings.ts synchronisieren

Die hardcodierten Werte in `DEMO_PROPERTIES` muessen exakt mit der Datenbank uebereinstimmen:

| Feld | BER-01 (neu) | MUC-01 (neu) | HH-01 (neu) |
|---|---|---|---|
| address | Schadowstr. | Leopoldstr. | Osterstr. |
| askingPrice | 280000 | 420000 | 175000 |
| monthlyRent | 1150 | 1580 | 750 |
| annualIncome | 13800 | 18960 | 9000 |
| postalCode | aus DB laden oder hart setzen | | |

Alle abgeleiteten Werte (Rendite, Faktor) berechnen sich dann korrekt aus den synchronisierten Basisdaten.

#### Schritt 2: Demo-Listings und Publications in DB anlegen

Damit die Vertriebspipeline funktioniert (v_public_listings, MOD-09 Katalog, Kaufy), muessen fuer die drei Demo-Immobilien echte Datensaetze angelegt werden:

- **3 Listings** in der `listings`-Tabelle (je eines pro Demo-Property, status='active')
- **6 Listing-Publications** in `listing_publications` (je 2 pro Listing: channel='kaufy' + channel='partner_network', status='active')

Dies fuellt `v_public_listings` und ermoeglicht den korrekten Datenfluss ueber alle Module.

#### Schritt 3: Investment Engine pruefen

Die Edge Function `sot-investment-engine` selbst ist korrekt implementiert -- sie rechnet mit den uebergebenen Werten. Das Problem waren die falschen Eingabewerte aus dem hardcodierten Demo-Layer. Nach Schritt 1 werden alle Kalkulationen (Rendite, Cashflow, Steuerersparnis) automatisch korrekt, da die Engine die synchronisierten Werte erhaelt.

#### Schritt 4: Kaufy Zone 3 validieren

Nach den Korrekturen soll Kaufy sowohl:
- Demo-Listings aus `useDemoListings.ts` anzeigen (fuer den Fall ohne DB-Zugang), als auch
- echte Listings aus `v_public_listings` laden (nach Schritt 2 befuellt)

Die Deduplizierung in `Kaufy2026Home.tsx` (Zeile 217-220) muss sicherstellen, dass Demo- und DB-Eintraege nicht doppelt erscheinen. Aktuell wird NICHT dedupliziert -- dies muss ergaenzt werden.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/hooks/useDemoListings.ts` | Alle Preise, Adressen, Mieten an DB anpassen |
| SQL Migration | 3 Listings + 6 Publications fuer Demo-Properties anlegen |
| `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Deduplizierung Demo vs. DB-Listings einbauen |
| `src/pages/portal/investments/SucheTab.tsx` | Deduplizierung pruefen (bereits vorhanden in Zeile 237-241) |

### Ergebnis

Nach dieser Korrektur zeigen **alle Ansichten** (MOD-04, MOD-08, MOD-09, Zone 1 SalesDesk, Zone 3 Kaufy) exakt dieselben drei Immobilien mit identischen Werten. Die Investment Engine berechnet auf Basis der korrekten DB-Werte, und die Vertriebspipeline (Listings + Publications) ist funktionsfaehig.

