

# Plan: Zone 1 Lead Desk korrekt mit Zone 2 Lead Manager verschaltet

## Ausgangslage

### Zone 2 Lead Manager (MOD-10) — BLEIBT UNVERAENDERT

Die bestehende 5-Tile-Struktur funktioniert und wird nicht angefasst:

```text
/portal/lead-manager/
  ├── kampagnen     ← Kampagnen buchen (5-Schritt-Wizard), Leads einsehen
  ├── kaufy         ← Brand-Templates bearbeiten (Kaufy)
  ├── futureroom    ← Brand-Templates bearbeiten (FutureRoom)
  ├── acquiary      ← Brand-Templates bearbeiten (Acquiary)
  └── projekte      ← Projekt-Templates (MOD-13 Projekte)
```

### Zone 1 Lead Desk — MUSS KORRIGIERT WERDEN

Aktuell hat Zone 1 zwei Tabs: "Website Leads" und "Kampagnen Leads". Der Kampagnen-Tab liest die falsche Tabelle (`ad_campaigns` statt `social_mandates`) und es fehlt die Admin-Sicht auf Brand-Templates.

## Gewuenschter Datenfluss

```text
Zone 1 (Admin/Backbone)                Zone 2 (Partner/Manager)
┌────────────────────────┐              ┌──────────────────────────┐
│ Brand-Templates         │──stellt──▶  │ Brand-Tabs (kaufy/fr/acq)│
│ (social_templates)      │  bereit     │ Partner personalisiert   │
│ Admin verwaltet Master  │              │ eigene Kopien            │
└────────────────────────┘              └──────────────────────────┘
                                                    │
                                                    ▼
                                        ┌──────────────────────────┐
                                        │ Kampagne buchen          │
                                        │ (social_mandates)        │
                                        │ → Status: "submitted"    │
                                        └──────────┬───────────────┘
                                                   │
                                                   ▼
┌────────────────────────┐              ┌──────────────────────────┐
│ Kampagnen-Uebersicht    │◀─────────── │ Buchung landet in Z1     │
│ (social_mandates)       │             │ Admin prueft/publiziert   │
│ Alle Mandates aller     │             │ (spaeterer Schritt)      │
│ Partner sichtbar        │             └──────────────────────────┘
└────────────────────────┘
         │ Veroeffentlichung (spaeter)
         ▼
┌────────────────────────┐              ┌──────────────────────────┐
│ Generierte Leads        │──────────▶  │ "Meine Leads" in Z2     │
│ (social_leads)          │ automatisch │ Partner sieht eigene     │
│ Dokumentation in Z1     │             │ Leads sofort             │
└────────────────────────┘              └──────────────────────────┘
```

## Zone 1 Lead Desk: Neue 3-Tab-Struktur

```text
┌──────────────────────────────────────────────────────────────────┐
│  Lead Desk                                                       │
│  "Website-Leads (Zone 3) · Kampagnen · Brand-Templates"         │
├──────────────────┬──────────────────┬────────────────────────────┤
│  Website Leads   │  Kampagnen       │  Brand-Templates           │
│  (Default)       │                  │                            │
└──────────────────┴──────────────────┴────────────────────────────┘
```

### Tab 1: Website Leads (Zone 3) — KEINE AENDERUNG

Bleibt wie bisher: KPIs + Lead Pool + Create/Assign-Dialoge fuer Leads aus Website-Formularen.

### Tab 2: Kampagnen (social_mandates) — KORREKTUR

**Problem:** Liest aktuell `ad_campaigns`. Muss `social_mandates` lesen — das ist die Tabelle, in die Zone 2 schreibt.

**Inhalt:**
- KPI-Leiste: Mandates gesamt, Aktiv/Eingereicht, Generierte Leads (social_leads), Gesamtbudget
- Tabelle: Alle `social_mandates` (aller Partner), mit Brand-Context, Status, Budget, Partner-Name, Erstellungsdatum
- Pro Mandate: Anzahl generierter `social_leads`
- Info-Badge: "Veroeffentlichung wird in einem spaeteren Schritt implementiert"

### Tab 3: Brand-Templates (NEU)

Zone 1 verwaltet die Master-Templates, die den Partnern in Zone 2 zur Verfuegung stehen.

**Inhalt:**
- 3 Brand-Sektionen: Kaufy, FutureRoom, Acquiary
- Pro Brand: Liste der `social_templates` (alle Tenants zusammen, Admin-Sicht)
- Read-Only-Uebersicht: Code, Name, Brand, Anzahl Tenants die sie nutzen, Aktiv-Status
- Info-Badge: "Templates werden per Lazy-Seeding beim ersten Zugriff eines Partners erstellt"

## Datei-Aenderungen

### 1. LeadDesk.tsx — 3 Tabs statt 2

- Neuen Tab "Brand-Templates" hinzufuegen (Pfad: `templates`)
- Lazy-Import fuer neue Komponente
- Subtitle anpassen

### 2. LeadKampagnenDesk.tsx — KOMPLETT UEBERARBEITEN

Aktuell liest `ad_campaigns` + `ad_campaign_leads` — das sind die falschen Tabellen.

Neu:
- Liest `social_mandates` (alle, ohne tenant/user-Filter — Admin sieht alles)
- Zaehlt `social_leads` pro Mandate
- Zeigt Partner-Name (`partner_display_name`), Brand-Context, Status, Budget, Regionen
- KPIs: Mandates gesamt, Status "submitted"+"live", Generierte Leads, Gesamtbudget

### 3. LeadBrandTemplates.tsx — NEUE DATEI

Admin-Uebersicht ueber alle Brand-Templates:
- Gruppiert nach Brand (Kaufy/FutureRoom/Acquiary)
- Zeigt: Template-Code, Name, Brand, Aktiv-Status
- Zaehlt wie viele Tenants dieses Template nutzen
- Read-Only (kein Editieren — das macht der Partner in Zone 2)

### 4. routesManifest.ts — Neuen Sub-Route registrieren

`lead-desk/templates` hinzufuegen (und in AdminSidebar shouldShowInNav filtern, da bereits durch `startsWith('lead-desk/')` abgedeckt).

## Was NICHT geaendert wird

- Alle Dateien unter `src/pages/portal/lead-manager/` (Zone 2) bleiben unberuehrt
- `LeadManagerPage.tsx` — keine Aenderung
- `LeadManagerKampagnen.tsx` — keine Aenderung
- `LeadManagerBrand.tsx` — keine Aenderung
- `LeadManagerProjekte.tsx` — keine Aenderung
- `LeadWebsiteLeads.tsx` (Tab 1) — keine Aenderung
- `LeadPool.tsx` — keine Aenderung

## Technische Details

### Datenquellen pro Tab

| Tab | Tabelle | Filter | Zweck |
|-----|---------|--------|-------|
| Website Leads | `leads` | `zone1_pool = true` | Website-Formular-Leads |
| Kampagnen | `social_mandates` | keiner (Admin sieht alle) | Gebuchte Kampagnen aus Z2 |
| Kampagnen | `social_leads` | Count per `mandate_id` | Lead-Zaehler pro Kampagne |
| Brand-Templates | `social_templates` | keiner (Admin sieht alle) | Template-Uebersicht |

### Status-Flow fuer social_mandates

```text
submitted → (Admin-Review) → live → completed
                           → paused → live
                           → stopped
```

Die Statusuebergaenge (submitted → live usw.) werden in einem spaeteren Entwicklungsschritt implementiert. Aktuell ist der Tab rein dokumentarisch.

