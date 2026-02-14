# MOD-10 — ABRECHNUNG (Commission Management)

> **Version**: 1.1.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-14  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/leads`  
> **SSOT-Rolle**: Source of Truth für Provisionsabrechnungen und Umsatzverfolgung

---

## 1. Executive Summary

MOD-10 "Abrechnung" (ehemals "Leads", dann "Provisionen") dient als zentrale Abrechnungsstelle für
Partner-Provisionen. Die Lead-Generierung und -Verwaltung wurde in MOD-09 konsolidiert;
MOD-10 fokussiert ausschließlich auf Provisionsübersichten, Abrechnungen und Auszahlungen.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Provisionsdaten sind Read-Only für Partner (Zone-1 berechnet) |
| **R2** | Route bleibt `/portal/leads` (Legacy-Kompatibilität) |
| **R3** | Display-Name im Manifest ist "Abrechnung" |

---

## 3. Tiles (1)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Übersicht | `/portal/leads/uebersicht` | Dashboard mit Umsatz-KPIs, offenen und abgerechneten Provisionen |

---

## 4. Tile-Catalog Eintrag

```yaml
MOD-10:
  code: "MOD-10"
  title: "Abrechnung"
  icon: "CreditCard"
  main_route: "/portal/leads"
  display_order: 10
  sub_tiles: [uebersicht]
```

---

## 5. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.1.0 | 2026-02-14 | Naming alignment: Titel → "Abrechnung" (SIA3-002) |
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
