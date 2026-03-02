

# Billing System — Strukturplan

## Ist-Zustand (Was bereits existiert)

### Backend (solide Basis vorhanden)

| Komponente | Status | Details |
|---|---|---|
| `tenant_credit_balance` | DB-Tabelle | balance_credits, reserved, lifetime_purchased, lifetime_consumed |
| `credit_ledger` | DB-Tabelle | tenant_id, user_id, kind (credit/debit), amount, ref_type, ref_id |
| `armstrong_billing_events` | DB-Tabelle | action_code, org_id, cost_model, cost_cents, credits_charged |
| `billing_usage` | DB-Tabelle | Detailliertes Usage-Tracking (storage_bytes, document_count, extraction_pages, AI calls/tokens) |
| `rpc_credit_preflight` | DB-Funktion | Prueft Guthaben, lazy-provisioning mit 100 Free Credits |
| `rpc_credit_deduct` | DB-Funktion | Zieht Credits ab, loggt in credit_ledger |
| `rpc_credit_topup` | DB-Funktion | Laedt Credits auf, loggt in credit_ledger |
| `sot-credit-preflight` | Edge Function | REST-API fuer Balance/Preflight/Deduct/Topup |
| `sot-credit-checkout` | Edge Function | Stripe Checkout Session fuer Credit-Pakete |
| `sot-credit-webhook` | Edge Function | Stripe Webhook, ruft rpc_credit_topup auf |
| `billingConstants.ts` | Config SSOT | 12 System-Preise, 3 Credit-Pakete, 1 Cr = 0,25 EUR |

### Edge Functions die bereits Credits abziehen

| Edge Function | Credits | Service |
|---|---|---|
| `sot-inbound-receive` | 1 | PDF-Extraktion Posteingang |
| `sot-storage-extract` | 1 | Storage-Dokument-Extraktion |
| `sot-nk-beleg-parse` | 1 | NK-Beleg-Parsing |
| `sot-invoice-parse` | 1 | Rechnungs-Parsing |
| `sot-weg-abrechnung-parse` | 2 | WEG-Abrechnung-Parsing |
| `sot-finance-prepare` | 2 | Finanzierungs-Paketaufbereitung |
| `sot-contact-enrichment` | 1 | Kontakt-Anreicherung |
| `sot-ki-browser` | variabel | KI-Browser (Research, Extraction) |

### UI (Zone 2 — Nutzer)

| Komponente | Wo | Was |
|---|---|---|
| `AbrechnungTab` | /portal/stammdaten | Plan, Credit-Saldo, Rechnungsliste, TopUp-Button |
| `CreditTopUpDialog` | Shared | 3 Pakete (50/100/500 Credits), Stripe Checkout |
| `KostenDashboard` | /portal/communication-pro | Armstrong-Verbrauch, TopUp-Button |

### UI (Zone 1 — Admin)

| Seite | Wo | Was |
|---|---|---|
| `ArmstrongBilling` | /admin/armstrong/billing | Billing Events, Credits pro Tenant, Tagesansicht |
| `PlatformCostMonitor` | /admin/armstrong/costs | Echte API-Kosten vs. Credit-Erloese, Margen-Analyse, Credit-Kalkulator |

---

## Was fehlt fuer Produktionsreife

### 1. Zone 2: Verbrauchshistorie fehlt komplett

Der Nutzer sieht aktuell nur seinen **Saldo** (eine Zahl). Er sieht NICHT:
- Wofuer Credits verbraucht wurden (welche Aktion, wann)
- Wie viel er diesen Monat verbraucht hat vs. letzten Monat
- Welche Module am meisten kosten

**Fix:** Neue Sektion in `AbrechnungTab` — "Verbrauchshistorie" mit Daten aus `credit_ledger`. Gruppiert nach Kategorie, mit Monats-Vergleich und Einzelposten-Liste.

### 2. Fehlende Credit-Deduktion in aktiven Edge Functions

Mehrere Edge Functions verursachen Kosten, ziehen aber noch keine Credits ab:

| Edge Function | Kosten-Typ | Fehlendes Credit-Deduct |
|---|---|---|
| `sot-mail-ai-assist` | LLM-Kosten | Zeigt 402 bei "Credits aufgebraucht", ruft aber kein `rpc_credit_deduct` auf |
| `sot-content-engine` | LLM-Kosten | Gleicher Fall — 402-Response, aber kein Deduct |
| `sot-tenancy-lifecycle` | LLM-Kosten (AI Summary) | Kein Credit-Check/Deduct |
| `sot-discovery-scheduler` | LLM + API | Ruft sot-credit-preflight per HTTP, aber unklar ob Deduct erfolgt |

### 3. billingConstants.ts ist unvollstaendig

Aktuelle 12 Eintraege decken nicht alle abrechnungsfaehigen Services ab. Fehlend:

| Service | Kostentreiber | Vorschlag |
|---|---|---|
| KI-Mail-Assistent (Ausformulieren, Verbessern) | LLM-Tokens | 1 Credit/Aufruf |
| KI-Zusammenfassung (TLC) | LLM-Tokens | 1 Credit/Aufruf |
| WEG-Abrechnung-Parsing | LLM-Tokens | 2 Credits (bereits in Edge Fn, aber nicht in Constants) |
| Finanzierungs-Paket | LLM-Tokens | 2 Credits (bereits in Edge Fn, aber nicht in Constants) |
| KI-Browser/Research | LLM + Scraping | 2-5 Credits/Aufruf |
| Content-Engine (Social Posts) | LLM-Tokens | 2 Credits/Aufruf |
| Discovery Scheduler | LLM + API | 1 Credit/Run |

### 4. Kein Verbrauchs-Widget im Dashboard

Der Nutzer hat kein schnelles Signal ueber seinen Credit-Stand im Dashboard (MOD-00). Ein kleines Widget "Guthaben: 47 Credits" mit Trend-Indikator waere wichtig.

### 5. Kein Low-Balance-Warning

Wenn Credits unter einen Schwellwert fallen (z.B. < 10), gibt es keine Warnung. Der Nutzer bemerkt es erst, wenn eine Aktion fehlschlaegt.

---

## Implementierungsplan

### Schritt 1: billingConstants.ts vervollstaendigen
- Alle Edge Functions mit Credit-Deduktion in SYSTEM_PRICES aufnehmen
- Neue Kategorie `ai` hinzufuegen fuer LLM-basierte Services
- Mapping-Funktion `getServicePrice(action_code)` hinzufuegen

### Schritt 2: Verbrauchshistorie in AbrechnungTab
- Neue Sektion: `credit_ledger` Daten laden (letzte 30 Tage)
- Gruppierung nach ref_type (= Service-Kategorie)
- Monats-Balken (diesen Monat vs. letzten Monat)
- Einzelposten-Tabelle mit Datum, Service, Credits, User

### Schritt 3: Credit-Balance-Widget fuer Dashboard
- Kompaktes Widget: Saldo + Trend (letzte 7 Tage Verbrauch) + TopUp-Link
- Registrierung in `systemWidgets.ts`

### Schritt 4: Low-Balance-Warning
- In `sot-credit-preflight` bei balance < 10: Feld `low_balance_warning: true` zurueckgeben
- Im Frontend: Toast/Banner wenn low_balance erkannt wird
- Optional: E-Mail-Benachrichtigung via Edge Function

### Schritt 5: Fehlende Credit-Deduktionen nachrüsten
- `sot-mail-ai-assist`: Credit-Preflight + Deduct (1 Credit)
- `sot-content-engine`: Credit-Preflight + Deduct (2 Credits)
- `sot-tenancy-lifecycle` (AI Summary): Credit-Preflight + Deduct (1 Credit)

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/config/billingConstants.ts` | Neue Services + Kategorie 'ai' |
| `src/pages/portal/stammdaten/AbrechnungTab.tsx` | Verbrauchshistorie-Sektion |
| `src/components/dashboard/widgets/CreditBalanceWidget.tsx` | NEU |
| `src/config/systemWidgets.ts` | Widget registrieren |
| `supabase/functions/sot-mail-ai-assist/index.ts` | Credit-Deduktion |
| `supabase/functions/sot-content-engine/index.ts` | Credit-Deduktion |
| `supabase/functions/sot-tenancy-lifecycle/index.ts` | Credit-Deduktion |

### Kostenlose vs. kostenpflichtige Services (Gesamtuebersicht)

**Kostenlos (0 Credits):**
- Dashboard laden, Module oeffnen, Navigation
- Stammdaten bearbeiten (Profil, Kontakte manuell)
- Immobilien-Verwaltung (CRUD, Zaehlerstaende, Leases)
- Dokumente hochladen + manuell verwalten
- Armstrong Chat (einfache Fragen, KB-Suche)
- Mietvertragsgenerator (Template-basiert, kein LLM)
- Rechner (Finanzierung, NK, Vorsorge — Engine-basiert, kein API-Call)

**Kostenpflichtig (Credits):**
- KI-Dokumentenauslesung (PDF, Rechnung, NK-Beleg): 1-2 Cr
- KI-Mail-Assistent (Ausformulieren, Verbessern): 1 Cr
- KI-Zusammenfassung (TLC, Berichte): 1 Cr
- KI-Browser/Research: 2-5 Cr
- Content-Engine (Social Posts): 2 Cr
- Kontakt-Anreicherung: 1 Cr
- Bank-Sync (finAPI): 4 Cr
- Brief/Fax-Versand: 4 Cr
- KI-Telefonat: 2 Cr/Min + 15 Cr/Monat Grundgebuehr
- Finanzierungspaket-Aufbereitung: 2 Cr
- Storage Pro (10 GB): Festpreis 9,90 EUR/Monat

