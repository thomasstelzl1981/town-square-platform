# MOD-13 — PROJEKTE (Project Management Workbench)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/projekte`  
> **SSOT-Rolle**: Source of Truth für Projektdaten, Einheiten, Preislisten und Listings

---

## 1. Executive Summary

MOD-13 "Projekte" ist die zentrale Projekt-Management-Workbench. Sie unterstützt automatisierte
Intake-Prozesse (KI-basiert aus Exposés/Preislisten), direkte Projektaktivierung ohne
Zone-1-Gate und automatische Listing-Distribution an MOD-09 und Zone 3 (Kaufy).

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

## 3. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Übersicht | `/portal/projekte/uebersicht` | Projekt-Grid mit Status-KPIs |
| Timeline | `/portal/projekte/timeline` | Gantt-artige Projektplanung |
| Dokumente | `/portal/projekte/dokumente` | Projekt-Dokumentenraum |
| Einstellungen | `/portal/projekte/einstellungen` | Projektparameter und Vertriebssteuerung |

---

## 4. Vertriebsstatusreport

- Aggregiert EUR-Werte: Volumen, Reserviert, Verkauft, Frei, Provision, Rohertrag
- 2-seitiger PDF-Export (Seite 1: Exposé + Bauträger, Seite 2: KPIs + Preisliste)
- E-Mail-Versand mit persistenten Empfängerlisten (localStorage)

---

## 5. Edge Functions

| Function | Zweck |
|----------|-------|
| `sot-project-intake` | Automatisierter Projekt-Import |
| `sot-listing-publish` | Listing-Veröffentlichung (Z2→Z1) |
| `sot-generate-landing-page` | Landing-Page-Generierung (Z2→Z3) |

---

## 6. Tile-Catalog Eintrag

```yaml
MOD-13:
  code: "MOD-13"
  title: "Projekte"
  icon: "FolderKanban"
  main_route: "/portal/projekte"
  display_order: 13
  sub_tiles: [uebersicht, timeline, dokumente, einstellungen]
```

---

## 7. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
