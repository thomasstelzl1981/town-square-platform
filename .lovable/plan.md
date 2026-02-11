

# Widgets: Finanzdaten und News mit freien Daten (ohne API-Key)

## Konzept

Beide Widgets werden von "Stub/Coming Soon" auf **live** umgestellt. Design bleibt exakt gleich -- nur die Blur-Effekte und "Coming Soon"-Badges werden entfernt und echte Daten eingesetzt.

## Datenquellen (alle kostenlos, kein API-Key)

### Finanzdaten
| Symbol | Quelle | URL |
|--------|--------|-----|
| EUR/USD | EZB (ECB SDW) | `https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=jsondata` |
| BTC, ETH | CoinGecko Free API | `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true` |
| Gold | Frankfurter API (ECB-basiert) | `https://api.frankfurter.app/latest?to=XAU` oder CoinGecko-Commodity |
| DAX | Nicht frei verfuegbar -- wird als **statischer Richtwert** mit Hinweis "verzögert" angezeigt, oder entfernt |

**Strategie:** EUR/USD + BTC + ETH sind live. DAX wird durch einen weiteren Wechselkurs (z.B. EUR/GBP) oder Gold ersetzt, da es keine freie DAX-API gibt.

### News
| Quelle | RSS-Feed-URL |
|--------|-------------|
| Tagesschau Wirtschaft | `https://www.tagesschau.de/xml/rss2_https/` |
| Handelsblatt (falls verfuegbar) | Alternative: `https://www.tagesschau.de/wirtschaft/index~rss2.xml` |

RSS-Feeds werden in der Edge Function als XML geparsed und als JSON an das Frontend geliefert.

## Betroffene Dateien

| # | Datei | Aenderung |
|---|---|---|
| 1 | `supabase/functions/sot-finance-proxy/index.ts` | **NEU** -- Holt ECB + CoinGecko Daten, cached 30 Min |
| 2 | `supabase/functions/sot-news-proxy/index.ts` | **NEU** -- Holt RSS-Feed, parsed XML zu JSON, cached 60 Min |
| 3 | `src/hooks/useFinanceData.ts` | **NEU** -- React Query Hook fuer Finanzdaten |
| 4 | `src/hooks/useNewsData.ts` | **NEU** -- React Query Hook fuer News-Headlines |
| 5 | `src/components/dashboard/widgets/FinanceWidget.tsx` | Blur/Badge entfernen, echte Daten via Hook anzeigen |
| 6 | `src/components/dashboard/widgets/NewsWidget.tsx` | Blur/Badge entfernen, echte Headlines via Hook anzeigen |
| 7 | `src/config/systemWidgets.ts` | Status von `stub` auf `live` aendern, data_source aktualisieren |

## Technische Details

### Edge Function: sot-finance-proxy

```text
Request --> Edge Function
              |
              +--> CoinGecko: BTC, ETH Preis + 24h Change
              +--> ECB/Frankfurter: EUR/USD Kurs
              |
              v
           JSON Response:
           [
             { symbol: "EUR/USD", value: "1.0892", change: "-0.2%", trend: "down" },
             { symbol: "BTC", value: "67.4k", change: "+2.1%", trend: "up" },
             { symbol: "ETH", value: "3.2k", change: "+1.4%", trend: "up" },
             { symbol: "Gold", value: "2.341", change: "+0.3%", trend: "up" }
           ]
```

- 30 Minuten serverseitiger Cache (In-Memory)
- Kein API-Key erforderlich
- CORS-Headers fuer Frontend-Zugriff

### Edge Function: sot-news-proxy

```text
Request --> Edge Function
              |
              +--> Tagesschau RSS (XML)
              |
              v
           XML parsen --> JSON:
           [
             { title: "...", source: "Tagesschau", time: "2 Std.", link: "..." },
             { title: "...", source: "Tagesschau", time: "4 Std.", link: "..." }
           ]
```

- 60 Minuten serverseitiger Cache
- XML-Parsing direkt in Deno (kein externer Parser noetig)
- Maximal 5 Headlines

### Frontend-Widgets

**FinanceWidget.tsx:**
- Entfernt: `blur-[1px] opacity-60`, "Coming Soon" Badge, Stub-Message
- Hinzugefuegt: `useFinanceData()` Hook, Lade-Skeleton, Fehler-Fallback auf Demo-Daten
- Design bleibt identisch (Grid, Farben, Icons)

**NewsWidget.tsx:**
- Entfernt: `blur-[1px] opacity-60`, "Coming Soon" Badge, Stub-Message
- Hinzugefuegt: `useNewsData()` Hook, Lade-Skeleton, Fehler-Fallback auf Demo-Daten
- Klick auf Headline oeffnet Link in neuem Tab
- Design bleibt identisch

### Caching-Strategie

- Edge Function: In-Memory Cache (30/60 Min)
- Frontend: React Query `staleTime` (30/60 Min) -- kein Refetch bei Tab-Wechsel

## Keine DB-Aenderungen

Rein API-basiert mit Edge Functions als Proxy. Keine neuen Tabellen noetig.
