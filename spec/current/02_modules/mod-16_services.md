# MOD-16 — SERVICES (Service Marketplace)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/services`  
> **SSOT-Rolle**: Source of Truth für Service-Katalog, Anfragen und Aufträge

---

## 1. Executive Summary

MOD-16 "Services" ist ein interner Service-Marktplatz, der Partner-Dienstleistungen,
einen Amazon-Business-Shop und weitere Drittanbieter-Services aggregiert.

---

## 2. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Katalog | `/portal/services/katalog` | Service-Übersicht mit Kategorien |
| Anfragen | `/portal/services/anfragen` | Offene Service-Anfragen |
| Aufträge | `/portal/services/auftraege` | Laufende und abgeschlossene Aufträge |
| Settings | `/portal/services/settings` | Präferenzen und Benachrichtigungen |

---

## 3. Tile-Catalog Eintrag

```yaml
MOD-16:
  code: "MOD-16"
  title: "Services"
  icon: "ShoppingBag"
  main_route: "/portal/services"
  display_order: 16
  sub_tiles: [katalog, anfragen, auftraege, settings]
```

---

## 4. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
