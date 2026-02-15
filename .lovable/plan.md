

# Bereinigung und Vervollstaendigung: Integration Registry + API-Dokumentation

## Ist-Zustand -- Analyse-Ergebnis

### 3 Schichten der Integrations-Dokumentation (Problem)

Aktuell existieren Integrationen in drei getrennten, inkonsistenten Quellen:

1. **`integration_registry` (DB)** -- 38 Eintraege, teilweise veraltet
2. **`apiProviders.ts` (Code)** -- Nur 1 Eintrag (Vimcar), wird nirgends importiert
3. **Backend Secrets (Edge Functions)** -- 13 konfigurierte Secrets, teilweise nicht in der Registry

### Diskrepanzen im Detail

**In Backend-Secrets vorhanden, aber NICHT in `integration_registry`:**

| Secret | Genutzt in | Registry-Eintrag |
|--------|-----------|-------------------|
| ELEVENLABS_API_KEY | `elevenlabs-tts/`, `elevenlabs-scribe-token/` | FEHLT |
| LIVEKIT_API_KEY + SECRET + URL | `sot-videocall-create/`, `sot-videocall-invite-validate/` | FEHLT |
| PERPLEXITY_API_KEY | `sot-dossier-auto-research/` | FEHLT |
| OPENAI_API_KEY | (Reserve/Legacy) | FEHLT |

**In `integration_registry` als "active", aber Status stimmt nicht:**

| Code | Name | Problem |
|------|------|---------|
| NASA_APOD | NASA APOD | Status `pending_setup`, nutzt aber DEMO_KEY -- funktioniert |
| ZENQUOTES | ZenQuotes API | Status `pending_setup`, braucht keinen Key -- funktioniert |
| FINNHUB | Finnhub Markets | Status `pending_setup`, kein Secret konfiguriert, kein Edge Function |
| OPEN_METEO | Open-Meteo | Status `active`, korrekt (kein Key noetig) |

**In `integration_registry` eingetragen, aber NICHT benoetigt / fraglich:**

| Code | Name | Bewertung |
|------|------|-----------|
| ARLO_SMARTHOME | Arlo Smart Home | Kein Modul, kein Code, kein Plan -- ENTFERNEN |
| IPFI | IPFI Recherche | Unklarer Stub, kein Code -- ENTFERNEN |
| RADIO_BROWSER | Radio Browser API | Kein Code, kein Modul -- ENTFERNEN |
| CAYA | Caya DMS | Kein Code, kein konkreter Plan -- ENTFERNEN |
| UNSTRUCTURED | Unstructured.io | Kein Code, intern durch Lovable AI ersetzt -- ENTFERNEN |
| PROCESS_INBOUND | Process Inbound | Status `inactive`, Legacy -- ENTFERNEN |
| SEND_EMAIL | Send Email | Status `inactive`, ersetzt durch `sot-system-mail-send` -- ENTFERNEN |

**`apiProviders.ts` -- tote Datei:**

| Problem | Detail |
|---------|--------|
| Wird nirgends importiert | 0 Referenzen ausser in der Datei selbst |
| Nur 1 Eintrag (Vimcar) | Vimcar ist nicht in der DB-Registry |
| Duplikat-Konzept | Die DB-Registry ist die SSOT |

### Vollstaendige Soll-Uebersicht nach Bereinigung

**Kategorie 1: AKTIV (Secret vorhanden + Code funktioniert)**

| Code | Name | Secret | Edge Functions | Modul |
|------|------|--------|----------------|-------|
| RESEND | Resend Email | RESEND_API_KEY | 16 Functions | System-weit |
| GOOGLE_MAPS | Google Maps | GOOGLE_MAPS_API_KEY | sot-google-maps-key | MOD-03/04/06 |
| GOOGLE_PLACES | Google Places | (via GOOGLE_MAPS_API_KEY) | sot-places-search, sot-research-engine | MOD-04/12/14 |
| LOVABLE_AI | Lovable AI | LOVABLE_API_KEY | Diverse (Armstrong, Expose, Brief) | System-weit |
| ELEVENLABS | ElevenLabs | ELEVENLABS_API_KEY | elevenlabs-tts, elevenlabs-scribe-token | Armstrong Voice |
| LIVEKIT | LiveKit Video | LIVEKIT_API_KEY/SECRET/URL | sot-videocall-create/end/invite | Video-Calls |
| PERPLEXITY | Perplexity AI | PERPLEXITY_API_KEY | sot-dossier-auto-research | Dossier/Research |
| APIFY | Apify Scraper | APIFY_API_TOKEN | sot-research-engine, sot-apify-portal-job | MOD-12/14 |
| FIRECRAWL | Firecrawl | FIRECRAWL_API_KEY | sot-research-engine, sot-research-firecrawl-extract | MOD-12/14 |
| OPEN_METEO | Open-Meteo | (kein Key noetig) | (Client-seitig) | Dashboard Widget |
| NASA_APOD | NASA APOD | (DEMO_KEY reicht) | sot-nasa-apod | Dashboard Widget |
| ZENQUOTES | ZenQuotes | (kein Key noetig) | sot-zenquotes-proxy | Dashboard Widget |
| CRON | Cron System | CRON_SECRET | sot-ledger-retention u.a. | System-intern |

**Kategorie 2: GEPLANT (Modul existiert, API-Vertrag fehlt noch)**

| Code | Name | Modul | Prioritaet |
|------|------|-------|------------|
| STRIPE | Stripe Payments | Social/Listings (MOD-13/06) | Hoch |
| EUROPACE | Europace Baufi | Finanzierungsmanager (MOD-11) | Hoch |
| FUTURE_ROOM | Future Room | Finanzierung (MOD-07) | Mittel |
| scout24 | ImmoScout24 | Inserate (MOD-06) | Mittel |
| meta_ads | Meta Ads | Social (MOD-13) | Mittel |
| SPRENGNETTER | Sprengnetter | Bewertung (MOD-03) | Mittel |
| FINAPI | FinAPI | MSV Premium (MOD-05) | Niedrig |
| GMAIL_OAUTH | Gmail OAuth | Kommunikation (MOD-09) | Mittel |
| MICROSOFT_OAUTH | Outlook OAuth | Kommunikation (MOD-09) | Mittel |
| BRIEFDIENST | Briefdienst | Briefgenerator (MOD-02) | Niedrig |
| SIMPLEFAX | SimpleFax | Kommunikation | Niedrig |
| APOLLO | Apollo.io | Akquise (MOD-12) | Niedrig |
| HECTOR | Hector Kfz | Car-Management (MOD-17) | Niedrig |
| NEO_DIGITAL | Neo Digital | Mieter-Versicherung | Niedrig |

**Kategorie 3: ENTFERNEN (kein Code, kein Modul, kein Plan)**

| Code | Name | Grund |
|------|------|-------|
| ARLO_SMARTHOME | Arlo Smart Home | Kein Modul, kein Code |
| IPFI | IPFI Recherche | Unklarer Stub |
| RADIO_BROWSER | Radio Browser | Kein Code |
| CAYA | Caya DMS | Kein Code |
| UNSTRUCTURED | Unstructured.io | Ersetzt durch Lovable AI |
| PROCESS_INBOUND | Process Inbound | Legacy, inactive |
| SEND_EMAIL | Send Email | Legacy, inactive |

**Kategorie 4: OPTIONAL (Nice-to-have, Phase 2+)**

| Code | Name | Modul |
|------|------|-------|
| FINNHUB | Finnhub Markets | Dashboard Widget |
| AMAZON_PAAPI | Amazon PAAPI | Buecher (MOD-15) |
| EVENTBRITE_API | Eventbrite | Vortraege (MOD-15) |
| YOUTUBE_DATA_API | YouTube API | Vortraege (MOD-15) |
| IMPACT_AFFILIATE | Impact Affiliate | MOD-15 |
| UDEMY_AFFILIATE | Udemy Affiliate | MOD-15 |
| RABOT_ENERGY | Rabot Energy | PV/Energie |
| EUFY_CONNECT | Eufy Connect | Smart Home (Stub) |

## Umsetzungsplan

### Schritt 1: Tote Datei entfernen

`src/config/apiProviders.ts` loeschen -- wird nirgends importiert, ist ein Duplikat-Konzept zur DB-Registry.

### Schritt 2: SQL-Migration fuer Registry-Bereinigung

```text
-- 1. Nicht benoetigte Eintraege entfernen
DELETE FROM integration_registry WHERE code IN (
  'ARLO_SMARTHOME', 'IPFI', 'RADIO_BROWSER', 'CAYA', 
  'UNSTRUCTURED', 'PROCESS_INBOUND', 'SEND_EMAIL'
);

-- 2. Fehlende aktive Integrationen nachtragen
INSERT INTO integration_registry (code, name, type, status, description, auth_type, base_url, guardrails)
VALUES
  ('ELEVENLABS', 'ElevenLabs', 'integration', 'active', 
   'KI-Sprachsynthese und Echtzeit-Transkription fuer Armstrong Voice', 'api_key',
   'https://api.elevenlabs.io/v1', 'rate-limit-respect'),
  ('LIVEKIT', 'LiveKit Video', 'integration', 'active',
   'WebRTC Video-Calls fuer Beratungsgespraeche', 'api_key',
   'https://livekit.io', NULL),
  ('PERPLEXITY', 'Perplexity AI', 'integration', 'active',
   'KI-gestuetzte Web-Recherche fuer Dossier Auto-Research', 'api_key',
   'https://api.perplexity.ai', 'cost-per-query'),
  ('OPENAI', 'OpenAI', 'integration', 'active',
   'Reserve-KI-Provider (Legacy, primaer Lovable AI)', 'api_key',
   'https://api.openai.com/v1', NULL),
  ('CRON_SYSTEM', 'Cron System', 'internal', 'active',
   'Internes Cron-Secret fuer automatisierte Jobs', 'api_key',
   NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- 3. Status-Korrekturen
UPDATE integration_registry SET status = 'active' WHERE code = 'NASA_APOD';
UPDATE integration_registry SET status = 'active' WHERE code = 'ZENQUOTES';
UPDATE integration_registry SET status = 'active' WHERE code = 'apify';
UPDATE integration_registry SET status = 'active' WHERE code = 'FIRECRAWL';
UPDATE integration_registry SET status = 'active' WHERE code = 'FINNHUB' 
  AND EXISTS (SELECT 1); -- bleibt pending, kein Secret
```

### Schritt 3: Backlog-Datei erstellen

Eine neue Datei `spec/audit/integration_registry_audit.json` mit dem vollstaendigen Audit-Ergebnis und den offenen Aktionen (geplante Integrationen, MOD-15-Abhaengigkeiten etc.).

### Schritt 4: Vimcar-Eintrag in DB uebertragen

Falls Vimcar relevant bleibt (MOD-17 Car-Management), wird es als `pending_setup` in die DB-Registry aufgenommen. Andernfalls wird es mit der toten Datei entfernt.

## Ergebnis nach Bereinigung

- **1 Single Source of Truth**: Nur noch `integration_registry` (DB)
- **Tote Datei entfernt**: `apiProviders.ts`
- **7 Legacy-Eintraege geloescht**
- **5 aktive Integrationen nachgetragen** (ElevenLabs, LiveKit, Perplexity, OpenAI, Cron)
- **Status-Korrekturen** fuer NASA, ZenQuotes, Apify, Firecrawl
- **Audit-Datei** fuer laufende Nachverfolgung
