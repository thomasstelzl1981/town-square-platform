
# SOT Web Research Engine — Zentrale Recherche-Infrastruktur

## Ausgangslage

Aktuell existieren **10+ separate Edge Functions** fuer Recherche, verstreut und ohne einheitliche Schnittstelle:

| Funktion | Zweck | Provider |
|----------|-------|----------|
| sot-places-search | Google Places Suche | Google Maps API (konfiguriert) |
| sot-extract-email | Email aus Website extrahieren | Eigener HTML-Scraper |
| sot-research-firecrawl-extract | Web-Suche + Kontaktextraktion | Firecrawl (NICHT konfiguriert) |
| sot-apify-portal-job | Portal-Scraping | Apify (NICHT konfiguriert) |
| sot-apollo-search | Kontaktdatenbank-Suche | Apollo (NICHT konfiguriert) |
| sot-research-run-order | Orchestrator | Intern |
| sot-research-free | Stub (Mock-Daten) | - |
| sot-contact-enrichment | KI-Kontaktextraktion | Lovable AI (konfiguriert) |
| sot-acq-ai-research | Immobilien-Analyse | Lovable AI (konfiguriert) |
| sot-acq-standalone-research | Standalone-Analyse | OpenRouter (nicht konfiguriert) |

## Verfuegbare Provider (Ist-Zustand Secrets)

| Provider | Secret | Status |
|----------|--------|--------|
| Lovable AI | LOVABLE_API_KEY | Konfiguriert |
| Google Maps/Places | GOOGLE_MAPS_API_KEY | Konfiguriert |
| Firecrawl | FIRECRAWL_API_KEY | FEHLT — muss angelegt werden |
| Apify | APIFY_API_KEY | FEHLT — muss angelegt werden |

## Loesung: Einheitliche `sot-research-engine`

Eine **einzelne Edge Function** als zentrale Recherche-Engine mit Provider-Orchestrierung.

### Architektur

```text
+------------------------------------------------------------------+
|                    sot-research-engine                            |
|                                                                  |
|  Eingang: { intent, query, location, providers[], output_format }|
|                                                                  |
|  +------------------+  +------------------+  +----------------+  |
|  | Provider:        |  | Provider:        |  | Provider:      |  |
|  | google_places    |  | firecrawl        |  | apify          |  |
|  | (Firmensuche,    |  | (Web-Scrape,     |  | (Google Maps   |  |
|  |  Bewertungen)    |  |  Email-Extract)  |  |  Scraper Actor)|  |
|  +--------+---------+  +--------+---------+  +-------+--------+  |
|           |                      |                    |           |
|           +----------+-----------+--------------------+           |
|                      v                                           |
|            +-------------------+                                 |
|            | Lovable AI        |                                 |
|            | (Zusammenfuehren, |                                 |
|            |  Scoring,         |                                 |
|            |  Strukturieren)   |                                 |
|            +-------------------+                                 |
|                      |                                           |
|                      v                                           |
|  Unified Result: { contacts[], sources[], confidence, cost }     |
+------------------------------------------------------------------+
```

### Ablauf pro Recherche-Auftrag

1. **Intent parsen** — Lovable AI klassifiziert den Suchauftrag (Handwerker / Makler / Unternehmen / Kontaktperson)
2. **Provider-Plan erstellen** — je nach Intent und verfuegbaren API-Keys die optimale Kombination waehlen
3. **Parallel ausfuehren:**
   - Google Places: Firmennamen, Adressen, Telefon, Website, Bewertungen
   - Firecrawl: Websites scrapen fuer E-Mail, Impressum, Team-Seiten
   - Apify (Google Maps Scraper Actor): Erweiterte Geschaeftsdaten inkl. E-Mail
4. **KI-Zusammenfuehrung** — Lovable AI merged die Ergebnisse, dedupliziert, scored nach Relevanz
5. **Ergebnis zurueckgeben** — einheitliches Format fuer alle Consumer

### API-Schnittstelle

```text
POST sot-research-engine

Body:
{
  "intent": "find_contractors" | "find_brokers" | "find_companies" | "find_contacts" | "analyze_market",
  "query": "Sanitaer Handwerker",
  "location": "Berlin",
  "radius_km": 25,
  "filters": {
    "must_have_email": true,
    "min_rating": 3.5,
    "industry": "Sanitaer"
  },
  "providers": ["google_places", "firecrawl", "apify"],  // optional, sonst auto
  "max_results": 20,
  "context": {
    "module": "sanierung" | "akquise" | "recherche" | "marketing",
    "reference_id": "optional-mandate-or-order-id"
  }
}

Response:
{
  "success": true,
  "results": [
    {
      "name": "Berliner Badsanierung GmbH",
      "email": "info@berliner-badsanierung.de",
      "phone": "+49 30 12345678",
      "website": "https://berliner-badsanierung.de",
      "address": "Musterstr. 1, 10115 Berlin",
      "rating": 4.7,
      "reviews_count": 89,
      "confidence": 92,
      "sources": ["google_places", "firecrawl"],
      "source_refs": { ... }
    }
  ],
  "meta": {
    "providers_used": ["google_places", "firecrawl"],
    "total_found": 15,
    "cost_eur": 0.12,
    "duration_ms": 3400
  }
}
```

### Consumer-Module (wer die Engine nutzt)

| Modul | Intent | Besonderheit |
|-------|--------|-------------|
| MOD-05 Sanierung | find_contractors | must_have_email=true, Branche als Filter |
| MOD-12 AkquiseManager | find_brokers, find_companies | Apollo-Fallback, contact_staging Insert |
| MOD-14 RechercheModul | find_contacts, find_companies | Voller Provider-Mix, research_orders Tracking |
| Zone 1 Marketing | analyze_market, find_companies | Zukuenftig, gleiche Engine |
| Armstrong | web_research | Allgemeine Recherche via Engine |

## Umsetzungsschritte

### Phase 1: Secrets + Engine (dieses Ticket)

1. **FIRECRAWL_API_KEY Secret anlegen** — Connector aktivieren
2. **APIFY_API_KEY Secret anlegen** — Secret hinzufuegen
3. **Neue Edge Function `sot-research-engine`** erstellen mit:
   - Provider-Registry (google_places, firecrawl, apify)
   - Graceful Fallback: wenn ein Provider-Key fehlt, wird er uebersprungen
   - Parallele Ausfuehrung aller verfuegbaren Provider
   - Lovable AI fuer Merge + Scoring
   - Einheitliches Response-Format
4. **Frontend-Hook `useResearchEngine.ts`** — universeller Hook fuer alle Module

### Phase 2: Consumer umstellen

5. **Sanierung ProviderSearchPanel** — von `sot-places-search` + `sot-extract-email` auf `sot-research-engine` mit `intent: find_contractors` umstellen
6. **AkquiseManager SourcingTab** — von `sot-apollo-search` + `sot-apify-portal-job` auf Engine umstellen
7. **RechercheModul** — `sot-research-run-order` als Wrapper um Engine refactoren
8. **Armstrong WEB_RESEARCH** — Action an Engine anbinden

### Phase 3: Alte Functions aufloesen

9. Einzelne Provider-Functions (`sot-places-search`, `sot-extract-email`, `sot-apollo-search`) als deprecated markieren, sobald alle Consumer umgestellt sind

## Technische Details

### Betroffene Dateien (Phase 1)

| Datei | Aktion |
|-------|--------|
| supabase/functions/sot-research-engine/index.ts | NEU — Zentrale Engine |
| src/hooks/useResearchEngine.ts | NEU — Frontend-Hook |

### Provider-Implementierung in der Engine

**Google Places** (bereits funktionsfaehig):
- Places API Text Search fuer Firmendaten
- Liefert: Name, Adresse, Telefon, Website, Rating

**Firecrawl** (nach Secret-Anlage):
- Scrape der Websites aus Google Places fuer E-Mail-Extraktion
- Search API fuer zusaetzliche Web-Treffer
- Liefert: E-Mail, Impressum-Daten, Team-Infos

**Apify** (nach Secret-Anlage):
- Google Maps Scraper Actor fuer erweiterte Geschaeftsdaten
- Liefert: E-Mail (oft direkt), Oeffnungszeiten, Kategorien

**Lovable AI** (bereits konfiguriert):
- Intent-Klassifikation
- Ergebnis-Merge und Deduplizierung
- Confidence-Scoring
- Zusammenfassung und Strukturierung

### Keine DB-Aenderungen noetig
Die Engine gibt Ergebnisse direkt zurueck. Die Consumer-Module entscheiden selbst, ob und wo sie speichern (contact_staging, research_order_results, etc.).
