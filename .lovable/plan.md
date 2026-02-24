
# Drei Korrekturen: AI Assist auf Lovable AI, E-Mail Enrichment Strategie, LinkedIn Strategie

## Uebersicht

Drei separate Probleme werden adressiert:

1. **`sot-research-ai-assist`** nutzt direkt die Gemini API (`GEMINI_API_KEY`) statt den Lovable AI Gateway -- muss umgestellt werden
2. **E-Mail Enrichment** (`sot-contact-enrichment`) nutzt bereits den Lovable AI Gateway korrekt -- die Strategie als Ganzes sollte aber ueberdacht werden (aktuell nur Signatur-Extraktion, keine aktive Web-Recherche)
3. **LinkedIn-Strategie** verweist auf die offizielle LinkedIn API, die fuer Scraping nicht nutzbar ist -- realistischere Alternativen: **Apify LinkedIn Scraper** oder **Netrows API**

---

## 1. AI Assist auf Lovable AI Gateway umstellen

### Problem

`supabase/functions/sot-research-ai-assist/index.ts` hat eine defekte `callLovableAI`-Funktion (Zeilen 148-192):
- Sie ruft sich selbst rekursiv auf (Zeile 152)
- Dann eine nicht existierende `/sot-research-ai-internal` Funktion (Zeile 164)
- Dann faellt sie auf die direkte Gemini API zurueck (`GEMINI_API_KEY`, Zeile 172)
- Keiner dieser Aufrufe nutzt den Lovable AI Gateway

### Loesung

Die gesamte `callLovableAI`-Funktion wird durch einen sauberen Aufruf an `https://ai.gateway.lovable.dev/v1/chat/completions` ersetzt -- identisch zum Pattern in `sot-contact-enrichment` und `sot-armstrong-website`:

```text
callLovableAI(payload):
  1. LOVABLE_API_KEY aus Deno.env.get()
  2. POST an https://ai.gateway.lovable.dev/v1/chat/completions
  3. Non-streaming (stream: false)
  4. 429/402 Error-Handling
  5. Response parsen: choices[0].message.content
```

**Modell**: `google/gemini-3-flash-preview` (aktuelles Default-Modell, ersetzt das veraltete `gemini-2.5-flash` in den Prompts)

### Betroffene Aenderungen

| Zeile | Aenderung |
|---|---|
| 32-33 | Model auf `google/gemini-3-flash-preview` |
| 48-49 | Model auf `google/gemini-3-flash-preview` |
| 74-75 | Model auf `google/gemini-3-flash-preview` |
| 113-114 | Model auf `google/gemini-3-flash-preview` |
| 148-192 | Kompletter Rewrite der `callLovableAI`-Funktion |

### Weitere betroffene Edge Functions (Deprecated APIs)

Diese Functions nutzen ebenfalls direkte API-Keys statt Lovable AI Gateway und sollten perspektivisch migriert werden (nicht in diesem PR, nur Hinweis):

| Function | Problem |
|---|---|
| `sot-dossier-auto-research` | Nutzt `PERPLEXITY_API_KEY` direkt |
| `sot-armstrong-voice` | Nutzt `OPENAI_API_KEY` fuer Realtime-Voice (kein Gateway-Equivalent) |
| `sot-sprengnetter-valuation` | Faellt auf `OPENAI_API_KEY`/`GEMINI_API_KEY` zurueck |

---

## 2. E-Mail Enrichment Strategie ueberdenken

### Aktueller Zustand

`sot-contact-enrichment` macht genau **eine** Sache: Es extrahiert Kontaktdaten aus E-Mail-Signaturen per Lovable AI (Textanalyse). Das ist korrekt implementiert und nutzt bereits den Gateway.

**Was fehlt**: Aktive Enrichment-Schritte nach der Signatur-Extraktion:
- Wenn die Signatur nur Name + Firma liefert, aber keine Telefonnummer oder Website: kein Follow-Up
- Keine Verbindung zum Strategy Ledger
- Kein automatischer Trigger fuer Google Places oder Firecrawl nach Signatur-Extraktion

### Erweiterte Strategie

Die E-Mail-Anreicherung wird zum **Einstiegspunkt** fuer den Strategy Ledger:

```text
E-Mail eingehend
  -> Signatur-Extraktion (Lovable AI) -- wie bisher
  -> Kontakt erstellt/aktualisiert
  -> NEU: Strategy Ledger initialisieren (basierend auf Kategorie des Kontakts)
  -> NEU: Wenn data_gaps vorhanden (z.B. phone, website):
     -> Automatisch naechsten Strategy-Step triggern
        (z.B. Google Places fuer Telefon, Firecrawl fuer Website)
```

### Aenderungen

**Datei:** `supabase/functions/sot-contact-enrichment/index.ts`

Nach erfolgreichem Upsert des Kontakts (ca. Zeile 370-420):
1. Strategy Ledger pruefen/erstellen via `sot-research-strategy-resolver`
2. Wenn `data_gaps` vorhanden und Auto-Enrich aktiv: naechsten Step via `sot-research-engine` (Intent: `strategy_step`) triggern
3. Kosten-Tracking: Der Step-Cost wird im Ledger protokolliert

Dies macht die E-Mail-Enrichment-Card zu einem echten Pipeline-Trigger statt nur eines Signatur-Parsers.

---

## 3. LinkedIn Strategie ueberdenken

### Problem

Die aktuelle Implementierung verweist auf die offizielle LinkedIn API (`api.linkedin.com/v2/organizationLookup`). Diese ist:
- **Nicht fuer Scraping gedacht** -- LinkedIn genehmigt API-Zugang nur fuer ausgewaehlte Partner
- **Extrem restriktiv** -- Self-Service-Zugang ist auf Marketing-APIs beschraenkt
- **Nicht realistisch** fuer unser Use-Case (Kontaktperson + Position von Unternehmen finden)

### Recherche-Ergebnis: Realistische Alternativen

Basierend auf aktueller Marktrecherche (2026):

```text
+-------------------+------------+--------------+------------------+-------------------+
| Provider          | Kosten     | Pro Request  | Methode          | Empfehlung        |
+===================+============+==============+==================+===================+
| Netrows           | 49 EUR/Mo  | ~0.005 EUR   | API (48+ Endp.)  | EMPFOHLEN         |
|                   | (10k Cred) |              | Real-time        | (bestes P/L)      |
+-------------------+------------+--------------+------------------+-------------------+
| Apify LinkedIn    | Pay-per-use| ~0.01 EUR    | Scraper Actor    | ALTERNATIVE       |
| Scraper           |            |              | (Cookie-based)   | (bereits integriert|
|                   |            |              |                  |  als Provider)    |
+-------------------+------------+--------------+------------------+-------------------+
| Proxycurl         | 49 USD/Mo  | ~0.49 USD    | API              | ZU TEUER          |
+-------------------+------------+--------------+------------------+-------------------+
| PhantomBuster     | 69 USD/Mo  | ~0.14 USD    | Browser-Automat. | KOMPLEX           |
+-------------------+------------+--------------+------------------+-------------------+
| LinkedIn Official | Gratis     | Gratis       | Offizielle API   | NICHT NUTZBAR     |
|                   |            |              |                  | (zu restriktiv)   |
+-------------------+------------+--------------+------------------+-------------------+
```

### Empfehlung: Duale Strategie

**Primaer: Apify LinkedIn Scraper** (bereits als Provider im System)
- Nutzt den bestehenden `apify_maps`-Provider-Pfad
- Neuer Actor: `apify/linkedin-profile-scraper` oder `apify/linkedin-company-scraper`
- Vorteil: Kein neues Secret noetig (APIFY_API_TOKEN existiert bereits)
- Kosten: ~0.01 EUR pro Profil

**Spaeter: Netrows API** (wenn Volumen steigt)
- Bestes Preis-Leistungs-Verhaeltnis bei hohem Volumen (0.005 EUR/Request)
- 48+ Endpoints (Profil, Company, Posts, Search)
- Erfordert neues Secret: `NETROWS_API_KEY`
- Integration als neuer Provider-Typ im Research Engine

### Technische Aenderungen

**a) `src/engines/marketDirectory/spec.ts`**:
- `LINKEDIN_CONFIG` aktualisieren: `method: 'apify_scraper'` statt `'official_api'`
- Provider-Typ `'apify_linkedin'` hinzufuegen (neben `'apify_maps'` und `'apify_portal'`)
- `LinkedInContact` Interface bleibt (korrekt definiert)
- Neuen Provider `'netrows'` als Zukunftsoption vorbereiten

**b) `supabase/functions/sot-research-engine/index.ts`**:
- `linkedin_future` Step umbenennen zu `linkedin_scrape`
- Implementierung: Apify `linkedin-company-scraper` Actor starten
- Input: Firmenname aus `contact_data.company_name`
- Output: Ansprechpartner, Position, Company-URL
- Fallback: Wenn Apify-Token fehlt, `not_configured` wie bisher

**c) `supabase/functions/sot-research-strategy-resolver/index.ts`**:
- `linkedin_future` zu `linkedin_scrape` umbenennen in der Strategy-Registry

---

## Zusammenfassung der Aenderungen

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-research-ai-assist/index.ts` | Kompletter Rewrite `callLovableAI` auf Gateway, Modell-Update |
| `supabase/functions/sot-contact-enrichment/index.ts` | Strategy-Ledger-Integration nach Signatur-Extraktion |
| `supabase/functions/sot-research-engine/index.ts` | `linkedin_future` -> `linkedin_scrape` mit Apify-Implementierung |
| `supabase/functions/sot-research-strategy-resolver/index.ts` | `linkedin_future` -> `linkedin_scrape` |
| `src/engines/marketDirectory/spec.ts` | LinkedIn-Config + neuer Provider `apify_linkedin` + `netrows` |

### Modul-Freeze-Check

Alle betroffenen Dateien liegen ausserhalb der Modul-Pfade (Edge Functions + Engines) -- kein Freeze betroffen.
