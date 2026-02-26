# 06_QUICK_WINS — Top 30 Sofort-Fixes (<30 Minuten)

## Analyse-Stand: 2026-02-26 | Analyst: GitHub Agent v2
## Basis: Vollständiger Repo-Scan (src/, supabase/, manifests/, spec/)

---

> Alle Fixes sind **sofort umsetzbar** — kein Refactoring, kein Architektur-Umbau.
> Sortiert nach Impact (P0/P1 zuerst).

---

### QW-01: Auth-Guard für `sot-contacts-import`
- **Datei:** `supabase/functions/sot-contacts-import/index.ts` Zeile 1–10
- **Problem:** Keine Authentifizierung — jeder kann Bulk-Kontakt-Import triggern.
- **Fix:**
  ```typescript
  // Nach CORS-Check hinzufügen:
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~5 Minuten

---

### QW-02: Auth-Guard für `sot-google-maps-key`
- **Datei:** `supabase/functions/sot-google-maps-key/index.ts` Zeile 10–14
- **Problem:** Google-Maps-API-Key wird ohne Auth ausgegeben — kostspielige Key-Exposition.
- **Fix:**
  ```typescript
  // Direkt nach OPTIONS-Check:
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~5 Minuten

---

### QW-03: Auth-Guard für `elevenlabs-scribe-token`
- **Datei:** `supabase/functions/elevenlabs-scribe-token/index.ts` Zeile 1–15
- **Problem:** ElevenLabs-API-Token wird ohne Auth ausgegeben — API-Kosten-Missbrauch möglich.
- **Fix:**
  ```typescript
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~5 Minuten

---

### QW-04: Stripe-Signatur-Pflicht in `sot-credit-webhook`
- **Datei:** `supabase/functions/sot-credit-webhook/index.ts` Zeile 54–60
- **Problem:** Fallback ohne `STRIPE_WEBHOOK_SECRET` akzeptiert unverifizierte Stripe-Events.
- **Fix:**
  ```typescript
  // Vorher:
  if (webhookSecret) { ... } else {
    console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set — accepting unverified webhook");
    event = JSON.parse(body) as Stripe.Event;
  }

  // Nachher:
  if (!webhookSecret) {
    return json({ error: "Webhook secret not configured" }, 503);
  }
  event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~5 Minuten

---

### QW-05: Auth-Guard für `sot-finance-proxy`
- **Datei:** `supabase/functions/sot-finance-proxy/index.ts` Zeile 1–10
- **Problem:** Finanzierungs-Proxy ohne Auth — Dritte können Finanzanfragen im Namen von Tenants erstellen.
- **Fix:** Standard Auth-Guard (wie QW-01) hinzufügen.
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~5 Minuten

---

### QW-06: Auth-Guard für `pvgis-proxy`
- **Datei:** `supabase/functions/pvgis-proxy/index.ts` Zeile 1–10
- **Problem:** Kein Auth-Check — öffentlich zugänglicher PVGIS-Proxy.
- **Fix:** Standard Auth-Guard hinzufügen.
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~5 Minuten

---

### QW-07: Webhook-Signatur für `sot-social-payment-webhook`
- **Datei:** `supabase/functions/sot-social-payment-webhook/index.ts` Zeile 11–22
- **Problem:** Stripe-Payment-Webhook ohne `constructEventAsync` — fake Payments möglich.
- **Fix:**
  ```typescript
  import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const webhookSecret = Deno.env.get("STRIPE_SOCIAL_WEBHOOK_SECRET");
  if (!webhookSecret) return new Response(JSON.stringify({ error: "Not configured" }), { status: 503 });
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
  const body = await req.text();
  const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  const { mandate_id, payment_status, session_id } = event.data.object as Record<string, string>;
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~20 Minuten

---

### QW-08: RLS aktivieren auf `contacts`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** `contacts`-Tabelle hat kein RLS — alle Tenant-Kontakte sind für alle lesbar.
- **Fix:**
  ```sql
  -- Neue Migration erstellen:
  ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON public.contacts
    FOR ALL USING (
      tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
    );
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~10 Minuten

---

### QW-09: RLS aktivieren auf `listings`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** `listings`-Tabelle ohne RLS.
- **Fix:**
  ```sql
  ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON public.listings
    FOR ALL USING (
      tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
    );
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~10 Minuten

---

### QW-10: RLS aktivieren auf `documents`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** `documents`-Tabelle (sensitiv!) ohne RLS.
- **Fix:**
  ```sql
  ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON public.documents
    FOR ALL USING (
      tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
    );
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~10 Minuten

---

### QW-11: Silent-Fail in `sot-property-crud` beheben
- **Datei:** `supabase/functions/sot-property-crud/index.ts`
- **Problem:** Fehler werden geloggt aber Response ist `200 OK`.
- **Fix:**
  ```typescript
  // Vorher:
  console.error("Error:", error);
  return new Response(JSON.stringify({ success: false }), { status: 200 });

  // Nachher:
  console.error("Error:", error);
  return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  ```
- **Impact:** 🟠 P1 | EDGE-FN
- **Zeit:** ~10 Minuten

---

### QW-12: Silent-Fail in `sot-listing-publish` beheben
- **Datei:** `supabase/functions/sot-listing-publish/index.ts`
- **Problem:** Kritischer Listing-Publish-Pfad mit Silent-Fails.
- **Fix:** Alle `console.error(...)` ohne nachfolgendes `return error-Response` patchen.
- **Impact:** 🟠 P1 | EDGE-FN
- **Zeit:** ~15 Minuten

---

### QW-13: Silent-Fail in `sot-letter-generate` beheben
- **Datei:** `supabase/functions/sot-letter-generate/index.ts`
- **Problem:** Brief-Generierung schlägt still fehl — User sieht keine Fehlermeldung.
- **Fix:** `console.error` → Error-Response mit 500.
- **Impact:** 🟠 P1 | EDGE-FN
- **Zeit:** ~10 Minuten

---

### QW-14: `ALTER TABLE ADD COLUMN IF NOT EXISTS` in 20260216-Migration
- **Datei:** `supabase/migrations/20260216144315_2ae47675-c734-4910-b2d3-9d272a1159c7.sql` Zeile 3–5
- **Problem:** `ADD COLUMN` ohne `IF NOT EXISTS` — Fehler bei Re-Run.
- **Fix:**
  ```sql
  -- Vorher:
  ALTER TABLE vorsorge_contracts ADD COLUMN category text NOT NULL DEFAULT 'vorsorge';

  -- Nachher:
  ALTER TABLE vorsorge_contracts ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'vorsorge';
  ```
- **Impact:** 🟠 P1 | DB
- **Zeit:** ~3 Minuten

---

### QW-15: `ALTER TABLE ADD COLUMN IF NOT EXISTS` in 20260218-Migration
- **Datei:** `supabase/migrations/20260218000944_1582fe61-8aad-4d6c-b7ef-c3c87ae7dcb4.sql` Zeile 1
- **Problem:** `is_published` ADD COLUMN ohne IF NOT EXISTS.
- **Fix:**
  ```sql
  ALTER TABLE public.pet_providers ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
  ```
- **Impact:** 🟠 P1 | DB
- **Zeit:** ~2 Minuten

---

### QW-16: INSERT ON CONFLICT in acq_email_templates Migration
- **Datei:** `supabase/migrations/20260206025112_7e59d62e-0718-46a1-b6a1-1b0cc119dc88.sql` Zeile 414
- **Problem:** INSERT ohne ON CONFLICT — Duplikate bei Re-Run.
- **Fix:**
  ```sql
  INSERT INTO public.acq_email_templates (...) VALUES (...)
    ON CONFLICT (code) DO NOTHING;
  ```
- **Impact:** 🟠 P1 | DB
- **Zeit:** ~5 Minuten

---

### QW-17: Fehlender Index für `rent_payments.due_date`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** Häufiger Arrears-Check-Query ohne Index.
- **Fix:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_due
    ON public.rent_payments(tenant_id, due_date) WHERE paid_at IS NULL;
  ```
- **Impact:** 🟠 P1 | PERFORMANCE
- **Zeit:** ~5 Minuten

---

### QW-18: Fehlender Index für `documents.entity_id + module_code`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** DMS-Queries filtern häufig nach entity_id+module_code ohne Composite-Index.
- **Fix:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_documents_entity_module
    ON public.documents(entity_id, module_code);
  ```
- **Impact:** 🟠 P1 | PERFORMANCE
- **Zeit:** ~5 Minuten

---

### QW-19: Fehlender Index für `acq_offers.tenant_id + status`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** Akquise-Manager filtert häufig nach tenant+status ohne Index.
- **Fix:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_acq_offers_tenant_status
    ON public.acq_offers(tenant_id, status);
  ```
- **Impact:** 🟡 P2 | PERFORMANCE
- **Zeit:** ~5 Minuten

---

### QW-20: Interne Analyse-Dokumente aus `public/` entfernen
- **Datei:** `public/AUDIT_*.md`, `public/IST_*.md`, `public/*.txt`
- **Problem:** 15+ interne Analyse-Dokumente liegen in `public/` und sind über das Web erreichbar.
- **Fix:**
  ```bash
  # Dokumente in docs/archive/ verschieben:
  mkdir -p docs/archive/2026-02/
  mv public/AUDIT_*.md docs/archive/2026-02/
  mv public/IST_*.md docs/archive/2026-02/
  mv public/AUDIT_*.txt docs/archive/2026-02/
  # ggf. robots.txt anpassen (bereits vorhanden)
  ```
- **Impact:** 🟡 P2 | SECURITY/HYGIENE
- **Zeit:** ~10 Minuten

---

### QW-21: `as any` für FinanzKategorie Enum ersetzen
- **Datei:** `src/hooks/useFinanzmanagerData.ts` Zeile 39,47,48
- **Problem:** `values.category as any` — keine Typ-Sicherheit für Enum.
- **Fix:**
  ```typescript
  // types/finanzmanager.ts erstellen:
  export type FinanzKategorie = 'einnahmen' | 'ausgaben' | 'investment' | 'vorsorge' | 'other';
  export type ZahlungsIntervall = 'monatlich' | 'quartalsweise' | 'jaehrlich' | 'einmalig';

  // Im Hook:
  category: values.category as FinanzKategorie,
  payment_interval: (values.payment_interval as ZahlungsIntervall) ?? 'monatlich',
  ```
- **Impact:** 🟠 P1 | TYPESCRIPT
- **Zeit:** ~15 Minuten

---

### QW-22: Paginierung für `contacts` in `useAdminResearch`
- **Datei:** `src/hooks/useAdminResearch.ts` Zeile 154,168
- **Problem:** Unbegrenzte Contacts-Queries — potenziell Tausende Rows.
- **Fix:**
  ```typescript
  // Vorher:
  .from('contacts').select('id, name, email, phone, status').eq('status', 'new')

  // Nachher:
  .from('contacts').select('id, name, email, phone, status').eq('status', 'new')
    .limit(200).order('created_at', { ascending: false })
  ```
- **Impact:** 🟠 P1 | PERFORMANCE
- **Zeit:** ~10 Minuten

---

### QW-23: Paginierung für `contacts` in `useAcqContacts`
- **Datei:** `src/hooks/useAcqContacts.ts` Zeile 221,231,243,262
- **Problem:** 4 unbegrenzte Contacts-Queries.
- **Fix:** `.limit(500).order('created_at', { ascending: false })` an alle 4 Queries anhängen.
- **Impact:** 🟠 P1 | PERFORMANCE
- **Zeit:** ~10 Minuten

---

### QW-24: `console.log` Batch-Entfernung aus Prod-Code
- **Datei:** `src/hooks/useDemoSeedEngine.ts` (49x `console.log`)
- **Problem:** 49 Debug-Logs in produktivem Seed-Code.
- **Fix:**
  ```typescript
  // ESLint-Auto-Fix für Debug-Logs:
  // Alle console.log durch bedingte Logs ersetzen:
  if (import.meta.env.DEV) console.log('Seeding:', data);
  // Oder: Logging-Service nutzen
  ```
- **Impact:** 🟡 P2 | HYGIENE
- **Zeit:** ~20 Minuten

---

### QW-25: Deno-Import-Versionen vereinheitlichen (kritischste Funktionen)
- **Datei:** `supabase/functions/sot-social-meta-webhook/index.ts` Zeile 1, `sot-whatsapp-webhook/index.ts` Zeile 2
- **Problem:** `@supabase/supabase-js@2` (vague) → `@2.49.1` (explizit).
- **Fix:**
  ```typescript
  // Vorher:
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  // Nachher:
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
  ```
- **Impact:** 🟡 P2 | HYGIENE
- **Zeit:** ~10 Minuten

---

### QW-26: Fehlender `RLS` auf `finance_mandates`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** Finanzmandate ohne Row Level Security.
- **Fix:**
  ```sql
  ALTER TABLE public.finance_mandates ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON public.finance_mandates
    FOR ALL USING (
      tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
    );
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~10 Minuten

---

### QW-27: Fehlender `RLS` auf `leases`
- **Datei:** `supabase/migrations/` (neue Migration)
- **Problem:** Mietverträge ohne Row Level Security — DSGVO-kritisch.
- **Fix:**
  ```sql
  ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tenant_isolation" ON public.leases
    FOR ALL USING (
      tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
    );
  ```
- **Impact:** 🔴 P0 | SECURITY
- **Zeit:** ~10 Minuten

---

### QW-28: Silent-Fail in `QuickIntakeUploader` beheben
- **Datei:** `src/components/projekte/QuickIntakeUploader.tsx` Zeile 111,208,255,304
- **Problem:** 4x `console.error` ohne User-Feedback.
- **Fix:**
  ```typescript
  // Vorher:
  } catch (err) {
    console.error('Upload error:', err);
  }

  // Nachher:
  } catch (err) {
    console.error('Upload error:', err);
    toast.error('Upload fehlgeschlagen: ' + (err as Error).message);
  }
  ```
- **Impact:** 🟡 P2 | UX
- **Zeit:** ~10 Minuten

---

### QW-29: QueryClient `retry` auf auth-Errors korrektstellen
- **Datei:** `src/App.tsx` Zeile 43–52
- **Problem:** `retry`-Logik prüft `error.status ?? error.code` — bei Supabase-Fehlern ist `code` ein String ('PGRST301').
- **Fix:**
  ```typescript
  retry: (failureCount, error) => {
    const errorWithStatus = error as { status?: number; code?: string | number };
    const status = errorWithStatus?.status;
    const code = String(errorWithStatus?.code ?? '');
    if (status && [401, 403, 404, 422].includes(status)) return false;
    if (['PGRST301', 'PGRST116'].includes(code)) return false;
    return failureCount < 2;
  },
  ```
- **Impact:** 🟡 P2 | REACT
- **Zeit:** ~10 Minuten

---

### QW-30: Auth-Guard für `sot-solar-insights` und `sot-nasa-apod`
- **Datei:** `supabase/functions/sot-solar-insights/index.ts`, `sot-nasa-apod/index.ts`
- **Problem:** Externe API-Proxy ohne Auth — Rate-Limits der externen APIs werden für alle verbraucht.
- **Fix:** Standard Auth-Guard (wie QW-01) in beide Funktionen einfügen.
- **Impact:** 🟡 P2 | SECURITY
- **Zeit:** ~10 Minuten

---

## Zusammenfassung Quick Wins

| Kategorie | Anzahl | Geschätzter Gesamt-Aufwand |
|-----------|--------|-----------------------------|
| 🔴 P0 SECURITY (Auth/RLS/Webhook) | 12 | ~90 Minuten |
| 🟠 P1 (Edge-Fn, DB, Perf, TypeScript) | 8 | ~75 Minuten |
| 🟡 P2 (Hygiene, UX, Performance) | 10 | ~80 Minuten |
| **Gesamt** | **30** | **~245 Minuten (~4h)** |

> 💡 **Empfehlung**: QW-01 bis QW-10 + QW-26 + QW-27 zuerst — alle P0-Security-Fixes.
> Diese 12 Fixes können in einem einzelnen Sprint (halber Tag) erledigt werden.
