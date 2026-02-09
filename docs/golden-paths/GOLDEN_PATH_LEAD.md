# Golden Path: Lead-Generierung & Vertrieb

> **Pfad:** Zone 3 (Kaufy/Miety) → Zone 1 (Lead Pool) → MOD-09/MOD-10 (Partner)
> **Status:** FROZEN v1.0

---

## Übersicht

Leads werden über Zone-3-Websites generiert, in Zone 1 qualifiziert und an Vertriebspartner (MOD-09/MOD-10) delegiert.

## Phasen

### Phase 1: Lead-Capture (Zone 3)
- Kontaktformulare auf Kaufy2026, Miety, FutureRoom, SoT
- Edge Function `sot-lead-capture` erstellt Lead in `leads` Tabelle
- Initiale Kategorisierung: `kaufinteressent`, `mietinteressent`, `finanzierung`, `partner`
- Automatische `contact_staging` Erstellung für Deduplizierung

### Phase 2: Qualifizierung (Zone 1 — Lead Pool)
- Platform Admin sieht alle unzugewiesenen Leads
- Scoring basierend auf Vollständigkeit und Quelle
- ActionKey: `LEAD_ASSIGN` → Zuweisung an Partner-Organisation
- Status: `new` → `qualified` → `assigned`

### Phase 3: Partner-Bearbeitung (MOD-09 / MOD-10)
- **MOD-09 (Vertriebspartner):** Partner sieht zugewiesene Listings im Katalog
- **MOD-10 (Leads):** Partner bearbeitet zugewiesene Leads
  - Inbox: Neue Leads
  - Pipeline: Bearbeitungsfortschritt
  - Werbung: Ad-Kampagnen (ad_campaigns, ad_campaign_leads)

### Phase 4: Konversion
- Lead → Kontakt (contacts) Merge bei Qualifizierung
- Lead → Partner Deal (partner_deals) bei Vertragsabschluss
- Commission-Tracking: `commissions` Tabelle
- Abrechnung über Zone 1 Commission Approval

## Datenfluss

```
Zone 3 Website
  └── leads (via Edge Function)
       ├── contact_staging (Deduplizierung)
       └── lead_assignments (Zone 1 → Partner)
            ├── lead_activities (Bearbeitungs-Log)
            └── partner_pipelines (Pipeline-Stage)
                 └── partner_deals (Abschluss)
                      └── commissions (Provision)
```

## Camunda ActionKeys
- `LEAD_ASSIGN` → Zone 1 weist Lead an Partner zu

## DMS-Struktur
```
MOD_10/
  └── {lead_public_id}/
       ├── Anfrage
       └── Korrespondenz
```
