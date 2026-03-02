

# Research & Search Engine Audit — Apollo-Elimination + Provider-Klarheit

## Befund nach tiefer Analyse

### Die zentrale Engine: `sot-research-engine` (1206 Zeilen)

Die zentrale Engine existiert und funktioniert. Sie nutzt **3 aktive Provider**:

| Provider | Secret | Status | Zweck |
|----------|--------|--------|-------|
| **Google Places** (New API) | `GOOGLE_MAPS_API_KEY` | Konfiguriert, aktiv | Discovery: Firmen finden nach Name/Ort |
| **Apify** | `APIFY_API_TOKEN` | Konfiguriert, aktiv | Portal-Scraping (ImmoScout, Immowelt, eBay) + Google Maps Scraper |
| **Firecrawl** | `FIRECRAWL_API_KEY` | Konfiguriert, aktiv | E-Mail-Extraktion von Firmenwebsites |
| **Netrows** | `NETROWS_API_KEY` | Konfiguriert, aktiv | LinkedIn-Scraping (Person/Company) |
| **Lovable AI** | `LOVABLE_API_KEY` | Konfiguriert, aktiv | Merge, Deduplizierung, Scoring |

**Apollo ist KEIN Provider in `sot-research-engine`.** Die Engine hat Apollo nie als Provider genutzt — sie nutzt Google Places, Apify, Firecrawl und Netrows.

---

### Apollo Dead Code — Vollstaendige Liste

| Typ | Datei/Stelle | Problem |
|-----|-------------|---------|
| **Edge Function** | `supabase/functions/sot-apollo-search/` | Komplette Apollo.io API-Integration, wird von NIEMANDEM aufgerufen |
| **Edge Function** | `supabase/functions/sot-research-pro-contacts/` | Stub das "Apollo-Ersatz" sein sollte, liefert nur Mock-Daten |
| **UI-Code** | `src/pages/portal/akquise-manager/AkquiseMandate.tsx` | `handleApolloSearch`, `showApolloDialog`, `apolloForm`, `apolloLoading`, SOURCE_CONFIG mit `apollo`-Eintrag — Button "Apollo" in UI |
| **UI-Code** | `src/pages/portal/akquise-manager/components/SourcingTab.tsx` | Identische Duplikation: `handleApolloSearch`, Apollo-Dialog, Apollo-Button |
| **Hook** | `src/hooks/useAdminResearch.ts` | Interface `ApolloSearchParams`, `ApolloContact`, Funktion `startApolloSearch` — alles Apollo-benannt, ruft aber `sot-research-engine` auf |
| **Hook** | `src/hooks/useAcqContacts.ts` | Type `ContactStagingSource` enthaelt `'apollo'` als Wert |
| **Manifest** | `src/manifests/armstrongManifest.ts` | Zeile 648: "Sucht professionelle Kontakte ueber Apollo" |

### Weitere tote/doppelte Edge Functions

| Function | Status | Empfehlung |
|----------|--------|------------|
| `sot-apollo-search` | **DEAD** — 0 Aufrufe, braucht `APOLLO_API_KEY` (nicht konfiguriert) | **Loeschen** |
| `sot-research-pro-contacts` | **STUB** — liefert nur Mock-Daten, 0 echte Logik | **Loeschen** |
| `sot-places-search` | **DEAD** — 0 Frontend-Aufrufe, Duplikat von `searchGooglePlaces()` in `sot-research-engine` | **Loeschen** |

### Google Places — NICHT abgeschafft

Google Places ist **aktiv und korrekt integriert** in `sot-research-engine` als Discovery-Provider. Der Key `GOOGLE_MAPS_API_KEY` ist konfiguriert. Es gibt zusaetzlich:
- `sot-google-maps-key` — liefert den Key ans Frontend fuer Map-Rendering (korrekt, behalten)
- `sot-places-search` — separate Edge Function die dasselbe macht wie `sot-research-engine` intern (Duplikat, loeschen)
- `sot-solar-insights` — nutzt Google Maps fuer PV-Analyse (korrekt, behalten)
- `pvgis-proxy` — nutzt Google Maps fuer Geocoding (korrekt, behalten)

### Wer nutzt die zentrale Engine korrekt?

| Konsument | Hook/Datei | Intent | Nutzt Engine korrekt? |
|-----------|-----------|--------|----------------------|
| MOD-04 Sanierung | `ProviderSearchPanel.tsx` via `useResearchEngine` | `find_contractors` | Ja |
| MOD-11 FM | `FMEinreichung.tsx` via `useResearchEngine` | `find_companies` | Ja |
| MOD-12 Akquise Tools | `useAcqTools.ts` | `search_portals` | Ja (direkt invoke) |
| MOD-12 Akquise Mandate | `AkquiseMandate.tsx` | `find_brokers` | Ja, aber Apollo-benannt |
| MOD-12 SourcingTab | `SourcingTab.tsx` | `find_brokers` | Ja, aber Apollo-benannt + Duplikat |
| Zone 1 Admin | `useAdminResearch.ts` | `find_contacts` | Ja, aber Apollo-benannt |
| Zone 1 Desk | `useDeskContacts.ts` | `find_contacts` | Ja |
| Zone 1 SOAT | `useSoatSearchEngine.ts` | `find_contacts` | Ja |
| Dossier Auto | `useDossierAutoResearch.ts` | via `sot-dossier-auto-research` | Ja (eigene Function) |

**Alle Konsumenten rufen `sot-research-engine` auf — keiner ruft Apollo direkt auf.** Das "Apollo" ist nur noch in Labels, Variablennamen und UI-Texten.

---

## Bereinigungsplan

### Schritt 1: Edge Functions loeschen (3 Funktionen)

- `supabase/functions/sot-apollo-search/` — Dead Code, 0 Aufrufe
- `supabase/functions/sot-research-pro-contacts/` — Stub mit Mock-Daten, 0 echte Nutzer
- `supabase/functions/sot-places-search/` — Duplikat, 0 Frontend-Aufrufe

### Schritt 2: Apollo-Referenzen in MOD-12 bereinigen

**`AkquiseMandate.tsx`:**
- `handleApolloSearch` umbenennen zu `handleEngineSearch`
- `showApolloDialog` → `showSearchDialog`
- `apolloForm` → `searchForm`
- `apolloLoading` → `searchLoading`
- SOURCE_CONFIG: `apollo` → `engine` (Label: "KI-Recherche")
- Apollo-Dialog: Titel aendern zu "KI-Kontaktrecherche"
- `source: 'apollo'` → `source: 'engine'`

**`SourcingTab.tsx`:**
- Identische Bereinigung wie AkquiseMandate.tsx (gleicher Code)

### Schritt 3: Apollo-Referenzen in Zone 1 bereinigen

**`useAdminResearch.ts`:**
- `ApolloSearchParams` → `ResearchSearchParams`
- `ApolloContact` → `ResearchContact`
- `startApolloSearch` → `startResearch`
- Kommentar Zeile 3 korrigieren

### Schritt 4: Type + Manifest bereinigen

**`useAcqContacts.ts`:**
- `ContactStagingSource`: `'apollo'` → `'engine'`

**`armstrongManifest.ts`:**
- Zeile 648: "ueber Apollo" → "ueber die Research Engine"
- `sot-research-pro-contacts` Eintrag entfernen (Function wird geloescht)

### Schritt 5: Datenbank-Check

- Pruefen ob `contact_staging.source` Eintraege mit `'apollo'` existieren → per Migration auf `'engine'` updaten

---

## Ergebnis nach Bereinigung

```text
Aktive Provider-Architektur:

sot-research-engine (ZENTRAL)
├── Google Places (New API)  → Discovery
├── Apify                    → Portal-Scraping + Google Maps Scraper
├── Firecrawl                → E-Mail-Extraktion
├── Netrows                  → LinkedIn-Scraping
└── Lovable AI               → Merge & Scoring

Geloescht:
├── sot-apollo-search        (Dead Code)
├── sot-research-pro-contacts (Stub)
└── sot-places-search        (Duplikat)

Umbenannt:
├── "Apollo" → "KI-Recherche" (UI)
└── "apollo" → "engine" (Source-Typ)
```

