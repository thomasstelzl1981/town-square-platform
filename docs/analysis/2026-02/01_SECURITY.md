# 01_SECURITY — Sicherheitsanalyse Edge Functions & Datenbank

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

## A. Edge Functions — Sicherheitsmatrix (131 Funktionen)

| Funktion | Zeilen | Auth-Check | CORS | Webhook-Sig | Error-Handling |
|----------|--------|-----------|------|-------------|----------------|
| check-landing-page-expiry | 44 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| elevenlabs-scribe-token | 54 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| elevenlabs-tts | 80 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| finance-document-reminder | 260 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| pv-connector-bridge | 116 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| pvgis-proxy | 110 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| setup-demo-account | 112 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-ai-research | 223 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-contact-enrich | 213 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-create-dataroom | 172 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-generate-response | 150 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-inbound-webhook | 359 | PARTIAL | RESTRIKTIV ✅ | JA ✅ | VOLLSTÄNDIG |
| sot-acq-offer-extract | 236 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-outbound | 252 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-profile-extract | 142 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-acq-standalone-research | 209 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-admin-mail-send | 181 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-admin-sequence-runner | 341 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-apify-portal-job | 182 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-apollo-search | 208 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-armstrong-advisor | 3949 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-armstrong-voice | 206 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-armstrong-website | 86 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-auth-change-email | 97 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-calendar-sync | 358 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-cleanup-orphan-accounts | 253 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-cloud-sync | 564 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-contact-enrichment | 483 | PARTIAL | ALLOW-ALL | JA ✅ | VOLLSTÄNDIG |
| sot-contacts-import | 41 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-contacts-sync | 333 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-create-test-user | 117 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-credit-checkout | 112 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-credit-preflight | 159 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-credit-webhook | 118 | SERVICE | ALLOW-ALL | JA ✅ | VOLLSTÄNDIG |
| sot-discovery-scheduler | 588 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-dms-download-url | 133 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-docs-export | 213 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-docs-export-appendix | 375 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-docs-export-engineering | 823 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-docs-export-modules | 476 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-docs-export-rfp | 298 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-docs-export-specs | 635 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-document-parser | 795 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-dossier-auto-research | 222 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-embedding-pipeline | 192 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-excel-ai-import | 271 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-expose-description | 193 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-extract-email | 157 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-extract-offer | 153 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-finance-manager-notify | 213 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-finance-proxy | 134 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-finapi-sync | 724 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-futureroom-public-submit | 284 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-generate-landing-page | 79 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-geomap-snapshot | 207 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-google-maps-key | 53 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-inbound-receive | 872 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-indexnow | 77 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-investment-engine | 332 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-ki-browser | 1163 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-lead-inbox | 332 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-ledger-retention | 140 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-letter-generate | 134 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-listing-publish | 540 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-mail-connect | 263 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-mail-fetch-body | 472 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-mail-gmail-auth | 306 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-mail-send | 399 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-mail-sync | 925 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-manager-activate | 215 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-market-pulse-report | 79 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-meeting-send | 125 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-meeting-summarize | 142 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-msv-reminder-check | 279 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-msv-rent-report | 264 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-nasa-apod | 106 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-news-proxy | 69 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-nk-beleg-parse | 243 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-pet-profile-init | 100 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-places-search | 194 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-project-description | 218 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-project-intake | 939 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-project-market-report | 113 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-property-crud | 263 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-public-project-intake | 404 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-registry-import | 305 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-renovation-inbound-webhook | 255 | SERVICE | ALLOW-ALL | JA ✅ | VOLLSTÄNDIG |
| sot-renovation-outbound | 112 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-renovation-scope-ai | 561 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-rent-arrears-check | 156 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-rent-match | 208 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-renter-invite | 213 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-research-ai-assist | 204 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-research-engine | 1206 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-research-import-contacts | 170 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-research-pro-contacts | 49 | **FEHLT** 🔴 | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-research-run-order | 302 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-research-strategy-resolver | 255 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-scheduler-control | 135 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-serien-email-send | 215 | PARTIAL | ALLOW-ALL | JA ✅ | VOLLSTÄNDIG |
| sot-sitemap-generator | 143 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-analyze-performance | 58 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-draft-generate | 136 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-draft-rewrite | 80 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-extract-patterns | 84 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-generate-briefing | 105 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-mandate-submit | 180 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-meta-webhook | 121 | SERVICE | ALLOW-ALL | **NEIN** 🔴 | VOLLSTÄNDIG |
| sot-social-payment-create | 70 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-social-payment-webhook | 59 | SERVICE | ALLOW-ALL | **NEIN** 🔴 | VOLLSTÄNDIG |
| sot-solar-insights | 83 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-sprengnetter-valuation | 109 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-storage-extract | 266 | PARTIAL | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-storage-extractor | 587 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-system-mail-send | 183 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-tenant-storage-reset | 121 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-transaction-categorize | 365 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-videocall-create | 139 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-videocall-end | 60 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-videocall-invite-send | 132 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-videocall-invite-validate | 136 | SERVICE | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-vv-prefill-check | 177 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-website-ai-generate | 178 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-website-lead-capture | 66 | SERVICE | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-website-publish | 124 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-website-update-section | 230 | PARTIAL | ALLOW-ALL | N/A | VOLLSTÄNDIG |
| sot-whatsapp-media | 215 | PARTIAL | RESTRIKTIV ✅ | N/A | SILENT-FAILS |
| sot-whatsapp-send | 189 | PARTIAL | ALLOW-ALL | N/A | SILENT-FAILS |
| sot-whatsapp-webhook | 307 | SERVICE | ALLOW-ALL | **NEIN** 🔴 | SILENT-FAILS |
| sot-z3-auth | 236 | SERVICE | RESTRIKTIV ✅ | N/A | VOLLSTÄNDIG |
| sot-zenquotes-proxy | 95 | **FEHLT** 🔴 | ALLOW-ALL | N/A | VOLLSTÄNDIG |

### Zusammenfassung

| Status | Anzahl |
|--------|--------|
| Auth-Check FEHLT 🔴 | 19 |
| Auth-Check PARTIAL 🟡 | 89 |
| Auth-Check SERVICE ✅ | 23 |
| CORS ALLOW-ALL 🔴 | 119 |
| CORS RESTRIKTIV ✅ | 12 |
| Webhook-Sig NEIN 🔴 | 3 |
| Webhook-Sig JA ✅ | 5 |
| SILENT-FAILS 🔴 | 24 |

---

## B. Tabellen ohne Row Level Security (RLS)

Die folgenden 32 Tabellen haben **kein** `ENABLE ROW LEVEL SECURITY` in den Migrations:

> 🔴 **Kritisch**: Diese Tabellen sind für jeden authentifizierten Benutzer lesbar/schreibbar, solange keine separaten Policies greifen.

| Tabelle | Risiko | Tenant-Daten? |
|---------|--------|---------------|
| `access_grants` | 🔴 KRITISCH | Ja |
| `ad_campaign_leads` | 🟠 HOCH | Ja |
| `ad_campaigns` | 🟠 HOCH | Ja |
| `applicant_profiles` | 🔴 KRITISCH | Ja — personenbezogen |
| `contacts` | 🔴 KRITISCH | Ja — personenbezogen |
| `credibility_flags` | 🟠 HOCH | Ja |
| `documents` | 🔴 KRITISCH | Ja — sensitiv |
| `finance_bank_contacts` | 🔴 KRITISCH | Ja — Bankdaten |
| `finance_cases` | 🔴 KRITISCH | Ja — Finanzdaten |
| `finance_mandates` | 🔴 KRITISCH | Ja — Verträge |
| `finance_requests` | 🔴 KRITISCH | Ja — Kreditanfragen |
| `future_room_cases` | 🟡 MITTEL | Ja |
| `investment_favorites` | 🟡 MITTEL | Ja |
| `investment_searches` | 🟡 MITTEL | Ja |
| `lead_activities` | 🟠 HOCH | Ja |
| `lead_assignments` | 🟠 HOCH | Ja |
| `leads` | 🟠 HOCH | Ja — personenbezogen |
| `leases` | 🔴 KRITISCH | Ja — Mietverträge |
| `listings` | 🟠 HOCH | Ja — Immobilienangebote |
| `msv_enrollments` | 🟡 MITTEL | Ja |
| `partner_deals` | 🟡 MITTEL | Ja |
| `partner_verifications` | 🟡 MITTEL | Ja |
| `properties` | 🟠 HOCH | Ja — Immobiliendaten |
| `property_features` | 🟡 MITTEL | Ja |
| `property_financing` | 🔴 KRITISCH | Ja — Finanzierung |
| `rent_payments` | 🔴 KRITISCH | Ja — Zahlungsdaten |
| `rent_reminders` | 🟡 MITTEL | Ja |
| `renter_invites` | 🟡 MITTEL | Ja |
| `scraper_jobs` | 🟢 LOW | Nein |
| `scraper_providers` | 🟢 LOW | Nein |
| `scraper_results` | 🟢 LOW | Nein |
| `units` | 🟠 HOCH | Ja — Wohneinheitsdaten |

**Empfohlener Sofortfix** (für die 10 kritischsten):
```sql
-- Für jede der kritischen Tabellen:
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.contacts
  FOR ALL USING (tenant_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

---

## C. Environment Variables — Sicherheitsstatus

### Frontend-Konfiguration (`src/integrations/supabase/client.ts`)
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```
✅ **Korrekt**: Nur `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) wird client-seitig verwendet — kein Service-Key.

### Referenzierte VITE_-Variablen in src/
| Variable | Datei | Bewertung |
|----------|-------|-----------|
| `VITE_SUPABASE_URL` | `client.ts` | ✅ Sicher (public) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts` | ✅ Sicher (anon key) |
| `VITE_GOOGLE_MAPS_API_KEY` | `Integrations.tsx:122` | ⚠️ Hinweis angezeigt |

### `.gitignore` Bewertung
```
.env
.env.*
!.env.example
```
✅ Alle `.env`-Dateien sind in `.gitignore` — kein Secrets-Leak über Git.

### Service-Key Exposition
- ❌ **Keine** `SUPABASE_SERVICE_ROLE_KEY`-Verwendung in `src/` gefunden
- ✅ Service-Keys werden ausschließlich in `supabase/functions/` verwendet (Server-seitig)

---

## D. Stripe Webhook-Signatur

### `sot-credit-webhook` ✅ TEILWEISE SICHER
```typescript
// Zeile 44–53
if (webhookSecret) {
  event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
} else {
  // Dev mode: parse without verification
  console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set — accepting unverified webhook");
  event = JSON.parse(body) as Stripe.Event;
}
```
⚠️ **Problem**: Fallback-Modus akzeptiert unverifizierte Events wenn `STRIPE_WEBHOOK_SECRET` nicht gesetzt ist.

**Fix**: Secret als Required markieren:
```typescript
if (!webhookSecret) {
  return json({ error: "Webhook not configured" }, 503);
}
```

### `sot-social-payment-webhook` 🔴 UNSICHER
- Keine Stripe-Signaturvalidierung — direkte JSON-Verarbeitung ohne Verifizierung
- **Risiko**: Fake-Payment-Events können injiziert werden

---

## E. Resend/Email Webhook Validierung

### `sot-contact-enrichment` ✅ Webhook-Secret vorhanden
```typescript
// Signatur-Validierung implementiert
```

### `sot-serien-email-send` ✅ Webhook-Validierung vorhanden

### `sot-acq-inbound-webhook` ✅ Webhook-Signatur implementiert

### `sot-mail-*` Funktionen ⚠️ KEIN INBOUND-WEBHOOK-SCHUTZ
Die Mail-Sync-Funktionen (`sot-mail-sync`, `sot-mail-fetch-body`) werden per JWT-Auth geschützt, verarbeiten aber eingehende E-Mail-Webhooks (z.B. Google PubSub) ohne Signaturvalidierung.

---

## F. Kritische Sofortmaßnahmen (P0)

1. **Auth zu 19 ungeschützten Funktionen hinzufügen** — insbesondere `sot-google-maps-key`, `sot-contacts-import`, `sot-finance-proxy`
2. **Webhook-Signatur für `sot-social-meta-webhook`** mit `X-Hub-Signature-256` implementieren
3. **Webhook-Signatur für `sot-whatsapp-webhook`** auf POST-Payload
4. **Webhook-Signatur für `sot-social-payment-webhook`** via Stripe
5. **RLS aktivieren** auf den 10 kritischen Tabellen (contacts, documents, finance_*)
6. **`sot-credit-webhook` Fallback entfernen** — Stripe-Secret als Pflicht

> Alle Findings wurden gegen den aktuellen Code-Stand (2026-02-26) geprüft.
> Die vorherigen Findings aus `ENTERPRISE_READINESS_REVIEW.md` (2026-02-16) sind noch gültig —
> es wurden keine der damals identifizierten Sicherheitsprobleme behoben.
