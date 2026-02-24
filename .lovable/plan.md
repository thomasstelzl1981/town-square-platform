
# Recherche-Modul: Netrows-Luecken + UI-Professionalisierung + Dokumentation

## Befunde

### 1. Netrows: Vollstaendig implementiert, nirgends registriert

| Ebene | Status | Problem |
|-------|--------|---------|
| Edge Function (`sot-research-engine`) | AKTIV — Netrows ist **PRIMARY** Provider fuer `linkedin_scrape` mit Apify als Fallback | Korrekt implementiert |
| Secret (`NETROWS_API_KEY`) | KONFIGURIERT — im Cloud hinterlegt | OK |
| `spec.ts` LINKEDIN_CONFIG | VERALTET — Apify steht als "primary", Netrows als "future" | **Widerspricht der Edge Function** |
| `integration_registry` (DB) | FEHLT — kein Eintrag fuer Netrows | **Nicht registriert** |
| `Integrations.tsx` SECRET_MAP | FEHLT — kein Eintrag `NETROWS: ['NETROWS_API_KEY']` | **Nicht erkannt** |
| `Integrations.tsx` ICON_MAP | FEHLT — kein Icon fuer `NETROWS` | **Nicht angezeigt** |
| `docs/secrets/NETROWS_API_KEY.md` | FEHLT — keine Dokumentation | **Nicht dokumentiert** |

### 2. Apify Secret-Name Bug

`Integrations.tsx` SECRET_MAP nutzt `APIFY_API_KEY`, aber der tatsaechliche Secret heisst `APIFY_API_TOKEN`. Die Integration wird deshalb faelschlicherweise als "Secret fehlt" angezeigt.

### 3. Suchformular: Unklare UX

- Titel "Neue Suche" sagt nichts ueber den Prozess aus
- Keine Beschreibung der Pipeline (Google Places -> Firecrawl -> KI-Merge)
- Zielanzahl max 100 — fuer Testlaeufe mit 500 ungeeignet
- Keine Kosteninformation
- Keine Provider-Status-Anzeige

---

## Umsetzungsplan

### Phase 1: Netrows Registrierung (Daten-Konsistenz)

**1.1 `integration_registry` DB-Eintrag**

```sql
INSERT INTO integration_registry (code, name, type, status, description)
VALUES ('NETROWS', 'Netrows LinkedIn Scraping', 'integration', 'active',
  'LinkedIn Company & Person Scraping — primaerer Provider fuer Kontaktperson-Enrichment via linkedin_scrape Step');
```

**1.2 `Integrations.tsx` SECRET_MAP erweitern**

```text
NETROWS: ['NETROWS_API_KEY'],
```

**1.3 `Integrations.tsx` ICON_MAP erweitern**

```text
NETROWS: Users,  (oder ein LinkedIn-aehnliches Icon)
```

**1.4 Apify SECRET_MAP Bug fixen**

```text
APIFY: ['APIFY_API_TOKEN'],   // war: APIFY_API_KEY
```

### Phase 2: spec.ts LINKEDIN_CONFIG korrigieren

Die Realitaet umkehren — Netrows ist primary, Apify ist fallback:

```typescript
export const LINKEDIN_CONFIG = {
  /** Primary: Netrows API (best price/performance at scale) */
  primary: {
    method: 'netrows_api' as const,
    secretName: 'NETROWS_API_KEY',
    baseUrl: 'https://api.netrows.com/api/v1',
    estimatedCostPerLookup: 0.005,
    rateLimitPerDay: 10000,
    endpoints: ['company/search', 'company/profile', 'person/search', 'person/profile'],
  },
  /** Fallback: Apify LinkedIn Scraper */
  fallback: {
    method: 'apify_scraper' as const,
    actor: 'apify/linkedin-company-scraper',
    secretName: 'APIFY_API_TOKEN',
    estimatedCostPerLookup: 0.01,
    rateLimitPerDay: 500,
  },
} as const;
```

Kommentar ueber `LinkedInContact` ebenfalls aktualisieren.

### Phase 3: Secret-Dokumentation

**3.1 `docs/secrets/NETROWS_API_KEY.md` erstellen**

Analog zu `FIRECRAWL_API_KEY.md`:
- Was ist der Key?
- Wo bekommt man ihn? (https://netrows.com/get-access)
- Wie hinterlegen? (Secret Name: `NETROWS_API_KEY`)
- Auswirkung wenn nicht gesetzt (Fallback auf Apify)
- Kosten (~0.005 EUR pro Lookup)

### Phase 4: Suchformular professionalisieren

**4.1 Card-Titel + Beschreibung**

```text
MANUELLE RECHERCHE
Startet eine mehrstufige Echtzeit-Pipeline:
1. Google Places / Apify Maps — Basisadressen + Telefon + Website
2. Firecrawl — E-Mail-Extraktion von Unternehmens-Websites
3. Netrows / Apify LinkedIn — Ansprechpartner + LinkedIn-Profil
4. KI-Merge (Gemini) — Deduplizierung, Normalisierung, Scoring

Ergebnisse erscheinen in Echtzeit in der Tabelle darunter und koennen
nach Validierung ins Kontaktbuch importiert werden.
```

**4.2 Zielanzahl erweitern**

Dropdown erhaelt: 10, 25, 50, 100, 200, 500

**4.3 Provider-Status-Badges**

Unter der Beschreibung: Gruene/rote Badges fuer jeden Provider basierend auf Secret-Verfuegbarkeit.

```text
[OK] Google Places  [OK] Firecrawl  [OK] Netrows  [OK] Apify  [OK] KI-Merge
```

**4.4 Kosten-Hinweis**

Unterhalb des Starten-Buttons:

```text
[i] Geschaetzte Kosten pro Kontakt: ~2.5 ct (Google) + ~1.0 ct (Firecrawl) + ~0.5 ct (Netrows)
```

### Phase 5: StrategyOverview — Netrows Provider richtig labeln

`StrategyOverview.tsx` hat bereits einen `netrows` Eintrag in `PROVIDER_ICONS` — korrekt. Aber die `CATEGORY_SOURCE_STRATEGIES` in `spec.ts` muessen geprueft werden, ob Netrows-Steps enthalten sind (aktuell nur in der `linkedin_scrape` Pipeline, nicht in den Kategorie-Strategien). Das ist korrekt, da Netrows nur fuer den LinkedIn-Enrichment-Schritt genutzt wird, nicht fuer die Discovery.

---

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| DB Migration | INSERT `NETROWS` in `integration_registry` |
| `src/pages/admin/Integrations.tsx` | SECRET_MAP + ICON_MAP + Apify-Bug fix |
| `src/engines/marketDirectory/spec.ts` | LINKEDIN_CONFIG primary/fallback umkehren |
| `docs/secrets/NETROWS_API_KEY.md` | Neue Dokumentation |
| `src/pages/admin/ki-office/AdminRecherche.tsx` | Card-Titel, Beschreibung, Zielanzahl 200/500, Provider-Badges, Kosten-Hinweis |

**Modul-Freeze-Check**: Alle Dateien liegen in `src/pages/admin/`, `src/engines/`, `docs/` — ausserhalb der Modul-Pfade. Kein Freeze betroffen.
