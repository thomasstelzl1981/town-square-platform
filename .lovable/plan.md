

# MOD-21 Website Builder — Umsetzungsplan
## Monetarisierbares Website-Hosting-Modul mit Zonenarchitektur

---

## 1. Einordnung ins System

**Modul-Code:** MOD-21 (naechster freier Slot)
**Area:** `services` (neben MOD-14, MOD-15, MOD-05, MOD-16)
**Basis-Pfad Zone 2:** `/portal/website-builder`
**Zone 3 Auslieferung:** `/website/sites/:slug` (ZBC-R08-konform)
**Zone 1 Governance:** `/admin/website-hosting` (neue Admin-Routen)

---

## 2. Architektur-Uebersicht

```text
ZONE 2 (Portal — Kunde)              ZONE 1 (Admin — Governance)
┌──────────────────────────┐         ┌─────────────────────────┐
│ MOD-21 Website Builder   │         │ /admin/website-hosting   │
│                          │         │                         │
│ Tile 1: Websites         │         │ - Vertragsuebersicht    │
│ Tile 2: Design           │         │ - Domain-Freigabe       │
│ Tile 3: SEO              │         │ - Abuse-Monitoring      │
│ Tile 4: Vertrag          │         │ - Suspendierung         │
│                          │         │ - Template-Verwaltung   │
│ Widget: [+Neue Website]  │         └─────────────────────────┘
│ Inline: Editor-Flow      │
│ Preview: Live-Vorschau   │                    │
└──────────┬───────────────┘                    │
           │ publish (nur mit Vertrag)          │
           ▼                                    ▼
      ZONE 3 (Public Delivery)
      /website/sites/:slug
      Stateless Renderer aus published version
```

---

## 3. Datenbank-Schema

### 3a. `tenant_websites`

| Spalte | Typ | Default | Zweck |
|--------|-----|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| tenant_id | uuid FK organizations | NOT NULL | Mandant |
| created_by | uuid FK profiles | NOT NULL | Ersteller |
| name | text | NOT NULL | Website-Name (Firmenname) |
| slug | text | UNIQUE NOT NULL | URL-Slug fuer Subdomain |
| industry | text | NULL | Branche |
| target_audience | text | NULL | Zielgruppe |
| goal | text | 'branding' | leads, branding, sales |
| branding_json | jsonb | '{}' | {primary_color, font, logo_url, favicon_url} |
| seo_json | jsonb | '{}' | {title, description, og_image} |
| status | text | 'draft' | draft, published, suspended |
| published_at | timestamptz | NULL | Letztes Publish-Datum |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

**RLS:** tenant_id = get_user_tenant_id()

### 3b. `website_pages`

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| website_id | uuid FK tenant_websites | NOT NULL |
| tenant_id | uuid FK organizations | NOT NULL |
| slug | text | 'home' |
| title | text | NOT NULL |
| sort_order | int | 0 |
| is_published | bool | false |
| created_at | timestamptz | now() |

**RLS:** tenant_id-scoped. **MVP:** Max 1 Seite (Home). Phase 2: Multi-Page.

### 3c. `website_sections`

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| page_id | uuid FK website_pages | NOT NULL |
| tenant_id | uuid FK organizations | NOT NULL |
| section_type | text | NOT NULL |
| sort_order | int | 0 |
| content_json | jsonb | '{}' |
| design_json | jsonb | '{}' |
| is_visible | bool | true |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

**section_type Enum (MVP — 8 Typen):**
- `hero` — Hauptbanner mit Headline, Subline, CTA, Hintergrundbild
- `features` — 3-4 Feature-Cards mit Icons
- `about` — Ueber-uns Text + Bild
- `services` — Leistungen/Angebote-Liste
- `testimonials` — Kundenstimmen
- `gallery` — Bildergalerie
- `contact` — Kontaktformular (Lead-Capture → Edge Function)
- `footer` — Impressum, Datenschutz, Links

**content_json Beispiel (hero):**
```text
{
  "headline": "Kapitalanlage leicht gemacht",
  "subline": "Ihr Partner fuer renditestarke Immobilien",
  "cta_text": "Jetzt beraten lassen",
  "cta_link": "#contact",
  "background_image_url": "...",
  "overlay_opacity": 0.4
}
```

**RLS:** tenant_id-scoped

### 3d. `website_versions` (Publish-Snapshots)

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| website_id | uuid FK tenant_websites | NOT NULL |
| tenant_id | uuid FK organizations | NOT NULL |
| snapshot_json | jsonb | NOT NULL |
| version_number | int | NOT NULL |
| published_by | uuid FK profiles | NOT NULL |
| published_at | timestamptz | now() |

Beim Publish wird der gesamte Seitenbaum (pages + sections) als JSON-Snapshot gespeichert. Zone 3 liest **nur** aus `website_versions` (latest), niemals direkt aus `website_sections`.

### 3e. `hosting_contracts`

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| tenant_id | uuid FK organizations | NOT NULL |
| website_id | uuid FK tenant_websites | NOT NULL |
| plan | text | 'basic' |
| price_cents | int | 5000 |
| currency | text | 'EUR' |
| status | text | 'pending' |
| stripe_subscription_id | text | NULL |
| stripe_customer_id | text | NULL |
| accepted_terms_at | timestamptz | NULL |
| content_responsibility_confirmed | bool | false |
| cancelled_at | timestamptz | NULL |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

**Status-Machine:**
```text
[pending] --Zahlung--> [active] --Kuendigung--> [cancelled]
                          |
                   [payment_failed] --Retry--> [active]
                          |
                   [suspended] (Admin oder Payment)
```

**RLS:** tenant_id-scoped (SELECT, INSERT, UPDATE). Zone 1 Admin: Service-Role fuer Status-Updates.

### 3f. Realtime

```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_websites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_sections;
```

---

## 4. Edge Functions

### 4a. `sot-website-publish`

- Validiert: hosting_contract.status = 'active'
- Erstellt Snapshot aus aktuellen pages + sections
- Setzt tenant_websites.status = 'published'
- Schreibt Event in data_event_ledger
- Gibt Fehler zurueck wenn kein aktiver Vertrag

### 4b. `sot-website-ai-generate`

- Armstrong-Modus "Website Designer"
- Input: {name, industry, target_audience, goal, page_count}
- Output: Komplette Section-Struktur mit Texten via Lovable AI Gateway (Gemini Flash)
- Schreibt direkt in website_sections
- Kein kostenpflichtiger Schritt ohne User-CTA

### 4c. `sot-website-lead-capture`

- Empfaengt Kontaktformular-Submissions von Zone 3
- Schreibt in `contact_requests` oder `leads` (ZBC-R06 konform: Zone 3 darf nicht direkt in Tenant-Tabellen schreiben)
- Sendet optional Notification an Tenant

### 4d. `sot-website-hosting-webhook`

- Stripe Webhook Handler fuer Hosting-Subscriptions
- Events: `invoice.paid` → active, `invoice.payment_failed` → payment_failed, `customer.subscription.deleted` → cancelled
- Aktualisiert hosting_contracts.status
- Bei Suspendierung: setzt tenant_websites.status = 'suspended'

---

## 5. Frontend-Komponenten

### 5a. Zone 2 — MOD-21 Tiles

**Tile 1: "Websites"** (Default) — Dashboard mit WidgetGrid
- Widget "+Neue Website" → Inline-Flow oeffnet sich darunter
- Widgets fuer bestehende Websites (Name, Status-Badge, Vorschau-Thumbnail)
- Klick auf Widget → Inline-Editor-Flow

**Tile 2: "Design"** — Globale Branding-Einstellungen
- Farbschema, Schriftart, Logo-Upload
- Aenderungen wirken auf alle Sections

**Tile 3: "SEO"** — Meta-Daten, OG-Tags, robots.txt Basics

**Tile 4: "Vertrag"** — Hosting-Vertragsstatus, Rechnungen, Kuendigungsoptionen

### 5b. Inline-Editor-Flow (Kern-UX)

Layout: `react-resizable-panels` — Links Editor (scrollbar), Rechts Live-Preview

**Editor (linke Seite):**
- Vertikaler Section-Stack (drag-and-drop via @dnd-kit)
- Jede Section ist eine ausklappbare Karte
- Section-Toolbar: Verschieben, Duplizieren, Loeschen, Sichtbarkeit
- "+ Section hinzufuegen" Button zwischen Sections
- Section-Type-Auswahl als Dropdown/Cards
- Content-Felder pro Section-Type (Texte, Bilder, Links)

**Preview (rechte Seite):**
- Echtzeit-Rendering der aktuellen Sections
- Desktop/Mobile Toggle
- Kein iframe — direktes React-Rendering der Section-Komponenten

**Publish-Bar (sticky unten):**
- Vertragsstatus-Anzeige
- "Vorschau" Button
- "Veroeffentlichen" Button (disabled ohne aktiven Vertrag)
- Bei fehlendem Vertrag: "Hosting-Vertrag abschliessen" CTA

### 5c. Hosting-Vertragsabschluss (Inline, kein Modal)

Oeffnet sich als Section unter dem Editor wenn Publish ohne Vertrag geklickt wird:
- Leistungsbeschreibung
- Preis (50 EUR/Monat)
- Kuendigungsfrist
- Checkbox: Hostingbedingungen akzeptiert
- Checkbox: Inhalteverantwortung bestaetigt
- CTA: "Kostenpflichtig abonnieren" → Stripe Checkout

### 5d. Section-Renderer (Zone 3)

8 Renderer-Komponenten (shared, da von Zone 2 Preview UND Zone 3 genutzt):
- `SectionHero.tsx`
- `SectionFeatures.tsx`
- `SectionAbout.tsx`
- `SectionServices.tsx`
- `SectionTestimonials.tsx`
- `SectionGallery.tsx`
- `SectionContact.tsx`
- `SectionFooter.tsx`

Diese liegen in `src/shared/website-renderer/` (zone-agnostisch per ZBC-R04).

### 5e. Zone 3 — Public Renderer

Neue Route: `/website/sites/:slug`
- Laedt latest published version aus `website_versions`
- Rendert Sections sequenziell
- Kein Auth erforderlich (public)
- Kontaktformular sendet an `sot-website-lead-capture`
- Zeigt "Website nicht verfuegbar" wenn status = suspended

### 5f. Zone 1 — Admin-Routen

4 neue Routen unter `/admin/website-hosting`:
- Dashboard: Alle Hosting-Vertraege, Umsatz-KPIs
- Domains: Slug-Verwaltung, Freigaben (Phase 2: Custom Domains)
- Abuse: Gemeldete Inhalte, Suspendierungs-Tool
- Templates: Section-Templates verwalten (Phase 2)

---

## 6. Routing-Manifest-Aenderungen

### routesManifest.ts — Zone 2 (neues Modul)

```text
"MOD-21": {
  name: "Website Builder",
  base: "website-builder",
  icon: "Globe",
  display_order: 21,
  visibility: { default: true, org_types: ["client", "partner"] },
  tiles: [
    { path: "websites", component: "WBWebsites", title: "Websites", default: true },
    { path: "design", component: "WBDesign", title: "Design" },
    { path: "seo", component: "WBSeo", title: "SEO" },
    { path: "vertrag", component: "WBVertrag", title: "Vertrag" },
  ],
  dynamic_routes: [
    { path: ":websiteId/editor", component: "WBEditor", title: "Editor", dynamic: true },
  ],
}
```

### routesManifest.ts — Zone 3 (neue Website)

```text
sites: {
  base: "/website/sites",
  layout: "TenantSiteLayout",
  routes: [
    { path: ":slug", component: "TenantSiteRenderer", title: "Website", dynamic: true },
  ],
}
```

### routesManifest.ts — Zone 1 (neue Admin-Routen)

```text
{ path: "website-hosting", component: "WebHostingDashboard", title: "Website Hosting" },
{ path: "website-hosting/domains", component: "WebHostingDomains", title: "Domains" },
{ path: "website-hosting/abuse", component: "WebHostingAbuse", title: "Abuse" },
{ path: "website-hosting/templates", component: "WebHostingTemplates", title: "Templates" },
```

### areaConfig.ts

MOD-21 wird zu `services` Area hinzugefuegt.

---

## 7. Armstrong Integration

Neuer Armstrong-Action-Eintrag in `armstrongManifest.ts`:

```text
{
  id: "WEBSITE_GENERATE",
  label: "Website generieren",
  category: "Website",
  execution_mode: "execute",
  description: "Erstellt eine komplette Website-Struktur mit Texten basierend auf Firmenprofil",
  requires_confirmation: true,
  cost_credits: 1
}
```

Armstrong "Website Designer" Modus:
- Darf: Sections erstellen, Texte anpassen, Design-Parameter aendern
- Darf NICHT: Publish ausloesen, Vertrag abschliessen

---

## 8. Stripe-Integration fuer Hosting-Billing

Bestehende Infrastruktur: `subscriptions` + `invoices` Tabellen mit Stripe-Feldern existieren bereits.

Fuer Hosting-Billing wird `hosting_contracts` als eigenstaendige Tabelle genutzt (nicht die generische `subscriptions`), da:
- Eigene Status-Machine (suspended bei Abuse)
- Vertragsspezifische Felder (content_responsibility_confirmed)
- Klare Zuordnung zu website_id

**Stripe-Flow:**
1. Kunde klickt "Kostenpflichtig abonnieren"
2. Edge Function erstellt Stripe Checkout Session (mode: subscription, price: 5000 cents/month)
3. Nach erfolgreicher Zahlung: Webhook setzt hosting_contracts.status = active
4. Publish wird freigeschaltet

---

## 9. MVP-Scope (Phase 1)

| Feature | Enthalten |
|---------|-----------|
| 1-Seiten-Websites | Ja |
| 8 Section-Typen | Ja |
| Inline-Editor mit Live-Preview | Ja |
| KI-Generierung (Armstrong) | Ja |
| Hosting-Vertrag + Stripe Billing | Ja |
| Subdomain-Auslieferung (/website/sites/:slug) | Ja |
| Versionierung (Snapshots) | Ja |
| Impressum/Datenschutz-Generator | Ja (als Section-Template) |
| Kontaktformular → Lead-Capture | Ja |
| Zone 1 Hosting-Dashboard | Ja |
| Custom Domains | Nein (Phase 2) |
| Multi-Page | Nein (Phase 2) |
| Template-Marketplace | Nein (Phase 2) |
| Analytics | Nein (Phase 2) |

---

## 10. Implementierungs-Reihenfolge

| Schritt | Was | Abhaengigkeit |
|---------|-----|--------------|
| 1 | DB Migration: 5 Tabellen + RLS + Realtime | - |
| 2 | Shared Section-Renderer (8 Komponenten) | - |
| 3 | Edge Function: sot-website-ai-generate | Lovable AI |
| 4 | Edge Function: sot-website-publish | DB |
| 5 | Edge Function: sot-website-lead-capture | DB |
| 6 | Edge Function: sot-website-hosting-webhook | Stripe |
| 7 | Frontend Hooks (useWebsites, useSections, useHostingContract) | DB |
| 8 | Zone 2 UI: MOD-21 Tiles + Inline-Editor | Steps 2+7 |
| 9 | Zone 3: TenantSiteRenderer | Step 2 |
| 10 | Zone 1: Admin Hosting-Dashboard | DB |
| 11 | Stripe Checkout Integration | Stripe aktiviert |
| 12 | Routing-Manifest + Area-Config Updates | - |
| 13 | Armstrong-Manifest Update | - |
| 14 | E2E Test auf 1366x768 | Alles |

---

## 11. Voraussetzungen

- **Stripe:** Muss aktiviert werden (Stripe-Integration im Projekt). Bestehende Stripe-Felder in subscriptions/invoices zeigen, dass Stripe schon vorbereitet ist, aber der Secret Key muss konfiguriert sein.
- **Lovable AI:** Bereits konfiguriert (LOVABLE_API_KEY vorhanden) — fuer Armstrong Website Designer.
- **Storage:** Supabase Storage Bucket fuer Website-Assets (Bilder, Logos) muss angelegt werden.

---

## 12. Akzeptanzkriterien

- Maximal 3 Klicks bis erste fertige Website (Klick "+", Eingaben, "KI generieren")
- Keine horizontale Scrollbar bei 1366x768
- Publish-Button disabled ohne aktiven Hosting-Vertrag
- Hosting-Vertragsabschluss mit Stripe-Zahlung
- Website sofort unter /website/sites/:slug erreichbar nach Publish
- Suspendierung bei Zahlungsausfall deaktiviert Auslieferung
- Armstrong kann komplette Website generieren, aber nicht publishen
- Kontaktformular-Submissions landen als Leads beim Tenant
- Versionierung: Rollback auf vorherige Version moeglich
- Zone 3 liest nur aus published Snapshots, nie aus Draft-Sections

