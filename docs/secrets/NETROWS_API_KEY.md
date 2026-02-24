# NETROWS_API_KEY — Secret-Dokumentation

> **Status:** ✅ KONFIGURIERT  
> **Benötigt von:** Edge Function `sot-research-engine` (linkedin_scrape Step)  
> **Modul:** MOD-14 Communication Pro → Recherche  

---

## Was ist dieser Key?

Der **Netrows API Key** wird für LinkedIn Company & Person Scraping benötigt. Netrows ist der **primäre Provider** für den `linkedin_scrape`-Schritt in der Research Engine. Er liefert Ansprechpartner-Namen, Positionen und LinkedIn-Profil-URLs zu gefundenen Unternehmen.

## Wo bekomme ich den Key?

1. Gehe zu [https://netrows.com/get-access](https://netrows.com/get-access)
2. Erstelle einen Account oder logge dich ein
3. Navigiere zu **Dashboard → API Keys**
4. Erstelle einen neuen API Key
5. Kopiere den Key

## Wie hinterlegen?

Der Key muss als **Secret** im Lovable Cloud Backend hinterlegt werden:

- **Secret Name:** `NETROWS_API_KEY`
- **Verwendung:** Wird in der Edge Function `sot-research-engine` über `Deno.env.get('NETROWS_API_KEY')` gelesen

## Auswirkung wenn nicht gesetzt

- Der `linkedin_scrape`-Schritt fällt automatisch auf **Apify LinkedIn Scraper** (`APIFY_API_TOKEN`) zurück
- Apify ist langsamer und teurer (~0.01 EUR/Lookup vs. ~0.005 EUR/Lookup)
- Bei fehlendem Apify-Token wird der LinkedIn-Enrichment-Schritt komplett übersprungen

## Kosten

- **~0.005 EUR pro Lookup** (Netrows)
- **~0.01 EUR pro Lookup** (Apify Fallback)
- Rate Limit: 10.000 Requests/Tag (Netrows) vs. 500/Tag (Apify)
- Die Kosten werden in `research_billing_log` protokolliert

## Provider-Hierarchie

```text
1. Netrows API (PRIMARY)  → NETROWS_API_KEY
2. Apify LinkedIn (FALLBACK) → APIFY_API_TOKEN
```
