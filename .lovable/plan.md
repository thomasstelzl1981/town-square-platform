
# SOT Research Engine -- Fehleranalyse und Fix

## Ursache: Edge-Function-Timeout

Die Engine **funktioniert technisch**, aber laeuft in ein **Timeout** (60s Limit fuer Edge Functions). Der Ablauf:

1. **Phase 1** (Google Places + Apify parallel): ~25-30s -- liefert 6-10 Ergebnisse (OK)
2. **Phase 2** (Firecrawl Email-Scraping): Scrapt bis zu **10 Websites parallel**, jede mit `waitFor: 2000ms` -- addiert 15-30s
3. **Phase 3** (AI Merge via Lovable AI): ~5-10s
4. **Gesamt**: 45-70s -- ueberschreitet das 60s-Limit

Beweis aus den Logs:
- "Bank Eggenfelden" (6 Ergebnisse, 6 Websites): 40s = knapp geschafft
- "Sanitaer Installateur Muenchen" (10 Ergebnisse, 10 Websites): Timeout, keine Antwort

## Fix-Plan

### Aenderung 1: Firecrawl-Limit reduzieren (Hauptfix)
In `scrapeEmailsFirecrawl()`: Maximal **5 statt 10** Websites scrapen und `waitFor` von 2000ms auf **1000ms** reduzieren. Das spart 10-15s.

### Aenderung 2: Apify-Timeout reduzieren
Der Apify-Aufruf hat ein 50s-Timeout (`setTimeout(() => controller.abort(), 50000)`). Bei paralleler Ausfuehrung mit Google Places reicht das nicht. Reduzierung auf **30s**.

### Aenderung 3: Globales Timeout mit Fallback
Eine globale Zeitschranke (50s) einbauen. Wenn Phase 2 zu lange dauert, werden die Ergebnisse OHNE Email-Anreicherung zurueckgegeben -- besser als gar keine Antwort.

### Aenderung 4: Phase 3 (AI Merge) nur bei wenig Ergebnissen
AI Merge ueberspringen wenn weniger als 8 Ergebnisse (Deduplizierung lohnt sich nicht). Das spart 5-10s.

## Technische Umsetzung

### Geaenderte Datei: `supabase/functions/sot-research-engine/index.ts`

Konkrete Aenderungen:
- **Zeile 107**: Apify timeout von `50000` auf `30000` reduzieren
- **Zeile 110**: Apify abort timeout von `50000` auf `30000`
- **Zeile 265**: `slice(0, 10)` aendern zu `slice(0, 5)` (max 5 Websites)
- **Zeile 279**: `waitFor: 2000` aendern zu `waitFor: 1000`
- **Zeile 596-629**: Phase 2 in ein `Promise.race` mit 15s-Timeout wrappen
- **Zeile 634**: AI Merge nur wenn `allResults.length >= 8` (sonst Fallback-Deduplizierung)

### Erwartete Zeiten nach Fix

```text
Phase 1 (Places + Apify):   ~15-20s  (Apify-Timeout 30s statt 50s)
Phase 2 (Firecrawl, max 5): ~5-8s    (5 URLs, 1s waitFor, 15s hard limit)
Phase 3 (AI Merge):         ~5s      (nur bei >= 8 Ergebnissen)
────────────────────────────────────
Gesamt:                     ~25-35s  (deutlich unter 60s)
```

Keine neuen Dateien noetig -- reine Optimierung in einer einzigen Edge Function.
