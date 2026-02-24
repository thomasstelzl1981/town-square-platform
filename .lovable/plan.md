

# Plan: Zone 1 Brand-Templates — Post-Erstellung mit Social-Media-Vorschau

## Ueberblick

Der Tab "Brand-Templates" in Zone 1 wird vom reinen Read-Only-Monitor zu einem vollstaendigen **Post-Erstellungs- und Verwaltungstool** umgebaut. Admins erstellen hier Social-Media-Posts fuer Kaufy, FutureRoom und Acquiary, die dann in Zone 2 von Partnern gebucht werden koennen.

## Architektur-Entscheidung

Die `social_templates`-Tabelle ist bereits die SSOT. Sie hat `image_url`, `editable_fields_schema` (caption + cta), `brand_context`, `code`, `active`. Allerdings fehlt:
- Unterstuetzung fuer **mehrere Bilder** (1-4 pro Post)
- **Zielgruppen-Presets** und **Kampagnen-Optionen** die Zone 1 pro Template vordefiniert
- Visuelle Darstellung als **echter Social-Media-Post**

## Was sich aendert

### 1. Datenbank-Migration: `social_templates` erweitern

Neue Spalten:

```text
image_urls          jsonb    DEFAULT '[]'    -- Array von bis zu 4 Bild-URLs (Storage)
target_audience     jsonb    DEFAULT '{}'    -- Vordefinierte Zielgruppe
                                             -- { age_min, age_max, genders, interests[], geo_regions[] }
campaign_defaults   jsonb    DEFAULT '{}'    -- Vorgegebene Kampagnen-Parameter
                                             -- { min_budget_cents, suggested_budget_cents,
                                             --   suggested_duration_days, rhythm, credit_cost }
approved            boolean  DEFAULT false   -- Freigabe-Status fuer Zone 2
approved_at         timestamptz             -- Zeitpunkt der Freigabe
approved_by         uuid                    -- Admin der freigegeben hat
```

Die bestehende `image_url` (Text, einzelnes Bild) bleibt fuer Abwaertskompatibilitaet. `image_urls` (JSONB-Array) wird die neue Hauptquelle.

### 2. Storage-Bucket fuer Template-Bilder

Neuer Pfad im bestehenden `tenant-documents` Bucket:
`platform/brand-templates/{brand_context}/{template_id}/{filename}`

Kein tenant_id-Prefix, weil dies plattformweite Assets sind (Zone 1).

### 3. LeadBrandTemplates.tsx — Kompletter Umbau

**Statt** einer Tabelle mit Code/Name/Format/Tenants wird jetzt:

```text
┌──────────────────────────────────────────────────────────────────┐
│  Brand-Templates                                                 │
│  [Kaufy] [FutureRoom] [Acquiary]  ← Brand-Filter-Tabs           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── Post-Karte (Social-Media-Optik) ───────────────────────┐  │
│  │ ┌────────────────────────────────┐  Kaufy · KAU-RENDITE   │  │
│  │ │                                │                         │  │
│  │ │   Bild 1 (4:5 Format)         │  Bis zu 5,2% Miet-     │  │
│  │ │   1080 x 1350px               │  rendite — Kapital-     │  │
│  │ │                                │  anlagen in Toplagen    │  │
│  │ │   [+] weitere Bilder (2-4)    │                         │  │
│  │ │                                │  CTA: Jetzt entdecken  │  │
│  │ └────────────────────────────────┘                         │  │
│  │                                                            │  │
│  │  ── Zielgruppe & Kampagnen-Optionen ───────────────────── │  │
│  │  Alter: 25-55  Geschlecht: Alle  Regionen: DACH           │  │
│  │  Min-Budget: 500 EUR  Vorgeschlagen: 2.500 EUR             │  │
│  │  Laufzeit: 14 Tage  Credits: 10 Cr                        │  │
│  │                                                            │  │
│  │  Status: [Entwurf] / [Freigegeben fuer Zone 2]            │  │
│  │  [Bearbeiten]  [Freigeben]  [Deaktivieren]                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─── Naechster Post ──────────────────────────────────────┐    │
│  │ ...                                                      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [+ Neuen Post erstellen]  ← Inline-Formular (kein Dialog!)    │
└──────────────────────────────────────────────────────────────────┘
```

**Jeder Post sieht aus wie ein echter Social-Media-Post:**
- Linke Seite: Bild im 4:5-Format (oder Slideshow-Dots fuer mehrere Bilder)
- Rechte Seite: Caption-Text, CTA-Button-Vorschau, Beschreibung
- Unterhalb: Targeting-Parameter und Kampagnen-Defaults
- Footer: Status-Badge + Actions

**Neuen Post erstellen (Inline-Formular, immer sichtbar):**

```text
┌─── Neuen Post erstellen ─────────────────────────────────────────┐
│                                                                   │
│  Marke: [Kaufy ▼]    Code: [___________]    Name: [___________]  │
│                                                                   │
│  ┌─── Bilder (1-4) ──────────────────────────────────────────┐   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                  │   │
│  │  │ Bild │  │ Bild │  │  +   │  │      │                  │   │
│  │  │  1   │  │  2   │  │      │  │      │                  │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                  │   │
│  │  4:5 Format · 1080x1350px · JPG/PNG/WebP                 │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Anzeigentext: [_____________________________________________]   │
│  Call-to-Action: [___________________]                            │
│  Beschreibung:  [_____________________________________________]   │
│                                                                   │
│  ── Zielgruppe (Voreinstellung fuer Partner) ──                  │
│  Alter: [25] – [55]   Geschlecht: [Alle ▼]                      │
│  Regionen: [DACH ▼ / Multiselect]                                │
│  Interessen: [Immobilien, Kapitalanlage, ...]                    │
│                                                                   │
│  ── Kampagnen-Defaults ──                                        │
│  Min-Budget: [500] EUR    Vorgeschlagen: [2500] EUR              │
│  Laufzeit: [14] Tage      Credit-Kosten: [10] Credits            │
│                                                                   │
│  [Post speichern (Entwurf)]   [Speichern & Freigeben]            │
└───────────────────────────────────────────────────────────────────┘
```

### 4. Meta Marketing API — Durchgedachte Felder

Basierend auf der Meta Marketing API (Campaign → Ad Set → Ad Creative) werden folgende Felder benoetigt:

**Auf Template-Ebene (Zone 1 definiert):**

| Feld | Meta-API-Mapping | Beschreibung |
|------|-----------------|--------------|
| `image_urls` (1-4) | `object_story_spec.link_data.picture` / Carousel `child_attachments` | Bilder im 4:5-Format |
| `caption_text` | `object_story_spec.link_data.message` | Primaertext des Posts |
| `cta_variant` | `call_to_action.type` (LEARN_MORE, SIGN_UP, GET_QUOTE, CONTACT_US) | CTA-Button-Typ |
| `description` | `object_story_spec.link_data.description` | Beschreibungstext |

**Auf Zielgruppen-Ebene (Zone 1 vor-definiert, Zone 2 uebernimmt/passt an):**

| Feld | Meta-API-Mapping | Beschreibung |
|------|-----------------|--------------|
| `age_min` | `targeting.age_min` | Min. Alter (18-65) |
| `age_max` | `targeting.age_max` | Max. Alter (18-65) |
| `genders` | `targeting.genders` | 0=Alle, 1=M, 2=W |
| `geo_regions` | `targeting.geo_locations.regions` | Regionen (z.B. Bayern, NRW) |
| `interests` | `targeting.flexible_spec[].interests` | Interessen-Keywords |

**Auf Kampagnen-Ebene (Zone 1 gibt Defaults vor, Zone 2 waehlt bei Buchung):**

| Feld | Meta-API-Mapping | Beschreibung |
|------|-----------------|--------------|
| `min_budget_cents` | `daily_budget` (Minimum) | Mindestbudget |
| `suggested_budget_cents` | `daily_budget` (Vorschlag) | Empfohlenes Budget |
| `suggested_duration_days` | `end_time - start_time` | Vorgeschlagene Laufzeit |
| `rhythm` | Scheduling-Logik | daily / weekly / burst |
| `credit_cost` | Plattform-intern | Credits fuer diese Buchung |

### 5. Buchungs-Flow in Zone 2 (bestehend, wird angepasst)

Der 5-Schritt-Wizard in `LeadManagerKampagnen.tsx` zeigt bei Schritt 2 bereits Templates aus `social_templates`. Aenderung:
- Nur Templates mit `approved = true` werden in Zone 2 angezeigt
- Targeting-Defaults werden aus dem Template uebernommen (Partner kann ueberschreiben)
- Budget-Minimum wird aus `campaign_defaults.min_budget_cents` enforced
- Credit-Kosten werden angezeigt

**Keine strukturelle Aenderung an Zone 2** — nur ein zusaetzlicher Filter (`approved = true`) und Anzeige der Defaults.

### 6. Billing-Integration

Der Buchungsflow benoetigt:
1. **Credit-Preflight**: Vor Buchung prueft `sot-credit-preflight`, ob genug Credits vorhanden
2. **Credit-Debit**: Bei `status: submitted` werden Credits abgebucht
3. **Credit-Refund**: Bei `status: stopped` vor Veroeffentlichung werden Credits erstattet

Die Edge Function `sot-social-mandate-submit` wird erweitert um Credit-Preflight-Check.

## Datei-Aenderungen

### Neue Dateien
- `src/pages/admin/lead-desk/LeadBrandTemplates.tsx` — Komplett-Neuschreibung (ersetzt bestehende Read-Only-Version)
- `src/pages/admin/lead-desk/BrandPostCard.tsx` — Social-Media-Post-Karte (Vorschau wie echt)
- `src/pages/admin/lead-desk/BrandPostCreator.tsx` — Inline-Erstellungsformular

### Geaenderte Dateien
- `supabase/functions/sot-social-mandate-submit/index.ts` — Credit-Preflight hinzufuegen, `approved`-Check
- `src/pages/portal/lead-manager/LeadManagerKampagnen.tsx` — Filter `approved = true`, Defaults anzeigen (minimale Aenderung, Zone 2 Struktur bleibt)

### Datenbank-Migration
- `social_templates`: 6 neue Spalten (image_urls, target_audience, campaign_defaults, approved, approved_at, approved_by)

## Was NICHT geaendert wird

- `LeadManagerBrand.tsx` (Zone 2) — keine Aenderung
- `LeadManagerProjekte.tsx` (Zone 2) — keine Aenderung
- `TemplateCard.tsx` — bleibt fuer Zone 2 erhalten
- `templateImages.ts` — bleibt fuer Abwaertskompatibilitaet
- Tab 1 (Website Leads) und Tab 2 (Kampagnen) — keine Aenderung

## Technische Details

### Bild-Upload-Flow

1. Admin waehlt Bilder (1-4, JPG/PNG/WebP, max 5MB)
2. Upload via `useUniversalUpload` in Storage: `platform/brand-templates/{brand}/{template_id}/{filename}`
3. Oeffentliche URL wird in `image_urls`-Array gespeichert
4. Vorschau zeigt erstes Bild gross im 4:5-Format, weitere als Thumbnails/Dots

### Freigabe-Workflow

```text
Entwurf (approved=false) → Admin klickt "Freigeben" → approved=true
                                                      → approved_at = now()
                                                      → approved_by = admin_user_id
                         → In Zone 2 sichtbar bei Kampagnen-Buchung

Admin klickt "Zurueckziehen" → approved=false
                              → In Zone 2 nicht mehr buchbar
                              → Bestehende Mandates bleiben unveraendert
```

### Credit-Kalkulation

Jedes Template definiert `credit_cost` in `campaign_defaults`. Beispiel:
- Standard-Post (1 Bild): 5 Credits (1,25 EUR)
- Carousel-Post (2-4 Bilder): 10 Credits (2,50 EUR)
- Premium-Kampagne (mit AI-Targeting): 20 Credits (5,00 EUR)

Credits werden bei Mandate-Submit via `sot-credit-preflight` geprueft und abgebucht.

