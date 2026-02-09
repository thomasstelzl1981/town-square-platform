

# Systemwidgets Live-Anbindung — Implementierungsplan

## Zusammenfassung

Die Widgets werden zwar angezeigt, zeigen aber nur Demo-Daten mit "Coming Soon"-Badge, weil:
1. **Keine Hooks existieren** — es fehlen `useQuote.ts`, `useRadio.ts`, `useSpaceAPOD.ts` etc.
2. **Widget-Komponenten sind Stubs** — zeigen hardcodierte Demo-Daten mit `blur-[1px] opacity-60`
3. **Status in Config ist `stub`** — muss auf `live` gesetzt werden nach Implementierung

### Was funktioniert bereits

| Widget | Status | Grund |
|--------|--------|-------|
| **Wetter** | ✅ Live | `useWeather.ts` Hook + Open-Meteo API (kein Key) |
| **Globus** | ✅ Live | Edge Function + Google Maps Key |

### Was noch Stubs sind

| Widget | API | API-Key nötig? | Schwierigkeit |
|--------|-----|----------------|---------------|
| **Quote** | ZenQuotes | ❌ Nein | Einfach |
| **Radio** | Radio Browser | ❌ Nein | Mittel |
| **Space** | NASA APOD | ✅ Ja (kostenlos) | Einfach |
| **Finance** | Finnhub | ✅ Ja (kostenpflichtig für Realtime) | Komplex |
| **News** | RSS/NewsAPI | Variiert | Mittel |

---

## Implementierungsplan

### Phase 1: Sofort umsetzbar (kein API-Key nötig)

#### 1.1 Quote Widget (ZenQuotes API)

**Neuer Hook:** `src/hooks/useQuote.ts`
```typescript
// ZenQuotes API: https://zenquotes.io/api/today
// Keine Auth, CORS-freundlich, 24h Cache
```

**Änderungen an:** `src/components/dashboard/widgets/QuoteWidget.tsx`
- Hook einbinden
- Demo-Daten durch echte ersetzen
- Blur/Opacity entfernen
- "Coming Soon" Badge entfernen

**Config Update:** `src/config/systemWidgets.ts`
- `SYS.MINDSET.QUOTE`: `status: 'stub'` → `status: 'live'`

---

#### 1.2 Radio Widget (Radio Browser API)

**Neuer Hook:** `src/hooks/useRadio.ts`
```typescript
// Radio Browser API: https://de1.api.radio-browser.info/json/stations/topvote/10
// Keine Auth, CORS-freundlich
// WICHTIG: Kein Autoplay! User muss klicken
```

**Änderungen an:** `src/components/dashboard/widgets/RadioWidget.tsx`
- Hook für Sender-Liste
- Audio-Element mit User-Interaktion (Play/Pause/Stop)
- Volume-Slider
- Sender-Auswahl (Dropdown oder Carousel)

**Config Update:** `src/config/systemWidgets.ts`
- `SYS.AUDIO.RADIO`: `status: 'stub'` → `status: 'live'`

---

### Phase 2: API-Key erforderlich (kostenlos)

#### 2.1 Space Widget (NASA APOD)

**Edge Function:** `supabase/functions/sot-nasa-apod/index.ts`
```typescript
// NASA APOD API: https://api.nasa.gov/planetary/apod
// API Key: DEMO_KEY (30 req/h) oder eigener Key (1000 req/h)
// 24h Cache aggressiv
```

**Neuer Hook:** `src/hooks/useSpaceAPOD.ts`

**Änderungen an:** `src/components/dashboard/widgets/SpaceWidget.tsx`
- Tägliches Astronomie-Bild anzeigen
- Titel + kurze Erklärung
- Link zu NASA

**Config Update:** `src/config/systemWidgets.ts`
- `SYS.SPACE.DAILY`: `status: 'stub'` → `status: 'live'`

**Integration Registry Update:** 
- `NASA_APOD`: `status: pending_setup` → `status: active`

---

### Phase 3: Premium/Komplexer (später)

#### 3.1 Finance Widget (Finnhub)

**Problem:** Finnhub Free-Tier hat Einschränkungen:
- Keine EU-Indizes (DAX) im Free-Tier
- 60 API-Calls/Minute
- Realtime nur für US-Märkte

**Alternative:** Alpha Vantage (kostenlos, aber langsamer)

**Empfehlung:** Vorerst als Stub lassen oder alternative Datenquelle evaluieren.

#### 3.2 News Widget

**Optionen:**
- RSS-Feeds (kostenlos, aber Parsing nötig)
- NewsAPI (60.000 req/mo kostenlos)
- GNews API

**Empfehlung:** RSS-basiert für Wirtschafts-Headlines (kein API-Key).

---

## Dateiübersicht

| # | Datei | Aktion | Priorität |
|---|-------|--------|-----------|
| 1 | `src/hooks/useQuote.ts` | NEU erstellen | P0 |
| 2 | `src/components/dashboard/widgets/QuoteWidget.tsx` | Refactor (Hook einbinden) | P0 |
| 3 | `src/hooks/useRadio.ts` | NEU erstellen | P1 |
| 4 | `src/components/dashboard/widgets/RadioWidget.tsx` | Refactor (Audio-Player) | P1 |
| 5 | `supabase/functions/sot-nasa-apod/index.ts` | NEU erstellen | P1 |
| 6 | `src/hooks/useSpaceAPOD.ts` | NEU erstellen | P1 |
| 7 | `src/components/dashboard/widgets/SpaceWidget.tsx` | Refactor (APOD anzeigen) | P1 |
| 8 | `src/config/systemWidgets.ts` | Status updaten | P0 |
| 9 | DB: `integration_registry` | Status auf `active` setzen | P1 |
| 10 | `supabase/config.toml` | Neue Edge Function registrieren | P1 |

---

## Technische Details

### useQuote.ts (ZenQuotes)

```typescript
import { useQuery } from '@tanstack/react-query';

interface Quote {
  quote: string;
  author: string;
}

export function useQuote() {
  return useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      // ZenQuotes hat CORS-Issues, daher Proxy oder cached Edge Function
      const response = await fetch('https://zenquotes.io/api/today');
      const data = await response.json();
      return {
        quote: data[0].q,
        author: data[0].a,
      };
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h Cache
    retry: 1,
  });
}
```

**CORS-Problem:** ZenQuotes blockiert Browser-Requests. Lösung: Edge Function als Proxy.

### useRadio.ts (Radio Browser)

```typescript
import { useQuery } from '@tanstack/react-query';

interface RadioStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  country: string;
  tags: string;
}

export function useRadioStations(limit = 10) {
  return useQuery<RadioStation[]>({
    queryKey: ['radio-stations', limit],
    queryFn: async () => {
      const response = await fetch(
        `https://de1.api.radio-browser.info/json/stations/topvote/${limit}`
      );
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1h Cache
  });
}
```

### NASA APOD Edge Function

```typescript
// supabase/functions/sot-nasa-apod/index.ts
// Verwendet NASA_APOD_API_KEY Secret oder DEMO_KEY
// Cached Antwort für 24h
```

---

## Akzeptanzkriterien

### P0 (Sofort)

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Quote Widget zeigt echtes Zitat | ✅ Kein "Coming Soon", echte Daten |
| 2 | Kein Blur/Opacity auf Content | ✅ Klare Lesbarkeit |
| 3 | 24h Cache funktioniert | ✅ Nur 1 API-Call pro Tag |

### P1 (Diese Woche)

| # | Test | Erwartung |
|---|------|-----------|
| 4 | Radio Widget zeigt Sender-Liste | ✅ Top 10 Sender |
| 5 | Play-Button startet Stream | ✅ Audio spielt (kein Autoplay!) |
| 6 | Space Widget zeigt APOD-Bild | ✅ Tägliches NASA-Bild |
| 7 | Integration Registry Status = active | ✅ Für alle aktiven APIs |

### P2 (Später)

| # | Test | Erwartung |
|---|------|-----------|
| 8 | Finance Widget mit echten Daten | ⏳ Evaluierung Datenquelle |
| 9 | News Widget mit Headlines | ⏳ RSS-Parsing |

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|------------|
| **CORS-Blockade** (ZenQuotes) | Edge Function als Proxy |
| **NASA Rate Limits** (DEMO_KEY: 30/h) | Aggressives Caching (24h) |
| **Radio-Stream Autoplay** | Browser blockiert; User-Click erforderlich |
| **Finnhub EU-Daten** | Alternative API oder nur US-Märkte zeigen |

