

# Zone 2 Search Engines — Tiefenanalyse & Eignungsbewertung

## Uebersicht: 5 Search-Implementierungen in Zone 2

### 1. MOD-04 Immobilien — Sanierung: Handwerker-Suche

| Eigenschaft | Detail |
|-------------|--------|
| **Datei** | `src/components/portal/immobilien/sanierung/tender/ProviderSearchPanel.tsx` |
| **Hook** | `useResearchEngine` (shared) |
| **Intent** | `find_contractors` |
| **Provider** | Google Places → Firecrawl (E-Mail) |
| **Suchzweck** | Sanitaer, Elektriker, Dachdecker etc. nach Kategorie + Standort finden |
| **Bewertung** | **GEEIGNET** — Nutzt den shared Hook korrekt, Auto-Suche bei Standort, manuelle E-Mail-Eingabe als Fallback, Progress-Indicator vorhanden |

**Staerken:** Saubere Architektur, Kategorie-Mapping (sanitaer→"Sanitaer Installateur"), automatische Suche bei Standort-Aenderung, Checkbox-Selektion mit manueller E-Mail-Ergaenzung.

**Schwaechen:** Keine.

---

### 2. MOD-11 Finanzierungsmanager — Bankensuche

| Eigenschaft | Detail |
|-------------|--------|
| **Datei** | `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx` |
| **Hook** | `useResearchEngine` (shared) |
| **Intent** | `find_companies` |
| **Provider** | Google Places |
| **Suchzweck** | Regionalbanken nach PLZ/Ort finden fuer Finanzierungseinreichung |
| **Bewertung** | **GEEIGNET** — Nutzt den shared Hook korrekt, Auto-Suche aus Falldaten (PLZ/Stadt), Ergebnisse direkt als Bank-Auswahl nutzbar |

**Staerken:** Auto-Suchbegriff aus Antragsdaten, Reset bei Fall-Wechsel.

**Schwaechen:** Keine.

---

### 3. MOD-12 Akquise — Tools: Portal-Recherche

| Eigenschaft | Detail |
|-------------|--------|
| **Datei** | `src/pages/portal/akquise-manager/components/PortalSearchTool.tsx` |
| **Hook** | `usePortalSearch` aus `useAcqTools.ts` |
| **Intent** | `search_portals` |
| **Provider** | Apify (Portal-Scraping) |
| **Suchzweck** | ImmoScout24, Immowelt, eBay durchsuchen nach Listings oder Maklern |
| **Bewertung** | **GEEIGNET** — Eigener Hook mit Mutation-Pattern, Portal-spezifische Config (Preisfilter, Objekttypen), sauber ueber `sot-research-engine` geroutet |

**Staerken:** Portal-Auswahl, Preis-Range, Objekttyp-Filter, Broker/Listing-Toggle.

**Schwaechen:** Keine.

---

### 4. MOD-12 Akquise — Mandate/Sourcing: Kontaktrecherche

| Eigenschaft | Detail |
|-------------|--------|
| **Datei** | `AkquiseMandate.tsx` (Z. 342-383, 438-470) + `SourcingTab.tsx` (Z. 106-169) |
| **Hook** | **KEINER** — Direkte `supabase.functions.invoke` Aufrufe |
| **Intent** | `find_brokers` + `search_portals` |
| **Provider** | Google Places + Firecrawl + Apify |
| **Suchzweck** | Makler/Broker finden und in `contact_staging` importieren |
| **Bewertung** | **PROBLEMATISCH — Code-Duplikation + kein shared Hook** |

**Probleme:**
1. **AkquiseMandate.tsx hat 3 identische `sot-research-engine` Aufrufe** (Z. 346, 369, 442) — derselbe Code der in SourcingTab auch steht
2. **SourcingTab.tsx hat 2 weitere identische Aufrufe** (Z. 109, 151) — exakt gleiche Logik
3. **Weder `useResearchEngine` noch ein anderer shared Hook** wird verwendet — stattdessen manuelles State-Management mit `searchLoading`, `apifyLoading`
4. **AkquiseMandate.tsx ist 1132 Zeilen** und enthaelt sowohl die Mandate-Logik ALS AUCH den kompletten Sourcing-Code, obwohl `SourcingTab` als Extraktion existiert

**Empfehlung:** 
- AkquiseMandate.tsx: Sourcing-Code komplett entfernen, nur noch `<SourcingTab>` rendern
- SourcingTab.tsx: Auf `useResearchEngine` Hook umstellen statt direkte `invoke` Calls
- Das wuerde ~150 Zeilen Duplikat-Code eliminieren

---

### 5. MOD-22 Pets — Caring: Anbieter-Suche

| Eigenschaft | Detail |
|-------------|--------|
| **Datei** | `src/pages/portal/pets/PetsCaring.tsx` + `CaringProviderDetail.tsx` |
| **Hook** | `usePetProviderSearch` (eigener Hook) |
| **Intent** | Keiner — **direkte Datenbank-Abfrage**, NICHT ueber `sot-research-engine` |
| **Provider** | Supabase DB (`pet_providers` + `pet_services` Tabellen) |
| **Suchzweck** | Pet-Service-Anbieter (Gassi, Betreuung, Pflege) nach PLZ/Ort + Kategorie finden |
| **Bewertung** | **GEEIGNET fuer den Zweck** — Das ist eine Marktplatz-Suche in eigenen Daten, keine externe Recherche |

**Klarstellung:** Dieser Hook durchsucht die eigene `pet_providers`-Tabelle (registrierte Anbieter auf der Plattform), nicht das Internet. Das ist korrekt so — `sot-research-engine` waere hier falsch, weil keine externen Kontakte gesucht werden.

**Schwaechen:** Client-seitige PLZ-Filterung (Kommentar sagt "Engine wird ersetzen") — bei wenigen Anbietern akzeptabel, bei Skalierung muesste das serverseitig passieren.

---

### 6. MOD-22 Pets — Shop: Produkt-Suche

| Eigenschaft | Detail |
|-------------|--------|
| **Datei** | `src/pages/portal/pets/PetsShop.tsx` |
| **Hook** | Keiner — inline `filter()` auf geladene Produkte |
| **Provider** | Client-seitiger String-Match |
| **Suchzweck** | Produkte im Shop nach Name filtern |
| **Bewertung** | **GEEIGNET** — Simple In-Memory-Filterung, voellig ausreichend fuer Produktkataloge |

---

## Zusammenfassung

```text
Zone 2 Search Engines — Status

✅ MOD-04 Sanierung     → useResearchEngine (shared)     → SAUBER
✅ MOD-11 FM            → useResearchEngine (shared)     → SAUBER
✅ MOD-12 Tools         → usePortalSearch (useAcqTools)   → SAUBER
⚠️  MOD-12 Mandate      → Direkte invoke (DUPLIKAT)      → BEREINIGUNG NOETIG
✅ MOD-22 Pets Caring   → usePetProviderSearch (DB)       → KORREKT (eigene Daten)
✅ MOD-22 Pets Shop     → Inline filter                   → KORREKT (trivial)
```

## Bereinigungsplan

### Einziger Handlungsbedarf: MOD-12 Akquise Mandate/Sourcing

**Schritt 1:** `AkquiseMandate.tsx` — Alle Sourcing-Funktionen entfernen (`handleEngineSearch`, `handleApifySearch`, Search-Dialoge, zugehoerige States). Stattdessen nur `<SourcingTab>` rendern.

**Schritt 2:** `SourcingTab.tsx` — Die beiden direkten `supabase.functions.invoke('sot-research-engine')` Aufrufe durch `useResearchEngine` Hook ersetzen.

**Ergebnis:** ~150 Zeilen Dead-Code weg, einheitliches Pattern in allen Zone-2-Modulen.

