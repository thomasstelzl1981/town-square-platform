

# Engine zum Laufen bringen — Integration der Recherche-Pipeline

## Das Problem (in einfachen Worten)

Die Recherche-Engine existiert und funktioniert technisch, aber die Teile sind nicht miteinander verbunden:

1. **Du klickst "Suche starten"** in der Recherche-UI
2. Die Edge Function `sot-research-engine` wird aufgerufen — aber mit **falschen Daten**: Statt deinem Suchbegriff und Ort wird immer `"SOAT Recherche"` als Query geschickt
3. Die Edge Function liefert Ergebnisse zurueck — aber **niemand schreibt sie in die Datenbank**
4. Die UI liest aus der Datenbank — findet nichts — zeigt leere Tabelle

Es fehlt also die "Bruecke" zwischen dem Suchergebnis und der Datenbank.

---

## Loesung (2 Dateien aendern)

### 1. Hook reparieren: `useStartSoatOrder` echte Suchparameter uebergeben + Ergebnisse speichern

**Datei:** `src/hooks/useSoatSearchEngine.ts` — Funktion `useStartSoatOrder`

Aktuell (kaputt):
```text
query: 'SOAT Recherche'   // ← Hardcoded statt echtem Suchbegriff
max_results: 25            // ← Ignoriert target_count vom Auftrag
// Ergebnis wird komplett verworfen!
```

Neu:
1. Vor dem Edge-Function-Call: Order aus DB laden (title, intent, target_count, desk)
2. Intent-String parsen (Format: `"Suchbegriff, Region, Kategorie"`)
3. Echte Werte an `sot-research-engine` uebergeben:
   - `query` = Suchbegriff aus intent
   - `location` = Region aus intent
   - `max_results` = target_count vom Auftrag
4. Ergebnis der Edge Function empfangen (`data.results[]`)
5. Phase-Updates senden: `strategy` → `discovery` → `extract` → `finalize`
6. Jeden Kontakt als Zeile in `soat_search_results` schreiben:

   | Engine-Feld | DB-Spalte |
   |-------------|-----------|
   | name | company_name |
   | salutation | salutation |
   | first_name | first_name |
   | last_name | last_name |
   | email | email |
   | phone | phone |
   | website | website_url |
   | address | address_line (+ city/postal_code extrahiert) |
   | confidence | confidence_score |
   | sources | source_refs_json |

7. Order-Status auf `done` setzen (oder `failed` bei Fehler)
8. Engine-Funktionen `normalizeContact` und `calcConfidence` auf jeden Kontakt anwenden bevor er gespeichert wird

### 2. Kontaktbuch-Import verbinden: `sot-research-import-contacts` ersetzen

**Datei:** `src/hooks/useResearchImport.ts`

Aktuell ruft der Import `sot-research-import-contacts` auf — eine Edge Function die nur ein Stub ist (gibt Mock-Daten zurueck).

Neu: Direkt im Hook die Logik implementieren:
1. Selektierte `soat_search_results` laden
2. Engine-Funktion `findDedupeMatches` pruefen (E-Mail-Dedupe gegen `contacts`)
3. Je nach `duplicate_policy`:
   - `skip`: Duplikate ueberspringen
   - `update`: Bestehenden Kontakt aktualisieren
4. Engine `normalizeContact` + `calcConfidence` + `applyQualityGate` auf jeden neuen Kontakt anwenden
5. In `contacts`-Tabelle schreiben (upsert)
6. `validation_state` der importierten Results auf `imported` setzen
7. Toast mit Ergebnis: "X importiert, Y Duplikate uebersprungen"

---

## Technische Details

### Dateien mit Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useSoatSearchEngine.ts` | `useStartSoatOrder` komplett ueberarbeiten: echte Params + DB-Persist + Phase-Tracking |
| `src/hooks/useResearchImport.ts` | Import-Logik direkt mit Engine-Funktionen statt Edge-Function-Stub |

### Was NICHT angefasst wird

- Edge Function `sot-research-engine` — funktioniert bereits korrekt
- Engine `spec.ts` / `engine.ts` — fertig gebaut
- UI-Seiten (`AdminRecherche.tsx`, `AdminKontaktbuch.tsx`) — bereits korrekt verdrahtet
- DB-Tabellen — Schema passt bereits

### Vorhandene API-Keys (alle konfiguriert)

- `GOOGLE_MAPS_API_KEY` — Google Places Suche
- `APIFY_API_TOKEN` — Apify Crawler
- `FIRECRAWL_API_KEY` — E-Mail-Extraktion
- `LOVABLE_API_KEY` — KI Merge + Scoring

### Erwartetes Ergebnis nach der Aenderung

1. User gibt Suchbegriff + Region + Kategorie ein → klickt "Suche starten"
2. Fortschrittsanzeige zeigt Phasen (Strategie → Suche → Extraktion → Abschluss)
3. Ergebnisse erscheinen automatisch in der Ergebnis-Tabelle (via Realtime)
4. User kann Ergebnisse validieren, filtern, exportieren
5. User kann selektierte Ergebnisse ins Kontaktbuch importieren (mit Dedupe-Check)
6. Importierte Kontakte erscheinen sofort im Kontaktbuch

