
# Klicktest-Bericht und Reparaturplan: Investment-Suche

## 1. Datenbank-Abgleich (MOD-04 vs. Listings)

### Properties in der DB (MOD-04):
| Code | Titel | Stadt | is_demo | ID |
|------|-------|-------|---------|-----|
| BER-01 | Altbau Berlin-Mitte | Berlin | true | d0000000-...-001 |
| MUC-01 | Wohnung Schwabing | Muenchen | true | d0000000-...-002 |
| HH-01 | Wohnung Eimsbuettel | Hamburg | true | d0000000-...-003 |

### Listings in der DB:
| Public-ID | Titel | Stadt | Status | Asking Price |
|-----------|-------|-------|--------|-------------|
| DEMO-BER01 | Altbau Berlin-Mitte | Berlin | active | 280.000 |
| DEMO-MUC01 | Wohnung Schwabing | Muenchen | active | 420.000 |
| DEMO-HH01 | Wohnung Eimsbuettel | Hamburg | active | 175.000 |

### Demo-Daten im Code (useDemoListings):
| Code | Titel | Stadt | Preis |
|------|-------|-------|-------|
| BER-01 | Altbau Berlin-Mitte | Berlin | 280.000 |
| MUC-01 | Wohnung Schwabing | Muenchen | 420.000 |
| HH-01 | Wohnung Eimsbuettel | Hamburg | 175.000 |
| SOT-BT-DEMO | Residenz am Stadtpark | Muenchen | 450.000 (new_construction, MOD-13) |

**Ergebnis:** Keine Phantom-Daten. Die Dedup-Logik filtert "Residenz am Stadtpark" korrekt via `new_construction`-Filter in MOD-08 und MOD-09. Keine weiteren hartcodierten Immobilien im Code gefunden.

---

## 2. Klicktest-Ergebnisse

### MOD-08 (Investment-Suche) -- Code-Analyse

**hasSearched-Gate:** KORREKT implementiert (Zeile 546-556). Vor Klick wird ein Hinweis-Platzhalter angezeigt.

**Suchformular:** KORREKT -- 4-Spalten-Grid mit zVE, EK, Familienstand, Kirchensteuer (kein Collapsible).

**Button-Zentrierung:** KORREKT -- `flex justify-center` (Zeile 429).

**BUG GEFUNDEN -- Dedup bricht Metrics-Cache:**
Die `handleInvestmentSearch` (Zeile 266-312) berechnet Metrics und speichert sie unter `listing.listing_id` als Key. Fuer DB-Listings ist das die UUID `e0000000-...`. Fuer Demo-Listings ist es `demo-listing-d0000000-...`. Da DB und Demo identische Titel+Stadt haben, werden die Demos in `mergedListings` (Zeile 238-252) herausgefiltert -- nur die DB-Eintraege bleiben. Die Berechnung laeuft aber korrekt auf den DB-Listings (Zeile 283), also sollten die Cache-Keys passen.

**ABER:** Die Berechnung in `handleInvestmentSearch` (Zeile 270-273) dedupliziert DB gegen Demo und berechnet dann nur die verbleibenden. Die DB-Listings kommen von `freshListings` via `refetch()`, und deren IDs werden als Keys genutzt. Die Anzeige in `mergedListings` nutzt ebenfalls die DB-Listing-IDs. Das SOLLTE passen.

**Moegliches Problem:** Die `refetch()` in Zeile 268 holt DB-Listings mit `listing_id` (aus `item.id` der Listings-Tabelle). In `mergedListings` wird ebenfalls `listing_id` genutzt. Das stimmt ueberein. Der Flow ist korrekt im Code.

**Bilder:** DB-Listings suchen Bilder via `document_links` + `documents.file_path`. Wenn keine Bilder hochgeladen wurden, wird das Demo-Bild uebertragen (Zeile 245). Das ist korrekt implementiert.

### MOD-09 (Beratung) -- Code-Analyse

**hasSearched-Gate:** KORREKT (Zeile 294-303).

**BUG:** Die `handleSearch` (Zeile 209) nutzt `deduplicateByField`, die Demo-IDs bevorzugt, wenn kein DB-Match existiert. Aber da die DB-Listings identische Titel+Stadt haben, werden Demos herausgefiltert. Die Berechnung laeuft auf den DB-Listings. Der Cache nutzt `listing.id` (DB-UUID). Die Anzeige in `visibleListings` (Zeile 253) nutzt ebenfalls `deduplicateByField` -- die DB-Listings behalten ihre Original-IDs. Der Cache-Key sollte passen.

**Kein Phantom:** Korrekt gefiltert mit `new_construction`-Filter.

### Zone 3 (Kaufy) -- Code-Analyse

**KRITISCHER BUG GEFUNDEN:**
Die `handleInvestmentSearch` (Zeile 252-253) berechnet nur `freshListings` (DB-Listings), NICHT die Demo-Listings. Zeile 253: `const listingsToProcess = (freshListings || []).slice(0, 20)`. Demo-Listings werden in der Anzeige (`allListings`, Zeile 232-237) hinzugefuegt, aber NICHT in die Berechnung einbezogen. Ergebnis: Demo-Listings auf Kaufy zeigen "---" bei den Metrics.

**Loesung:** In `handleInvestmentSearch` muessen die Demo-Listings (nach Dedup) ebenfalls in `listingsToProcess` aufgenommen werden -- genau wie in MOD-08 und MOD-09.

---

## 3. Reparaturplan

### Aenderung 1: Zone 3 Kaufy -- Demo-Listings in Berechnung einbeziehen

**Datei:** `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx`

In `handleInvestmentSearch` (ca. Zeile 252-253) die Demo-Listings mit den DB-Listings mergen:

Aktuell:
```
const { data: freshListings } = await refetch();
const listingsToProcess = (freshListings || []).slice(0, 20);
```

Neu:
```
const { data: freshListings } = await refetch();
// Merge demo listings with DB listings (deduplicated)
const dbKeys = new Set((freshListings || []).map(l => `${l.title}|${l.city}`));
const demosToInclude = demoListings
  .filter(d => d.property_type !== 'new_construction')
  .filter(d => !dbKeys.has(`${d.title}|${d.city}`));
const listingsToProcess = [...demosToInclude, ...(freshListings || [])].slice(0, 20);
```

Das stellt sicher, dass auch Demo-Listings ihre Metrics berechnet bekommen, genau wie in MOD-08 und MOD-09.

### Aenderung 2: Zone 3 Kaufy -- new_construction Filter

Die `allListings` Merge-Logik (Zeile 232-237) filtert aktuell NICHT nach `new_construction`. Das Projekt-Demo-Objekt ("Residenz am Stadtpark") koennte hier erscheinen.

**Loesung:** `demoListings` in Zone 3 ebenfalls filtern:

Aktuell (Zeile 52):
```
const { kaufyListings: demoListings } = useDemoListings();
```

Neu:
```
const { kaufyListings: allDemoListings } = useDemoListings();
const demoListings = useMemo(() =>
  allDemoListings.filter(d => d.property_type !== 'new_construction'),
  [allDemoListings]
);
```

---

## 4. Zusammenfassung

| Modul | hasSearched-Gate | Formular 4-Spalten | Button zentriert | Bilder | Metrics | Phantom-Filter | Status |
|-------|-----------------|-------------------|-----------------|--------|---------|---------------|--------|
| MOD-08 | OK | OK | OK | OK (Dedup-Transfer) | OK | OK | KORREKT |
| MOD-09 | OK | OK | OK | OK | OK | OK | KORREKT |
| Zone 3 | OK | OK | OK | OK | BUG (Demos ohne Berechnung) | FEHLT | 2 BUGS |

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Demo-Listings in Berechnung einbeziehen + new_construction-Filter |

**Keine DB-Migration noetig. Keine Phantom-Daten in der Datenbank.**
