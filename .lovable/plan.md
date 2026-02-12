

# Kaufy-Objekte Kachel: 3-Zeilen-Design + Multi-Select + "Objekt uebernehmen"

## Ziel

Die "Objekte aus Kaufy" Kachel (rechts neben Magic Intake) wird auf das identische 3-Zeilen-Design der MagicIntakeCard gebracht. Multi-Select wird ermoeglicht und ein blauer "Objekt uebernehmen" Button schliesst die Kachel ab.

## Design (3 Zeilen)

```text
+------------------------------------------+
| [ShoppingBag] Objekte aus Kaufy          |  ← Zeile 1: Icon + Titel
| Marktplatz durchsuchen — Stammdaten...   |  ← Zeile 2: Beschreibung (11px)
| [Suchfeld: Objekt suchen...        ]    |  ← Zeile 3a: Input + Dropdown
| [x] 80999 Muenchen — ETW — 320.000 €    |  ← Zeile 3b: Ausgewaehlte Objekte (Chips)
| [Objekt uebernehmen]  (blau, volle Br.) |  ← Button
+------------------------------------------+
```

## Aenderungen

### Datei: `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`

**1. State erweitern (ca. Zeile 88-101):**
- `searchQuery` bleibt
- NEU: `selectedListings` — Array von ausgewaehlten Listings (Multi-Select)
- Typ: `Array<{ public_id, title, city, postal_code, property_type, asking_price, total_area_sqm, year_built }>`

**2. Kaufy-Kachel (Zeilen 190-230) komplett umbauen:**
- Gleiche Struktur wie MagicIntakeCard: `glass-card`, `p-3`, Icon+Titel, Description `text-[11px]`, dann Input `h-7 text-xs`
- Suchfeld bleibt identisch (mit Dropdown)
- Bei Klick auf ein Listing: wird zu `selectedListings` hinzugefuegt (nicht ersetzt)
- Ausgewaehlte Objekte als kompakte Chips unterhalb des Suchfelds (mit X zum Entfernen)
- Jeder Chip: `rounded-md bg-muted/50 border text-[11px] px-2 py-1` mit Stadt, Typ, Preis
- Button: `w-full h-7 text-xs` in Primaer-Blau "Objekt uebernehmen" (bzw. "X Objekte uebernehmen" bei Mehrfachauswahl)
- Button disabled wenn keine Auswahl

**3. handleListingSelect anpassen (Zeile 136-148):**
- Statt Suchfeld zu ueberschreiben: Listing zum `selectedListings` Array hinzufuegen
- Suchfeld leeren nach Auswahl
- Duplikate verhindern (pruefen ob public_id schon in selectedListings)

**4. Neuer Handler `handleAdoptObjects`:**
- Nimmt das erste (oder primaere) Objekt und setzt `externalObjectData` + `externalPurchasePrice` wie bisher
- Bei mehreren Objekten: erstes Objekt wird primaer gesetzt, weitere koennen spaeter erweitert werden
- Toast: "X Objekt(e) uebernommen"

**5. "Created" State analog MagicIntake:**
- Nach "Objekt uebernehmen": Kachel wechselt in einen kompakten Bestaetigungs-Modus
- Gruener Rand (`border-green-500/30`), CheckCircle2 Icon
- Zeigt uebernommene Objekte als Liste

## Keine weiteren Dateien betroffen

Nur `FMFinanzierungsakte.tsx` wird geaendert — die Kaufy-Kachel ist inline definiert (kein separates Component).

