# MOD-09 — VERTRIEBSPARTNER (Sales Partner Portal)

> **Version**: 1.1.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-18  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/vertriebspartner`  
> **SSOT-Rolle**: Source of Truth für Partner-Katalog, Beratung und Kundenverwaltung

---

## 1. Executive Summary

MOD-09 "Vertriebspartner" (Display: "Immomanager") ist die operative Zentrale für Sales Partner.
Es bietet einen Immobilienkatalog mit Provisionsanzeige, einen kundenfreundlichen Beratungsmodus
ohne Provisionsdaten, eine Kundenverwaltung, ein Partnernetzwerk und die Systemgebühr-/Provisionsübersicht.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Katalog-View zeigt Partner-Provision; Beratung-View NICHT (Blind-to-Customer Policy) |
| **R2** | Listings kommen aus `v_public_listings` (Read-Only) |
| **R3** | Lead-Funktionalität ist in MOD-10 (Lead Manager) konsolidiert |
| **R4** | Selfie Ads Studio ist in MOD-10 (Lead Manager) konsolidiert |

---

## 3. Tiles (5)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Katalog | `/portal/vertriebspartner/katalog` | Immobilien-Grid mit Provision |
| Beratung | `/portal/vertriebspartner/beratung` | Kundenfreundliche Ansicht ohne Provision |
| Kunden | `/portal/vertriebspartner/kunden` | CRM für Partner-Kunden |
| Netzwerk | `/portal/vertriebspartner/network` | Partner-Netzwerk und Vermittlungen |
| Provisionen | `/portal/vertriebspartner/systemgebuehr` | Systemgebühr-Vereinbarung und Provisionsübersicht |

---

## 4. Tile-Catalog Eintrag

```yaml
MOD-09:
  code: "MOD-09"
  title: "Immomanager"
  icon: "Handshake"
  main_route: "/portal/vertriebspartner"
  display_order: 9
  sub_tiles: [katalog, beratung, kunden, network, systemgebuehr]
```

---

## 5. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.1.0 | 2026-02-18 | Tile "Leads" ersetzt durch "Provisionen" (Route: systemgebuehr). Selfie Ads in MOD-10 Lead Manager konsolidiert. |
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
