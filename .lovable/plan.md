
# MOD-10 Lead Manager — Systemanalyse und Umsetzungsplan

## 1. IST-Stand-Analyse

### Was existiert bereits?

**MOD-10 im Manifest (routesManifest.ts, Zeile 375-384):**
- Name: "Provisionen" (base: "provisionen")
- Nur 1 Tile: "Uebersicht" (ProvisionenUebersicht)
- Inhalt: Reine Provisionsabrechnung aus `sale_transactions` — hat nichts mit Lead Management zu tun

**MOD-10 in tile_catalog (DB):**
- tile_code: MOD-10, title: "Provisionen", main_tile_route: /portal/leads
- Aktiv, aber nur 1 Sub-Tile ("Uebersicht")

**LeadsTab in MOD-09 (Vertriebspartner, Zeile 362):**
- Route: `/portal/vertriebspartner/leads`
- Statischer Stub: KPI-Cards (alle 0), Link zu "Selfie Ads Studio"
- Keine echte Datenbankanbindung

**Selfie Ads Studio in MOD-09 (dynamic_routes, Zeile 367-372):**
- 6 Seiten unter `/portal/vertriebspartner/selfie-ads*`
- Funktional: Kampagnen planen (SelfieAdsPlanen), Zusammenfassung (SelfieAdsSummary), Kampagnen-Liste (SelfieAdsKampagnen), Performance, Abrechnung
- Templates sind Kaufy-only (5 Immobilien-Templates)
- Mandate werden via `sot-social-mandate-submit` in `social_mandates` gespeichert
- Leads kommen via `sot-social-meta-webhook` in `social_leads`

**Zone-1 Lead Desk (Admin, Zeile 144-149):**
- 4 Tabs: Pool, Zuweisungen, Provisionen, Monitor
- Separate Governance-Ebene — bleibt unveraendert

**Vorhandene DB-Tabellen (Social-Stack):**
- `social_mandates` — Auftraege (partner_user_id, budget, regions, status, template_slots, publishing_meta)
- `social_campaigns` — Kampagnen (budget_cents, spend_cents, platform_targets, status)
- `social_creatives` — Creatives (mandate_id, template_id, slot_key, caption_text, cta_variant)
- `social_leads` — Leads (mandate_id, campaign_id, partner_user_id, lead_data, source, platform)
- `social_lead_events` — Event-Log (lead_id, event_type, payload)
- `social_templates` — Templates (code, name, format_type, ci_rules, editable_fields_schema)
- `social_metrics` — Metriken (impressions, clicks, likes)

**Vorhandene DB-Tabellen (Alt-Stack, weniger relevant):**
- `ad_campaigns` — Alte Kampagnen-Tabelle (property_id, external_campaign_id)
- `ad_campaign_leads` — Junction (campaign_id, lead_id)

### Bewertung des Vorschlags

Der Vorschlag ist **konzeptionell solide**, aber das vorgeschlagene Datenmodell (ad_brand_assets, ad_templates, etc.) wuerde **Parallelstrukturen** zu den existierenden `social_*` Tabellen erzeugen. Das ist Drift.

**Empfehlung:** Die `social_*` Tabellen sind bereits das richtige Fundament. Sie muessen lediglich um ein `brand_context`-Feld und einige fehlende Felder erweitert werden, statt komplett neue Tabellen anzulegen.

---

## 2. Architekturentscheidungen

### A) MOD-10 wird zum "Lead Manager" (nicht "Provisionen")

Das aktuelle MOD-10 ("Provisionen") zeigt nur Provisionsabrechnungen. Diese Funktion gehoert logisch in die einzelnen Manager-Module (MOD-09, MOD-11, MOD-12) als Sub-Tab "Provisionen". MOD-10 wird zum eigenstaendigen Lead Manager.

### B) Selfie Ads Studio migriert aus MOD-09 nach MOD-10

Die 6 Selfie-Ads-Seiten unter `/portal/vertriebspartner/selfie-ads*` sind funktional Lead-Generierung, nicht Immobilienvermittlung. Sie gehoeren in den Lead Manager.

### C) Wiederverwendung der social_* Tabellen

Keine neuen Tabellen fuer Kampagnen/Leads. Stattdessen Erweiterung:
- `social_mandates` + `brand_context` Spalte (text, default 'kaufy')
- `social_leads` + `status` Spalte (text, default 'new') + `notes` (text)
- `social_templates` + `brand_context` Spalte

### D) Brand Context Assets als Seed-Daten (kein eigener Tabellentyp)

Brand-Assets (Meta Page IDs, Ad Account IDs) werden als Konfiguration in einer neuen `social_brand_assets` Tabelle gespeichert (4 Rows, admin-only).

---

## 3. Neues Datenmodell (Delta zu bestehend)

### Neue Tabelle

```text
social_brand_assets
  id (uuid PK)
  brand_context (text UNIQUE) — 'futureroom' | 'kaufy' | 'lennox_friends' | 'acquiary'
  display_name (text)
  meta_ad_account_id (text)
  meta_page_id (text)
  meta_ig_actor_id (text)
  active (boolean, default true)
  created_at (timestamptz)
```

### Schema-Erweiterungen (ALTER TABLE)

```text
social_mandates:
  + brand_context (text, default 'kaufy')
  + monthly_cap_cents (integer, nullable)

social_leads:
  + lead_status (text, default 'new')  -- 'new','contacted','qualified','converted','lost'
  + notes (text, nullable)
  + brand_context (text, nullable)

social_templates:
  + brand_context (text, default 'kaufy')
```

### Meta-Mapping (ad_meta_mapping aus Vorschlag — sinnvoll als neue Tabelle)

```text
social_meta_mapping
  id (uuid PK)
  mandate_id (uuid FK social_mandates)
  meta_campaign_id (text)
  meta_adset_id (text)
  meta_creative_id (text)
  meta_ad_id (text)
  meta_form_id (text)
  meta_page_id (text)
  last_sync_at (timestamptz)
```

### Budget-Guardrails

```text
social_budget_caps
  id (uuid PK)
  manager_user_id (uuid, NOT NULL)
  tenant_id (uuid, NOT NULL)
  monthly_cap_cents (integer)
  spend_month_to_date_cents (integer, default 0)
  last_synced_at (timestamptz)
```

---

## 4. Routing und Manifest

### routesManifest.ts — MOD-10 Redesign

```text
"MOD-10": {
  name: "Lead Manager",
  base: "lead-manager",
  icon: "Megaphone",
  display_order: 10,
  visibility: { default: false, org_types: ["partner"], requires_activation: true },
  tiles: [
    { path: "uebersicht", component: "LeadManagerUebersicht", title: "Uebersicht", default: true },
    { path: "kampagnen", component: "LeadManagerKampagnen", title: "Kampagnen" },
    { path: "studio", component: "LeadManagerStudio", title: "Studio" },
    { path: "leads", component: "LeadManagerLeads", title: "Leads" },
  ],
  dynamic_routes: [
    { path: "kampagnen/:mandateId", component: "LeadManagerKampagneDetail", title: "Kampagne Detail", dynamic: true },
    { path: "studio/planen", component: "LeadManagerStudioPlanen", title: "Kampagne planen" },
    { path: "studio/summary", component: "LeadManagerStudioSummary", title: "Zusammenfassung" },
  ],
}
```

### tile_catalog Update (SQL)

```text
UPDATE tile_catalog 
SET title = 'Lead Manager',
    main_tile_route = '/portal/lead-manager',
    sub_tiles = '[
      {"title": "Uebersicht", "route": "/portal/lead-manager/uebersicht"},
      {"title": "Kampagnen", "route": "/portal/lead-manager/kampagnen"},
      {"title": "Studio", "route": "/portal/lead-manager/studio"},
      {"title": "Leads", "route": "/portal/lead-manager/leads"}
    ]'::jsonb,
    icon_key = 'Megaphone'
WHERE tile_code = 'MOD-10';
```

### MOD-09 Bereinigung

- LeadsTab und alle SelfieAds* Seiten aus MOD-09 entfernen
- Tile "Leadeingang" aus MOD-09 tiles Array entfernen
- dynamic_routes fuer selfie-ads* aus MOD-09 entfernen

---

## 5. UI-Screens (Inline-Flow, 4 Tabs)

### Tab 1: Uebersicht
- KPI-Cards: Gesamtausgaben (Spend), Leads generiert, CPL (Cost per Lead), Aktive Kampagnen
- Brand-Filter (FutureRoom/Kaufy/Lennox/Acquiary)
- Letzte 5 Leads (Kompakt-Liste)
- CTA: "Neue Kampagne" -> oeffnet Studio/Planen

### Tab 2: Kampagnen
- Liste aller `social_mandates` des Managers (gefiltert auf partner_user_id)
- Pro Kachel: Brand-Badge, Status, Budget, Laufzeit, Lead-Count
- Klick: Inline-Detail (Setup-Snapshot, Performance-KPIs, Leads dieser Kampagne)
- Actions: Pause/Resume/Stop (Status-Updates auf social_mandates + social_campaigns)

### Tab 3: Studio
- Brand-Switch (4 Brands als Kacheln)
- Template-Katalog (aus social_templates, gefiltert nach brand_context)
- "Kampagne planen" Button -> Inline-Flow (Migration von SelfieAdsPlanen)
- Template-Preview mit Slot-Regeln

### Tab 4: Leads
- Liste aus `social_leads` WHERE partner_user_id = currentUser
- Filter: Brand, Kampagne, Status (new/contacted/qualified/converted/lost)
- Lead-Detail inline: Kontaktdaten (aus lead_data), Notizen-Feld, Status-Dropdown
- Export-Button (optional, CSV)

---

## 6. Edge Functions

### Bestehende (anzupassen)

**sot-social-mandate-submit:**
- Neues Feld `brand_context` im Body akzeptieren
- Validierung: brand_context muss in social_brand_assets existieren
- Budget-Check gegen social_budget_caps

**sot-social-meta-webhook:**
- Lead-Zuordnung: meta_form_id -> social_meta_mapping -> mandate_id -> partner_user_id
- brand_context aus Mandate uebernehmen
- lead_status default 'new' setzen

### Neue Edge Functions

**sot-social-campaign-publish:**
- Nimmt mandate_id, erstellt Meta Campaign + AdSet + Ad via Marketing API
- Speichert Mapping in social_meta_mapping
- Setzt mandate.status = 'live'
- Erfordert: META_ACCESS_TOKEN Secret (System User Token)

**sot-social-campaign-control:**
- Actions: pause, resume, stop
- Aktualisiert Meta Campaign Status via API
- Aktualisiert social_mandates.status + social_campaigns.status

**sot-social-lead-detail:**
- Holt Lead-Details von Meta Leadgen API (nach webhook nur IDs)
- Speichert vollstaendige lead_data in social_leads

### Secrets (erforderlich fuer Meta-Integration)

- META_ACCESS_TOKEN — System User Token (langlebig, server-to-server)
- META_APP_SECRET — Fuer Webhook Signature Verification
- META_VERIFY_TOKEN — Bereits vorhanden

---

## 7. Zu aendernde Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration SQL | social_brand_assets + social_meta_mapping + social_budget_caps + ALTER social_mandates/leads/templates |
| tile_catalog UPDATE | MOD-10 umbenennen + Routen |
| src/manifests/routesManifest.ts | MOD-10 komplett neu, MOD-09 bereinigen |
| src/pages/portal/LeadsPage.tsx | Umbauen zu LeadManagerPage mit 4-Tile Router |
| src/pages/portal/lead-manager/LeadManagerUebersicht.tsx | Neu: KPIs + letzte Leads |
| src/pages/portal/lead-manager/LeadManagerKampagnen.tsx | Neu: Kampagnen-Liste + Inline-Detail |
| src/pages/portal/lead-manager/LeadManagerStudio.tsx | Migration aus SelfieAdsStudio + Brand-Switch |
| src/pages/portal/lead-manager/LeadManagerStudioPlanen.tsx | Migration aus SelfieAdsPlanen + brand_context |
| src/pages/portal/lead-manager/LeadManagerStudioSummary.tsx | Migration aus SelfieAdsSummary |
| src/pages/portal/lead-manager/LeadManagerLeads.tsx | Neu: Lead-Liste + Detail + Status + Notizen |
| src/router/ManifestRouter.tsx | componentMap erweitern |
| src/pages/portal/VertriebspartnerPage.tsx | LeadsTab + SelfieAds Routes entfernen |
| supabase/functions/sot-social-mandate-submit/index.ts | brand_context + Budget-Check |
| supabase/functions/sot-social-meta-webhook/index.ts | Robusteres Mapping via social_meta_mapping |
| supabase/functions/sot-social-campaign-publish/index.ts | Neu |
| supabase/functions/sot-social-campaign-control/index.ts | Neu |

---

## 8. Was NICHT veraendert wird

- Zone-1 Lead Desk (Admin) — bleibt komplett unveraendert
- Zone-3 Lead Capture Flow (leads Tabelle, lead_assignments) — komplett getrennt
- Bestehende Provisionslogik (sale_transactions, commissions) — wird in die Manager-Module verschoben (separater Task)
- sot-lead-capture Edge Function — unveraendert

---

## 9. Umsetzungsreihenfolge

1. **DB-Migration:** Neue Tabellen + ALTER Statements + RLS + tile_catalog UPDATE
2. **Manifest + Router:** routesManifest.ts + ManifestRouter.tsx + LeadManagerPage Router
3. **Tab 1 (Uebersicht):** KPIs aus social_mandates/social_leads aggregieren
4. **Tab 3 (Studio):** Migration SelfieAds -> Lead Manager mit Brand-Switch
5. **Tab 2 (Kampagnen):** Mandats-Liste + Inline-Detail
6. **Tab 4 (Leads):** Lead-Liste mit Status-Management
7. **MOD-09 Bereinigung:** LeadsTab + SelfieAds Routen entfernen
8. **Edge Functions:** sot-social-campaign-publish + sot-social-campaign-control (erfordert META_ACCESS_TOKEN)
