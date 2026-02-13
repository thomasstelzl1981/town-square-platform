# MOD-18 — FINANZANALYSE (Financial Analysis)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/finanzanalyse`  
> **SSOT-Rolle**: Source of Truth für Finanz-Dashboards, Reports und Szenarien

---

## 1. Executive Summary

MOD-18 "Finanzanalyse" bietet ein umfassendes Dashboard für die finanzielle Gesundheit
des Nutzers. Es aggregiert Daten aus Immobilien (MOD-04), Finanzierung (MOD-07) und
Fahrzeugen (MOD-17) zu konsolidierten Finanz-Reports und Szenario-Simulationen.

---

## 2. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Dashboard | `/portal/finanzanalyse/dashboard` | KPI-Übersicht: Vermögen, Cashflow, Rendite |
| Reports | `/portal/finanzanalyse/reports` | Strukturierte Finanzberichte |
| Szenarien | `/portal/finanzanalyse/szenarien` | What-if-Simulationen |
| Settings | `/portal/finanzanalyse/settings` | Datenquellen und Report-Konfiguration |

---

## 3. Cross-Module-Datenquellen

| Modul | Daten |
|-------|-------|
| MOD-04 | Immobilienportfolio, Mieteinnahmen, Bewertungen |
| MOD-07 | Finanzierungen, Darlehenskonditionen |
| MOD-17 | Fahrzeugkosten, Leasing-Raten |

---

## 4. Tile-Catalog Eintrag

```yaml
MOD-18:
  code: "MOD-18"
  title: "Finanzanalyse"
  icon: "TrendingUp"
  main_route: "/portal/finanzanalyse"
  display_order: 18
  sub_tiles: [dashboard, reports, szenarien, settings]
```

---

## 5. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
