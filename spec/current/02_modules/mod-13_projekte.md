# MOD-13 — PROJEKTE (Project Management Workbench)

> **Version**: 1.1.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-18  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/projekte`  
> **SSOT-Rolle**: Source of Truth für Projektdaten, Einheiten, Preislisten, Listings und Projekt-Kampagnen

---

## 1. Executive Summary

MOD-13 "Projekte" (Display: "Projektmanager") ist die zentrale Projekt-Management-Workbench.
Sie unterstützt automatisierte Intake-Prozesse (KI-basiert aus Exposés/Preislisten), direkte
Projektaktivierung ohne Zone-1-Gate, automatische Listing-Distribution an MOD-09 und Zone 3 (Kaufy),
sowie Lead-Kampagnen für eigene Projekte über den integrierten Lead Manager.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Jedes Projekt erhält eine `public_id` (SOT-BT-...) |
| **R2** | Aktivierung erstellt automatisch `listings` und `listing_publications` |
| **R3** | Standard-DMS-Hierarchie: `MOD_13/{project_code}` (7 Projekt- + 5 Einheiten-Ordner) |
| **R4** | Ein permanentes Demo-Projekt bleibt als Referenz in allen Views |
| **R5** | GoldenPathGuard umschließt Projekt-Detailseiten |

---

## 3. Tiles (5)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Dashboard | `/portal/projekte/dashboard` | Projekt-Grid mit Status-KPIs und Manager-Visitenkarte |
| Projekte | `/portal/projekte/projekte` | Projektliste mit Magic Intake und Verwaltung |
| Vertrieb | `/portal/projekte/vertrieb` | Vertriebsstatusreport und Verkaufssteuerung |
| Landing Page | `/portal/projekte/landing-page` | Landing-Page-Generierung für Projekte |
| Lead Manager | `/portal/projekte/lead-manager` | Projekt-Kampagnen: Lead-Generierung für eigene Projekte |

---

## 4. Lead Manager (Projekt-Kampagnen)

Der Lead Manager Tile rendert `<LeadManagerInline contextMode="project" />` aus MOD-10:
- Nur Projekt-Kampagnen sichtbar (keine Brand-Auswahl)
- Kampagnen/Leads gefiltert nach eigenen Projekten aus `dev_projects`
- `social_mandates.project_id` verknüpft Kampagnen mit Projekten
- Projektdaten (Name, Ort, Preisrange, Einheiten) fließen automatisch in Templates

---

## 5. Vertriebsstatusreport

- Aggregiert EUR-Werte: Volumen, Reserviert, Verkauft, Frei, Provision, Rohertrag
- 2-seitiger PDF-Export (Seite 1: Exposé + Bauträger, Seite 2: KPIs + Preisliste)
- E-Mail-Versand mit persistenten Empfängerlisten (localStorage)

---

## 6. Edge Functions

| Function | Zweck |
|----------|-------|
| `sot-project-intake` | Automatisierter Projekt-Import |
| `sot-listing-publish` | Listing-Veröffentlichung (Z2→Z1) |
| `sot-generate-landing-page` | Landing-Page-Generierung (Z2→Z3) |
| `sot-social-mandate-submit` | Kampagnen-Beauftragung mit `project_id` (Z2→Z1) |

---

## 7. Tile-Catalog Eintrag

```yaml
MOD-13:
  code: "MOD-13"
  title: "Projektmanager"
  icon: "FolderKanban"
  main_route: "/portal/projekte"
  display_order: 13
  sub_tiles: [dashboard, projekte, vertrieb, landing-page, lead-manager]
```

---

## 8. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.1.0 | 2026-02-18 | Tile "Lead Manager" hinzugefügt. Tiles komplett an Manifest angeglichen (Dashboard, Projekte, Vertrieb, Landing Page, Lead Manager). Projekt-Kampagnen via social_mandates.project_id dokumentiert. |
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
