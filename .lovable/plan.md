

# SOT Research Engine -- Alle Einsatzorte und Optimierung

## Wo die Engine ueberall eingesetzt wird

Die `sot-research-engine` wird an **8 Stellen** im Projekt aufgerufen:

| # | Datei | Intent | max_results | Modul |
|---|-------|--------|-------------|-------|
| 1 | `ProviderSearchPanel.tsx` (Sanierung) | find_contractors | 20 | sanierung |
| 2 | `FMEinreichung.tsx` (Bankensuche) | find_companies | 20 | finanzierung |
| 3 | `SourcingTab.tsx` (Akquise) | find_brokers | apolloForm.limit | akquise |
| 4 | `SourcingTab.tsx` (Akquise) | search_portals | apifyForm.limit | akquise |
| 5 | `AkquiseMandate.tsx` (Apollo) | find_brokers | apolloForm.limit | akquise |
| 6 | `AkquiseMandate.tsx` (Portale) | search_portals | apifyForm.limit | akquise |
| 7 | `AkquiseMandate.tsx` (Auto-Recherche) | find_brokers | 25 | akquise |
| 8 | `useAdminResearch.ts` (Admin) | find_contacts | 25 | recherche |
| 9 | `useSoatSearchEngine.ts` (SOAT) | find_contacts | (default 20) | soat_search |
| 10 | `useAcqTools.ts` (Portal-Hook) | search_portals | 50 | akquise |

## Aenderungen

### 1. Edge Function: Limits erhoehen und Timeouts anpassen
**Datei: `supabase/functions/sot-research-engine/index.ts`**

- **Apify `maxCrawledPlacesPerSearch`**: Von `Math.min(maxResults, 10)` auf `Math.min(maxResults, 25)` erhoehen (Zeile 119), damit bis zu 25 Google-Places-Ergebnisse moeglich sind
- **Firecrawl URL-Limit**: Von `slice(0, 5)` auf `slice(0, 10)` erhoehen (Zeile 265 und 606), weil mehr Ergebnisse auch mehr Email-Anreicherung brauchen
- **Firecrawl `waitFor`**: Bleibt bei 1000ms (OK)
- **Phase 2 Timeout**: Von 15s auf **25s** erhoehen (Zeile 622), da mehr URLs gescrapt werden
- **Apify Actor Timeout**: Von 25s auf **35s** erhoehen (Zeile 107), damit bei 25 Ergebnissen genug Zeit bleibt
- **Apify Abort Timeout**: Von 30s auf **40s** (Zeile 110)
- **Phase 3 AI Merge**: Schwelle von 8 auf **12** anpassen -- bei bis zu 25 Ergebnissen lohnt sich AI Merge erst bei mehr Daten

### 2. useResearchEngine Hook: Timer und Fortschrittsanzeige
**Datei: `src/hooks/useResearchEngine.ts`**

Neuen State hinzufuegen:
- `elapsedSeconds: number` -- zaehlt jede Sekunde hoch waehrend `isSearching === true`
- `estimatedDuration: number` -- geschaetzte Dauer basierend auf `max_results` (z.B. max_results <= 10: ~30s, <= 20: ~45s, <= 25: ~55s)
- Ein `setInterval` das jede Sekunde `elapsedSeconds` hochzaehlt, gestoppt beim Ende der Suche
- Beides im Return-Objekt exponieren

### 3. ProviderSearchPanel: Timer-UI und max_results erhoehen
**Datei: `src/components/portal/immobilien/sanierung/tender/ProviderSearchPanel.tsx`**

- `max_results` von 20 auf **25** erhoehen
- Waehrend `isSearching`: Fortschrittsanzeige mit:
  - Animiertem Progress-Balken (nutzt `elapsedSeconds / estimatedDuration * 100`)
  - Text: "Suche laeuft... XX/~60s -- Bitte warten, Ergebnisse werden aus mehreren Quellen zusammengefuehrt"
  - Phasen-Hinweise: 0-15s "Google Places durchsuchen...", 15-35s "Websites nach E-Mails scannen...", 35-55s "Ergebnisse zusammenfuehren..."

### 4. FMEinreichung: Timer-UI und max_results erhoehen
**Datei: `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx`**

- `max_results` von 20 auf **25** erhoehen
- Waehrend `aiLoading`: Gleiche Fortschrittsanzeige wie ProviderSearchPanel
  - Progress-Balken mit Sekundenzaehler
  - Text: "Bankensuche laeuft... XX/~60s"

### 5. Gemeinsame Timer-Komponente erstellen
**Neue Datei: `src/components/portal/shared/SearchProgressIndicator.tsx`**

Wiederverwendbare Komponente fuer alle Einsatzorte:

```text
Aufbau:
+--------------------------------------------------+
| [=====>                    ]  12/~55s             |
| Google Places durchsuchen...                      |
| Bitte warten -- Ergebnisse werden aus mehreren    |
| Quellen zusammengefuehrt.                         |
+--------------------------------------------------+
```

Props:
- `elapsedSeconds: number`
- `estimatedDuration: number` (default 55)
- `phases?: { upTo: number; label: string }[]` (optionale Phasen-Labels)

Nutzt die bestehende `Progress`-Komponente aus `src/components/ui/progress.tsx`.

### 6. Weitere Aufrufstellen anpassen
- `useAdminResearch.ts`: max_results bleibt bei 25 (bereits OK)
- `AkquiseMandate.tsx` Auto-Recherche: bleibt bei 25 (bereits OK)
- `useSoatSearchEngine.ts`: kein max_results gesetzt -- default 20, erhoehen auf 25
- `useAcqTools.ts`: max_results 50 fuer Portale -- bleibt (Portal-Suche ist anders)

## Geaenderte/Neue Dateien

1. `supabase/functions/sot-research-engine/index.ts` -- Limits und Timeouts erhoehen
2. `src/hooks/useResearchEngine.ts` -- Timer-State (elapsedSeconds, estimatedDuration)
3. `src/components/portal/shared/SearchProgressIndicator.tsx` -- NEUE Komponente
4. `src/components/portal/immobilien/sanierung/tender/ProviderSearchPanel.tsx` -- max_results=25 + Timer-UI
5. `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx` -- max_results=25 + Timer-UI
6. `src/hooks/useSoatSearchEngine.ts` -- max_results=25

## Erwartete Zeiten nach Anpassung

```text
Phase 1 (Places + Apify, 25 Ergebnisse): ~20-30s
Phase 2 (Firecrawl, max 10 URLs, 25s limit): ~8-15s
Phase 3 (AI Merge, ab 12 Ergebnisse):     ~5-8s
────────────────────────────────────────────────────
Gesamt:                                   ~35-50s (unter 60s)
```

